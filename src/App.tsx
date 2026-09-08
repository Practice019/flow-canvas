import { useCallback, useEffect, useRef, useState } from "react";
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
import type { ProjectEntry } from "./projects";
import { dataProjects, findDataProject } from "./projects";
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
  const [entries, setEntries] = useState<ProjectEntry[]>(() => dataProjects());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { fitView } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = entries.find((e) => e.key === activeKey) ?? null;

  /** 载入项目：布局画布、同步 URL、复位视图。 */
  const loadProject = useCallback(
    (entry: ProjectEntry) => {
      setActiveKey(entry.key);
      setError(null);
      const { nodes: rfNodes, edges: rfEdges } = layoutFlow(entry.file);
      setNodes(rfNodes);
      setEdges(rfEdges);
      setSelectedId(null);
      if (entry.source === "data") {
        history.replaceState(null, "", `?file=${encodeURIComponent(entry.name)}`);
      } else {
        history.replaceState(null, "", window.location.pathname);
      }
      requestAnimationFrame(() => fitView({ padding: 0.12, maxZoom: 1 }));
    },
    [fitView]
  );

  // 初始加载：?file= 参数（默认 flow.json）→ glob 已知文件直接载入，否则回退 HTTP 拉取
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("file") ?? "flow.json";
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, "");
    const known = findDataProject(safe);
    if (known) {
      loadProject(known);
      return;
    }
    fetch(`/data/${safe}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}（文件 ${safe} 不存在？）`);
        return r.json();
      })
      .then((f: FlowFile) => {
        if (!Array.isArray(f.nodes) || !Array.isArray(f.edges)) {
          throw new Error("flow.json 缺少 nodes/edges 数组");
        }
        const entry: ProjectEntry = {
          key: `data:${safe}`,
          name: safe,
          source: "data",
          file: f,
        };
        setEntries((prev) =>
          prev.some((p) => p.key === entry.key) ? prev : [...prev, entry]
        );
        loadProject(entry);
      })
      .catch((e) => setError(String(e)));
  }, [loadProject]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((ns) => applyNodeChanges(changes, ns));
  }, []);

  const onSelectionChange = useCallback((params: { nodes: Node[] }) => {
    const first = params.nodes[0];
    setSelectedId(first && first.type === "flow" ? first.id : null);
  }, []);

  const onSelectProject = useCallback(
    (key: string) => {
      const entry = entries.find((e) => e.key === key);
      if (entry) loadProject(entry);
    },
    [entries, loadProject]
  );

  if (error) {
    return <div className="load-error">加载失败：{error}</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◇</span>
          <strong>{active?.file.project ?? "Flow Canvas"}</strong>
          <span className="sub">{active?.file.description}</span>
        </div>
        <div className="actions">
          <div className="meta">
            {active ? fileStats(active.file) : ""}
            <span style={{ opacity: 0.5 }}>（state: {nodes.length}n/{edges.length}e）</span>
          </div>
          <select
            className="proj-select"
            value={activeKey ?? ""}
            onChange={(e) => onSelectProject(e.target.value)}
            title="切换项目"
          >
            <option value="" disabled>
              切换项目…
            </option>
            <optgroup label="data/ 目录">
              {entries
                .filter((e) => e.source === "data")
                .map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.name} — {e.file.project}
                  </option>
                ))}
            </optgroup>
            {entries.some((e) => e.source === "imported") && (
              <optgroup label="本次会话导入">
                {entries
                  .filter((e) => e.source === "imported")
                  .map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.name} — {e.file.project}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
          <button
            className="btn"
            disabled={!active}
            onClick={() =>
              active &&
              downloadText(
                `${active.file.project}-流程链路.md`,
                toMarkdown(active.file),
                "text/markdown"
              )
            }
          >
            导出 Markdown
          </button>
          <button
            className="btn"
            disabled={!active}
            onClick={() =>
              active && downloadText("flow.json", JSON.stringify(active.file, null, 2), "application/json")
            }
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
          file={active?.file ?? { project: "", generatedAt: "", nodes: [], edges: [] }}
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
