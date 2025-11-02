// ========================================
// 主遊戲類別
// ========================================
import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { AudioManager } from './audio.js';
import { SlashEffect } from './effects.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.lastTime = 0;
        this.running = true;
        
        // 初始化音訊管理器
        this.audio = new AudioManager();
        
        // 特效系統
        this.effects = [];
        
        this.init();
    }
    
    init() {
        // 載入關卡
        this.level = new Level('forgotten_crossroads');
        
        // 創建玩家
        this.player = new Player(
            this.level.data.spawnPoint.x,
            this.level.data.spawnPoint.y
        );
        
        // 創建相機
        this.camera = new Camera(this.level.data.bounds);
        
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
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制 deltaTime 避免極端情況
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        this.update(clampedDelta);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // 更新玩家
        this.player.update(
            deltaTime,
            this.level.platforms,
            this.level.enemies,
            this.level.abilityOrbs
        );
        
        // 更新關卡
        this.level.update(deltaTime, this.player);
        
        // 更新特效
        this.effects.forEach(effect => effect.update(deltaTime));
        this.effects = this.effects.filter(effect => effect.active);
        
        // 更新相機
        this.camera.follow(
            this.player,
            this.canvas.width,
            this.canvas.height
        );
        
        // 更新區域名稱（根據玩家位置）
        this.updateRegionName();
    }
    
    draw() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製背景視差層
        this.drawParallaxBackground();
        
        // 應用相機變換
        this.ctx.save();
        this.camera.apply(this.ctx);
        
        // 繪製關卡
        this.level.draw(this.ctx);
        
        // 繪製玩家
        this.player.draw(this.ctx);
        
        // 繪製特效（在玩家上方，確保可見）
        this.effects.forEach(effect => effect.draw(this.ctx));
        
        // 恢復相機變換
        this.ctx.restore();
    }
    
    drawParallaxBackground() {
        CONFIG.PARALLAX_LAYERS.forEach((layer, index) => {
            const offsetX = this.camera.x * layer.speed;
            const offsetY = this.camera.y * layer.speed * 0.5;
            
            this.ctx.fillStyle = layer.color;
            this.ctx.globalAlpha = layer.alpha;
            
            // 繪製重複的背景
            const patternWidth = this.canvas.width * 1.5;
            const patternHeight = this.canvas.height * 1.5;
            
            for (let x = -patternWidth; x < this.canvas.width + patternWidth; x += patternWidth) {
                for (let y = -patternHeight; y < this.canvas.height + patternHeight; y += patternHeight) {
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
        document.getElementById('death-screen').classList.add('show');
    }
    
    hideDeathScreen() {
        document.getElementById('death-screen').classList.remove('show');
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
        
        // 重生玩家
        this.player.respawn(this.level.data.spawnPoint);
    }
    
    // 創建斬擊特效
    createSlashEffect(x, y, direction) {
        const effect = new SlashEffect(x, y, direction);
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