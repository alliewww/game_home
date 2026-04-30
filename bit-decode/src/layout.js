// ─── 版面尺寸計算 ────────────────────────────────────────────────────────────
// 負責根據視窗大小與位元數，計算並套用 --bit-size / --playfield-height CSS 變數

const ALL_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

// 目前關卡的有效位元權重陣列（每次 applyLayout 時更新）
export let activeWeights = [...ALL_WEIGHTS];

export function getBitCount(maxNumber) {
  return Math.floor(Math.log2(maxNumber)) + 1;
}

// 同步計算並套用版面 CSS 變數
// pfWidthOverride：傳入 DOM 精確量測值；省略時從 window 估算（不需等待 DOM）
export function applyLayout(maxNumber, pfWidthOverride) {
  const bitCount  = getBitCount(maxNumber);
  activeWeights   = ALL_WEIGHTS.slice(ALL_WEIGHTS.length - bitCount);

  const rem       = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const pfWidth   = pfWidthOverride ?? (window.innerWidth < 768 ? window.innerWidth - 2 * rem : 610);
  const pfPadding = rem;          // padding-left + padding-right (0.5rem × 2)
  const bitGap    = 0.1 * rem;   // gap: 0.1rem
  const arrowWidth = 28;          // .card-translate-arrow + bits-zone padding
  const totalCells = bitCount + 1;

  const byWidth  = (pfWidth - pfPadding - totalCells * bitGap - arrowWidth) / totalCells;
  // 高度限制：讓 3 張卡 + 狀態列等 UI 都能塞進螢幕
  const byHeight = (window.innerHeight - 235) / 3.4;

  const bs = Math.floor(Math.max(20, Math.min(byWidth, byHeight)));
  document.documentElement.style.setProperty('--bit-size', `${bs}px`);

  // 棋盤固定高：3 張卡 × (bs+13) + 3 個 gap + header + padding
  const pfHeight = 3 * (bs + 13) + 3 * 6.4 + 23 + 16;
  document.documentElement.style.setProperty('--playfield-height', `${Math.ceil(pfHeight)}px`);
}

// 先用估算值同步設定，再用 DOM 精確量測校正（避免首次渲染高度跳動）
export function updateActiveWeights(maxNumber) {
  applyLayout(maxNumber);
  requestAnimationFrame(() => {
    const pf = document.querySelector('.playfield');
    if (!pf) return;
    const domWidth = pf.getBoundingClientRect().width;
    if (domWidth > 0) applyLayout(maxNumber, domWidth);
  });
}
