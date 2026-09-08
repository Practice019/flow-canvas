import { useMemo, useState, type CSSProperties } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FlowFile } from "./types";
import { FONT_DEFAULT, FONT_MAX, FONT_MIN, readFontSize, writeFontSize } from "./fontSize";

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
  const [fontSize, setFontSize] = useState<number>(readFontSize);
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

  const adjust = (delta: number) => {
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize + delta));
    setFontSize(next);
    writeFontSize(next);
  };

  return (
    <aside className="detail-panel" style={{ "--detail-font-size": `${fontSize}px` } as CSSProperties}>
      <div className="detail-head">
        <span className={`badge badge-${node.kind ?? "stage"}`}>
          {kindZh(node.kind)}
        </span>
        <div className="font-control" title="侧栏字号">
          <button
            className="font-btn"
            onClick={() => adjust(-1)}
            disabled={fontSize <= FONT_MIN}
            aria-label="减小字号"
          >
            A−
          </button>
          <span className="font-val">{fontSize}</span>
          <button
            className="font-btn"
            onClick={() => adjust(1)}
            disabled={fontSize >= FONT_MAX}
            aria-label="增大字号"
          >
            A+
          </button>
        </div>
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
