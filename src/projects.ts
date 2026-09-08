import type { FlowFile } from "./types";

export type ProjectSource = "data" | "imported";

export interface ProjectEntry {
  key: string;
  name: string;
  source: ProjectSource;
  file: FlowFile;
}

/** data/ 目录下的全部 flow 文件（构建期由 Vite glob 收集，新增文件自动进入列表）。 */
const dataGlob = import.meta.glob("../data/*.json", { eager: true }) as Record<
  string,
  { default: FlowFile }
>;

/** 列出 data/ 目录中的全部项目，按文件名排序。 */
export function dataProjects(): ProjectEntry[] {
  return Object.entries(dataGlob)
    .map(([path, mod]) => ({
      key: `data:${path}`,
      name: path.split("/").pop() ?? path,
      source: "data" as const,
      file: mod.default,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** 按文件名（如 "understand-anything.json"）查找 data/ 中的项目。 */
export function findDataProject(name: string): ProjectEntry | undefined {
  return dataProjects().find((p) => p.name === name);
}

/** 解析并校验导入的 flow.json 文本；不合法则抛出带中文说明的错误。 */
export function parseFlowFile(text: string, fileName: string): FlowFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`${fileName}：JSON 解析失败（不是合法 JSON）`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${fileName}：JSON 顶层必须是对象`);
  }
  const f = raw as Partial<FlowFile>;
  if (typeof f.project !== "string" || !f.project.trim()) {
    throw new Error(`${fileName}：缺少 project 字段（项目名）`);
  }
  if (!Array.isArray(f.nodes) || !Array.isArray(f.edges)) {
    throw new Error(`${fileName}：缺少 nodes/edges 数组`);
  }
  return f as FlowFile;
}
