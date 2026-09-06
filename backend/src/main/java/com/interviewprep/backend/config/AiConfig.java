package com.interviewprep.backend.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.model.anthropic.AnthropicStreamingChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.voyageai.VoyageAiEmbeddingModel;
import dev.langchain4j.model.voyageai.VoyageAiEmbeddingModelName;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.VectorParams;
import java.time.Duration;
import java.util.concurrent.ExecutionException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

/**
 * Shared LangChain4j/Qdrant infrastructure beans used by the {@code search} and {@code interview}
 * domains. Kept here rather than per-domain since both consume the same chat model, embedding
 * model, and vector store.
 *
 * <p>Every bean here is {@link Lazy}: the Anthropic/Voyage AI client builders validate their API
 * key eagerly, and connecting to Qdrant to check/create the collection is a real network call —
 * none of that should happen at application startup, or the whole backend would refuse to boot
 * without these (optional, metered) credentials configured. This mirrors how the {@code
 * sync-agent} sidecar is already optional: the rest of the app works without it, only the
 * features that depend on it fail until it's configured.
 */
@Configuration
public class AiConfig {

    public static final String NODES_COLLECTION = "nodes";
    private static final VoyageAiEmbeddingModelName EMBEDDING_MODEL_NAME =
            VoyageAiEmbeddingModelName.VOYAGE_3_LITE;

    @Bean
    @Lazy
    public ChatModel chatModel(@Value("${app.anthropic.api-key}") String apiKey) {
        return AnthropicChatModel.builder()
                .apiKey(apiKey)
                .modelName("claude-sonnet-5")
                .maxTokens(2048)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    @Bean
    @Lazy
    public StreamingChatModel streamingChatModel(@Value("${app.anthropic.api-key}") String apiKey) {
        return AnthropicStreamingChatModel.builder()
                .apiKey(apiKey)
                .modelName("claude-sonnet-5")
                .maxTokens(2048)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    @Bean
    @Lazy
    public EmbeddingModel embeddingModel(@Value("${app.voyage.api-key}") String apiKey) {
        return VoyageAiEmbeddingModel.builder().apiKey(apiKey).modelName(EMBEDDING_MODEL_NAME).build();
    }

    @Bean(destroyMethod = "close")
    @Lazy
    public QdrantClient qdrantClient(
            @Value("${app.qdrant.host}") String host,
            @Value("${app.qdrant.grpc-port}") int grpcPort,
            @Value("${app.qdrant.use-tls}") boolean useTls,
            @Value("${app.qdrant.api-key}") String apiKey)
            throws ExecutionException, InterruptedException {
        QdrantGrpcClient.Builder builder = QdrantGrpcClient.newBuilder(host, grpcPort, useTls);
        if (!apiKey.isBlank()) {
            builder.withApiKey(apiKey);
        }
        QdrantClient client = new QdrantClient(builder.build());
        // Done here (rather than in the embeddingStore bean below) so it also covers
        // SearchService's direct QdrantClient injection for querying.
        ensureCollectionExists(client);
        ensureOwnerIndexExists(client);
        return client;
    }

    @Bean
    @Lazy
    public EmbeddingStore<TextSegment> embeddingStore(QdrantClient qdrantClient) {
        return QdrantEmbeddingStore.builder().client(qdrantClient).collectionName(NODES_COLLECTION).build();
    }

    private void ensureCollectionExists(QdrantClient client) throws ExecutionException, InterruptedException {
        boolean exists = client.collectionExistsAsync(NODES_COLLECTION).get();
        if (!exists) {
            VectorParams vectorParams =
                    VectorParams.newBuilder()
                            .setSize(EMBEDDING_MODEL_NAME.dimension())
                            .setDistance(Distance.Cosine)
                            .build();
            client.createCollectionAsync(NODES_COLLECTION, vectorParams).get();
        }
    }

    // SearchService filters every search by the "userId" payload field (see its ownerFilter).
    // Some Qdrant deployments (e.g. Qdrant Cloud) reject filtering on a field with no payload
    // index ("Index required but not found"), while others (the local dev Qdrant) allow it via
    // an unindexed scan — so this can't be caught by local testing alone.
    private void ensureOwnerIndexExists(QdrantClient client) throws ExecutionException, InterruptedException {
        boolean exists = client.getCollectionInfoAsync(NODES_COLLECTION).get().containsPayloadSchema("userId");
        if (!exists) {
            client.createPayloadIndexAsync(NODES_COLLECTION, "userId", PayloadSchemaType.Keyword, null, null, null, null)
                    .get();
        }
    }
}
