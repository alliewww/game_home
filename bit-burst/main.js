import { gsap } from './node_modules/gsap/index.js';
import { Physics2DPlugin } from './node_modules/gsap/Physics2DPlugin.js';

gsap.registerPlugin(Physics2DPlugin);

// 暴露到全域讓現有 script.js 能存取
window.gsap = gsap;
window.Physics2DPlugin = Physics2DPlugin;

// 等待 DOM 完整後設定版號 (由 Vite 定義常數 __APP_VERSION__)
document.addEventListener('DOMContentLoaded', () => {
    const vLabel = document.getElementById('version-label');
    if (vLabel && typeof __APP_VERSION__ !== 'undefined') {
      vLabel.textContent = `v${__APP_VERSION__}`;
    }
  });
  
import './script.js'; 