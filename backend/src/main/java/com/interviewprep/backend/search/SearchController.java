package com.interviewprep.backend.search;

import com.interviewprep.backend.auth.AppUserPrincipal;
import com.interviewprep.backend.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final SearchService searchService;

    @GetMapping("/api/v1/search")
    public SearchResponse search(
            @RequestParam("q") String query,
            @RequestParam(name = "limit", required = false) Integer limit,
            @AuthenticationPrincipal AppUserPrincipal principal) {
        int effectiveLimit = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        return new SearchResponse(searchService.search(query, effectiveLimit, principal.userId()));
    }

    @PostMapping("/api/v1/search/reindex")
    public ResponseEntity<Void> reindex() {
        searchService.reindexAll();
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
