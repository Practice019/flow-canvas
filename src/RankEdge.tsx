import { memo } from "react";
import { getSmoothStepPath, BaseEdge, type EdgeProps } from "@xyflow/react";

interface RankEdgeData {
  isBack?: boolean;
}

/**
 * Rank-aware flow edge (TB layout).
 *
 * Every edge renders through this custom component (React Flow's built-in
 * smoothstep edges vanish SILENTLY when the graph contains a cycle, verified
 * by controlled experiment):
 *
 * - forward edge: solid rounded orthogonal step path, straight in the inner
 *   corridor between the two cards;
 * - back edge (cycle re-entry): same orthogonal path but dashed and offset
 *   8px perpendicular to the edge direction, so it runs parallel to the
 *   forward edge instead of arcing around the graph (no crossings).
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
  data,
}: EdgeProps) {
  const isBack = Boolean((data as RankEdgeData | undefined)?.isBack);

  // 回边偏移：垂直于主方向 8px，与正向边平行分离
  const horizontal = Math.abs(targetX - sourceX) >= Math.abs(targetY - sourceY);
  const offX = horizontal ? 0 : isBack ? 8 : 0;
  const offY = horizontal ? (isBack ? -8 : 0) : 0;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: sourceX + offX,
    sourceY: sourceY + offY,
    targetX: targetX + offX,
    targetY: targetY + offY,
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
      labelStyle={{ fill: isBack ? "#a08a68" : "#c9b896", fontSize: 11 }}
      style={
        isBack
          ? { stroke: "#6f5a3e", strokeWidth: 1.5, strokeDasharray: "6 3" }
          : { stroke: "#8b7355", strokeWidth: 1.5 }
      }
      markerEnd={markerEnd}
    />
  );
}

const RankEdge = memo(RankEdgeInner);
export default RankEdge;
