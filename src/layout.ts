import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
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

/** Topological layered layout (LR). Isolated nodes go to the last rank. */
export function layoutFlow(file: FlowFile): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 110, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of file.nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  const ids = new Set(file.nodes.map((n) => n.id));
  for (const e of file.edges) {
    if (ids.has(e.source) && ids.has(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  const nodes: Node[] = file.nodes.map((n) => {
    const p = g.node(n.id);
    return {
      id: n.id,
      type: "flow",
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      data: {
        ...n,
        kindZh: KIND_ZH[n.kind ?? "stage"],
      },
    };
  });

  const edges: Edge[] = file.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({
      id: `e${i}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label,
      type: "smoothstep",
      style: { stroke: "#8b7355", strokeWidth: 1.5 },
      labelStyle: { fill: "#c9b896", fontSize: 11 },
      labelBgStyle: { fill: "#161310", fillOpacity: 0.9 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    }));

  return { nodes, edges };
}
