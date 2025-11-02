// ========================================
// 存檔點類別
// ========================================
import { CONFIG } from './config.js';
import { PLAYER_STATE } from './playerState.js';

export class SavePoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.activated = false; // 是否已經啟動過
        this.glowing = false;
        
        // 動畫
        this.rotationAngle = 0;
        this.pulseScale = 1;
        this.pulseDirection = 1;
    }
    
    /**
     * 啟動存檔點
     */
    activate() {
        this.activated = true;
        this.glowing = true;
        
        // 儲存遊戲狀態
        this.saveGame();
        
        // 通知遊戲更新存檔點位置
        if (window.game && window.game.updateSavePoint) {
            window.game.updateSavePoint(this.x, this.y);
        }
        
        // 觸發視覺和音效反饋
        if (window.game && window.game.showAbilityNotification) {
            window.game.showAbilityNotification('遊戲已存檔！');
        }
        
        console.log('遊戲已存檔到存檔點：', { x: this.x, y: this.y });
    }
    
    /**
     * 儲存遊戲狀態
     */
    saveGame() {
        const saveData = {
            playerState: {
                level: PLAYER_STATE.level || 1,
                experience: PLAYER_STATE.experience || 0,
                health: PLAYER_STATE.health || CONFIG.PLAYER.MAX_HEALTH,
                abilities: { ...PLAYER_STATE.abilities },
                collectedOrbs: [...(PLAYER_STATE.collectedOrbs || [])]
            },
            savePointPosition: {
                x: this.x,
                y: this.y
            },
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('gameSave', JSON.stringify(saveData));
            console.log('存檔成功！', saveData);
        } catch (error) {
            console.error('存檔失敗：', error);
        }
    }
    
    /**
     * 載入遊戲狀態
     */
    static loadGame() {
        try {
            const saveData = localStorage.getItem('gameSave');
            if (saveData) {
                const data = JSON.parse(saveData);
                console.log('讀取存檔：', data);
                return data;
            }
        } catch (error) {
            console.error('讀取存檔失敗：', error);
        }
        return null;
    }
    
    /**
     * 更新動畫
     */
    update(deltaTime) {
        // 旋轉動畫
        this.rotationAngle += deltaTime * 2;
        if (this.rotationAngle >= Math.PI * 2) {
            this.rotationAngle -= Math.PI * 2;
        }
        
        // 脈衝動畫
        if (this.activated) {
            this.pulseScale += this.pulseDirection * deltaTime * 1.5;
            if (this.pulseScale >= 1.2) {
                this.pulseScale = 1.2;
                this.pulseDirection = -1;
            } else if (this.pulseScale <= 1.0) {
                this.pulseScale = 1.0;
                this.pulseDirection = 1;
            }
        }
    }
    
    /**
     * 繪製存檔點
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 外圈光暈（啟動後更亮）
        const glowColor = this.activated ? '#4aff4a' : '#4a9eff';
        const glowAlpha = this.activated ? 0.4 : 0.2;
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2);
        gradient.addColorStop(0, glowColor + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, glowColor + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2 * this.pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        // 旋轉的外環
        ctx.rotate(this.rotationAngle);
        ctx.strokeStyle = this.activated ? '#4aff4a' : '#4a9eff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // 重置旋轉
        ctx.rotate(-this.rotationAngle);
        
        // 核心圓
        ctx.fillStyle = this.activated ? '#4aff4a' : '#4a9eff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // 內部高光效果（替代圖示）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 繪製互動提示
     */
    drawInteractionHint(ctx) {
        const hintText = this.activated ? '按 E 再次存檔' : '按 E 存檔';
        const hintY = this.y - this.radius - 30;
        
        // 提示背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(hintText).width;
        ctx.fillRect(this.x - textWidth / 2 - 10, hintY - 20, textWidth + 20, 30);
        
        // 提示文字
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hintText, this.x, hintY - 5);
    }
}
