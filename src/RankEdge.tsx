import { memo } from "react";
import {
  getBezierPath,
  getSmoothStepPath,
  BaseEdge,
  type EdgeProps,
} from "@xyflow/react";

/**
 * Rank-aware flow edge.
 *
 * React Flow's built-in smoothstep edges vanish SILENTLY when the graph
 * contains a cycle (verified by controlled experiment). We therefore render
 * every edge through this custom component:
 *
 * - forward edge (target right of source): rounded orthogonal step path
 * - back edge (cycle re-entry): dashed bezier arc that swings around
 */
function RankEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
}: EdgeProps) {
  const isBackEdge = targetX <= sourceX;

  const [path, labelX, labelY] = isBackEdge
    ? getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        curvature: 0.55,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 16,
        offset: 14,
      });

  return (
    <BaseEdge
      id={id}
      path={path}
      label={label}
      labelX={labelX}
      labelY={labelY}
      labelShowBg
      labelBgPadding={[6, 3]}
      labelBgBorderRadius={4}
      labelBgStyle={{ fill: "#161310", fillOpacity: 0.92 }}
      labelStyle={{ fill: isBackEdge ? "#a08a68" : "#c9b896", fontSize: 11 }}
      style={
        isBackEdge
          ? { stroke: "#6f5a3e", strokeWidth: 1.5, strokeDasharray: "6 3" }
          : { stroke: "#8b7355", strokeWidth: 1.5 }
      }
      markerEnd={markerEnd}
    />
  );
}

const RankEdge = memo(RankEdgeInner);
export default RankEdge;
