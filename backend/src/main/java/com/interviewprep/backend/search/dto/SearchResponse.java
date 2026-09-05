package com.interviewprep.backend.search.dto;

import java.util.List;

public record SearchResponse(List<SearchResultResponse> results) {}
