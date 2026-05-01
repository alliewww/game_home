// ─── 關卡定義 ───────────────────────────────────────────────────────────────
// 難度分 7 個等級（2-bit → 8-bit），程式生成共 30 關

export const LEVEL_TIERS = [
  { maxNumber: 3,   levelCount: 3, baseTarget: 2, labelKey: 'tier2bit' },
  { maxNumber: 7,   levelCount: 4, baseTarget: 3, labelKey: 'tier3bit' },
  { maxNumber: 15,  levelCount: 4, baseTarget: 4, labelKey: 'tier4bit' },
  { maxNumber: 31,  levelCount: 4, baseTarget: 5, labelKey: 'tier5bit' },
  { maxNumber: 63,  levelCount: 4, baseTarget: 6, labelKey: 'tier6bit' },
  { maxNumber: 127, levelCount: 5, baseTarget: 7, labelKey: 'tier7bit' },
  { maxNumber: 255, levelCount: 6, baseTarget: 8, labelKey: 'tier8bit' },
]; // 3+4+4+4+4+5+6 = 30 關

function generateLevels() {
  const levels = [];
  LEVEL_TIERS.forEach(tier => {
    for (let i = 0; i < tier.levelCount; i++) {
      levels.push({
        maxNumber:   tier.maxNumber,
        targetClear: tier.baseTarget + i,
        initialRows: Math.min(3, tier.baseTarget + i), // 最多 3 張，但不超過總題數
        labelKey:    tier.labelKey,
      });
    }
  });
  return levels;
}

export const LEVELS = generateLevels();

// 全部關卡通關後進入的無限模式設定
export const INFINITE_LEVEL = {
  maxNumber:   255,
  targetClear: Infinity,
  initialRows: 3,
  labelKey:    'infiniteMode',
};
