const infoScreen = document.getElementById('info-screen');
const infoCloseBtn = document.getElementById('info-close-btn');
const infoOpenBtns = document.querySelectorAll('.info-open-btn');

function setLanguage(lang) {
  const langSections = document.querySelectorAll('.info-lang');
  langSections.forEach(sec => {
    sec.classList.toggle('active', sec.classList.contains(`lang-${lang}`));
  });
}

if (infoScreen && infoCloseBtn && infoOpenBtns.length) {
  infoOpenBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.l;
      setLanguage(lang);
      infoScreen.classList.remove('hidden');
    });
  });

  infoCloseBtn.addEventListener('click', () => {
    infoScreen.classList.add('hidden');
  });
}

// 語言切換按鈕
const langToggleBtn = document.getElementById("lang-toggle-btn");
const languageOrder = ['ja', 'zh', 'en'];
let currentLanguageIndex = 0;

function getInitialLanguage() {
  // 獲取瀏覽器語言
  const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
  // 根據語言代碼判斷
  if (browserLang.startsWith('zh')) {
    return 'zh';
  } else if (browserLang.startsWith('ja')) {
    return 'ja';
  } else {
    return 'en';
  }
}

function updatePageLanguage(lang, translationsFile) {
  // 更新遊戲說明按鈕的語言
  const infoBtns = document.querySelectorAll('.info-open-btn');
  infoBtns.forEach(btn => {
    // 隱藏所有按鈕
    btn.style.display = 'none';
    // 只顯示當前語言的按鈕
    if (btn.dataset.l === lang) {
      btn.style.display = 'inline-block';
    }
  });

  // 更新遊戲標題
  const titleSpans = document.querySelectorAll('.game-title span[lang]');
  titleSpans.forEach(span => {
    span.classList.toggle('active', span.lang === lang);
  });

  if (translationsFile && translationsFile.translations) {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      const text = translationsFile.translations[key]?.[lang] 
                || translationsFile.translations[key]?.['en'];
      if (text) el.textContent = text;
    });
  }

  if(document.querySelector('.header-nav-lang')) {
    const jpBtn = document.querySelector('.header-nav-lang-jp');
    const enBtn = document.querySelector('.header-nav-lang-en');
    const zhBtn = document.querySelector('.header-nav-lang-zh');
  
    if(lang === 'ja') {
      jpBtn.classList.add('active');
      enBtn.classList.remove('active');
      zhBtn.classList.remove('active');
    } else if(lang === 'en') {
      jpBtn.classList.remove('active');
      enBtn.classList.add('active');
      zhBtn.classList.remove('active');
    } else if(lang === 'zh') {
      jpBtn.classList.remove('active');
      enBtn.classList.remove('active');
      zhBtn.classList.add('active');
    }
  }
  // 更新當前語言索引
  currentLanguageIndex = languageOrder.indexOf(lang);
}

if(document.querySelector('.header-nav-lang')){
  const jpBtn = document.querySelector('.header-nav-lang-jp');
  const enBtn = document.querySelector('.header-nav-lang-en');
  const zhBtn = document.querySelector('.header-nav-lang-zh');

  jpBtn?.addEventListener('click', () => {
    updatePageLanguage('ja');
    jpBtn.classList.add('active');
    enBtn.classList.remove('active');
    zhBtn.classList.remove('active');
  });
  enBtn?.addEventListener('click', () => {
    updatePageLanguage('en');
    jpBtn.classList.remove('active');
    enBtn.classList.add('active');
    zhBtn.classList.remove('active');
  });
  zhBtn?.addEventListener('click', () => {
    updatePageLanguage('zh');
    jpBtn.classList.remove('active');
    enBtn.classList.remove('active');
    zhBtn.classList.add('active');
  });
}

if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    currentLanguageIndex = (currentLanguageIndex + 1) % languageOrder.length;
    const newLang = languageOrder[currentLanguageIndex];
    updatePageLanguage(newLang);
  });
}

// 初始化時設置語言
const initialLang = getInitialLanguage();
updatePageLanguage(initialLang);

// 讓外部可調用
export { updatePageLanguage, getInitialLanguage };