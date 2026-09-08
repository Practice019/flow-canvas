import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FlowFile, FlowNode } from "./types";
import { FONT_MAX, FONT_MIN, readFontSize, writeFontSize } from "./fontSize";
import { NODE_W, NODE_H } from "./layout";
import { placePopup } from "./popupPlacement";

const POPUP_W = 360;
const POPUP_H_ESTIMATE = 420;

function kindZh(kind?: string): string {
  switch (kind) {
    case "module": return "模块";
    case "decision": return "决策";
    case "artifact": return "产物";
    case "detail": return "细节";
    default: return "阶段";
  }
}

/**
 * 点击节点卡片后出现在卡片旁的悬浮全文说明面板。
 * 内容与旧 DetailPanel 一致（markdown 正文 / 下游关系 / 字号控制持久化），
 * 位置由 placePopup 计算并随画布平移缩放跟随。
 */
export default function NodePopup({
  file,
  node,
  nodeX,
  nodeY,
  zoom,
  vx,
  vy,
  vw,
  vh,
  onClose,
}: {
  file: FlowFile;
  node: FlowNode;
  nodeX: number;
  nodeY: number;
  zoom: number;
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  onClose: () => void;
}) {
  const [fontSize, setFontSize] = useState<number>(readFontSize);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: POPUP_W,
    h: POPUP_H_ESTIMATE,
  });
  const ref = useRef<HTMLDivElement>(null);

  // 内容渲染后测量真实（可能被 max-height 截断的）高度，用于精确定位
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ w: r.width || POPUP_W, h: r.height });
  }, [node.id, file, fontSize]);

  const outgoing = useMemo(
    () =>
      file.edges
        .filter((e) => e.source === node.id)
        .map((e) => ({
          label: e.label,
          target: file.nodes.find((n) => n.id === e.target)?.title ?? e.target,
        })),
    [file, node]
  );

  const placement = placePopup({
    nodeX,
    nodeY,
    cardW: NODE_W,
    cardH: NODE_H,
    zoom,
    vx,
    vy,
    vw,
    vh,
    popupW: size.w,
    popupH: size.h,
  });

  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const adjust = useCallback(
    (delta: number) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize + delta));
      setFontSize(next);
      writeFontSize(next);
    },
    [fontSize]
  );

  return (
    <div
      ref={ref}
      className="node-popup"
      role="dialog"
      aria-label={node.title}
      style={
        {
          left: placement.left,
          top: placement.top,
          width: POPUP_W,
          "--detail-font-size": `${fontSize}px`,
        } as CSSProperties
      }
    >
      <div className="detail-head">
        <span className={`badge badge-${node.kind ?? "stage"}`}>
          {kindZh(node.kind)}
        </span>
        <div className="font-control" title="弹层字号">
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
    </div>
  );
}
