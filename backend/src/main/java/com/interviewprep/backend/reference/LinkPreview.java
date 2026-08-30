package com.interviewprep.backend.reference;

public record LinkPreview(String title, String description, String imageUrl) {

    static final LinkPreview EMPTY = new LinkPreview(null, null, null);
}
