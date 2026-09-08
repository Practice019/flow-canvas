import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface FlowCardData extends Record<string, unknown> {
  title: string;
  body: string;
  kindZh: string;
  kind: string;
}

/** Strip markdown punctuation for the plain excerpt (子问题3 换 react-markdown). */
function plain(md: string): string {
  return md.replace(/[#*`>\-\[\]()]/g, "").replace(/\s+/g, " ").trim();
}

function FlowNodeCardInner({ data, selected }: NodeProps) {
  const d = data as FlowCardData;
  return (
    <div className={`flow-card kind-${d.kind}${selected ? " selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="card-top">
        <span className={`badge badge-${d.kind}`}>{d.kindZh}</span>
      </div>
      <div className="card-title">{d.title}</div>
      <div className="card-excerpt">{plain(d.body).slice(0, 80)}…</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const FlowNodeCard = memo(FlowNodeCardInner);
export default FlowNodeCard;
