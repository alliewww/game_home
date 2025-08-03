// 暫停選單相關邏輯
import { gsap } from 'gsap';

function pauseGame(gameState) {
  const { gameRunning, gameEnding, autoDropTimer } = gameState;
  if (!gameRunning || gameEnding) return;
  gameState.gameRunning = false;
  if (autoDropTimer) {
    clearInterval(gameState.autoDropTimer);
    gameState.autoDropTimer = null;
  }
  gameState.pauseMenu.classList.add('active');
  gsap.fromTo(
    gameState.pauseMenu,
    { opacity: 0 },
    { opacity: 1, duration: 0.3, ease: 'power2.out' }
  );
}

function resumeGame(gameState) {
  gameState.gameRunning = true;
  if (!gameState.isPracticeMode) {
    gameState.autoDropTimer = setInterval(() => {
      if (gameState.gameRunning) {
        gameState.dropNewRow();
      }
    }, gameState.currentDropInterval);
  }
  gameState.pauseMenu.classList.remove('active');
}

function setupPauseMenuEvents(gameState) {
  const { pauseBtn, resumeBtn, homeBtn, restartGameBtn, gsap } = gameState;
  pauseBtn.addEventListener('click', () => pauseGame(gameState));
  resumeBtn.addEventListener('click', () => resumeGame(gameState));
  homeBtn.addEventListener('click', () => {
    gameState.gameRunning = false;
    gameState.gameEnding = false;
    if (gameState.autoDropTimer) {
      clearInterval(gameState.autoDropTimer);
      gameState.autoDropTimer = null;
    }
    gameState.pauseMenu.classList.remove('active');
    gameState.homeScreen.classList.add('active');
    gameState.gameScreen.classList.remove('active');
    gsap.fromTo(
      gameState.homeScreen,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' }
    );
  });
  restartGameBtn.addEventListener('click', () => {
    gameState.pauseMenu.classList.remove('active');
    gameState.startGame(gameState.isPracticeMode);
  });
}

export { pauseGame, resumeGame, setupPauseMenuEvents };