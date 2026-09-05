package com.interviewprep.backend.interview.agent;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface InterviewerAgent {

    @SystemMessage(
            """
            You are an Interviewer agent conducting a mock technical interview based on the
            candidate's own study notes below. Ask exactly one clear, specific interview question
            that can reasonably be answered in a few sentences. Never repeat a question already
            asked. Never answer your own question. Respond with only the question text, no
            preamble or numbering.
            """)
    @UserMessage(
            """
            Study notes:
            {{topicContext}}

            Questions already asked in this session:
            {{previousQuestions}}

            Ask the next interview question.
            """)
    String generateQuestion(@V("topicContext") String topicContext, @V("previousQuestions") String previousQuestions);

    @SystemMessage(
            """
            You are an Interviewer agent conducting a mock technical interview based on the
            candidate's own study notes below. Ask exactly one clear, specific interview question
            that can reasonably be answered in a few sentences. Never repeat a question already
            asked. Never answer your own question. Respond with only the question text, no
            preamble or numbering.
            """)
    @UserMessage(
            """
            Study notes:
            {{topicContext}}

            Questions already asked in this session:
            {{previousQuestions}}

            Ask the next interview question.
            """)
    TokenStream streamNextQuestion(
            @V("topicContext") String topicContext, @V("previousQuestions") String previousQuestions);
}
