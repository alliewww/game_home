import { gsap } from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

gsap.registerPlugin(Physics2DPlugin);

// 等待 DOM 完整後設定版號 (由 Vite 定義常數 __APP_VERSION__)
document.addEventListener('DOMContentLoaded', () => {
    const vLabel = document.getElementById('version-label');
    if (vLabel && typeof __APP_VERSION__ !== 'undefined') {
      vLabel.textContent = `v${__APP_VERSION__}`;
    }
  });

function updateScreenSizeLabel() {
    const screenSizeLabel = document.getElementById('screen-size-label');
    if(!screenSizeLabel) return;
    const width = window.innerWidth;

    if (width < 420) {
        screenSizeLabel.textContent = 'Small';
    } else if (width >= 421 && width <= 767) {
        screenSizeLabel.textContent = 'Mobile';
    } else if (width >= 768) {
        screenSizeLabel.textContent = 'Desktop';
    }
}

// 初始化時調用
updateScreenSizeLabel();

// 監聽視窗大小變化
window.addEventListener('resize', updateScreenSizeLabel);
  
import './script.js'; 