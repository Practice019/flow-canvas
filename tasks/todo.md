# Task List: 弹窗拖动调宽

基线 commit（开工前 checkpoint）：`67dc628`（flow-canvas 仓库，工作区干净）

## Task 1: popupWidth.ts 宽度持久化模块 ✅

**Description:** 新增 `src/popupWidth.ts`，照 `fontSize.ts` 模式实现弹窗宽度读取/写入：
KEY `fc-popup-width`，范围 [240, 640]，默认 360，clamp + try/catch 兜底。

**Acceptance criteria:**
- [x] 导出 `WIDTH_MIN=240`、`WIDTH_MAX=640`、`WIDTH_DEFAULT=360`、`readPopupWidth()`、`writePopupWidth(n)`
- [x] `writePopupWidth` 越界值被 clamp 后才落盘

**Verification:**
- [x] `pnpm build` exit 0
- [x] 文件内容与 fontSize.ts 模式逐条对应（diff 级 review）

**Dependencies:** None
**Files likely touched:** `src/popupWidth.ts`（新增）
**Estimated scope:** XS
**结果:** commit `14a5d08`

## Task 2: NodePopup 拖动调宽 + 手柄 CSS ✅

**Description:** NodePopup 内加宽度 state（初值 readPopupWidth），内联 width 替换 POPUP_W；
外缘（按 placement.side 选左/右）加 10px 拖动手柄，Pointer Events 拖动
（按下记录基准 → move 增量算新宽 clamp → up 写 localStorage + 还原 body 样式）；
index.css 加 `.resize-handle` 样式（col-resize、hover 高亮、touch-action: none）。

**Acceptance criteria:**
- [x] 外缘拖动加宽/收窄，宽度恒在 [240, 640]，对面边随鼠标、贴卡片边不动
- [x] pointerdown 已 stopPropagation：拖手柄时画布不平移
- [x] 拖动中无文本选中、光标恒为 col-resize

**Verification:**
- [x] `pnpm build` exit 0
- [x] CDP 实测：360→480 精确（+120 拖动量）；+600 钳 640；-1000 钳 240
- [x] CDP 实测：拖动前后 viewport transform 完全一致（无平移）

**Dependencies:** Task 1
**Files likely touched:** `src/NodePopup.tsx`、`src/index.css`
**Estimated scope:** M
**结果:** commit `ceec1ff`

## Checkpoint: Foundation ✅

## Task 3: 持久化 + 全量回归验证 ✅

**Description:** 验证宽度刷新保持，并回归既有行为不受影响；截图存 docs/；收尾 commit。

**Acceptance criteria:**
- [x] 拖到自定义宽度 → 刷新 → 再开卡片宽度不变（单标签受控验证：360→420→刷新→420；store=420）
- [x] 窄视口（820px 模拟）弹窗翻左侧，左缘拖动加宽、右缘钉死、不越界
- [x] A-/A+ 字号（14→15，fc-detail-font-size 持久化）、Esc 关闭、点空白关闭均正常
- [x] `docs/screenshot-popup-resize-*.png` 证据截图入库

**Verification:**
- [x] 上述各项 CDP 驱动实测 + 截图
- [x] `pnpm build` exit 0；git log 基线起每步一 commit

**Dependencies:** Task 2
**Files likely touched:** `docs/`（截图）、`README.md`
**Estimated scope:** S
**结果:** commit `待提交`

## Checkpoint: Complete ✅
- 全部验收项过，最终 commit 交付
