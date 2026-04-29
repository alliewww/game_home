# game_home

遊戲大廳網站，部署於 [game.allie.tw](https://game.allie.tw)。

## 分支說明

| 分支 | 用途 |
|------|------|
| `w-space` | 開發用，存放原始碼 |
| `gh-pages` | 部署用，由 GitHub Actions 自動管理，請勿手動修改 |

---

## 開發與部署流程

### 開發

```bash
cd tictactoe-3d   # 或其他遊戲目錄
npm run dev
```

> `tictactoe-3d` 開發前需確認 `index.html` 指向 `/src/main.tsx`。
> 若被 build 版本覆蓋，執行以下指令還原：
> ```bash
> cp tictactoe-3d/.index.src.html tictactoe-3d/index.html
> ```

### 部署

開發完成後，直接 push 到 `w-space`，GitHub Actions 會自動 build 並部署：

```bash
git add .
git commit -m "描述這次的更新"
git push origin w-space
```

約 1–3 分鐘後 [game.allie.tw](https://game.allie.tw) 自動更新。

Actions 執行狀態：[github.com/alliewww/game_home/actions](https://github.com/alliewww/game_home/actions)

---

## 備註

- `tictactoe-3d/.index.src.html`：Vite dev 用的 index.html 模板，build 時會自動還原
- `gh-pages` 分支由 `.github/workflows/deploy.yml` 管理，不需手動操作
