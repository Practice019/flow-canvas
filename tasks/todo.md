# Task List: 弹窗拖动调宽

基线 commit（开工前 checkpoint）：`67dc628`（flow-canvas 仓库，工作区干净）

## Task 1: popupWidth.ts 宽度持久化模块

**Description:** 新增 `src/popupWidth.ts`，照 `fontSize.ts` 模式实现弹窗宽度读取/写入：
KEY `fc-popup-width`，范围 [240, 640]，默认 360，clamp + try/catch 兜底。

**Acceptance criteria:**
- [ ] 导出 `WIDTH_MIN=240`、`WIDTH_MAX=640`、`WIDTH_DEFAULT=360`、`readPopupWidth()`、`writePopupWidth(n)`
- [ ] `writePopupWidth` 越界值被 clamp 后才落盘

**Verification:**
- [ ] `pnpm build` exit 0
- [ ] 文件内容与 fontSize.ts 模式逐条对应（diff 级 review）

**Dependencies:** None
**Files likely touched:** `src/popupWidth.ts`（新增）
**Estimated scope:** XS

## Task 2: NodePopup 拖动调宽 + 手柄 CSS

**Description:** NodePopup 内加宽度 state（初值 readPopupWidth），内联 width 替换 POPUP_W；
外缘（按 placement.side 选左/右）加 10px 拖动手柄，Pointer Events 拖动
（按下记录基准 → move 增量算新宽 clamp → up 写 localStorage + 还原 body 样式）；
index.css 加 `.resize-handle` 样式（col-resize、hover 高亮、touch-action: none）。

**Acceptance criteria:**
- [ ] 外缘拖动加宽/收窄，宽度恒在 [240, 640]，对面边随鼠标、贴卡片边不动
- [ ] pointerdown 已 stopPropagation：拖手柄时画布不平移
- [ ] 拖动中无文本选中、光标恒为 col-resize

**Verification:**
- [ ] `pnpm build` exit 0
- [ ] `pnpm dev` 实测：开卡片 → hover 外缘出 col-resize → 拖宽到 640 停住、拖窄到 240 停住
- [ ] 实测：拖手柄画布无平移

**Dependencies:** Task 1
**Files likely touched:** `src/NodePopup.tsx`、`src/index.css`
**Estimated scope:** M

## Checkpoint: Foundation
- [ ] build 绿 + Task 1/2 全部验收项过

## Task 3: 持久化 + 全量回归验证

**Description:** 验证宽度刷新保持，并回归既有行为不受影响；截图存 docs/；收尾 commit。

**Acceptance criteria:**
- [ ] 拖到自定义宽度 → F5 刷新 → 再开卡片宽度不变（DevTools 确认 fc-popup-width）
- [ ] 窄视口/靠右节点：弹窗翻左侧且钳制不越界（自定义宽度下）
- [ ] A-/A+ 字号、Esc 关闭、点空白关闭均正常
- [ ] `docs/screenshot-popup-resize.png` 等证据截图入库

**Verification:**
- [ ] 上述各项人工核对（或 CDP 驱动）+ 截图
- [ ] `pnpm build` exit 0；git log 显示基线起每步一 commit

**Dependencies:** Task 2
**Files likely touched:** `docs/`（截图）
**Estimated scope:** S

## Checkpoint: Complete
- [ ] 全部验收项过，最终 commit 交付
