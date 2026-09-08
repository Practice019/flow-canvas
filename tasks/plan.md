# Implementation Plan: 节点说明弹窗支持拖动调整宽度

## Overview

点击画布卡片弹出的全文说明面板（NodePopup）目前宽度写死 360px（`POPUP_W` 常量 + 内联 style）。
本计划让弹窗宽度可用鼠标/触摸在**外缘（远离卡片的一侧）拖动调整**，并在 `localStorage` 持久化，
与既有 `fontSize.ts`（A-/A+ 字号持久化）保持同一模式。

## Architecture Decisions

- **AD1 状态归属**：宽度状态放在 `NodePopup` 组件内（`useState`），首帧读 localStorage，
  拖动结束写入。理由：宽度是弹层私有 UI 状态，与字号同构；App 层无需感知。
- **AD2 新增持久化模块** `src/popupWidth.ts`：`KEY = "fc-popup-width"`，
  `WIDTH_MIN = 240`、`WIDTH_MAX = 640`、`WIDTH_DEFAULT = 360`，提供
  `readPopupWidth() / writePopupWidth(n)`（内部 clamp，try/catch 兜底）。
  完全复制 `fontSize.ts` 的容错模式（storage 不可用时静默回退默认值）。
- **AD3 拖动手柄位置 = 外缘**：`placePopup` 已返回 `side: "right" | "left"`。
  手柄固定放在**远离卡片的那条边**（side=right → 右缘，side=left → 左缘）。
  该边被定位算法钉在卡片旁，拖动时对面边随鼠标移动 —— 两侧行为对称、符合直觉。
- **AD4 拖动数学（增量法，无反馈回路）**：
  - 按下时记录 `startX`（clientX）与 `startWidth`；
  - `side=right`: `newW = startWidth + (clientX - startX)`；
  - `side=left`: `newW = startWidth - (clientX - startX)`；
  - 每帧 clamp 到 `[WIDTH_MIN, min(WIDTH_MAX, vw - 24)]`，`vw` 由 App 已传入。
  增量法保证拖动中位置稳定（不依赖每帧重新计算的 placement）。
- **AD5 事件与干扰隔离**：用 Pointer Events（pointerdown/move/up）天然支持鼠标+触摸；
  手柄 `pointerdown` 上 `preventDefault + stopPropagation`，防止触发 react-flow 画布平移；
  手柄 `touch-action: none`；拖动期间 body `user-select: none` + `cursor: col-resize`，up 时还原。
- **AD6 定位零改动**：`NodePopup` 已有 `useLayoutEffect` 测量真实渲染尺寸（getBoundingClientRect）
  并喂给 `placePopup`；宽度变化 → 测量值变化 → 重新钳制/翻侧自动生效，`popupPlacement.ts` 无需改动。

## Task List

### Phase 1: Foundation
- [ ] Task 1: `popupWidth.ts` 宽度持久化模块（S1）
- [ ] Task 2: NodePopup 拖动调宽 + 手柄 CSS（S2）

### Checkpoint: Foundation
- [ ] `pnpm build` 通过（tsc --noEmit + vite build）
- [ ] 浏览器实测：开卡片 → 外缘出现 col-resize 光标 → 拖宽/拖窄生效、不超 [240, 640]
- [ ] 浏览器实测：拖手柄不触发画布平移

### Phase 2: Persist & Regression
- [ ] Task 3: 持久化 + 全量回归验证（S3）

### Checkpoint: Complete
- [ ] 刷新页面宽度保持（localStorage fc-popup-width）
- [ ] 窄视口下翻左侧、钳制不越界（自定义宽度）
- [ ] A-/A+ 字号、Esc 关闭、点空白关闭均不受影响
- [ ] 截图证据存 `docs/`；`pnpm build` 绿；提交 commit

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 拖动手柄时 react-flow 把 pointerdown 当画布平移 | High | 手柄 pointerdown `stopPropagation + preventDefault`；S2 验收项显式验证 |
| 拖动中宽度与 placement 互相追逐产生抖动 | Med | AD4 增量法：拖动期间 width 只由按下基准+位移决定，与 placement 解耦 |
| 拖动中选中面板内文本 | Low | 拖动期间 body `user-select: none`，up 还原 |
| localStorage 不可用（隐私模式） | Low | AD2 沿用 fontSize.ts 的 try/catch 静默回退默认 360 |
| 视口很窄时弹窗被钳制后拖动观感异常 | Low | 允许：钳制保证可见性（placePopup 既有规则），宽度状态与视觉解耦 |

## Open Questions

- 无。范围明确：只调宽度、只弹窗内交互，不动字号逻辑与定位算法。
