// ========================================
// 主遊戲類別
// ========================================
import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { AudioManager } from './audio.js';
import { Atmosphere } from './atmosphere.js';
import { SlashEffect, FireballEffect } from './effects.js';
import { Collision } from './collision.js';

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
        
        // 載入背景圖片
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'Assets/background/bg-1.png';
        this.backgroundLoaded = false;
        this.backgroundImage.onload = () => {
            this.backgroundLoaded = true;
        };
        
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
        
        // 創建環境氛圍系統
        this.atmosphere = new Atmosphere(
            this.canvas.width,
            this.canvas.height,
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
        
        // 繪製環境粒子 (在關卡和玩家之間，營造深度)
        this.atmosphere.draw(this.ctx, this.camera);
        
        // 繪製關卡
        this.level.draw(this.ctx);
        
        // 繪製玩家
        this.player.draw(this.ctx);
        
        // 繪製特效（在玩家上方，確保可見）
        this.effects.forEach(effect => effect.draw(this.ctx));
        
        // 恢復相機變換
        this.ctx.restore();
        
        // 繪製前景霧氣 (在所有東西之上)
        this.atmosphere.drawFog(this.ctx, this.camera);
    }
    
    drawParallaxBackground() {
        if (this.backgroundLoaded) {
            // 繪製背景圖片作為視差背景
            const offsetX = this.camera.x * 0.3; // 視差速度
            const offsetY = this.camera.y * 0.15; // 較慢的垂直視差
            
            // 計算背景圖片的縮放和位置
            const scale = Math.max(
                this.canvas.width / this.backgroundImage.width,
                this.canvas.height / this.backgroundImage.height
            ) * 1.2; // 稍微放大以確保覆蓋整個畫面
            
            const bgWidth = this.backgroundImage.width * scale;
            const bgHeight = this.backgroundImage.height * scale;
            
            // 計算重複繪製的次數
            const startX = Math.floor(-offsetX / bgWidth) - 1;
            const endX = Math.ceil((this.canvas.width - offsetX) / bgWidth) + 1;
            const startY = Math.floor(-offsetY / bgHeight) - 1;
            const endY = Math.ceil((this.canvas.height - offsetY) / bgHeight) + 1;
            
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
    
    // 創建火球特效
    createFireballEffect(x, y, direction, enemies, player) {
        const effect = new FireballEffect(x, y, direction, enemies, player);
        
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