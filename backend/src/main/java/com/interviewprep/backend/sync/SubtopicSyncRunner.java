package com.interviewprep.backend.sync;

import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.sync.dto.SyncLink;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.anthropic.AnthropicWebSearchTool;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Runs a subtopic sync in the background: asks Claude to search the web for recent material on
 * the node's topic and summarize it, then checks whether the result is materially new compared to
 * the last completed run for the same node (see {@link #isNearDuplicate}) before persisting it as
 * a full history entry.
 */
@Component
class SubtopicSyncRunner {

    private static final Logger log = LoggerFactory.getLogger(SubtopicSyncRunner.class);
    private static final double DUPLICATE_OVERLAP_THRESHOLD = 0.8;

    private final SubtopicSyncRunRepository syncRunRepository;
    private final NodeRepository nodeRepository;
    private final ChatClient chatClient;

    SubtopicSyncRunner(
            SubtopicSyncRunRepository syncRunRepository,
            NodeRepository nodeRepository,
            ChatClient.Builder chatClientBuilder) {
        this.syncRunRepository = syncRunRepository;
        this.nodeRepository = nodeRepository;
        this.chatClient = chatClientBuilder.build();
    }

    @Async("syncTaskExecutor")
    public void run(UUID runId) {
        SubtopicSyncRun run = syncRunRepository.findById(runId).orElse(null);
        if (run == null) {
            return;
        }
        // Each save below is its own short transaction (Spring Data JPA's default per-method
        // transaction) and commits immediately. Deliberately not wrapping this whole method in
        // one @Transactional block: that would hold the RUNNING update uncommitted — invisible to
        // polling GET requests — for as long as the slow external search() call takes, making a
        // run look stuck at PENDING from the outside even while it's actually progressing.
        run.setStatus(SyncStatus.RUNNING);
        syncRunRepository.save(run);

        try {
            Node node = nodeRepository
                    .findById(run.getNodeId())
                    .orElseThrow(() -> new IllegalStateException("Node not found: " + run.getNodeId()));

            Optional<SubtopicSyncRun> previousRun = syncRunRepository.findFirstByNodeIdAndStatusOrderByCreatedAtDesc(
                    run.getNodeId(), SyncStatus.COMPLETED);
            List<SyncLink> previousLinks = previousRun.map(SubtopicSyncRun::getLinks).orElse(List.of());

            SyncResult result = search(node.getLabel(), previousLinks);

            if (isNearDuplicate(result.links(), previousLinks)) {
                run.setStatus(SyncStatus.NO_NEW_UPDATES);
            } else {
                run.setStatus(SyncStatus.COMPLETED);
                run.setSummary(result.summary());
                run.setLinks(result.links());
            }
        } catch (Exception e) {
            log.warn("Subtopic sync failed for run {}: {}", runId, e.toString());
            run.setStatus(SyncStatus.FAILED);
            run.setErrorMessage("Sync failed: " + e.getMessage());
        } finally {
            run.setCompletedAt(Instant.now());
            syncRunRepository.save(run);
        }
    }

    private SyncResult search(String topicLabel, List<SyncLink> previousLinks) {
        AnthropicWebSearchTool webSearchTool =
                AnthropicWebSearchTool.builder().maxUses(5).build();

        String priorUrlsNote = previousLinks.isEmpty()
                ? ""
                : "Sources already surfaced in a previous sync (prefer new ones over repeating these): "
                        + previousLinks.stream().map(SyncLink::url).collect(Collectors.joining(", "))
                        + "\n";

        String prompt =
                """
                Search the web for recent, notable developments, articles, or discussions related to
                the interview-prep topic "%s" that would be useful for someone studying this topic for
                technical interviews (news, official docs/release updates, notable write-ups or
                discussions).
                %s
                Respond with a concise 2-4 sentence summary of what's new, and 3-6 of the best source
                links, each with a short one-line note on why it's relevant.
                """
                        .formatted(topicLabel, priorUrlsNote);

        return chatClient
                .prompt()
                .options(AnthropicChatOptions.builder().webSearchTool(webSearchTool))
                .user(prompt)
                .call()
                .entity(SyncResult.class);
    }

    private boolean isNearDuplicate(List<SyncLink> newLinks, List<SyncLink> previousLinks) {
        if (previousLinks.isEmpty() || newLinks == null || newLinks.isEmpty()) {
            return false;
        }
        Set<String> previousUrls = previousLinks.stream().map(SyncLink::url).collect(Collectors.toSet());
        long overlapCount =
                newLinks.stream().filter(link -> previousUrls.contains(link.url())).count();
        double overlapRatio = (double) overlapCount / newLinks.size();
        return overlapRatio >= DUPLICATE_OVERLAP_THRESHOLD;
    }
}
