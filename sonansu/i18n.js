/* UI copy for zh-Hant (crawlable default / x-default at /), en, and ja.
   Humans may be sent from / to /en/ or /ja/ on first visit via navigator.languages. */
window.I18N = {
  "zh-Hant": {
    types: {
      normal: "一般", fire: "火", water: "水", electric: "電", grass: "草", ice: "冰",
      fighting: "格鬥", poison: "毒", ground: "地面", flying: "飛行", psychic: "超能力", bug: "蟲",
      rock: "岩石", ghost: "幽靈", dragon: "龍", dark: "惡", steel: "鋼", fairy: "妖精"
    },
    cats: ["物理", "特殊"],
    reflect: ["雙倍奉還", "鏡面反射"],
    wobbuffet: "果然翁",
    incomingPrefix: mon => `對手的${mon}即將使出「`,
    incoming: (mon, move) => `對手的${mon}即將使出「${move}」！`,
    opponentUsed: (mon, move) => `對手的${mon}使出了「${move}」！`,
    wobUsed: move => `果然翁使出了「${move}」！`,
    successLine: (move, mon) => `果然翁使出了「${move}」！加倍奉還給${mon}！`,
    failLine: move => `果然翁使出了「${move}」…但是失敗了！`,
    timeUp: "時間到！",
    penalty: n => `−${n} 秒`,
    coverTitle: "拜託你了果然翁",
    rule1: () => '物理招式使用<b class="c">雙倍奉還</b>、特殊招式使用<b class="m">鏡面反射</b>',
    rule2: (limit, penalty) => `限時 <b>${limit} 秒</b>，答錯扣 <b>${penalty} 秒</b>`,
    rule3: () => "一起來當果然翁(>﹏<)",
    bestRecord: n => `最高紀錄：${n} 題`,
    start: "開始挑戰",
    replay: "再玩一次",
    next: "下一題 →",
    hit: "成功(>﹏<)",
    miss: "失敗了...",
    streak: n => `🔥 ${n} 連勝中`,
    moveMeta: (mon, power) => `${mon} 的招式${power ? `・威力 ${power}` : ""}`,
    catMove: cat => `${cat}招式`,
    explainOk: (cat, reflect) => `${cat}招式要用 <b>${reflect}</b> 反彈`,
    explainBad: (cat, reflect, wrong, wrongCat) =>
      `${cat}招式要用 <b>${reflect}</b> 反彈，${wrong}只能反彈${wrongCat}招式`,
    scoreUnit: "次反擊成功",
    statRounds: "作答題數",
    statAcc: "正確率",
    statStreak: "最長連勝",
    newRecord: "🎉 新紀錄！",
    privacy: "隱私權政策",
    source: "資料來源",
    copyright: "著作權聲明",
    back: "← 返回",
    legalPrivacy: `
        <h3>隱私權政策</h3>
        <h4>一、適用範圍</h4>
        <p>本政策適用於本網站所提供之網頁遊戲服務。使用者進入或使用本網站，即表示已閱讀並瞭解本政策之內容。</p>
        <h4>二、個人資料之蒐集</h4>
        <p>本網站不要求使用者註冊或登入，亦不主動蒐集足以識別身分之個人資料（包括但不限於姓名、電子郵件、電話號碼或裝置識別碼）。本網站並未設置會員制度，亦未委託第三方進行廣告投放或流量分析。</p>
        <h4>三、本機資料之處理</h4>
        <p>為於同一裝置上顯示最高紀錄與記住語言選擇，本網站僅於使用者之瀏覽器本機儲存空間（Web Storage / localStorage）寫入資料，鍵名為 wob-best（最高分數）與 wob-lang（語言：zh-Hant、en 或 ja）。該資料僅存於使用者裝置，不會傳輸至本網站營運者之伺服器。公開網址以路徑區分語言（/ 為繁體中文、/en/ 為英文、/ja/ 為日文），供搜尋引擎收錄；不以 Cookie 記錄語言偏好。搜尋引擎爬蟲不會依瀏覽器語言被送往其他路徑。</p>
        <h4>四、Cookie 與追蹤技術</h4>
        <p>本網站不使用 Cookie，亦不使用分析、廣告或跨網站追蹤技術。</p>
        <h4>五、第三方傳輸</h4>
        <p>為顯示寶可夢圖像，使用者之瀏覽器可能向公開圖庫（PokeAPI Sprites，托管於 GitHub）發送圖像請求。該請求係瀏覽器為載入畫面所必要之連線，本網站營運者並不因此取得使用者之個人資料。有關該第三方之資料處理，請參閱其自行公布之政策。</p>
        <h4>六、資料主體之權利</h4>
        <p>使用者得隨時以瀏覽器之「清除網站資料」或同等功能，刪除本機所保存之最高紀錄。因本網站未蒐集個人資料，並無須另外提供查詢、更正或停止利用之申請程序。</p>
        <h4>七、政策之修訂</h4>
        <p>本政策如有修正，將於本頁更新生效日期後公布。建議使用者於使用本網站前自行參閱最新內容。</p>`,
    legalSource: `
        <h3>資料來源說明</h3>
        <h4>一、遊戲數值與名稱</h4>
        <p>本網站所使用之寶可夢名稱、屬性、招式名稱、招式威力、物理／特殊分類，以及各寶可夢可學會之招式清單，係整理自公開資料庫 <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokeAPI</a>（https://pokeapi.co/）。該資料庫之內容由其提供者維護，本網站不保證其完整、正確或即時。</p>
        <h4>二、圖像資料</h4>
        <p>畫面所顯示之寶可夢圖像，係透過 PokeAPI Sprites 專案所提供之對戰用靜態正面圖與背面圖載入（<a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">github.com/PokeAPI/sprites</a>）。圖像之著作權仍歸屬於原權利人，本網站並未取得授權，亦未對圖像主張任何權利。</p>
        <h4>三、分類依據</h4>
        <p>招式之物理攻擊或特殊攻擊分類，係依寶可夢系列自第四世代起所採用之官方招式分類。本網站不處理會因對戰狀況而改變分類之招式。</p>
        <h4>四、引用目的</h4>
        <p>前述資料僅供本網站非商業性粉絲遊戲之展示與遊玩使用，不得解釋為與資料原提供者或權利人存在合作、贊助或授權關係。</p>`,
    legalCopyright: `
        <h3>著作權聲明</h3>
        <h4>一、非官方聲明</h4>
        <p>本網站為獨立製作之非官方粉絲創作，與任天堂株式會社、株式会社ゲームフリーク、The Pokémon Company 及其關係企業無關，亦未經其授權、許可或贊助。</p>
        <h4>二、權利歸屬</h4>
        <p>「ポケットモンスター」「Pokémon」「寶可夢」及其他相關名稱、角色、招式、圖像、標章與世界觀，其商標權、著作權及其他智慧財產權，均為各該權利人所有。本網站對前述內容不主張任何權利。</p>
        <h4>三、本網站自行創作之部分</h4>
        <p>除引用之名稱、資料與圖像外，本網站之網頁程式碼、版面配置及遊戲流程設計，由本網站營運者製作。在不侵害第三人權利之前提下，歡迎非商業性之瀏覽與遊玩。</p>
        <h4>四、使用限制</h4>
        <p>本網站以非營利方式提供，不收取費用，亦不刊登廣告或從事商品販售。使用者不得將本網站內容用於商業目的，或暗示本網站與權利人有任何關聯。</p>
        <h4>五、權利人通知</h4>
        <p>如權利人認為本網站之公開提供有侵害其權利之虞，本網站將於接獲有效通知後停止提供相關內容或下架本服務。</p>`
  },
  en: {
    types: {
      normal: "Normal", fire: "Fire", water: "Water", electric: "Electric", grass: "Grass", ice: "Ice",
      fighting: "Fighting", poison: "Poison", ground: "Ground", flying: "Flying", psychic: "Psychic", bug: "Bug",
      rock: "Rock", ghost: "Ghost", dragon: "Dragon", dark: "Dark", steel: "Steel", fairy: "Fairy"
    },
    cats: ["Physical", "Special"],
    reflect: ["Counter", "Mirror Coat"],
    wobbuffet: "Wobbuffet",
    incomingPrefix: mon => `The opposing ${mon} is about to use “`,
    incoming: (mon, move) => `The opposing ${mon} is about to use “${move}”!`,
    opponentUsed: (mon, move) => `The opposing ${mon} used ${move}!`,
    wobUsed: move => `Wobbuffet used ${move}!`,
    successLine: (move, mon) => `Wobbuffet used ${move}! It bounced back at ${mon}!`,
    failLine: move => `Wobbuffet used ${move}... but it failed!`,
    timeUp: "Time's up!",
    penalty: n => `−${n}s`,
    coverTitle: "Please, Wobbuffet!",
    rule1: () => 'Use <b class="c">Counter</b> for Physical moves and <b class="m">Mirror Coat</b> for Special moves',
    rule2: (limit, penalty) => `<b>${limit}s</b> on the clock. Wrong answers cost <b>${penalty}s</b>.`,
    rule3: () => "Let's be Wobbuffet together (>﹏<)",
    bestRecord: n => `Best: ${n}`,
    start: "Start",
    replay: "Play again",
    next: "Next →",
    hit: "Success (>﹏<)",
    miss: "It failed...",
    streak: n => `🔥 ${n} streak`,
    moveMeta: (mon, power) => `${mon}'s move${power ? ` · Power ${power}` : ""}`,
    catMove: cat => `${cat} move`,
    explainOk: (cat, reflect) => `${cat} moves bounce with <b>${reflect}</b>`,
    explainBad: (cat, reflect, wrong, wrongCat) =>
      `${cat} moves bounce with <b>${reflect}</b>. ${wrong} only works on ${wrongCat} moves`,
    scoreUnit: "successful counters",
    statRounds: "Answered",
    statAcc: "Accuracy",
    statStreak: "Best streak",
    newRecord: "🎉 New record!",
    privacy: "Privacy",
    source: "Sources",
    copyright: "Copyright",
    back: "← Back",
    legalPrivacy: `
        <h3>Privacy Policy</h3>
        <h4>1. Scope</h4>
        <p>This policy applies to the browser game on this site. By using the site, you acknowledge that you have read and understood it.</p>
        <h4>2. Personal data</h4>
        <p>This site does not require registration or sign-in and does not collect information that identifies you (including name, email, phone number, or device identifiers). There is no membership system, and no third party is engaged for ads or analytics.</p>
        <h4>3. Local data</h4>
        <p>To show your high score and remember a language choice on the same device, this site writes local storage keys wob-best (score) and wob-lang (zh-Hant, en, or ja). Those values stay on your device and are not sent to our servers. Public URLs identify language by path (/ Traditional Chinese, /en/ English, /ja/ Japanese) so search engines can crawl each locale. Language is not stored in a cookie. Crawlers are not sent to another path based on browser language.</p>
        <h4>4. Cookies and tracking</h4>
        <p>This site does not use cookies, analytics, advertising, or cross-site tracking.</p>
        <h4>5. Third-party requests</h4>
        <p>To display Pokémon artwork, your browser may request images from the public PokeAPI Sprites library hosted on GitHub. That connection is required to render the game. We do not receive your personal data from it. See that provider's own policies for how they handle requests.</p>
        <h4>6. Your choices</h4>
        <p>You may delete the locally stored high score at any time with your browser's "clear site data" (or equivalent) controls. Because we do not collect personal data, there is no separate process to access, correct, or stop processing of personal information.</p>
        <h4>7. Changes</h4>
        <p>If this policy is updated, the revised text will be posted on this page. Please review it before using the site.</p>`,
    legalSource: `
        <h3>Data sources</h3>
        <h4>1. Game values and names</h4>
        <p>Pokémon names, types, move names, move power, the physical/special split, and each species' damaging move list are compiled from the public <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokeAPI</a> (https://pokeapi.co/). That database is maintained by its providers. This site does not guarantee completeness, accuracy, or timeliness.</p>
        <h4>2. Images</h4>
        <p>Pokémon images are loaded from the PokeAPI Sprites project's in-battle static front and back sprites (<a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">github.com/PokeAPI/sprites</a>). Copyright remains with the original rights holders. This site is not licensed to use the images and claims no rights in them.</p>
        <h4>3. Move categories</h4>
        <p>Physical vs. special categories follow the official split used in the Pokémon series from Generation IV onward. Moves whose category depends on battle conditions are not used.</p>
        <h4>4. Purpose</h4>
        <p>The data is used only to present and play this non-commercial fan game. It does not imply any partnership, sponsorship, or license with the data providers or rights holders.</p>`,
    legalCopyright: `
        <h3>Copyright notice</h3>
        <h4>1. Unofficial work</h4>
        <p>This site is an independent, unofficial fan work. It is not affiliated with, authorized, approved, or sponsored by Nintendo Co., Ltd., GAME FREAK inc., The Pokémon Company, or their affiliates.</p>
        <h4>2. Rights</h4>
        <p>Pokémon, Pocket Monsters, and related names, characters, moves, images, marks, and settings are trademarks, copyrights, and other intellectual property of their respective owners. This site claims no rights in that material.</p>
        <h4>3. Original portions</h4>
        <p>Apart from cited names, data, and images, the site's code, layout, and game flow were created by the site operator. Non-commercial play is welcome, provided it does not infringe third-party rights.</p>
        <h4>4. Limits</h4>
        <p>The site is provided free of charge, with no ads or merchandise. You may not use its content for commercial purposes or imply any connection with the rights holders.</p>
        <h4>5. Takedown</h4>
        <p>If a rights holder believes this public offering infringes their rights, we will stop providing the relevant content or take the service down after receiving a valid notice.</p>`
  },
  ja: {
    types: {
      normal: "ノーマル", fire: "ほのお", water: "みず", electric: "でんき", grass: "くさ", ice: "こおり",
      fighting: "かくとう", poison: "どく", ground: "じめん", flying: "ひこう", psychic: "エスパー", bug: "むし",
      rock: "いわ", ghost: "ゴースト", dragon: "ドラゴン", dark: "あく", steel: "はがね", fairy: "フェアリー"
    },
    cats: ["物理", "特殊"],
    reflect: ["カウンター", "ミラーコート"],
    wobbuffet: "ソーナンス",
    incomingPrefix: mon => `あいての${mon}は「`,
    incoming: (mon, move) => `あいての${mon}は「${move}」を使おうとしている！`,
    opponentUsed: (mon, move) => `あいての${mon}の　${move}！`,
    wobUsed: move => `ソーナンスの　${move}！`,
    successLine: (move, mon) => `ソーナンスの　${move}！　${mon}に跳ね返した！`,
    failLine: move => `ソーナンスの　${move}！　しかし失敗した！`,
    timeUp: "タイムアップ！",
    penalty: n => `−${n}秒`,
    coverTitle: "お願い、ソーナンス！",
    rule1: () => '物理技は<b class="c">カウンター</b>、特殊技は<b class="m">ミラーコート</b>',
    rule2: (limit, penalty) => `制限時間 <b>${limit}秒</b>。不正解は <b>${penalty}秒</b>減。`,
    rule3: () => "いっしょにソーナンスになろう(>﹏<)",
    bestRecord: n => `最高記録：${n}問`,
    start: "スタート",
    replay: "もういちど",
    next: "つぎへ →",
    hit: "成功(>﹏<)",
    miss: "失敗した…",
    streak: n => `🔥 ${n} れんしょう`,
    moveMeta: (mon, power) => `${mon}の技${power ? `・威力 ${power}` : ""}`,
    catMove: cat => `${cat}技`,
    explainOk: (cat, reflect) => `${cat}技は <b>${reflect}</b> で跳ね返す`,
    explainBad: (cat, reflect, wrong, wrongCat) =>
      `${cat}技は <b>${reflect}</b> で跳ね返す。${wrong}は${wrongCat}技にしか使えない`,
    scoreUnit: "回の反撃成功",
    statRounds: "回答数",
    statAcc: "正解率",
    statStreak: "最長連勝",
    newRecord: "🎉 新記録！",
    privacy: "プライバシー",
    source: "データ出典",
    copyright: "著作権",
    back: "← 戻る",
    legalPrivacy: `
        <h3>プライバシーポリシー</h3>
        <h4>1. 適用範囲</h4>
        <p>本ポリシーは、本サイトが提供するブラウザゲームに適用されます。本サイトを利用することで、内容を確認したものとみなします。</p>
        <h4>2. 個人情報の収集</h4>
        <p>本サイトは登録やログインを求めず、氏名、メールアドレス、電話番号、端末識別子など個人を特定できる情報を自ら収集しません。会員制度はなく、広告配信やアクセス解析を第三者に委託していません。</p>
        <h4>3. 端末内データ</h4>
        <p>同一端末で最高記録と表示言語を覚えるため、ブラウザのローカルストレージに wob-best（得点）と wob-lang（言語：zh-Hant、en、ja）を保存します。データは端末内のみで、運営者のサーバへは送りません。公開URLはパスで言語を示します（/ が繁体字中国語、/en/ が英語、/ja/ が日本語）。Cookie には言語を保存しません。検索クローラはブラウザ言語によって別パスへ送られません。</p>
        <h4>4. Cookie と追跡</h4>
        <p>本サイトは Cookie を使用せず、分析、広告、クロスサイト追跡も行いません。</p>
        <h4>5. 第三者への通信</h4>
        <p>ポケモンの画像表示のため、ブラウザが GitHub 上の PokeAPI Sprites 公開ライブラリへ画像を要求することがあります。これは画面描画に必要な通信であり、これにより運営者が個人情報を得ることはありません。当該第三者の取り扱いについては、先方の方針をご確認ください。</p>
        <h4>6. 利用者の権利</h4>
        <p>ブラウザの「サイトデータを削除」等の機能で、端末に保存した最高記録をいつでも消せます。個人情報を収集していないため、照会・訂正・利用停止の別手続は設けていません。</p>
        <h4>7. 改定</h4>
        <p>本ポリシーを改定する場合は、本ページに掲載します。ご利用前に最新の内容をご確認ください。</p>`,
    legalSource: `
        <h3>データ出典</h3>
        <h4>1. ゲーム数値と名称</h4>
        <p>ポケモン名、タイプ、技名、威力、物理／特殊分類、および各種が覚える攻撃技の一覧は、公開データベース <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokeAPI</a>（https://pokeapi.co/）から整理しています。内容は提供者の管理下にあり、本サイトはその完全性・正確性・即時性を保証しません。</p>
        <h4>2. 画像</h4>
        <p>表示画像は PokeAPI Sprites プロジェクトが提供する対戦用の静止正面・背面スプライトから読み込みます（<a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">github.com/PokeAPI/sprites</a>）。著作権は原権利者に帰属し、本サイトは利用許諾を受けておらず、画像について権利を主張しません。</p>
        <h4>3. 分類の根拠</h4>
        <p>技の物理／特殊は、ポケットモンスターシリーズが第4世代以降採用している公式分類に従います。対戦状況で分類が変わる技は扱いません。</p>
        <h4>4. 利用目的</h4>
        <p>上記データは、本サイトの非営利ファンゲームの表示とプレイにのみ用います。データ提供者や権利者との提携・後援・許諾を意味しません。</p>`,
    legalCopyright: `
        <h3>著作権について</h3>
        <h4>1. 非公式の表明</h4>
        <p>本サイトは独立した非公式のファン作品であり、任天堂株式会社、株式会社ゲームフリーク、株式会社ポケモンおよびその関係会社とは無関係で、許諾・承認・後援も受けていません。</p>
        <h4>2. 権利の帰属</h4>
        <p>「ポケットモンスター」「Pokémon」および関連する名称、キャラクター、技、画像、標章、世界観の商標権・著作権その他の知的財産権は、それぞれの権利者に帰属します。本サイトはそれらについて権利を主張しません。</p>
        <h4>3. 本サイトが作成した部分</h4>
        <p>引用する名称・データ・画像を除き、ウェブのコード、レイアウト、ゲーム進行の設計は本サイト運営者が作成しています。第三者の権利を害しない範囲で、非営利の閲覧とプレイを歓迎します。</p>
        <h4>4. 利用制限</h4>
        <p>本サイトは無償で提供し、広告掲載や商品販売は行いません。内容を営利目的に用いたり、権利者との関係があるように装ったりしてはなりません。</p>
        <h4>5. 権利者からの連絡</h4>
        <p>権利者が本サイトの公開を権利侵害と考える場合、有効な通知を受けた後、該当内容の提供を停止するか本サービスを取り下げます。</p>`
  }
};
