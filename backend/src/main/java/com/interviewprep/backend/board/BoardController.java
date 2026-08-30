package com.interviewprep.backend.board;

import com.interviewprep.backend.board.dto.BoardResponse;
import com.interviewprep.backend.board.dto.RootBoardResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping("/root")
    public RootBoardResponse getRoot() {
        return new RootBoardResponse(boardService.getRootBoardId());
    }

    @GetMapping("/{boardId}")
    public BoardResponse getBoard(@PathVariable UUID boardId) {
        return boardService.getBoard(boardId);
    }
}
