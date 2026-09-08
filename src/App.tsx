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
import RankEdge from "./RankEdge";
import { toMarkdown, fileStats } from "./export";

const nodeTypes = { flow: FlowNodeCard };
const edgeTypes = { rank: RankEdge };

function downloadText(name: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Canvas() {
  const [file, setFile] = useState<FlowFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("file") ?? "flow.json";
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, "");
    fetch(`/data/${safe}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}（文件 ${safe} 不存在？）`);
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
        <div className="actions">
          <div className="meta">
            {file ? fileStats(file) : ""}
            <span style={{ opacity: 0.5 }}>（state: {nodes.length}n/{edges.length}e）</span>
          </div>
          <button
            className="btn"
            disabled={!file}
            onClick={() => file && downloadText(`${file.project}-流程链路.md`, toMarkdown(file), "text/markdown")}
          >
            导出 Markdown
          </button>
          <button
            className="btn"
            disabled={!file}
            onClick={() => file && downloadText("flow.json", JSON.stringify(file, null, 2), "application/json")}
          >
            导出 JSON
          </button>
        </div>
      </header>
      <div className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
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
