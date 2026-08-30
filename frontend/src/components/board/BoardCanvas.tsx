import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { BoardResponse } from "../../types/api";
import { useNodeMutations } from "../../hooks/useNodeMutations";
import { useEdgeMutations } from "../../hooks/useEdgeMutations";
import { TopicNode, type TopicNodeData } from "./TopicNode";
import { NoteNode, type NoteNodeData } from "./NoteNode";
import { ParentTopicNode, type ParentTopicNodeData } from "./ParentTopicNode";
import { AddNodeToolbar } from "./AddNodeToolbar";
import { PromptModal } from "../common/PromptModal";

const nodeTypes = { topic: TopicNode, note: NoteNode, parentTopic: ParentTopicNode };

interface BoardCanvasProps {
  board: BoardResponse;
}

export function BoardCanvas({ board }: BoardCanvasProps) {
  return (
    <ReactFlowProvider>
      <BoardCanvasInner board={board} />
    </ReactFlowProvider>
  );
}

function BoardCanvasInner({ board }: BoardCanvasProps) {
  const { createNode, updateNode, updatePositions, deleteNode } = useNodeMutations(board.boardId);
  const { createEdge, deleteEdge } = useEdgeMutations(board.boardId);
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChangeDefault] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState<Edge>([]);
  const [showTopicPrompt, setShowTopicPrompt] = useState(false);
  const isSubtopicBoard = board.parentNode !== null;
  const parentAnchorId = board.parentNode?.id ?? null;

  function nextSpawnPosition() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const center = rect
      ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 100, y: 100 };
    return {
      positionX: center.x + (Math.random() - 0.5) * 80,
      positionY: center.y + (Math.random() - 0.5) * 80,
    };
  }

  useEffect(() => {
    const mappedNodes = board.nodes.map((n): Node => {
      if (n.type === "TOPIC") {
        const data: TopicNodeData = {
          label: n.label ?? "Untitled",
          childBoardId: n.childBoardId,
          isSubtopicBoard,
          completed: n.completed,
          subtopicCount: n.subtopicCount,
          completedSubtopicCount: n.completedSubtopicCount,
          onRename: (label: string) => {
            updateNode.mutate({ nodeId: n.id, request: { label } });
            setNodes((nds) =>
              nds.map((node) =>
                node.id === n.id ? { ...node, data: { ...node.data, label } } : node,
              ),
            );
          },
          onToggleComplete: (completed: boolean) => {
            updateNode.mutate({ nodeId: n.id, request: { completed } });
            setNodes((nds) =>
              nds.map((node) =>
                node.id === n.id ? { ...node, data: { ...node.data, completed } } : node,
              ),
            );
          },
        };
        return { id: n.id, type: "topic", position: { x: n.positionX, y: n.positionY }, data };
      }
      const data: NoteNodeData = {
        noteText: n.noteText ?? "",
        onChangeText: (noteText: string) => {
          updateNode.mutate({ nodeId: n.id, request: { noteText } });
        },
        onResize: (width: number, height: number) => {
          updateNode.mutate({ nodeId: n.id, request: { width, height } });
          setNodes((nds) =>
            nds.map((node) => (node.id === n.id ? { ...node, style: { width, height } } : node)),
          );
        },
      };
      return {
        id: n.id,
        type: "note",
        position: { x: n.positionX, y: n.positionY },
        style: { width: n.width ?? undefined, height: n.height ?? undefined },
        data,
      };
    });

    if (board.parentNode) {
      const parentData: ParentTopicNodeData = { label: board.parentNode.label ?? "Untitled" };
      mappedNodes.unshift({
        id: board.parentNode.id,
        type: "parentTopic",
        position: { x: -220, y: -160 },
        draggable: false,
        selectable: false,
        deletable: false,
        connectable: true,
        data: parentData,
      });
    }

    setNodes(mappedNodes);
    setEdges(
      board.edges.map((e): Edge => ({ id: e.id, source: e.sourceNodeId, target: e.targetNodeId })),
    );
    // Re-sync whenever we load a different board (navigation) or the server data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.boardId, board.nodes, board.edges, board.parentNode, isSubtopicBoard]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeDefault(changes);
      for (const change of changes) {
        if (change.type === "remove" && change.id !== parentAnchorId) {
          deleteNode.mutate(change.id);
        }
      }
    },
    [onNodesChangeDefault, deleteNode, parentAnchorId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeDefault(changes);
      for (const change of changes) {
        if (change.type === "remove") {
          deleteEdge.mutate(change.id);
        }
      }
    },
    [onEdgesChangeDefault, deleteEdge],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      createEdge.mutate(
        { sourceNodeId: connection.source, targetNodeId: connection.target },
        {
          onSuccess: (edge) => {
            setEdges((eds) => [
              ...eds,
              { id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId },
            ]);
          },
        },
      );
    },
    [createEdge, setEdges],
  );

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      if (node.id === parentAnchorId) return;
      updatePositions.mutate([
        { nodeId: node.id, positionX: node.position.x, positionY: node.position.y },
      ]);
    },
    [updatePositions, parentAnchorId],
  );

  function handleAddTopic() {
    setShowTopicPrompt(true);
  }

  function createTopic(trimmed: string) {
    setShowTopicPrompt(false);
    createNode.mutate(
      { type: "TOPIC", label: trimmed, ...nextSpawnPosition() },
      {
        onSuccess: (created) => {
          const data: TopicNodeData = {
            label: created.label ?? trimmed,
            childBoardId: created.childBoardId,
            isSubtopicBoard,
            completed: created.completed,
            subtopicCount: created.subtopicCount,
            completedSubtopicCount: created.completedSubtopicCount,
            onRename: (newLabel: string) => {
              updateNode.mutate({ nodeId: created.id, request: { label: newLabel } });
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === created.id ? { ...node, data: { ...node.data, label: newLabel } } : node,
                ),
              );
            },
            onToggleComplete: (completed: boolean) => {
              updateNode.mutate({ nodeId: created.id, request: { completed } });
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === created.id ? { ...node, data: { ...node.data, completed } } : node,
                ),
              );
            },
          };
          setNodes((nds) => [
            ...nds,
            {
              id: created.id,
              type: "topic",
              position: { x: created.positionX, y: created.positionY },
              data,
            },
          ]);
        },
      },
    );
  }

  function handleAddNote() {
    createNode.mutate(
      { type: "NOTE", noteText: "", ...nextSpawnPosition() },
      {
        onSuccess: (created) => {
          const data: NoteNodeData = {
            noteText: created.noteText ?? "",
            onChangeText: (noteText: string) => {
              updateNode.mutate({ nodeId: created.id, request: { noteText } });
            },
            onResize: (width: number, height: number) => {
              updateNode.mutate({ nodeId: created.id, request: { width, height } });
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === created.id ? { ...node, style: { width, height } } : node,
                ),
              );
            },
          };
          setNodes((nds) => [
            ...nds,
            {
              id: created.id,
              type: "note",
              position: { x: created.positionX, y: created.positionY },
              data,
            },
          ]);
        },
      },
    );
  }

  return (
    <div className="relative h-full w-full" ref={wrapperRef}>
      <div className="absolute left-4 top-4 z-10">
        <AddNodeToolbar
          onAddTopic={handleAddTopic}
          onAddNote={handleAddNote}
          addTopicLabel={isSubtopicBoard ? "+ SubTopic" : "+ Topic"}
        />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {showTopicPrompt && (
        <PromptModal
          title={isSubtopicBoard ? "SubTopic name" : "Topic name"}
          placeholder="e.g. Kafka"
          confirmLabel="Add"
          onSubmit={createTopic}
          onCancel={() => setShowTopicPrompt(false)}
        />
      )}
    </div>
  );
}
