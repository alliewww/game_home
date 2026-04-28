# game_home

遊戲大廳網站，部署於 [game.allie.tw](https://game.allie.tw)。

## 分支說明

| 分支 | 用途 |
|------|------|
| `w-space` | 開發用，存放原始碼 |
| `gh-pages` | 部署用，只存放網站需要的檔案 |

---

## 新增 / 修改遊戲後的部署流程

### 1. 在 `w-space` 開發完成後，先 build

```bash
cd tictactoe-3d
npm run deploy   # 自動還原 source index.html → build → 複製到當前目錄
cd ..
```

### 2. 切換到 `gh-pages`

```bash
git checkout -f gh-pages
```

### 3. 複製 build 結果到部署目錄

```bash
cp -r tictactoe-3d/dist/. tictactoe-3d/
```

如果有修改 `games_config.json`，從 `w-space` 取得：

```bash
git checkout w-space -- games_config.json
```

### 4. 移除不需要部署的備份檔

```bash
git restore --staged tictactoe-3d/.index.src.html 2>/dev/null; true
```

### 5. Commit & Push

```bash
git add tictactoe-3d/ games_config.json
git commit -m "deploy: 描述這次的更新"
git push origin gh-pages
```

### 6. 切回 `w-space` 繼續開發

```bash
git checkout w-space
```

---

## 備註

- `tictactoe-3d/.index.src.html`：build 用的備份模板，不需要 commit 到 `gh-pages`
- `tictactoe-3d/dist/`：build 輸出目錄，gitignore 不追蹤，切換分支時會保留在磁碟上
- `gh-pages` 不存放任何原始碼（`src/`、`tsconfig`、`package.json` 等）
