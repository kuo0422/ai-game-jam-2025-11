# ai-game-jam-2025-11

簡短說明
------------
這個專案是參加 AI Game Jam 時，運用AI開發出的 2D 像素平台動作遊戲（Metroidvania 風格）。
遊戲使用純前端技術 (HTML/CSS/JavaScript)。畫面繪製採用 canvas、遊戲物件以模組化的 JS 類別管理。


主要功能
--------
- 高 DPI 支援：canvas backing store 以 devicePixelRatio 縮放，並維持邏輯解析度
- 幀率獨立運算：使用 deltaTime 與 frameMultiplier 使移動、物理行為在不同幀率下表現一致
- 關卡、敵人、能力球、經驗掉落系統
- 基本 UI（血量、等級 / 經驗顯示）、死亡/勝利畫面與重啟邏輯

快速開始（在本機測試）
--------------------
直接開啟 index.html
- 在開發時你可以直接在檔案管理器中雙擊 `index.html` 打開瀏覽器檢視。但某些瀏覽器會阻止音訊自動播放或資源載入，建議使用一個本地靜態伺服器。

使用 PowerShell（如果你安裝了 Python）啟動簡單的伺服器：

```powershell
# 在專案根目錄執行
python -m http.server 8000
``` 

或使用 Node.js 的 http-server：

```powershell
npx http-server -c-1 . -p 8000
```

然後在瀏覽器開啟 http://localhost:8000

主要檔案與結構
----------------
- `index.html` - 遊戲入口與 UI 容器
- `css/style.css` - 佈局與樣式
- `js/game.js` - 主遊戲類別：初始化、遊戲循環、狀態管理（死亡 / 勝利 / 重啟）
- `js/player.js` - 玩家行為、輸入、繪製
- `js/level.js` - 關卡資料載入、物件（敵人、道具）建立與管理
- `js/enemy.js` - 各類敵人實作（Patrol, Chaser, Sentry...）
- `js/experience.js` - 經驗與掉落（若存在）
- `Assets/` - 圖片、音效與素材

遊玩操作（預設鍵位）
------------------
- 移動：A / D 或 ← / →
- 跳躍：Space 或 W
- 攻擊：K（斬擊），J（火球）
- 互動：E
- 重試（死亡後）：畫面上的按鈕或 `retry` UI

重新開始 / 重置行為
-------------------
重啟按鈕會執行下列流程以確保遊戲回到初始狀態：

- 停止並重置暫存特效、BGM 與計時器
- 清理舊的 `Player` 實例（包含移除事件監聽器）
- 重建 `Level`、`Player`、`Camera`、`Atmosphere` 等物件
- 重置 `PLAYER_STATE`（解鎖能力與已收集的物品）

這樣能確保敵人、物品與玩家狀態回到預設值，避免殘留和重複監聽器問題。

常見問題與調試
----------------
- 如果重新開始後畫面位置跑掉：
	- 確認 Camera 被重新建立並呼叫 `camera.follow(player, logicalWidth, logicalHeight)`。
	- `game.restartGame()` 已清理 `lastTime` 與 `effects`，避免 deltaTime 跳變導致瞬移。

- 如果按鍵行為在多次重啟後異常：
	- 已對 `Player` 的輸入監聽器改為有名稱的 handler，並在 `player.destroy()` 中移除。確保 `restartGame()` 在呼叫 `init()` 前先清理舊玩家。

- 如果勝利畫面覆蓋了等級 UI：
	- `exp-display` 的 z-index 在勝利時會暫時調整，若想讓它在暗幕後，可在 `game.showVictory()` 中設定 `exp-display.style.zIndex = '-1'`（專案已實作）。


其他建議改進（未實作）
-----------------------
- 將 Sprite/圖集載入改為全域快取，避免重啟時重複下載資源
- 新增自動化單元測試或集成測試（例如模擬 restart 流程）
- 將音訊管理抽離為更完整的系統以支援音量控制與暫停/恢復
