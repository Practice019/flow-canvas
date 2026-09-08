# flow.json 链路文件格式规范 v1

> Flow Canvas 的核心资产。画布只是它的视图，它本身是完整自洽的"项目流程链路文件"——
> 离开画布（配合导出的 markdown）仍可完整阅读。

## 顶层结构

```jsonc
{
  "project": "string — 项目名（必填）",
  "description": "string — 一句话说明这份链路是什么（可选）",
  "generatedAt": "ISO 8601 — 生成时间（必填）",
  "generator": "string — 生成者标识，如 'deepseek-agent'（可选）",
  "nodes": [FlowNode],
  "edges": [FlowEdge]
}
```

## FlowNode — 文字节点（画布上的卡片）

```jsonc
{
  "id": "string — 唯一标识（必填），建议有语义：'stage-setup'",
  "title": "string — 节点标题，一句话概括（必填）",
  "body": "string — markdown 正文，流程描述主体（必填），支持列表/代码块/加粗",
  "kind": "stage | module | decision | artifact | detail（可选，默认 stage）"
}
```

**kind 语义**：
- `stage` — 流程阶段（默认）
- `module` — 模块/子系统的介绍
- `decision` — 关键决策点（为什么这么做）
- `artifact` — 产物（文档、数据、可交付物）
- `detail` — 补充细节

## FlowEdge — 推导/传递关系（连线）

```jsonc
{
  "source": "node id（必填）",
  "target": "node id（必填）",
  "label": "string — 关系说明，如 '产物传递'、'触发'、'包含'（可选）"
}
```

## 约定

1. **文字优先**：节点主体是自然语言段落，不承载代码符号（类名/函数名不是主角，可以出现在正文中）
2. **有向无环优先**：允许环但默认流程链是有向的，画布按拓扑分层排布
3. **孤立节点合法**：尚未接链的说明可先放画布上
4. **id 稳定**：id 是修订闭环（未来"标记不清晰→AI 重写"）的锚点，一旦发布不改 id

## 导出格式（markdown）

整链导出按拓扑序展开：每节点一个 `##` 标题 + 正文 + 出边列表（`→ 目标标题（label）`）。
