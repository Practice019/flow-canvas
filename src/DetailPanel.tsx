import { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FlowFile } from "./types";

/** Full-text reading panel: selected node markdown + its outgoing relations. */
export default function DetailPanel({
  file,
  selectedId,
  onClose,
}: {
  file: FlowFile;
  selectedId: string | null;
  onClose: () => void;
}) {
  const node = useMemo(
    () => file.nodes.find((n) => n.id === selectedId) ?? null,
    [file, selectedId]
  );
  const outgoing = useMemo(
    () =>
      node
        ? file.edges
            .filter((e) => e.source === node.id)
            .map((e) => ({
              label: e.label,
              target: file.nodes.find((n) => n.id === e.target)?.title ?? e.target,
            }))
        : [],
    [file, node]
  );

  if (!node) return null;

  return (
    <aside className="detail-panel">
      <div className="detail-head">
        <span className={`badge badge-${node.kind ?? "stage"}`}>
          {kindZh(node.kind)}
        </span>
        <button className="close-btn" onClick={onClose} title="关闭">
          ✕
        </button>
      </div>
      <h2 className="detail-title">{node.title}</h2>
      <div className="detail-body">
        <Markdown remarkPlugins={[remarkGfm]}>{node.body}</Markdown>
      </div>
      {outgoing.length > 0 && (
        <div className="detail-out">
          <div className="detail-out-head">下游关系</div>
          <ul>
            {outgoing.map((o, i) => (
              <li key={i}>
                <span className="arrow">→</span> {o.target}
                {o.label && <span className="rel-label">（{o.label}）</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="detail-id">id: {node.id}</div>
    </aside>
  );
}

function kindZh(kind?: string): string {
  switch (kind) {
    case "module": return "模块";
    case "decision": return "决策";
    case "artifact": return "产物";
    case "detail": return "细节";
    default: return "阶段";
  }
}
