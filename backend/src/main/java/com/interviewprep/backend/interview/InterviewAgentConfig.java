package com.interviewprep.backend.interview;

import com.interviewprep.backend.interview.agent.CoachAgent;
import com.interviewprep.backend.interview.agent.GraderAgent;
import com.interviewprep.backend.interview.agent.InterviewerAgent;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

/**
 * Wires the Interviewer/Grader/Coach roles as separate LangChain4j AI Service interfaces (see
 * {@code interview/agent}) rather than one combined prompt, bound to the shared chat models from
 * {@link com.interviewprep.backend.config.AiConfig}. Every bean here is {@link Lazy} for the same
 * reason as those underlying models: they must not be resolved at startup without the optional,
 * metered credentials configured.
 */
@Configuration
public class InterviewAgentConfig {

    @Bean
    @Lazy
    public InterviewerAgent interviewerAgent(ChatModel chatModel, StreamingChatModel streamingChatModel) {
        return AiServices.builder(InterviewerAgent.class)
                .chatModel(chatModel)
                .streamingChatModel(streamingChatModel)
                .build();
    }

    @Bean
    @Lazy
    public GraderAgent graderAgent(StreamingChatModel streamingChatModel) {
        return AiServices.builder(GraderAgent.class).streamingChatModel(streamingChatModel).build();
    }

    @Bean
    @Lazy
    public CoachAgent coachAgent(StreamingChatModel streamingChatModel) {
        return AiServices.builder(CoachAgent.class).streamingChatModel(streamingChatModel).build();
    }
}
