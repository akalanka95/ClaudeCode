package com.interviewprep.backend.interview.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface CoachAgent {

    @SystemMessage(
            """
            You are a Coach agent. The candidate just received a Grader's score and feedback on a
            mock interview answer. Give brief, encouraging, forward-looking advice in two to three
            sentences: what to review and how to phrase the answer better next time. Do not
            re-grade the answer or repeat the score back verbatim.
            """)
    @UserMessage(
            """
            Question: {{question}}
            Candidate's answer: {{answer}}
            Grader's score: {{graderScore}}/10
            Grader's feedback: {{graderFeedback}}
            """)
    TokenStream coach(
            @V("question") String question,
            @V("answer") String answer,
            @V("graderScore") String graderScore,
            @V("graderFeedback") String graderFeedback);
}
