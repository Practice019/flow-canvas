import type { FlowFile, FlowNode } from "./types";

/** Topological-ish order: BFS from roots (no incoming edges), then leftovers. */
function orderedNodes(file: FlowFile): FlowNode[] {
  const incoming = new Set(file.edges.map((e) => e.target));
  const roots = file.nodes.filter((n) => !incoming.has(n.id));
  const seen = new Set<string>();
  const out: FlowNode[] = [];
  const queue = [...roots];
  while (queue.length) {
    const n = queue.shift()!;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
    for (const e of file.edges) {
      if (e.source === n.id) {
        const t = file.nodes.find((x) => x.id === e.target);
        if (t) queue.push(t);
      }
    }
  }
  for (const n of file.nodes) if (!seen.has(n.id)) out.push(n);
  return out;
}

const KIND_ZH: Record<string, string> = {
  stage: "阶段", module: "模块", decision: "决策", artifact: "产物", detail: "细节",
};

/**
 * Export the whole chain as one readable markdown document.
 * The promise: fully readable OUTSIDE the canvas.
 */
export function toMarkdown(file: FlowFile): string {
  const lines: string[] = [];
  lines.push(`# 项目流程：${file.project}`);
  if (file.description) lines.push(`> ${file.description}`);
  lines.push("");
  lines.push(`> 生成时间：${file.generatedAt}${file.generator ? ` · 生成者：${file.generator}` : ""}`);
  lines.push("");
  lines.push("## 链路总览");
  lines.push("");
  for (const e of file.edges) {
    const s = file.nodes.find((n) => n.id === e.source);
    const t = file.nodes.find((n) => n.id === e.target);
    if (s && t) lines.push(`- **${s.title}** → **${t.title}**${e.label ? `（${e.label}）` : ""}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  let i = 1;
  const byId = new Map(file.nodes.map((n) => [n.id, n]));
  for (const n of orderedNodes(file)) {
    lines.push(`## ${i}. ${n.title}`);
    lines.push("");
    if (n.kind && KIND_ZH[n.kind]) lines.push(`*类型：${KIND_ZH[n.kind]}*`);
    lines.push("");
    lines.push(n.body.trim());
    lines.push("");
    const outs = file.edges.filter((e) => e.source === n.id);
    if (outs.length) {
      for (const e of outs) {
        const t = byId.get(e.target);
        if (t) lines.push(`→ 下一步：**${t.title}**${e.label ? `（${e.label}）` : ""}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
    i++;
  }
  return lines.join("\n").replace(/\n---\n\n$/g, "\n");
}

/** Export format summary for header display. */
export function fileStats(file: FlowFile): string {
  const words = file.nodes.reduce((acc, n) => acc + n.body.length, 0);
  return `${file.nodes.length} 节点 · ${file.edges.length} 连线 · 约 ${words} 字`;
}
