/**
 * 悬浮说明面板的屏幕定位（纯函数，便于独立验证）。
 *
 * 输入：节点的画布坐标与卡片尺寸、视口变换（zoom + translate + 视口像素尺寸）、
 *       弹层自身的屏幕像素尺寸。输出：弹层左上角屏幕坐标 + 所在侧。
 *
 * 规则：
 * - 默认贴卡片右侧（间距 gap），屏幕尺寸恒定（不随缩放变小）；
 * - 右缘放不下则翻到卡片左侧；上下垂直居中对齐卡片并钳制进视口；
 * - 极端情况下（弹层大于视口）钳制到视口边缘，保证尽量可见。
 */

export interface PopupPlacementInput {
  /** 节点卡片左上角的画布坐标 */
  nodeX: number;
  nodeY: number;
  /** 节点卡片宽（布局常量，280） */
  cardW: number;
  /** 节点卡片高（布局常量，170） */
  cardH: number;
  /** 视口缩放 */
  zoom: number;
  /** 视口平移 x */
  vx: number;
  /** 视口平移 y */
  vy: number;
  /** 视口宽（屏幕像素） */
  vw: number;
  /** 视口高（屏幕像素） */
  vh: number;
  /** 弹层宽（屏幕像素） */
  popupW: number;
  /** 弹层高（屏幕像素） */
  popupH: number;
  /** 卡片与弹层间距（默认 12） */
  gap?: number;
  /** 视口边缘留白（默认 12） */
  margin?: number;
}

export interface PopupPlacement {
  left: number;
  top: number;
  side: "right" | "left";
}

export function placePopup(inp: PopupPlacementInput): PopupPlacement {
  const gap = inp.gap ?? 12;
  const m = inp.margin ?? 12;

  const cardLeft = inp.nodeX * inp.zoom + inp.vx;
  const cardTop = inp.nodeY * inp.zoom + inp.vy;
  const cardRight = (inp.nodeX + inp.cardW) * inp.zoom + inp.vx;
  const cardCenterY = cardTop + (inp.cardH * inp.zoom) / 2;

  // 水平：优先右侧，放不下翻左侧，最后钳制进视口
  let side: "right" | "left" = "right";
  let left = cardRight + gap;
  if (left + inp.popupW > inp.vw - m) {
    side = "left";
    left = cardLeft - gap - inp.popupW;
  }
  const maxLeft = Math.max(m, inp.vw - m - inp.popupW);
  left = Math.min(Math.max(left, m), maxLeft);

  // 垂直：与卡片垂直居中对齐，再钳制进视口
  let top = cardCenterY - inp.popupH / 2;
  const maxTop = Math.max(m, inp.vh - m - inp.popupH);
  top = Math.min(Math.max(top, m), maxTop);

  return { left, top, side };
}
