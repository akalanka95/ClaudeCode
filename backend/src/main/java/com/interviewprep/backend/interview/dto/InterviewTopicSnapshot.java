package com.interviewprep.backend.interview.dto;

import java.util.List;
import java.util.UUID;

public record InterviewTopicSnapshot(UUID nodeId, String label, List<String> path) {}
