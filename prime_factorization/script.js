// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch((err) => {
    console.error('SW registration failed', err);
  });
}

// 阻止行動裝置雙擊放大
document.addEventListener('dblclick', (e) => {
  e.preventDefault();
});

// 註冊 GSAP Physics2DPlugin
if (typeof gsap !== 'undefined' && typeof Physics2DPlugin !== 'undefined') {
  gsap.registerPlugin(Physics2DPlugin);
}

// 全域元素參考
const startBtn = document.getElementById('start-btn');
const wrapper = document.querySelector('.wrapper');
const gameScreen = document.getElementById('game-screen');

// 封裝開始遊戲流程
function startGame() {

  score = 0;
  successClicks = 0;
  failClicks = 0;
  resetCombo();
  maxShow = 0;
  scoreEl.textContent = 0;
  initGame();
  startTimer();
}

// 點擊 START 按鈕動畫後進入遊戲
startBtn.addEventListener('click', () => {
  // 防止重複點擊
  startBtn.disabled = true;

  // 讓 wrapper 成為覆蓋帷幕
  Object.assign(wrapper.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100vh',
    margin: '0',
    zIndex: '198',
    background: 'var(--color7)', // 保持首頁背景色
    willChange: 'transform',
    transform: 'translateZ(0)', // GPU layer promotion
  });

  // 使用 GSAP 往上掀開
  gsap.to(wrapper, {
    y: '-100%',
    duration: 0.7,
    ease: 'power2.inOut',
    onStart: () => {
      gameScreen.classList.remove('hidden'); // 先顯示遊戲畫面
      startGame();
    },
    onComplete: () => {
      wrapper.classList.add('hidden'); // 完成後隱藏
      // 清理行內樣式（保留 text-align 等 CSS）
      wrapper.style.cssText = '';

      // 移除 will-change 屬性
      wrapper.style.willChange = '';

      wrapper.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      document.getElementById('result-screen').classList.add('hidden');
      startBtn.disabled = false;
    },
  });
});

// --- 遊戲相關 ---
const GAME_TIME = 30; // 遊戲時間（秒）- 可在此調整遊戲時長
const primes = [2, 3, 5, 7, 11, 13];

let factorHistory = [];
let targetNumber  = 0;          // 初值不限，可設 0

const targetNumberEl = document.getElementById('target-number');
// 測試用：點擊圓球即播放爆破動畫
// targetNumberEl.addEventListener('click', () => {
//   showTimeBonus(BONUS_SECONDS);
// });
const primeBtns = document.querySelectorAll('.prime-btn');

// 倒數與計分相關
const timeFillEl = document.getElementById('time-fill');
const scoreEl = document.getElementById('score');
const timeTextEl = document.getElementById('time-text');

// 連打能量條相關
const comboFillEl = document.getElementById('combo-fill');
const comboCountEl = document.getElementById('combo-count');
const comboBarEl = document.getElementById('combo-bar');
const timeBarEl  = document.getElementById('time-bar');

let timeRemaining = GAME_TIME; // 秒
let timerInterval = null;
let score = 0;

let successClicks = 0;
let failClicks = 0;
let usedTargets = new Set(); // 本局已出現過的紅球數字

// 連打系統
let comboCount = 0;
const MAX_COMBO = 7;
const BONUS_SECONDS = 5; // 連擊滿能量後獎勵秒數
let maxShow = 0;
let maxComboAchieved = 0; // 本局最高連擊

const bestScoreKey = 'pf_best_score';

function loadBestScore() {
  const stored = localStorage.getItem(bestScoreKey);
  return stored ? parseInt(stored, 10) : 0;
}
function saveBestScore(v) {
  localStorage.setItem(bestScoreKey, String(v));
}
function updateBestScoreDisplay() {
  document.getElementById('best-score').textContent = loadBestScore();
}

// call once on load
updateBestScoreDisplay();

function startTimer() {
  clearInterval(timerInterval);
  timeRemaining = GAME_TIME;
  updateTimeUI();
  timerInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      clearInterval(timerInterval);
      endGame();
    }
    updateTimeUI();
  }, 1000);
}

function updateTimeUI() {
  const percent = (timeRemaining / GAME_TIME) * 100;
  timeFillEl.style.width = `${percent}%`;
  if (timeTextEl) timeTextEl.textContent = `${timeRemaining}s`;

  // 警告效果
  if (timeRemaining <= 5) {
    timeBarEl.classList.add('time-critical');
    timeBarEl.classList.remove('time-low');
    gameScreen.classList.add('danger-critical');
    gameScreen.classList.remove('danger-low');
  } else if (timeRemaining <= 10) {
    timeBarEl.classList.add('time-low');
    timeBarEl.classList.remove('time-critical');
    gameScreen.classList.add('danger-low');
    gameScreen.classList.remove('danger-critical');
  } else {
    timeBarEl.classList.remove('time-low', 'time-critical');
    gameScreen.classList.remove('danger-low', 'danger-critical');
  }
}

// ---- 更新連擊 UI ----
function updateComboUI() {
  const percent = comboCount >= MAX_COMBO ? 100 : (comboCount / MAX_COMBO) * 100;
  comboFillEl.style.width = `${percent}%`;
  comboCountEl.textContent = comboCount;
}

function resetCombo() {
  comboCount = 0;
  updateComboUI();
}

function increaseCombo() {
  comboCount++;
  maxComboAchieved++;
  if (maxComboAchieved >= maxShow) maxShow = maxComboAchieved;
  updateComboUI();

  if (comboCount >= MAX_COMBO) {
    timeRemaining += BONUS_SECONDS;
    if (timeRemaining > GAME_TIME) timeRemaining = GAME_TIME;
    updateTimeUI();
    showTimeBonus(BONUS_SECONDS);

    // 先保持滿格 0.3 秒再清空能量條
    setTimeout(() => {
      resetCombo();
    }, 300);
  }
}

function addScore(points) {
  score += points;
  if (score < 0) score = 0; // 不允許負分
  scoreEl.textContent = score;
}

function generateTarget() {
  // 目標：100~9999 之間，且僅由 primes 乘積構成
  while (true) {
    let value = 1;
    while (true) {
      const p = primes[Math.floor(Math.random() * primes.length)];
      if (value * p > 999) break; // 超出上限
      value *= p;
      if (Math.random() < 0.4) break; // 40% 機率停止，避免過大或過小
    }
    if (value >= 100 && value <= 999 && !usedTargets.has(value)) return value;
  }
}

function initGame() {
  factorHistory = [];
  targetNumber = generateTarget();
  usedTargets.add(targetNumber);
  updateBallDisplay();
  updateComboUI(); // 確保UI同步
}

function updateBallDisplay() {
  targetNumberEl.textContent = targetNumber;
  // 4位數字時縮小字體以適應圓球
  if (targetNumber >= 1000) {
    targetNumberEl.style.fontSize = '2rem';
  } else {
    targetNumberEl.style.fontSize = '2.5rem';
  }
}

// 質數按鈕點擊
primeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const val = Number(btn.dataset.value);

    if (targetNumber % val === 0) {
      // 正確可整除
      factorHistory.push(val);
      successClicks++;
      targetNumber /= val;

      explodeBall(); // 粒子效果
      animateEnergyParticles(btn); // 能量小球飛向能量條
      addScore(3);   // 每按對一次 +3 分
      increaseCombo(); // 增加連擊

      updateBallDisplay();

      if (targetNumber === 1) {
        addScore(5); // 關卡完成 +5 分
        transitionToNextLevel();
      }
    } else {
      // 錯誤閃紅
      btn.classList.add('error');
      failClicks++;
      addScore(-10); // 扣 10 分，最低 0
      resetCombo(); // 錯誤時重置連擊
      maxComboAchieved = 0;

      setTimeout(() => btn.classList.remove('error'), 300);
    }
  });
});

// ---- 粒子爆破函式 ----
function explodeBall(count = 20) {
  if (typeof gsap === 'undefined') return; // 確保 GSAP 可用

  const colors = ["#F05B5B", "#E6D2CC", "#B9B7BD", "#868B8E"];

  // 取球中心 (viewport 座標)
  const rect = targetNumberEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.classList.add('particle');

    // 隨機尺寸 20~40px
    const size = gsap.utils.random(20, 40);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = gsap.utils.random(colors);

    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;

    document.body.appendChild(p); // 附加至 body，避免受球動畫影響

    const angle = gsap.utils.random(0, 360);            // 噴射角度
    const velocity = gsap.utils.random(200, 600);       // 初速度
    const gravity = 600;                                // 重力
    const duration = gsap.utils.random(1, 1.5);         // 持續時間

    const baseConfig = {
      scale: 0.3,
      opacity: 0,
      rotation: gsap.utils.random(-720, 720),
      duration,
      ease: "power1.out",
      onComplete: () => p.remove(),
    };

    if (typeof Physics2DPlugin !== 'undefined' && gsap.utils.snap) {
      gsap.to(p, {
        physics2D: { angle, velocity, gravity },
        ...baseConfig,
      });
    } else {
      // Fallback：使用預先計算的 dx, dy
      const dxFallback = Math.cos(angle * (Math.PI / 180)) * velocity * 1.5;
      const dyFallback = Math.sin(angle * (Math.PI / 180)) * velocity * 1.5;
      gsap.to(p, {
        x: dxFallback,
        y: dyFallback,
        ...baseConfig,
      });
    }
  }
}

// ---- 小圓球飛向能量條效果 ----
function animateEnergyParticles(sourceEl, count = 4) {
  if (typeof gsap === 'undefined') return; // 如果沒引入 GSAP 就跳過
  const srcRect = sourceEl.getBoundingClientRect();
  const destRect = comboBarEl.getBoundingClientRect();
  const startX = srcRect.left + srcRect.width / 2;
  const startY = srcRect.top + srcRect.height / 2;
  const destX = destRect.left + destRect.width / 2;
  const destY = destRect.top + destRect.height / 2;

  const colors = ["#f1f5a4", "#fec08d", "#fac8b9"];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.classList.add('energy-particle');
    const size = gsap.utils.random(16, 22);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = gsap.utils.random(colors);
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    document.body.appendChild(p);

    // 隨機偏移增加自然感
    const offsetX = gsap.utils.random(-20, 20);
    const offsetY = gsap.utils.random(-20, 20);

    gsap.fromTo(
      p,
      {
        x: offsetX,
        y: offsetY,
        scale: 0.7,
        opacity: 1,
      },
      {
        x: destX - startX,
        y: destY - startY,
        scale: 0.6,
        opacity: 0,
        duration: gsap.utils.random(0.6, 0.8),
        ease: 'power1.in',
        onComplete: () => p.remove(),
      }
    );
  }
}

// ---- 關卡切換動畫 ----
function transitionToNextLevel() {
  // 爆破粒子，不影響球
  explodeBall(30);

  // 直接隱藏球（無動畫），待會再播放出現動畫
  gsap.set(targetNumberEl, { opacity: 0 });

  // 延遲少許以讓爆破更明顯，再切換關卡
  setTimeout(() => {
    initGame();
    // 球由小放大並淡入
    gsap.fromTo(
      targetNumberEl,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out" }
    );
  }, 300);
}

function endGame() {
  // show result screen
  document.getElementById('success-count').textContent = successClicks;
  document.getElementById('fail-count').textContent = failClicks;
  document.getElementById('final-score').textContent = score;
  document.getElementById('max-combo').textContent = maxShow;
  gameScreen.classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  // 彈出動畫
  const resBox = document.querySelector('.result-box');
  gsap.from(resBox, { scale: 0, opacity: 0, duration: 0.6, ease: "back.out" });

  // update best score
  const best = loadBestScore();
  if (score > best) {
    saveBestScore(score);
    updateBestScoreDisplay();
  }
}

// home button
document.getElementById('home-btn').addEventListener('click', () => {
  document.getElementById('result-screen').classList.add('hidden');
  wrapper.classList.remove('hidden');
  gameScreen.classList.add('hidden');

  // 重置 wrapper 位置與樣式，為下一次帷幕動畫做準備
  gsap.set(wrapper, { y: 0 });
  wrapper.style.cssText = '';
}); 

// ---- 顯示時間加成提示 ----
function showTimeBonus(sec) {
  if (typeof gsap === 'undefined') return;
  const rect = timeBarEl.getBoundingClientRect();
  const centerX = rect.left + rect.width - 20;
  const centerY = rect.top - 10; // 顯示在時間條上方

  const badge = document.createElement('span');
  badge.classList.add('time-bonus');
  badge.textContent = `+${sec}s`;
  badge.style.left = `${centerX}px`;
  badge.style.top = `${centerY}px`;
  document.body.appendChild(badge);

  gsap.fromTo(
    badge,
    { scale: 0.3, opacity: 1, xPercent: -50, yPercent: 50 },
    {
      scale: 3,
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out',
      onComplete: () => badge.remove(),
    }
  );
} 