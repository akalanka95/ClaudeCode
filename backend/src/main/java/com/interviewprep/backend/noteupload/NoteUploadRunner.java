package com.interviewprep.backend.noteupload;

import com.interviewprep.backend.noteblock.NoteBlock;
import com.interviewprep.backend.noteblock.NoteBlockRepository;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Runs a note-upload summarization in the background: sends the uploaded file to the sync-agent
 * sidecar (which drives the Claude Agent SDK's vision-capable summarization under the caller's
 * Claude Code subscription) to transcribe and summarize handwritten content into a title + headed
 * bullet sections, then creates a new NoteBlock on the subtopic's note board holding that summary
 * as structured HTML.
 */
@Component
class NoteUploadRunner {

    private static final Logger log = LoggerFactory.getLogger(NoteUploadRunner.class);
    private static final int CONNECT_TIMEOUT_MILLIS = 5_000;
    private static final int READ_TIMEOUT_MILLIS = 90_000;
    private static final double DEFAULT_WIDTH = 260;
    private static final double DEFAULT_HEIGHT = 200;
    private static final String DEFAULT_COLOR = "yellow";

    private final NoteUploadRepository noteUploadRepository;
    private final NoteBlockRepository noteBlockRepository;
    private final RestClient syncAgentClient;

    NoteUploadRunner(
            NoteUploadRepository noteUploadRepository,
            NoteBlockRepository noteBlockRepository,
            @Value("${app.sync-agent.base-url}") String syncAgentBaseUrl) {
        this.noteUploadRepository = noteUploadRepository;
        this.noteBlockRepository = noteBlockRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
        requestFactory.setReadTimeout(READ_TIMEOUT_MILLIS);
        this.syncAgentClient =
                RestClient.builder().baseUrl(syncAgentBaseUrl).requestFactory(requestFactory).build();
    }

    @Async("noteUploadTaskExecutor")
    public void run(UUID uploadId, byte[] fileBytes, String mimeType) {
        NoteUpload upload = noteUploadRepository.findById(uploadId).orElse(null);
        if (upload == null) {
            return;
        }
        // Each save below is its own short transaction and commits immediately — same reasoning as
        // SubtopicSyncRunner: don't wrap this in one @Transactional block, or the RUNNING update
        // stays invisible to polling GET requests for as long as the slow external call takes.
        upload.setStatus(NoteUploadStatus.RUNNING);
        noteUploadRepository.save(upload);

        try {
            SummarizeResponse summary = summarize(fileBytes, mimeType);
            NoteBlock noteBlock = createSummaryNoteBlock(upload.getNodeId(), summary);
            upload.setStatus(NoteUploadStatus.COMPLETED);
            upload.setResultNoteBlockId(noteBlock.getId());
        } catch (Exception e) {
            log.warn("Note upload summarize failed for upload {}: {}", uploadId, e.toString());
            upload.setStatus(NoteUploadStatus.FAILED);
            upload.setErrorMessage("Summarize failed: " + describeFailure(e));
        } finally {
            upload.setCompletedAt(Instant.now());
            noteUploadRepository.save(upload);
        }
    }

    private SummarizeResponse summarize(byte[] fileBytes, String mimeType) {
        String fileBase64 = Base64.getEncoder().encodeToString(fileBytes);
        SummarizeRequest request = new SummarizeRequest(fileBase64, mimeType);
        SummarizeResponse response = syncAgentClient
                .post()
                .uri("/summarize-upload")
                .body(request)
                .retrieve()
                .body(SummarizeResponse.class);
        if (response == null || response.sections() == null || response.sections().isEmpty()) {
            throw new IllegalStateException("Agent produced no summary");
        }
        return response;
    }

    // Builds the note's HTML directly from AI-supplied text fragments rather than parsing/trusting
    // HTML the model might return — every fragment is escaped, and only tags NoteEditor's TipTap
    // schema (heading/bulletList/listItem) actually understands are ever emitted.
    private NoteBlock createSummaryNoteBlock(UUID nodeId, SummarizeResponse summary) {
        List<NoteBlock> existing = noteBlockRepository.findByNodeIdOrderByCreatedAtAsc(nodeId);
        int cascadeOffset = (existing.size() % 6) * 24;

        NoteBlock noteBlock = new NoteBlock();
        noteBlock.setNodeId(nodeId);
        noteBlock.setContent(toHtml(summary));
        noteBlock.setColor(DEFAULT_COLOR);
        noteBlock.setPositionX(40 + cascadeOffset);
        noteBlock.setPositionY(40 + cascadeOffset);
        noteBlock.setWidth(DEFAULT_WIDTH);
        noteBlock.setHeight(DEFAULT_HEIGHT);
        noteBlock.setMinimized(false);
        noteBlock.setZIndex(existing.stream().mapToInt(NoteBlock::getZIndex).max().orElse(-1) + 1);

        return noteBlockRepository.save(noteBlock);
    }

    private String toHtml(SummarizeResponse summary) {
        StringBuilder html = new StringBuilder();
        if (summary.title() != null && !summary.title().isBlank()) {
            html.append("<h2>").append(escapeHtml(summary.title())).append("</h2>");
        }
        for (Section section : summary.sections()) {
            if (section.bullets() == null || section.bullets().isEmpty()) {
                continue;
            }
            if (section.heading() != null && !section.heading().isBlank()) {
                html.append("<h3>").append(escapeHtml(section.heading())).append("</h3>");
            }
            html.append("<ul>");
            for (String bullet : section.bullets()) {
                if (bullet == null || bullet.isBlank()) {
                    continue;
                }
                html.append("<li>").append(escapeHtml(bullet)).append("</li>");
            }
            html.append("</ul>");
        }
        return html.length() > 0 ? html.toString() : "<p></p>";
    }

    private String escapeHtml(String text) {
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String describeFailure(Exception e) {
        if (e instanceof ResourceAccessException) {
            return "sync-agent unreachable — is it running? (" + e.getMessage() + ")";
        }
        return e.getMessage();
    }

    private record SummarizeRequest(String fileBase64, String mimeType) {}

    private record SummarizeResponse(String title, List<Section> sections) {}

    private record Section(String heading, List<String> bullets) {}
}
