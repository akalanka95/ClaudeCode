package com.interviewprep.backend.search;

import com.interviewprep.backend.board.Board;
import com.interviewprep.backend.board.BoardRepository;
import com.interviewprep.backend.config.AiConfig;
import com.interviewprep.backend.node.Node;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.node.NodeType;
import com.interviewprep.backend.noteblock.NoteBlock;
import com.interviewprep.backend.noteblock.NoteBlockRepository;
import com.interviewprep.backend.search.dto.SearchResultResponse;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import io.qdrant.client.ConditionFactory;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QueryFactory;
import io.qdrant.client.WithPayloadSelectorFactory;
import io.qdrant.client.grpc.JsonWithInt.Value;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import org.jsoup.Jsoup;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Indexes Topic/Subtopic/Note labels, Details content, and note-block text into the shared
 * Qdrant {@code nodes} collection (see {@link com.interviewprep.backend.config.AiConfig}), and
 * serves semantic search over it.
 *
 * <p>Qdrant is treated purely as an index, not a source of truth: every result is hydrated back
 * against Postgres before being returned, and a stale entry pointing at a since-deleted node is
 * silently filtered out on read rather than eagerly cleaned up on every delete (cheaper than
 * walking the same cascade the DB already handles for us).
 */
@Service
public class SearchService {

    private static final int SNIPPET_LENGTH = 160;
    private static final int LABEL_EXCERPT_LENGTH = 60;
    private static final double MIN_SCORE = 0.0;
    private static final String KIND_NODE = "node";
    private static final String KIND_NOTE_BLOCK = "note_block";

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final QdrantClient qdrantClient;
    private final NodeRepository nodeRepository;
    private final NoteBlockRepository noteBlockRepository;
    private final BoardRepository boardRepository;

    // Explicit constructor (not Lombok's @RequiredArgsConstructor) so @Lazy can be placed on the
    // AI client params: SearchService itself is eagerly created (NodeService depends on it),
    // so without @Lazy right here, resolving these constructor arguments would still eagerly
    // build the Anthropic/Voyage/Qdrant clients at startup — see AiConfig's class-level note.
    public SearchService(
            @Lazy EmbeddingModel embeddingModel,
            @Lazy EmbeddingStore<TextSegment> embeddingStore,
            @Lazy QdrantClient qdrantClient,
            NodeRepository nodeRepository,
            NoteBlockRepository noteBlockRepository,
            BoardRepository boardRepository) {
        this.embeddingModel = embeddingModel;
        this.embeddingStore = embeddingStore;
        this.qdrantClient = qdrantClient;
        this.nodeRepository = nodeRepository;
        this.noteBlockRepository = noteBlockRepository;
        this.boardRepository = boardRepository;
    }

    @Async("searchIndexExecutor")
    public void indexNode(Node node) {
        indexNodeInternal(node);
    }

    @Async("searchIndexExecutor")
    public void removeNodeFromIndex(UUID nodeId) {
        embeddingStore.remove(nodeId.toString());
    }

    @Async("searchIndexExecutor")
    public void indexNoteBlock(NoteBlock noteBlock) {
        indexNoteBlockInternal(noteBlock);
    }

    @Async("searchIndexExecutor")
    public void removeNoteBlockFromIndex(UUID noteBlockId) {
        embeddingStore.remove(noteBlockId.toString());
    }

    @Async("searchIndexExecutor")
    @Transactional(readOnly = true)
    public void reindexAll() {
        embeddingStore.removeAll();
        nodeRepository.findAll().forEach(this::indexNodeInternal);
        noteBlockRepository.findAll().forEach(this::indexNoteBlockInternal);
    }

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(String query, int limit, UUID ownerId) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        Embedding queryEmbedding = embeddingModel.embed(query).content();
        // Queried directly against QdrantClient (not via langchain4j's EmbeddingStore.search)
        // and without requesting vectors back: langchain4j-qdrant re-scores matches client-side
        // by cosine-comparing the returned point vectors against the query vector, but newer
        // Qdrant servers (Qdrant Cloud runs 1.19.x) reply with a "named vector" wire shape this
        // client version doesn't parse, so those vectors silently come back empty and the
        // re-score blows up. Skip all that and trust the score Qdrant's server already computed.
        QueryPoints request = QueryPoints.newBuilder()
                .setCollectionName(AiConfig.NODES_COLLECTION)
                .setQuery(QueryFactory.nearest(queryEmbedding.vectorAsList()))
                .setWithPayload(WithPayloadSelectorFactory.enable(true))
                // Overfetch: several matches can collapse onto the same owning node (its own
                // content plus one or more note blocks), and some may point at a since-deleted
                // node, so more raw matches than `limit` are needed to end up with `limit` real
                // results.
                .setLimit(Math.max(limit * 4, 20))
                .setFilter(ownerFilter(ownerId))
                .build();

        List<ScoredPoint> matches;
        try {
            matches = qdrantClient.queryAsync(request).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }

        Map<UUID, Double> bestScoreByNode = new HashMap<>();
        for (ScoredPoint match : matches) {
            if (match.getScore() < MIN_SCORE) {
                continue;
            }
            Value nodeIdValue = match.getPayloadMap().get("nodeId");
            if (nodeIdValue == null) {
                continue;
            }
            UUID nodeId = UUID.fromString(nodeIdValue.getStringValue());
            bestScoreByNode.merge(nodeId, (double) match.getScore(), Math::max);
        }

        return bestScoreByNode.entrySet().stream()
                .sorted(Map.Entry.<UUID, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> toResult(entry.getKey(), entry.getValue()))
                .filter(Objects::nonNull)
                .toList();
    }

    private void indexNodeInternal(Node node) {
        String text = nodeIndexText(node);
        if (text.isBlank()) {
            embeddingStore.remove(node.getId().toString());
            return;
        }
        UUID ownerId = ownerIdForBoard(node.getBoardId());
        if (ownerId == null) {
            return;
        }
        upsert(node.getId(), node.getId(), KIND_NODE, text, ownerId);
    }

    private void indexNoteBlockInternal(NoteBlock noteBlock) {
        String content = noteBlock.getContent() != null ? noteBlock.getContent() : "";
        String text = Jsoup.parse(content).text().strip();
        if (text.isBlank()) {
            embeddingStore.remove(noteBlock.getId().toString());
            return;
        }
        UUID ownerId = nodeRepository
                .findById(noteBlock.getNodeId())
                .map(n -> ownerIdForBoard(n.getBoardId()))
                .orElse(null);
        if (ownerId == null) {
            return;
        }
        upsert(noteBlock.getId(), noteBlock.getNodeId(), KIND_NOTE_BLOCK, text, ownerId);
    }

    private UUID ownerIdForBoard(UUID boardId) {
        return boardRepository.findById(boardId).map(Board::getOwnerId).orElse(null);
    }

    private void upsert(UUID pointId, UUID ownerNodeId, String kind, String text, UUID ownerId) {
        Metadata metadata =
                new Metadata().put("nodeId", ownerNodeId).put("kind", kind).put("userId", ownerId);
        TextSegment segment = TextSegment.from(text, metadata);
        Embedding embedding = embeddingModel.embed(segment).content();
        embeddingStore.addAll(List.of(pointId.toString()), List.of(embedding), List.of(segment));
    }

    private static Filter ownerFilter(UUID ownerId) {
        return Filter.newBuilder()
                .addMust(ConditionFactory.matchKeyword("userId", ownerId.toString()))
                .build();
    }

    private SearchResultResponse toResult(UUID nodeId, double score) {
        return nodeRepository
                .findById(nodeId)
                .map(node -> new SearchResultResponse(
                        node.getId(), node.getType(), displayLabel(node), node.getBoardId(), snippet(node), score))
                .orElse(null);
    }

    private String nodeIndexText(Node node) {
        if (node.getType() == NodeType.TOPIC) {
            String label = node.getLabel() != null ? node.getLabel() : "";
            String details = node.getDetailsContent() != null ? node.getDetailsContent() : "";
            return (label + "\n" + details).strip();
        }
        return node.getNoteText() != null ? node.getNoteText().strip() : "";
    }

    private String displayLabel(Node node) {
        if (node.getType() == NodeType.TOPIC) {
            return node.getLabel();
        }
        return excerpt(node.getNoteText(), LABEL_EXCERPT_LENGTH);
    }

    private String snippet(Node node) {
        String source =
                node.getType() == NodeType.TOPIC
                        ? (node.getDetailsContent() != null ? node.getDetailsContent() : "")
                        : (node.getNoteText() != null ? node.getNoteText() : "");
        return excerpt(source, SNIPPET_LENGTH);
    }

    private static String excerpt(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        String trimmed = text.strip();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength).strip() + "...";
    }
}
