package com.interviewprep.backend.board.dto;

import com.interviewprep.backend.edge.dto.EdgeResponse;
import com.interviewprep.backend.node.dto.NodeResponse;
import java.util.List;
import java.util.UUID;

public record BoardResponse(
        UUID boardId,
        ParentNodeInfo parentNode,
        List<BreadcrumbItem> breadcrumb,
        List<NodeResponse> nodes,
        List<EdgeResponse> edges) {}
