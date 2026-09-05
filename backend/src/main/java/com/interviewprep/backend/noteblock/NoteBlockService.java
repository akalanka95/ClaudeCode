package com.interviewprep.backend.noteblock;

import com.interviewprep.backend.common.NotFoundException;
import com.interviewprep.backend.node.NodeRepository;
import com.interviewprep.backend.noteblock.dto.CreateNoteBlockRequest;
import com.interviewprep.backend.noteblock.dto.UpdateNoteBlockRequest;
import com.interviewprep.backend.search.SearchService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NoteBlockService {

    private static final double DEFAULT_WIDTH = 260;
    private static final double DEFAULT_HEIGHT = 200;
    private static final String DEFAULT_COLOR = "yellow";

    private final NoteBlockRepository noteBlockRepository;
    private final NodeRepository nodeRepository;
    private final SearchService searchService;

    @Transactional(readOnly = true)
    public List<NoteBlock> list(UUID nodeId) {
        requireNode(nodeId);
        return noteBlockRepository.findByNodeIdOrderByCreatedAtAsc(nodeId);
    }

    @Transactional
    public NoteBlock create(UUID nodeId, CreateNoteBlockRequest request) {
        requireNode(nodeId);
        List<NoteBlock> existing = noteBlockRepository.findByNodeIdOrderByCreatedAtAsc(nodeId);

        NoteBlock noteBlock = new NoteBlock();
        noteBlock.setNodeId(nodeId);
        noteBlock.setContent("");
        noteBlock.setColor(request.color() != null ? request.color() : DEFAULT_COLOR);
        int cascadeOffset = (existing.size() % 6) * 24;
        noteBlock.setPositionX(request.positionX() != null ? request.positionX() : 40 + cascadeOffset);
        noteBlock.setPositionY(request.positionY() != null ? request.positionY() : 40 + cascadeOffset);
        noteBlock.setWidth(DEFAULT_WIDTH);
        noteBlock.setHeight(DEFAULT_HEIGHT);
        noteBlock.setMinimized(false);
        noteBlock.setZIndex(existing.stream().mapToInt(NoteBlock::getZIndex).max().orElse(-1) + 1);

        return noteBlockRepository.save(noteBlock);
    }

    @Transactional
    public NoteBlock update(UUID noteBlockId, UpdateNoteBlockRequest request) {
        NoteBlock noteBlock = noteBlockRepository
                .findById(noteBlockId)
                .orElseThrow(() -> new NotFoundException("Note block not found: " + noteBlockId));

        if (request.content() != null) {
            noteBlock.setContent(request.content());
        }
        if (request.color() != null) {
            noteBlock.setColor(request.color());
        }
        if (request.positionX() != null) {
            noteBlock.setPositionX(request.positionX());
        }
        if (request.positionY() != null) {
            noteBlock.setPositionY(request.positionY());
        }
        if (request.width() != null) {
            noteBlock.setWidth(request.width());
        }
        if (request.height() != null) {
            noteBlock.setHeight(request.height());
        }
        if (request.minimized() != null) {
            noteBlock.setMinimized(request.minimized());
        }
        if (request.zIndex() != null) {
            noteBlock.setZIndex(request.zIndex());
        }

        noteBlock = noteBlockRepository.save(noteBlock);
        if (request.content() != null) {
            searchService.indexNoteBlock(noteBlock);
        }
        return noteBlock;
    }

    @Transactional
    public void delete(UUID noteBlockId) {
        if (!noteBlockRepository.existsById(noteBlockId)) {
            throw new NotFoundException("Note block not found: " + noteBlockId);
        }
        noteBlockRepository.deleteById(noteBlockId);
        searchService.removeNoteBlockFromIndex(noteBlockId);
    }

    private void requireNode(UUID nodeId) {
        if (!nodeRepository.existsById(nodeId)) {
            throw new NotFoundException("Node not found: " + nodeId);
        }
    }
}
