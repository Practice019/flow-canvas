import dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { FlowFile, FlowKind } from "./types";

export const NODE_W = 280;
export const NODE_H = 170;

const KIND_ZH: Record<FlowKind, string> = {
  stage: "阶段",
  module: "模块",
  decision: "决策",
  artifact: "产物",
  detail: "细节",
};

/**
 * 每个节点在四边居中位置的程序化 handle（相对节点左上角坐标）。
 * 节点同时声明 width/height 与 handles，让 React Flow 的 isNodeInitialized 判定
 * 在挂载/切换/导入所有路径上都成立——不依赖 ResizeObserver 的 DOM 测量时序，
 * 保证带环图（回边）的边也能稳定渲染。
 */
function buildHandles() {
  const mk = (type: "source" | "target", side: string, position: Position, x: number, y: number) => ({
    id: `${type === "source" ? "s" : "t"}-${side}`,
    type,
    x,
    y,
    width: 8,
    height: 8,
    position,
  });
  return [
    mk("target", "left", Position.Left, 0, NODE_H / 2),
    mk("target", "right", Position.Right, NODE_W, NODE_H / 2),
    mk("target", "top", Position.Top, NODE_W / 2, 0),
    mk("target", "bottom", Position.Bottom, NODE_W / 2, NODE_H),
    mk("source", "left", Position.Left, 0, NODE_H / 2),
    mk("source", "right", Position.Right, NODE_W, NODE_H / 2),
    mk("source", "top", Position.Top, NODE_W / 2, 0),
    mk("source", "bottom", Position.Bottom, NODE_W / 2, NODE_H),
  ];
}

/** 依据相对位置选择边的出/入侧：|dx|>=|dy| 走左右，否则走上下，始终朝向目标侧。 */
function pickSides(sx: number, sy: number, tx: number, ty: number): {
  sourceHandle: string;
  targetHandle: string;
} {
  const dx = tx - sx;
  const dy = ty - sy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "s-right", targetHandle: "t-left" }
      : { sourceHandle: "s-left", targetHandle: "t-right" };
  }
  return dy >= 0
    ? { sourceHandle: "s-bottom", targetHandle: "t-top" }
    : { sourceHandle: "s-top", targetHandle: "t-bottom" };
}

/** TB 语义的回边判定：目标在源上方，或同一排但目标在左侧（环/回环边）。 */
function isBackEdge(sx: number, sy: number, tx: number, ty: number): boolean {
  const EPS = 1e-6;
  if (ty < sy - EPS) return true;
  if (Math.abs(ty - sy) <= EPS && tx < sx - EPS) return true;
  return false;
}

/** Topological layered layout (TB, top→bottom). Isolated nodes go to the last rank. */
export function layoutFlow(file: FlowFile): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 36, ranksep: 90, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of file.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  const ids = new Set(file.nodes.map((n) => n.id));
  for (const e of file.edges) {
    if (ids.has(e.source) && ids.has(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  // node center positions, shared with edge side selection & back-edge classification
  const posById = new Map<string, { x: number; y: number }>();
  const nodes: Node[] = file.nodes.map((n) => {
    const p = g.node(n.id);
    posById.set(n.id, { x: p.x, y: p.y });
    return {
      id: n.id,
      type: "flow",
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      width: NODE_W,
      height: NODE_H,
      handles: buildHandles(),
      data: {
        ...n,
        kindZh: KIND_ZH[n.kind ?? "stage"],
      },
    };
  });

  const centerOf = (id: string) => posById.get(id)!;

  const edges: Edge[] = file.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => {
      const s = centerOf(e.source);
      const t = centerOf(e.target);
      const sides = pickSides(s.x, s.y, t.x, t.y);
      return {
        id: `e${i}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "rank",
        sourceHandle: sides.sourceHandle,
        targetHandle: sides.targetHandle,
        data: { isBack: isBackEdge(s.x, s.y, t.x, t.y) },
      };
    });

  return { nodes, edges };
}
