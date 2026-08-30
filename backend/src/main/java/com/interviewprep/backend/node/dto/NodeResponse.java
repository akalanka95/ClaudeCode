package com.interviewprep.backend.node.dto;

import com.interviewprep.backend.node.NodeType;
import java.util.UUID;

public record NodeResponse(
        UUID id,
        NodeType type,
        String label,
        String noteText,
        double positionX,
        double positionY,
        UUID childBoardId,
        String detailsContent,
        Double width,
        Double height,
        boolean completed,
        Integer subtopicCount,
        Integer completedSubtopicCount) {}
