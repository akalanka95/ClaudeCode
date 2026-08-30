package com.interviewprep.backend.noteblock.dto;

public record UpdateNoteBlockRequest(
        String content,
        String color,
        Double positionX,
        Double positionY,
        Double width,
        Double height,
        Boolean minimized,
        Integer zIndex) {}
