package com.interviewprep.backend.node.dto;

public record UpdateNodeRequest(
        String label,
        String noteText,
        Double positionX,
        Double positionY,
        Double width,
        Double height,
        Boolean completed) {}
