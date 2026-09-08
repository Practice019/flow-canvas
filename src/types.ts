export type FlowKind = "stage" | "module" | "decision" | "artifact" | "detail";

export interface FlowNode {
  id: string;
  title: string;
  body: string; // markdown
  kind?: FlowKind;
}

export interface FlowEdge {
  source: string;
  target: string;
  label?: string;
}

export interface FlowFile {
  project: string;
  description?: string;
  generatedAt: string;
  generator?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
