package com.interviewprep.backend.node;

import com.interviewprep.backend.node.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NodeMapper {

    private final NodeRepository nodeRepository;

    public NodeResponse toResponse(Node node) {
        Integer subtopicCount = null;
        Integer completedSubtopicCount = null;
        if (node.getType() == NodeType.TOPIC && node.getChildBoardId() != null) {
            subtopicCount = nodeRepository.countByBoardIdAndType(node.getChildBoardId(), NodeType.TOPIC);
            completedSubtopicCount =
                    nodeRepository.countByBoardIdAndTypeAndCompletedTrue(node.getChildBoardId(), NodeType.TOPIC);
        }

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
                node.getHeight(),
                node.isCompleted(),
                subtopicCount,
                completedSubtopicCount);
    }
}
