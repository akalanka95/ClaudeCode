package com.interviewprep.backend.node;

import com.interviewprep.backend.node.dto.NodeResponse;
import org.springframework.stereotype.Component;

@Component
public class NodeMapper {

    public NodeResponse toResponse(Node node) {
        return new NodeResponse(
                node.getId(),
                node.getType(),
                node.getLabel(),
                node.getNoteText(),
                node.getPositionX(),
                node.getPositionY(),
                node.getChildBoardId(),
                node.getDetailsContent(),
                node.getWidth(),
                node.getHeight());
    }
}
