package com.interviewprep.backend.interview.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface GraderAgent {

    @SystemMessage(
            """
            You are a Grader agent. Score the candidate's interview answer strictly against the
            study notes provided below, not your own outside knowledge. Judge correctness,
            completeness, and clarity. Respond in exactly this two-line format and nothing else:
            SCORE: <integer from 0 to 10>
            FEEDBACK: <one paragraph explaining what was right, what was missing, and what was
            wrong, referencing the study notes>
            """)
    @UserMessage(
            """
            Study notes:
            {{topicContext}}

            Question: {{question}}
            Candidate's answer: {{answer}}
            """)
    TokenStream grade(
            @V("topicContext") String topicContext, @V("question") String question, @V("answer") String answer);
}
