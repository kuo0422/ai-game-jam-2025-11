// ========================================
// 主遊戲類別
// ========================================
import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { AudioManager } from './audio.js';
import { Atmosphere } from './atmosphere.js';
import { SlashEffect, FireballEffect, RayEffect, DissolveEffect } from './effects.js';
import { Collision } from './collision.js';
import { Door } from './door.js';
import { SavePoint } from './savePoint.js';
import { PLAYER_STATE } from './playerState.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // 支援高 DPI 顯示器：我們維持「邏輯（CSS）寬高」不變，
        // 但將畫布的 backing store 設為 devicePixelRatio 倍數，並在 context 上做縮放。
        this.dpr = window.devicePixelRatio || 1;
        this.logicalWidth = CONFIG.CANVAS_WIDTH;
        this.logicalHeight = CONFIG.CANVAS_HEIGHT;

        // 設定 CSS 尺寸（邏輯像素）以控制畫面佈局
        this.canvas.style.width = this.logicalWidth + 'px';
        this.canvas.style.height = this.logicalHeight + 'px';

        // 設定 backing store 大小（物理像素）並縮放 context
        this.canvas.width = Math.max(1, Math.floor(this.logicalWidth * this.dpr));
        this.canvas.height = Math.max(1, Math.floor(this.logicalHeight * this.dpr));
        // reset any transform and apply DPR scaling so drawing calls use logical pixels
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        this.lastTime = 0;
        this.running = false; // 遊戲開始時不運行
        this.gameStarted = false; // 遊戲是否已開始
        
        // 初始化音訊管理器
        this.audio = new AudioManager();
        
        // 特效系統
        this.effects = [];
        
        // 載入背景圖片
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'Assets/background/bg-1.png';
        this.backgroundLoaded = false;
        this.backgroundImage.onload = () => {
            this.backgroundLoaded = true;
        };
        
        // 設置開始介面
        this.setupStartScreen();

        // 對顯示尺寸做自動調整（填滿視窗但保留長寬比），並在視窗大小改變時更新
        this.resizeDisplay();
        window.addEventListener('resize', () => this.resizeDisplay());
    }

    /**
     * 調整 canvas 的顯示大小（CSS 大小），同時保持邏輯解析度不變。
     * 這樣遊戲世界仍然使用固定的邏輯像素（CONFIG.CANVAS_*），
     * 但畫面會以最佳比例在不同大小與高解析度的螢幕上顯示且置中。
     */
    resizeDisplay() {
        try {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const scale = Math.min(vw / this.logicalWidth, vh / this.logicalHeight);

            const displayW = Math.floor(this.logicalWidth * scale);
            const displayH = Math.floor(this.logicalHeight * scale);

            // 設定 CSS 大小（顯示大小）
            this.canvas.style.width = displayW + 'px';
            this.canvas.style.height = displayH + 'px';

                // 清理定位屬性，佈局由 CSS 的 left-column 處理
                this.canvas.style.position = '';
                this.canvas.style.left = '';
                this.canvas.style.top = '';
                this.canvas.style.transform = '';

            // 注意：不要把 #ui 與 canvas 同步位置，讓 #controls-panel 可以固定在視窗右側
        } catch (e) {
            console.warn('resizeDisplay 發生錯誤', e);
        }
    }
    
    setupStartScreen() {
        const startBtn = document.getElementById('start-btn');
        const startScreen = document.getElementById('start-screen');
        
        if (!startBtn || !startScreen) {
            console.error('找不到開始介面元素');
            return;
        }
        
        // 點擊開始遊戲按鈕，直接開始遊戲
        startBtn.addEventListener('click', () => {
            console.log('開始按鈕被點擊');
            this.audio.playButtonClick();
            
            // 隱藏開始畫面
            startScreen.classList.add('hide');
            
            // 等待淡出動畫完成
            setTimeout(() => {
                // 開始背景放大動畫
                startScreen.classList.add('zoom-out');
                
                // 1.2秒後開始遊戲
                setTimeout(() => {
                    startScreen.classList.add('hidden');
                    this.startGame();
                }, 1200);
            }, 300);
        });
    }
    
    startGame() {
        console.log('遊戲開始');
        this.gameStarted = true;
        this.running = true;
        // 顯示右側操作區
        const right = document.getElementById('right-column');
        if (right) right.classList.remove('hidden');

        this.init();
    }
    
    init() {
        // 載入關卡
        this.level = new Level('forgotten_crossroads');
        
        // 初始化最後存檔點（預設為關卡出生點）
        this.lastSavePoint = {
            x: this.level.data.spawnPoint.x,
            y: this.level.data.spawnPoint.y
        };
        
        // 創建玩家
        this.player = new Player(
            this.level.data.spawnPoint.x,
            this.level.data.spawnPoint.y
        );

        // 創建相機
        this.camera = new Camera(this.level.data.bounds);

        // 創建環境氛圍系統
        // 傳遞邏輯尺寸給氛圍系統 / 相機等，內部都以邏輯像素為單位
        this.atmosphere = new Atmosphere(
            this.logicalWidth,
            this.logicalHeight,
            this.level.data.bounds
        );
        
        // 設定 UI
        this.updateHealthUI();
        this.updateAreaName(this.level.data.name);
        this.updateRegionName(); // 新增：顯示當前區域
        this.updateExpUI();
        
        // 播放 BGM
        this.audio.playBGM('Assets/Audio/BGM/Gameplay/Sacred Hollow.mp3', true);
        
        // 重試按鈕
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.respawn();
        });
        
        // 將遊戲實例暴露給全域，讓其他模組可以調用
        window.game = this;
        
        // 開始遊戲循環
        this.gameLoop(0);
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        // 初始化 lastTime
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        // 計算 deltaTime（秒），限制最大值避免跳幀
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        // 固定時間步長，確保物理計算穩定
        const fixedDelta = Math.min(deltaTime, 1/30); // 最低30fps
        
        this.update(fixedDelta);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // 更新玩家
        this.player.update(
            deltaTime,
            this.level.platforms,
            this.level.enemies,
            this.level.abilityOrbs,
            this.level.experienceOrbs,
            this.level.doors,
            this.level.savePoints
        );
        
        // 更新關卡
        this.level.update(deltaTime, this.player);
        
        // 更新環境氛圍
        this.atmosphere.update(deltaTime, this.camera);
        
        // 更新特效
        this.effects.forEach(effect => {
            // 火球需要平台信息進行碰撞檢測
            if (effect instanceof FireballEffect) {
                effect.update(deltaTime, this.level.platforms);
                
                // 火球敵人碰撞檢測
                if (!effect.exploded) {
                    this.level.enemies.forEach(enemy => {
                        if (enemy.alive && effect.checkHit(enemy)) {
                            effect.explode(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                            // 傷害在 FireballEffect.explode 中處理
                        }
                    });
                }
            } else {
                effect.update(deltaTime);
            }
        });
        this.effects = this.effects.filter(effect => effect.active);
        
        // 更新相機
        // Camera 也使用邏輯尺寸（與畫布 CSS 尺寸一致）
        this.camera.follow(
            this.player,
            this.logicalWidth,
            this.logicalHeight
        );
        
        // 更新區域名稱（根據玩家位置）
        this.updateRegionName();
    }
    
    draw() {
    // 清空畫布（使用邏輯尺寸）
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
        
        // 繪製背景視差層
        this.drawParallaxBackground();
        
        // 應用相機變換
        this.ctx.save();
        this.camera.apply(this.ctx);
        
        // 繪製環境粒子 (在關卡和玩家之間，營造深度)
        this.atmosphere.draw(this.ctx, this.camera);
        
        // 繪製關卡
        this.level.draw(this.ctx);
        
        // 繪製玩家
        this.player.draw(this.ctx);
        
        // 繪製互動提示
        this.drawInteractionHints();

        // 繪製特效（在玩家上方，確保可見）
        this.effects.forEach(effect => effect.draw(this.ctx));
        
        // 恢復相機變換
        this.ctx.restore();
        
        // 繪製前景霧氣 (在所有東西之上)
        this.atmosphere.drawFog(this.ctx, this.camera);
    }
    
    /**
     * 繪製互動提示
     */
    drawInteractionHints() {
        const nearest = this.player.getNearestInteractable();
        if (nearest) {
            switch(nearest.type) {
                case 'door':
                    nearest.object.drawInteractionHint(this.ctx, this.player.x, this.player.y);
                    break;
                case 'savePoint':
                    nearest.object.drawInteractionHint(this.ctx);
                    break;
            }
        }
    }

    drawParallaxBackground() {
        if (this.backgroundLoaded) {
            // 繪製背景圖片作為視差背景
            const offsetX = this.camera.x * 0.3; // 視差速度
            const offsetY = this.camera.y * 0.15; // 較慢的垂直視差
            
            // 計算背景圖片的縮放和位置
            const scale = Math.max(
                this.logicalWidth / this.backgroundImage.width,
                this.logicalHeight / this.backgroundImage.height
            ) * 1.2; // 稍微放大以確保覆蓋整個畫面
            
            const bgWidth = this.backgroundImage.width * scale;
            const bgHeight = this.backgroundImage.height * scale;
            
            // 計算重複繪製的次數
            const startX = Math.floor(-offsetX / bgWidth) - 1;
            const endX = Math.ceil((this.logicalWidth - offsetX) / bgWidth) + 1;
            const startY = Math.floor(-offsetY / bgHeight) - 1;
            const endY = Math.ceil((this.logicalHeight - offsetY) / bgHeight) + 1;
            
            // 繪製重複的背景圖片以創建無縫效果
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    this.ctx.drawImage(
                        this.backgroundImage,
                        x * bgWidth - (offsetX % bgWidth),
                        y * bgHeight - (offsetY % bgHeight),
                        bgWidth,
                        bgHeight
                    );
                }
            }
        } else {
            // 背景圖片還沒載入完成時，使用原本的視差顏色層
            CONFIG.PARALLAX_LAYERS.forEach((layer, index) => {
                const offsetX = this.camera.x * layer.speed;
                const offsetY = this.camera.y * layer.speed * 0.5;
                
                this.ctx.fillStyle = layer.color;
                this.ctx.globalAlpha = layer.alpha;
                
                // 繪製重複的背景
                const patternWidth = this.logicalWidth * 1.5;
                const patternHeight = this.logicalHeight * 1.5;

                for (let x = -patternWidth; x < this.logicalWidth + patternWidth; x += patternWidth) {
                    for (let y = -patternHeight; y < this.logicalHeight + patternHeight; y += patternHeight) {
                        this.ctx.fillRect(
                            x - (offsetX % patternWidth),
                            y - (offsetY % patternHeight),
                            patternWidth,
                            patternHeight
                        );
                    }
                }
                
                this.ctx.globalAlpha = 1;
            });
        }
    }
    
    updateHealthUI() {
        const healthContainer = document.getElementById('health');
        healthContainer.innerHTML = '';
        
        for (let i = 0; i < CONFIG.PLAYER.MAX_HEALTH; i++) {
            const mask = document.createElement('div');
            mask.className = 'health-mask';
            if (i >= this.player.health) {
                mask.classList.add('empty');
            }
            healthContainer.appendChild(mask);
        }
    }
    
    updateAreaName(name) {
        document.getElementById('area-name').textContent = name;
    }
    
    updateRegionName() {
        // 根據玩家位置判斷在哪個區域
        if (!this.level.data.regions) return;
        
        const playerX = this.player.x + this.player.width / 2;
        const playerY = this.player.y + this.player.height / 2;
        
        for (const region of this.level.data.regions) {
            if (playerX >= region.x && playerX <= region.x + region.width &&
                playerY >= region.y && playerY <= region.y + region.height) {
                document.getElementById('area-name').textContent = region.name;
                return;
            }
        }
    }
    
    showDeathScreen() {
        const right = document.getElementById('right-column');
        if (right) right.classList.add('hidden');
        document.getElementById('death-screen').classList.add('show');
    }
    
    hideDeathScreen() {
        const right = document.getElementById('right-column');
        if (right) right.classList.remove('hidden');
        document.getElementById('death-screen').classList.remove('show');
    }
    
    showVictory() {
        console.log('顯示勝利畫面');
        this.running = false; // 停止遊戲循環
        
        // Get exp-display before hiding the right column
        const expDisplay = document.getElementById('exp-display');
        if (expDisplay) {
            // Move exp display behind the victory screen
            expDisplay.style.zIndex = '-1';  // Below the victory screen
        }
        
        const right = document.getElementById('right-column');
        if (right) right.classList.add('hidden');
        
        const victoryScreen = document.getElementById('victory-screen');
        victoryScreen.classList.add('show');
        
        // 播放勝利音效
        if (this.audio && this.audio.playVictory) {
            this.audio.playVictory();
        }
        
        // 設置重新開始按鈕事件（如果還沒設置）
        const restartBtn = document.getElementById('victory-restart-btn');
        if (restartBtn && !restartBtn.dataset.listenerAdded) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
            restartBtn.dataset.listenerAdded = 'true';
        }
    }
    
    hideVictoryScreen() {
        const victoryScreen = document.getElementById('victory-screen');
        victoryScreen.classList.remove('show');
        const right = document.getElementById('right-column');
        if (right) right.classList.remove('hidden');
    }
    
    restartGame() {
        // 隱藏勝利畫面並顯示控制面板
        this.hideVictoryScreen();

        // 重置玩家狀態（能力、收集物等）
        PLAYER_STATE.reset();

        // Reset exp display to normal position
        const expDisplay = document.getElementById('exp-display');
        if (expDisplay) {
            expDisplay.style.zIndex = '';  // Reset to default
        }

        // Stop audio and clear transient systems
        if (this.audio && typeof this.audio.stopBGM === 'function') {
            this.audio.stopBGM();
        }

        // 清理現有玩家的輸入監聽器（如果有）
        if (this.player && typeof this.player.destroy === 'function') {
            this.player.destroy();
        }

        // Clear transient runtime state
        this.effects = [];
        this.lastTime = 0;

        // 重新初始化遊戲物件：清空 references，讓 init() 重新建立全新實例
        this.running = true;
        this.level = null;
        this.player = null;
        this.camera = null;

        // 重新初始化所有遊戲對象（Level、Player、Camera、Atmosphere 等）
        this.init();
    }
    
    showAbilityNotification(text) {
        const notification = document.getElementById('ability-notification');
        const textElement = document.getElementById('ability-text');
        
        textElement.textContent = text;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    respawn() {
        this.hideDeathScreen();
        
        // 重置敵人
        this.level.enemies.forEach(enemy => {
            enemy.alive = true;
            enemy.health = enemy.maxHealth;
        });
        
        // 重生玩家到最後存檔點
        this.player.respawn(this.lastSavePoint);
    }
    
    // 更新存檔點（當玩家存檔時呼叫）
    updateSavePoint(x, y) {
        this.lastSavePoint = { x, y };
        console.log('更新存檔點：', this.lastSavePoint);
    }
    
    // 創建斬擊特效
    createSlashEffect(x, y, direction) {
        const effect = new SlashEffect(x, y, direction);
        this.effects.push(effect);
    }
    
    // 創建火球特效
    createFireballEffect(x, y, direction, enemies, player, damage = 1) {
        const effect = new FireballEffect(x, y, direction, enemies, player, damage);
        
        // 立即檢查初始位置是否在牆內，如果是則立即爆炸
        const fireballBox = {
            x: x - effect.radius,
            y: y - effect.radius,
            width: effect.radius * 2,
            height: effect.radius * 2
        };
        
        let hitPlatform = false;
        this.level.platforms.forEach(platform => {
            if (Collision.checkAABB(fireballBox, platform)) {
                hitPlatform = true;
            }
        });
        
        if (hitPlatform) {
            // 如果初始位置就在牆內，立即爆炸
            effect.explode(x, y);
        }
        
        this.effects.push(effect);
    }
    
    // 創建射線特效
    createRayEffect(startX, startY, endX, endY, player) {
        const effect = new RayEffect(startX, startY, endX, endY, player);
        this.effects.push(effect);
    }
    
    // 創建消融特效
    createDissolveEffect(x, y, width, height, color) {
        const effect = new DissolveEffect(x, y, width, height, color);
        this.effects.push(effect);
    }
    
    // 更新經驗值 UI
    updateExpUI() {
        // 如果 UI 元素存在則更新
        let expElement = document.getElementById('exp-display');
        if (!expElement) {
            expElement = document.createElement('div');
            expElement.id = 'exp-display';
            expElement.style.cssText = 'position: absolute; top: 60px; left: 20px; color: #fff; font-size: 16px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);';
            document.getElementById('ui').appendChild(expElement);
        }
        
        const player = this.player;
        const currentLevelExp = CONFIG.PLAYER_EXP.EXP_PER_LEVEL[player.level - 1] || 0;
        const nextLevelExp = CONFIG.PLAYER_EXP.EXP_PER_LEVEL[player.level] || 999;
        const currentExp = player.experience - currentLevelExp;
        const neededExp = nextLevelExp - currentLevelExp;
        
        expElement.textContent = `Lv.${player.level} | EXP: ${currentExp}/${neededExp}`;
    }
    
    // 玩家升級事件
    onPlayerLevelUp(newLevel) {
        // 可以添加升級特效或通知
        if (this.showAbilityNotification) {
            this.showAbilityNotification(`升級！等級 ${newLevel}`);
        }
        this.updateExpUI();
    }
}