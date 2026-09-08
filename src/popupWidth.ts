/** Node popup width state, persisted to localStorage. */

const KEY = "fc-popup-width";
export const WIDTH_MIN = 240;
export const WIDTH_MAX = 640;
export const WIDTH_DEFAULT = 360;

function clamp(n: number): number {
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(n)));
}

export function readPopupWidth(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return WIDTH_DEFAULT;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return WIDTH_DEFAULT;
    return clamp(n);
  } catch {
    return WIDTH_DEFAULT;
  }
}

export function writePopupWidth(n: number): void {
  try {
    localStorage.setItem(KEY, String(clamp(n)));
  } catch {
    /* storage unavailable: ignore */
  }
}
