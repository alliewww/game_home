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
const scoreEl = document.getElementById('score'); // 指向遊戲中的分數板
const finalScoreEl = document.getElementById('final-score'); // 指向結算畫面的分數

// 計時器與結算畫面元素
const timeFill = document.getElementById('time-fill');
const timeText = document.getElementById('time-text');
const resultScreen = document.getElementById('result-screen');
const homeBtn = document.getElementById('home-btn');
const successCountEl = document.getElementById('success-count');
const failCountEl = document.getElementById('fail-count');


// 遊戲畫面元素
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const resultEl = document.getElementById('result');
const operatorBtns = document.querySelectorAll('.operator-btn');

// 预览题目元素
const previewNum1El1 = document.getElementById('preview-num1-1');
const previewNum2El1 = document.getElementById('preview-num2-1');
const previewResultEl1 = document.getElementById('preview-result-1');
const previewNum1El2 = document.getElementById('preview-num1-2');
const previewNum2El2 = document.getElementById('preview-num2-2');
const previewResultEl2 = document.getElementById('preview-result-2');

let correctOperators = [];
let questionQueue = []; // 题目队列：[当前题目, 下一题, 下下一题]

// GSAP matchMedia for responsive animations
let moveToNextQuestion; // 將函數宣告為一個變數


// 生成单个题目对象
function createQuestion() {
  let num1 = Math.floor(Math.random() * 10) + 1;
  let num2 = Math.floor(Math.random() * 10) + 1;

  const potentialResults = [];
  
  // 加法
  potentialResults.push({ op: '+', val: num1 + num2 });
  // 減法 (確保結果為正)
  if (num1 - num2 >= 0) {
    potentialResults.push({ op: '-', val: num1 - num2 });
  }
  // 乘法
  potentialResults.push({ op: '*', val: num1 * num2 });
  // 除法 (確保能整除)
  if (num1 % num2 === 0) {
    potentialResults.push({ op: '/', val: num1 / num2 });
  }
  
  // 從可能的結果中隨機選一個
  const chosenResult = potentialResults[Math.floor(Math.random() * potentialResults.length)];
  const result = chosenResult.val;

  // 找出所有能產生這個結果的運算子
  const correctOps = [];
  if (num1 + num2 === result) correctOps.push('+');
  if (num1 - num2 === result) correctOps.push('-');
  if (num1 * num2 === result) correctOps.push('*');
  if (num1 % num2 === 0 && num1 / num2 === result) correctOps.push('/');

  return {
    num1: num1,
    num2: num2,
    result: result,
    correctOperators: correctOps
  };
}

// 初始化题目队列
function initQuestionQueue() {
  questionQueue = [];
  for (let i = 0; i < 3; i++) {
    questionQueue.push(createQuestion());
  }
  updateDisplay();
}

// 更新显示
function updateDisplay() {
  // 在首次更新顯示時，設定好水平置中
  updateDisplayContent();
}

// 单独的函数来更新显示内容（不包含动画）
function updateDisplayContent() {
  const currentQ = questionQueue[0];
  const nextQ = questionQueue[1];
  const nextNextQ = questionQueue[2];
  
  // 更新当前题目
  if (currentQ) {
    num1El.textContent = currentQ.num1;
    num2El.textContent = currentQ.num2;
    resultEl.textContent = currentQ.result;
    correctOperators = currentQ.correctOperators;
  }
  
  // 更新下一题预览
  if (nextQ) {
    previewNum1El1.textContent = nextQ.num1;
    previewNum2El1.textContent = nextQ.num2;
    previewResultEl1.textContent = nextQ.result;
  }
  
  // 更新下下一题预览
  if (nextNextQ) {
    previewNum1El2.textContent = nextNextQ.num1;
    previewNum2El2.textContent = nextNextQ.num2;
    previewResultEl2.textContent = nextNextQ.result;
  }
}

// 產生新題目 (保持原有函数名，但改为调用队列系统)
function generateQuestion() {
  initQuestionQueue();
}

// 检查答案
function checkAnswer(selectedOperator) {
  if (correctOperators.includes(selectedOperator)) {
    score += 10;
    scoreEl.textContent = score;
    successClicks++;
    moveToNextQuestion();
  } else {
    // 答錯了，播放錯誤動畫（只影響當前題目內容），包含等号
    failClicks++;
    const currentContent = [
      num1El, 
      document.getElementById('operator'), 
      num2El, 
      document.getElementById('equal'),
      resultEl
    ];
    
    // 創建錯誤震動動畫
    gsap.timeline()
      .to(currentContent, {
        x: -10,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(currentContent, {
        x: 10,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(currentContent, {
        x: -5,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(currentContent, {
        x: 0,
        duration: 0.1,
        ease: "power2.inOut"
      });
    
    console.log('Wrong!');
  }
}

// 計時器相關
const GAME_TIME = 30; // 遊戲時間（秒）
let timeLeft = GAME_TIME;
let timerInterval = null;

function endGame() {
  clearInterval(timerInterval);
  gameScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  // 更新結算畫面
  finalScoreEl.textContent = score;
  successCountEl.textContent = successClicks;
  failCountEl.textContent = failClicks;
}

let score = 0, successClicks = 0, failClicks = 0, maxShow = 0;
function resetCombo() {}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = GAME_TIME;

  // 重置畫面
  timeFill.style.width = '100%';
  timeText.textContent = `${timeLeft}s`;
  
  // stop test
  // timerInterval = setInterval(() => {
  //   timeLeft--;
  //   const fillWidth = (timeLeft / GAME_TIME) * 100;
  //   timeFill.style.width = `${fillWidth}%`;
  //   timeText.textContent = `${timeLeft}s`;
  //   if (timeLeft <= 0) {
  //     endGame();
  //   }
  // }, 1000);
}

// 封裝開始遊戲流程
function startGame() {
  score = 0;
  successClicks = 0;
  failClicks = 0;
  resetCombo();
  maxShow = 0;
  if(scoreEl) scoreEl.textContent = 0;
  initGame();
  startTimer();
}

function initGame() {
    generateQuestion();
}

// 為按鈕綁定事件
operatorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        checkAnswer(btn.dataset.op);
    });
});

// 點擊 HOME 按鈕返回首頁
homeBtn.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    wrapper.classList.remove('hidden');
    wrapper.style.cssText = ''; // 清理 wrapper 的行內樣式
});

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
    zIndex: '1000',
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
