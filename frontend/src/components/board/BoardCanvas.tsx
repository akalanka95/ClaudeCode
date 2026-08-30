import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
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
import { AddNodeToolbar } from "./AddNodeToolbar";

const nodeTypes = { topic: TopicNode, note: NoteNode };

interface BoardCanvasProps {
  board: BoardResponse;
}

export function BoardCanvas({ board }: BoardCanvasProps) {
  const { createNode, updateNode, updatePositions, deleteNode } = useNodeMutations(board.boardId);
  const { createEdge, deleteEdge } = useEdgeMutations(board.boardId);

  const [nodes, setNodes, onNodesChangeDefault] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(
      board.nodes.map((n): Node => {
        if (n.type === "TOPIC") {
          const data: TopicNodeData = {
            label: n.label ?? "Untitled",
            childBoardId: n.childBoardId,
            onRename: (label: string) => {
              updateNode.mutate({ nodeId: n.id, request: { label } });
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === n.id ? { ...node, data: { ...node.data, label } } : node,
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
        };
        return { id: n.id, type: "note", position: { x: n.positionX, y: n.positionY }, data };
      }),
    );
    setEdges(
      board.edges.map((e): Edge => ({ id: e.id, source: e.sourceNodeId, target: e.targetNodeId })),
    );
    // Re-sync whenever we load a different board (navigation) or the server data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.boardId, board.nodes, board.edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removals = changes.filter((c) => c.type === "remove");
      const rest = changes.filter((c) => c.type !== "remove");
      if (rest.length) {
        onNodesChangeDefault(rest);
      }
      for (const removal of removals) {
        if (removal.type !== "remove") continue;
        const node = nodes.find((n) => n.id === removal.id);
        const isTopic = node?.type === "topic";
        const confirmed = window.confirm(
          isTopic
            ? "Delete this topic and everything nested under it? This cannot be undone."
            : "Delete this note?",
        );
        if (confirmed) {
          onNodesChangeDefault([removal]);
          deleteNode.mutate(removal.id);
        }
      }
    },
    [nodes, onNodesChangeDefault, deleteNode],
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
      updatePositions.mutate([
        { nodeId: node.id, positionX: node.position.x, positionY: node.position.y },
      ]);
    },
    [updatePositions],
  );

  function handleAddTopic() {
    const label = window.prompt("Topic name:");
    if (!label || !label.trim()) return;
    const trimmed = label.trim();
    createNode.mutate(
      { type: "TOPIC", label: trimmed, positionX: 100 + Math.random() * 200, positionY: 100 + Math.random() * 200 },
      {
        onSuccess: (created) => {
          const data: TopicNodeData = {
            label: created.label ?? trimmed,
            childBoardId: created.childBoardId,
            onRename: (newLabel: string) => {
              updateNode.mutate({ nodeId: created.id, request: { label: newLabel } });
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === created.id ? { ...node, data: { ...node.data, label: newLabel } } : node,
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
      { type: "NOTE", noteText: "", positionX: 100 + Math.random() * 200, positionY: 100 + Math.random() * 200 },
      {
        onSuccess: (created) => {
          const data: NoteNodeData = {
            noteText: created.noteText ?? "",
            onChangeText: (noteText: string) => {
              updateNode.mutate({ nodeId: created.id, request: { noteText } });
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
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10">
        <AddNodeToolbar onAddTopic={handleAddTopic} onAddNote={handleAddNote} />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
