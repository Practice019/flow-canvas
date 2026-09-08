/** Node popup font-size state, persisted to localStorage. */

const KEY = "fc-detail-font-size";
export const FONT_MIN = 12;
export const FONT_MAX = 22;
export const FONT_STEP = 1;
export const FONT_DEFAULT = 14;

function clamp(n: number): number {
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
}

export function readFontSize(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return FONT_DEFAULT;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return FONT_DEFAULT;
    return clamp(n);
  } catch {
    return FONT_DEFAULT;
  }
}

export function writeFontSize(n: number): void {
  try {
    localStorage.setItem(KEY, String(clamp(n)));
  } catch {
    /* storage unavailable: ignore */
  }
}
