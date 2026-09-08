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
