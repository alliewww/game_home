// ─── 多語言 / 翻譯 ───────────────────────────────────────────────────────────

export let translationsFile = null;

export async function loadTranslations() {
  try {
    const url = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
      ? './public/config/translations.json'
      : './config/translations.json';
    const response = await fetch(url);
    const ct = response.headers.get('content-type');
    if (!ct?.includes('application/json')) throw new Error('回應不是有效的 JSON');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    translationsFile = await response.json();
  } catch (err) {
    console.error('載入翻譯失敗:', err);
  }
}

export function getCurrentLang() {
  if (document.querySelector('.header-nav-lang-zh.active')) return 'zh';
  if (document.querySelector('.header-nav-lang-jp.active')) return 'ja';
  return 'en';
}

// 取得指定 key 的當前語言文字（找不到回傳 fallback）
export function tr(key, fallback = '') {
  const lang = getCurrentLang();
  return translationsFile?.translations?.[key]?.[lang]
    ?? translationsFile?.translations?.[key]?.en
    ?? fallback;
}

// 同 tr，但支援 {變數} 替換，例如 trf('msg', { n: 5 })
export function trf(key, vars, fallback = '') {
  let text = tr(key, fallback);
  Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

export function getInitialLanguage() {
  const lang = (navigator.language || navigator.userLanguage).toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('ja')) return 'ja';
  return 'en';
}

// 切換頁面語言：更新所有 data-translate 元素、語言按鈕高亮、CSS 變數
// onAfterUpdate：語言更新完成後的回呼（例如重新渲染首頁進度條）
export function updatePageLanguage(lang, translations, onAfterUpdate) {
  // 遊戲說明按鈕：只顯示當前語言那一顆
  document.querySelectorAll('.info-open-btn').forEach(btn => {
    btn.style.display = btn.dataset.l === lang ? 'inline-block' : 'none';
  });

  // 關卡數字前綴（第 / レベル / Lv.）
  document.querySelectorAll('.home-level-label').forEach(el => {
    el.style.display = el.dataset.l === lang ? 'inline' : 'none';
  });

  // 標題多語 span
  document.querySelectorAll('.game-title span[lang]').forEach(span => {
    span.classList.toggle('active', span.lang === lang);
  });

  // data-translate 元素
  if (translations?.translations) {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key  = el.getAttribute('data-translate');
      const text = translations.translations[key]?.[lang]
                || translations.translations[key]?.en;
      if (text) el.textContent = text;
    });
  }

  // 語言按鈕高亮
  document.querySelector('.header-nav-lang-jp')?.classList.toggle('active', lang === 'ja');
  document.querySelector('.header-nav-lang-en')?.classList.toggle('active', lang === 'en');
  document.querySelector('.header-nav-lang-zh')?.classList.toggle('active', lang === 'zh');

  // 棋盤標題文字（CSS content 變數）
  const playfieldLabel = translations?.translations?.playfieldLabel?.[lang]
    ?? translations?.translations?.playfieldLabel?.en
    ?? '👤  Human Numbers  ─────►  🖥️  Computer Language';
  document.documentElement.style.setProperty('--playfield-label', `'${playfieldLabel}'`);

  onAfterUpdate?.();
}
