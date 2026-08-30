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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Runs a subtopic sync in the background: asks the sync-agent sidecar (which drives the Claude
 * Agent SDK's web search under the caller's Claude Code subscription) for recent material on the
 * node's topic, then checks whether the result is materially new compared to the last completed
 * run for the same node (see {@link #isNearDuplicate}) before persisting it as a full history
 * entry.
 */
@Component
class SubtopicSyncRunner {

    private static final Logger log = LoggerFactory.getLogger(SubtopicSyncRunner.class);
    private static final double DUPLICATE_OVERLAP_THRESHOLD = 0.8;
    private static final int CONNECT_TIMEOUT_MILLIS = 5_000;
    private static final int READ_TIMEOUT_MILLIS = 90_000;

    private final SubtopicSyncRunRepository syncRunRepository;
    private final NodeRepository nodeRepository;
    private final RestClient syncAgentClient;

    SubtopicSyncRunner(
            SubtopicSyncRunRepository syncRunRepository,
            NodeRepository nodeRepository,
            @Value("${app.sync-agent.base-url}") String syncAgentBaseUrl) {
        this.syncRunRepository = syncRunRepository;
        this.nodeRepository = nodeRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
        requestFactory.setReadTimeout(READ_TIMEOUT_MILLIS);
        this.syncAgentClient =
                RestClient.builder().baseUrl(syncAgentBaseUrl).requestFactory(requestFactory).build();
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
            run.setErrorMessage("Sync failed: " + describeFailure(e));
        } finally {
            run.setCompletedAt(Instant.now());
            syncRunRepository.save(run);
        }
    }

    private SyncResult search(String topicLabel, List<SyncLink> previousLinks) {
        List<String> previousUrls = previousLinks.stream().map(SyncLink::url).toList();
        SearchRequest request = new SearchRequest(topicLabel, previousUrls);
        return syncAgentClient
                .post()
                .uri("/search")
                .body(request)
                .retrieve()
                .body(SyncResult.class);
    }

    private String describeFailure(Exception e) {
        if (e instanceof ResourceAccessException) {
            return "sync-agent unreachable — is it running? (" + e.getMessage() + ")";
        }
        return e.getMessage();
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

    private record SearchRequest(String topicLabel, List<String> previousUrls) {}
}
