import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface FlowCardData extends Record<string, unknown> {
  title: string;
  body: string;
  kindZh: string;
  kind: string;
}

/** Compact markdown for the card excerpt: full markdown, height-capped by CSS. */
function FlowNodeCardInner({ data, selected }: NodeProps) {
  const d = data as FlowCardData;
  return (
    <div className={`flow-card kind-${d.kind}${selected ? " selected" : ""}`}>
      {/* 4-side handles: edges pick sides dynamically by target direction (see layout.ts) */}
      <Handle type="target" position={Position.Left} id="t-left" />
      <Handle type="target" position={Position.Right} id="t-right" />
      <Handle type="target" position={Position.Top} id="t-top" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" />
      <Handle type="source" position={Position.Left} id="s-left" />
      <Handle type="source" position={Position.Right} id="s-right" />
      <Handle type="source" position={Position.Top} id="s-top" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" />
      <div className="card-top">
        <span className={`badge badge-${d.kind}`}>{d.kindZh}</span>
      </div>
      <div className="card-title">{d.title}</div>
      <div className="card-md excerpt">
        <Markdown remarkPlugins={[remarkGfm]}>{d.body}</Markdown>
      </div>
    </div>
  );
}

const FlowNodeCard = memo(FlowNodeCardInner);
export default FlowNodeCard;
