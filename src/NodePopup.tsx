import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FlowFile, FlowNode } from "./types";
import { FONT_MAX, FONT_MIN, readFontSize, writeFontSize } from "./fontSize";
import {
  WIDTH_MAX,
  WIDTH_MIN,
  readPopupWidth,
  writePopupWidth,
} from "./popupWidth";
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
  const [width, setWidth] = useState<number>(readPopupWidth);
  const ref = useRef<HTMLDivElement>(null);

  // 内容渲染后测量真实（可能被 max-height 截断的）高度，用于精确定位
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ w: r.width || POPUP_W, h: r.height });
    // width 变化（拖动调宽）必须触发重测，否则 placePopup 拿到旧宽
  }, [node.id, file, fontSize, width]);

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

  // ---- 外缘拖动调宽（增量法：新宽 = 按下基准宽 ± 位移，与 placement 解耦无抖动）----
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    side: "right" | "left";
  } | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const endDrag = useCallback(() => {
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    dragRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current) return;
      e.preventDefault();
      e.stopPropagation(); // 不触发 react-flow 画布平移
      const start = {
        startX: e.clientX,
        startWidth: width,
        side: placement.side,
      };
      dragRef.current = start;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";

      const maxW = vw > 0 ? Math.min(WIDTH_MAX, vw - 24) : WIDTH_MAX;
      const nextFrom = (clientX: number) => {
        const delta =
          start.side === "right"
            ? clientX - start.startX
            : start.startX - clientX;
        return Math.min(Math.max(WIDTH_MIN, start.startWidth + delta), maxW);
      };
      const onMove = (ev: PointerEvent) => {
        if (dragRef.current) setWidth(nextFrom(ev.clientX));
      };
      const onUp = (ev: PointerEvent) => {
        const next = nextFrom(ev.clientX);
        setWidth(next);
        writePopupWidth(next);
        endDrag();
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      dragCleanupRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [width, placement.side, vw, endDrag]
  );

  // 拖动中弹层被卸载（Esc/点空白）时，兜底释放 window 监听与 body 样式
  useEffect(() => {
    return () => endDrag();
  }, [endDrag]);

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
          width,
          "--detail-font-size": `${fontSize}px`,
        } as CSSProperties
      }
    >
      <div
        className={`resize-handle resize-handle--${placement.side}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整弹窗宽度"
        onPointerDown={onHandlePointerDown}
      />
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
