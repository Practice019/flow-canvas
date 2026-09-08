import { useCallback, useEffect, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowFile } from "./types";
import { layoutFlow } from "./layout";
import FlowNodeCard from "./FlowNodeCard";
import DetailPanel from "./DetailPanel";

const nodeTypes = { flow: FlowNodeCard };

function Canvas() {
  const [file, setFile] = useState<FlowFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    fetch("/data/flow.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((f: FlowFile) => {
        if (!Array.isArray(f.nodes) || !Array.isArray(f.edges)) {
          throw new Error("flow.json 缺少 nodes/edges 数组");
        }
        setFile(f);
        const { nodes: rfNodes, edges: rfEdges } = layoutFlow(f);
        setNodes(rfNodes);
        setEdges(rfEdges);
        requestAnimationFrame(() => fitView({ padding: 0.12, maxZoom: 1 }));
      })
      .catch((e) => setError(String(e)));
  }, [fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((ns) => applyNodeChanges(changes, ns));
  }, []);

  const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
    const first = params.nodes[0];
    setSelectedId(first && first.type === "flow" ? first.id : null);
  }, []);

  if (error) {
    return <div className="load-error">加载失败：{error}</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◇</span>
          <strong>{file?.project ?? "Flow Canvas"}</strong>
          <span className="sub">{file?.description}</span>
        </div>
        <div className="meta">
          {nodes.length} 节点 · {edges.length} 连线
        </div>
      </header>
      <div className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onSelectionChange={onSelectionChange}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1.4} color="#2a251d" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable maskColor="rgba(10,10,10,0.75)" nodeColor="#3d3428" />
        </ReactFlow>
        <DetailPanel
          file={file ?? { project: "", generatedAt: "", nodes: [], edges: [] }}
          selectedId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
