
// bit_burst
(() => {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  const GAME_TIME = 5000;

  // Elements
  const homeScreen = document.getElementById("home-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const startBtn = document.getElementById("start-button");
  const restartBtn = document.getElementById("restart-button");
  // const testBtn = document.getElementById("test-button");
  // const test2Btn = document.getElementById("test2-button");
  const numbersContainer = document.getElementById("numbers-container");
  const playfield = document.querySelector('.playfield');
  const eliminatedCountEl = document.getElementById("eliminated-count");
  const speedLevelEl = document.getElementById("speed-level");
  const nextLevelInfoEl = document.getElementById("next-level-info");
  const finalEliminatedCountEl = document.getElementById("final-eliminated-count");

  // 游戏状态管理
  let gameRunning = false;
  let gameEnding = false;
  let autoDropTimer = null;
  let eliminatedRowsCount = 0; // 成功消除的行数统计
  let correctAnswersCount = 0; // 答对的题目数量统计
  let currentDropInterval = GAME_TIME; // 当前掉落间隔（毫秒）

  // Register plugin if not yet
  if (window.Physics2DPlugin) {
    gsap.registerPlugin(window.Physics2DPlugin);
  }

  // 測試按鈕觸發檢查
  // testBtn.addEventListener("click", checkAndEliminateMatches);

  startBtn.addEventListener("click", () => {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");

    // 开始游戏
    startGame();

    // GSAP 動畫示例：逐漸淡入主遊戲畫面
    gsap.fromTo(
      gameScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });

  // 返回首页按钮事件监听器
  restartBtn.addEventListener("click", () => {
    // 停止游戏并重置状态
    gameRunning = false;
    gameEnding = false;
    
    // 清除定时器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
    
    // 重新获取元素确保一致性
    const gameOverScreenElement = document.getElementById("game-over-screen");
    if (gameOverScreenElement) {
      gameOverScreenElement.classList.remove("active");
    }
    
    // 返回首页而不是直接开始游戏
    homeScreen.classList.add("active");

    // GSAP 動畫示例：逐漸淡入首页画面
    gsap.fromTo(
      homeScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  });

  // 根据消除数计算掉落间隔
  function calculateDropInterval(eliminatedCount) {
    // if (eliminatedCount >= 10) return 1000;  // 1秒
    // if (eliminatedCount >= 7) return 2000;   // 2秒
    if (eliminatedCount >= 5) return 3000;   // 3秒
    if (eliminatedCount >= 3) return 4000;   // 4秒
    return GAME_TIME; // 默认5秒
  }

  // 获取下一级信息
  function getNextLevelInfo(currentCount) {
    // if (currentCount >= 10) {
    //   return "Level: Max";
    // } else if (currentCount >= 7) {
    //   return `Level: 4`;
    // } else 
    if (currentCount >= 5) {
      return `Lv.Max`;
    } else if (currentCount >= 3) {
      return `Lv.2`;
    } else {
      return `Lv.1`;
    }
  }

  // 更新状态显示
  function updateStatusDisplay() {
    if (eliminatedCountEl) {
      eliminatedCountEl.textContent = eliminatedRowsCount;
    }
    if (speedLevelEl) {
      speedLevelEl.textContent = (currentDropInterval / 1000).toString();
    }
    if (nextLevelInfoEl) {
      nextLevelInfoEl.textContent = getNextLevelInfo(eliminatedRowsCount);
    }
  }

  // 更新掉落速度
  function updateDropSpeed() {
    const newInterval = calculateDropInterval(eliminatedRowsCount);
    if (newInterval !== currentDropInterval) {
      currentDropInterval = newInterval;
      
      // 重置定时器以应用新的间隔
      if (autoDropTimer) {
        clearInterval(autoDropTimer);
        autoDropTimer = setInterval(() => {
          if (gameRunning) {
            dropNewRow();
            // 游戏结束检查现在由 dropNewRow() 处理
          }
        }, currentDropInterval);
      }
      
    }
    
    // 更新状态显示
    updateStatusDisplay();
  }

  // 开始游戏函数
  function startGame() {
    gameRunning = true;
    gameEnding = false;
    eliminatedRowsCount = 0; // 重置消除计数
    correctAnswersCount = 0; // 重置答对题目计数
    currentDropInterval = GAME_TIME; // 重置掉落间隔
    
    // 更新状态显示
    updateStatusDisplay();
    
    // 清空游戏区域
    if (playfield) {
      playfield.innerHTML = '';
      // 移除游戏结束的视觉状态
      playfield.classList.remove('game-ending');
    }

    // 开场自动掉三排
    setTimeout(() => dropNewRow(), 200);
    setTimeout(() => dropNewRow(), 400);
    setTimeout(() => dropNewRow(), 600);

    autoDropTimer = setInterval(() => {
      if (gameRunning) {
        dropNewRow();
      }
    }, currentDropInterval);
  }

  // 游戏结束函数  
  function gameOver() {
    
    // gameEnding状态已经在checkGameOver中设置，这里不需要再检查
    gameRunning = false;
    
    // 清除定时器
    if (autoDropTimer) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }

    // 重新获取游戏结束界面元素，确保它存在
    const gameOverScreenElement = document.getElementById("game-over-screen");
    console.log("gameOverScreen element:", gameOverScreenElement); // 检查元素是否存在
    
    // 更新游戏结束统计显示
    if (finalEliminatedCountEl) {
      finalEliminatedCountEl.textContent = eliminatedRowsCount;
    }
    
    // 显示游戏结束界面
    gameScreen.classList.remove("active");
    
    if (gameOverScreenElement) {
      gameOverScreenElement.classList.add("active");

      // GSAP 動畫：淡入游戏结束画面
      gsap.fromTo(
        gameOverScreenElement,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    } else {
      console.error("gameOverScreen element not found! Trying fallback...");
    }
  }

  // 检查游戏是否结束
  function checkGameOver() {
    if (!playfield || !gameRunning || gameEnding) return;
    
    const rowCount = playfield.children.length;
    
    if (rowCount >= 10) {
      // 立即设置gameEnding，禁用方格点击功能
      gameEnding = true;
      // 添加视觉反馈，让玩家知道游戏即将结束
      playfield.classList.add('game-ending');
      // 延迟一下结束游戏，确保玩家能看到当前状态
      setTimeout(gameOver, 100);
    }
  }

  // 掉落新一排的函数（从原来的TEST2按钮逻辑提取）
  function dropNewRow() {
    if (!playfield || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return; // 防止動畫期間新增

    const row = document.createElement("div");
    row.className = "bits-row";

    // 建立 8 個 0 方格直接加入 row
    weights.forEach(() => {
      const bit = document.createElement("div");
      bit.className = "bit bit-zero";
      bit.textContent = "0";
      bit.addEventListener("click", simpleToggle);
      row.appendChild(bit);
    });

    // 題目方格
    const qBox = document.createElement("div");
    qBox.className = "bit target-box";
    qBox.textContent = randInt(1, 128);

    row.appendChild(qBox);

    playfield.prepend(row);

    // 掉落動畫：從上方掉落到最上層位置
    gsap.from(row, {
      y: "-100%",
      duration: 0.6,
      ease: "bounce.out",
      onComplete: () => {
        // 动画完成后重新检查游戏是否应该结束
        // 重新计算当前行数，因为在掉落过程中可能有行被消除了
        setTimeout(() => {
          checkGameOver();
        }, 100);
      }
    });
  }

  // TEST2: 生成新的一排題目與作答區並掉落
  // test2Btn.addEventListener("click", () => {
  //   if (gameRunning) {
  //     dropNewRow();
  //     checkGameOver();
  //   }
  // });

  function checkAndEliminateMatches() {
    if (!playfield || playfield.children.length === 0 || !gameRunning || gameEnding) return;
    if (playfield.dataset.isEliminating === 'true') return;

    const allRows = Array.from(playfield.children);
    const rowsToEliminate = [];

    allRows.forEach(row => {
        const answerBits = row.querySelectorAll(".bit:not(.target-box)");
        const targetBox = row.querySelector(".target-box");

        if (!targetBox || answerBits.length !== weights.length) {
            return;
        }

        const targetNumber = parseInt(targetBox.textContent, 10);
        let currentSum = 0;
        answerBits.forEach((bit, bitIndex) => {
            if (bit.textContent === "1") {
                currentSum += weights[bitIndex];
            }
        });

        if (currentSum === targetNumber) {
            rowsToEliminate.push(row);
        }
    });

    if (rowsToEliminate.length === 0) return;

    playfield.dataset.isEliminating = 'true';

    const rowHeight = allRows[0].getBoundingClientRect().height;
    const rowGap = parseFloat(getComputedStyle(playfield).gap) || 0;
    const fallDistance = rowHeight + rowGap;

    const rowsThatMoved = [];

    const tl = gsap.timeline({
        onComplete: () => {
            // 更新消除计数和答对题目计数
            eliminatedRowsCount += rowsToEliminate.length;
            correctAnswersCount += rowsToEliminate.length;
            console.log(`成功消除 ${rowsToEliminate.length} 行, 总计: ${eliminatedRowsCount} 行, 答对: ${correctAnswersCount} 题`);
            
            rowsToEliminate.forEach(row => row.remove());
            // 動畫結束後，重設移動過的行的 transform
            gsap.set(rowsThatMoved, { y: 0, overwrite: true });
            playfield.dataset.isEliminating = 'false';
            
            // 更新掉落速度
            updateDropSpeed();
            
            // 消除完毕后检查游戏是否结束
            checkGameOver();
        }
    });

    // 執行消除行的粒子動畫
    rowsToEliminate.forEach(row => {
        scatterBits(row, row.querySelector('.target-box'));
        tl.to(row, {
            opacity: 0,
            duration: 0.4,
        }, "<");
    });

    // 計算並執行上方行的掉落動畫
    let eliminatedCount = 0;
    // 從下往上遍歷
    for (let i = allRows.length - 1; i >= 0; i--) {
        const row = allRows[i];
        if (rowsToEliminate.includes(row)) {
            eliminatedCount++;
        } else if (eliminatedCount > 0) {
            // 此行下方有被消除的行，需要向下掉落
            rowsThatMoved.push(row);
            tl.to(row, {
                y: fallDistance * eliminatedCount,
                duration: 0.6,
                ease: 'power2.inOut'
            }, "<"); // 與消除動畫同時開始
        }
    }
  }

  function scatterBits(row, targetEl) {
    const bitEls = row.querySelectorAll(".bit");
    bitEls.forEach((bitEl) => {
      const rect = bitEl.getBoundingClientRect();
      const char = document.createElement("div");
      char.className = "flying-char";
      char.textContent = bitEl.textContent;
      char.style.position = "absolute";
      char.style.left = `${rect.left + rect.width / 2}px`;
      char.style.top = `${rect.top + rect.height / 2}px`;
      char.style.transform = "translate(-50%, -50%)";
      char.style.fontSize = `${rect.height * 0.5}px`;
      char.style.color = getComputedStyle(bitEl).color;
      char.style.pointerEvents = "none";
      document.body.appendChild(char);

      const velocity = gsap.utils.random(200, 400);
      const angle = gsap.utils.random(-110, -70);

      gsap.to(char, {
        duration: 3,
        rotation: gsap.utils.random(-720, 720),
        physics2D: {
          velocity: velocity,
          angle: angle,
          gravity: 500,
        },
        opacity: 0,
        onComplete: () => char.remove(),
      });

      // 讓原本的方格快速縮小並淡出，營造被炸消失效果
      gsap.to(bitEl, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(2)" });
    });

    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      const tChar = document.createElement("div");
      tChar.className = "flying-char";
      tChar.textContent = targetEl.textContent;
      Object.assign(tChar.style, {
        position: "absolute",
        left: `${tRect.left + tRect.width / 2}px`,
        top: `${tRect.top + tRect.height / 2}px`,
        transform: "translate(-50%, -50%)",
        fontSize: `${tRect.height * 0.5}px`,
        color: getComputedStyle(targetEl).color,
        pointerEvents: "none",
      });
      document.body.appendChild(tChar);

      const velT = gsap.utils.random(200, 400);
      const angT = gsap.utils.random(-110, -70);

      gsap.to(tChar, {
        duration: 3,
        rotation: gsap.utils.random(-720, 720),
        physics2D: {
          velocity: velT,
          angle: angT,
          gravity: 500,
        },
        opacity: 0,
        onComplete: () => tChar.remove(),
      });

      // 目標方格自身縮小消失
      gsap.to(targetEl, { scale: 0, opacity: 0, duration: 0.3, ease: "back.in(2)" });
    }
  }

  // 初始化
  function renderNumbers() {
    numbersContainer.innerHTML = "";
    weights.forEach((n) => {
      const el = document.createElement("div");
      el.className = "number-label";
      el.textContent = n;
      numbersContainer.appendChild(el);
    });

    // 追加 QNS 標籤
    const qnsEl = document.createElement("div");
    qnsEl.className = "number-label";
    qnsEl.textContent = "QNS";
    numbersContainer.appendChild(qnsEl);
  }

  // 針對動態加入的新列，簡單切換 0/1
  function simpleToggle(e) {
    // 只有在游戏运行且未结束时才能操作
    if (!gameRunning || gameEnding) return;
    
    const el = e.currentTarget;
    if (el.textContent === "0") {
      el.textContent = "1";
      el.classList.remove("bit-zero");
      el.classList.add("bit-one");
    } else {
      el.textContent = "0";
      el.classList.remove("bit-one");
      el.classList.add("bit-zero");
    }

    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: "power1.out" });

    // 延遲一小段時間再檢查，確保點擊動畫有時間開始
    setTimeout(checkAndEliminateMatches, 100);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  document.addEventListener("DOMContentLoaded", renderNumbers);
})(); 