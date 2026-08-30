import { Position, type InternalNode, type Node } from "@xyflow/react";

// Finds the point where the line between the two node centers crosses
// `intersectionNode`'s rectangular boundary.
function getNodeIntersection(intersectionNode: InternalNode<Node>, targetNode: InternalNode<Node>) {
  const w = (intersectionNode.measured.width ?? 0) / 2;
  const h = (intersectionNode.measured.height ?? 0) / 2;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.measured.width ?? 0) / 2;
  const y1 = targetPosition.y + (targetNode.measured.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;

  return {
    x: w * (xx3 + yy3) + x2,
    y: h * (-xx3 + yy3) + y2,
  };
}

function getEdgePosition(node: InternalNode<Node>, intersectionPoint: { x: number; y: number }) {
  const n = node.internals.positionAbsolute;
  const nodeWidth = node.measured.width ?? 0;
  const nodeHeight = node.measured.height ?? 0;
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + nodeWidth - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + nodeHeight - 1) return Position.Bottom;
  return Position.Top;
}

// Computes the shortest anchor points between two nodes, picking whichever
// side of each node's border is closest to the other node instead of
// always routing through a fixed top/bottom handle.
export function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos: getEdgePosition(source, sourceIntersectionPoint),
    targetPos: getEdgePosition(target, targetIntersectionPoint),
  };
}
