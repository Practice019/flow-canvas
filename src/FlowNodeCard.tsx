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
      <Handle type="target" position={Position.Left} />
      <div className="card-top">
        <span className={`badge badge-${d.kind}`}>{d.kindZh}</span>
      </div>
      <div className="card-title">{d.title}</div>
      <div className="card-md excerpt">
        <Markdown remarkPlugins={[remarkGfm]}>{d.body}</Markdown>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const FlowNodeCard = memo(FlowNodeCardInner);
export default FlowNodeCard;
