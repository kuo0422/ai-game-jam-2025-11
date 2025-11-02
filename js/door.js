// ========================================
// 門類別 - Boss 房間門等互動門
// ========================================
import { CONFIG } from './config.js';
import { PLAYER_STATE } from './playerState.js';

export class Door {
    constructor(x, y, width, height, type = 'boss') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'boss', 'normal', 'locked'
        this.opened = false;
        this.locked = true;
        this.requiredAbility = null; // 需要的能力
        
        // 動畫
        this.glowIntensity = 0;
        this.glowDirection = 1;
    }
    
    /**
     * 開啟門
     */
    open() {
        if (this.locked) {
            console.log('門被鎖住了！');
            // 顯示提示訊息
            if (window.game && window.game.showAbilityNotification) {
                window.game.showAbilityNotification('門被鎖住了！需要特殊能力');
            }
            return false;
        }
        
        this.opened = true;
        console.log('Boss 門已開啟！遊戲完成！');
        
        // 直接觸發遊戲完成
        if (window.game && window.game.showVictory) {
            window.game.showVictory();
        }
        
        return true;
    }
    
    /**
     * 解鎖門
     */
    unlock() {
        this.locked = false;
        console.log('門已解鎖！');
    }
    
    /**
     * 更新門的動畫和狀態
     */
    update(deltaTime) {
        if (this.opened) return;
        
        // 檢查是否應該解鎖門
        if (this.locked && this.requiredAbility) {
            if (PLAYER_STATE.abilities[this.requiredAbility]) {
                this.unlock();
            }
        }
        
        // 發光動畫
        this.glowIntensity += this.glowDirection * deltaTime * 2;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0.3) {
            this.glowIntensity = 0.3;
            this.glowDirection = 1;
        }
    }
    
    /**
     * 繪製門
     */
    draw(ctx) {
        if (this.opened) {
            // 門已開啟，可以選擇不繪製或繪製開啟狀態
            return;
        }
        
        // 繪製門框
        ctx.strokeStyle = this.locked ? '#666' : '#4a9eff';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 繪製門板
        const doorColor = this.locked ? 'rgba(100, 100, 100, 0.8)' : 'rgba(74, 158, 255, 0.6)';
        ctx.fillStyle = doorColor;
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // 發光效果（未鎖定時）
        if (!this.locked) {
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2,
                this.y + this.height / 2,
                0,
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2
            );
            gradient.addColorStop(0, `rgba(74, 158, 255, ${this.glowIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(74, 158, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // 繪製鎖圖示（如果門被鎖住）
        if (this.locked) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', this.x + this.width / 2, this.y + this.height / 2);
        }
    }
    
    /**
     * 繪製互動提示
     */
    drawInteractionHint(ctx, playerX, playerY) {
        if (this.opened) return;
        
        const hintText = this.locked ? '門被鎖住了' : '按 E 完成遊戲';
        const hintX = this.x + this.width / 2;
        const hintY = this.y - 20;
        
        // 提示背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(hintText).width;
        ctx.fillRect(hintX - textWidth / 2 - 10, hintY - 20, textWidth + 20, 30);
        
        // 提示文字
        ctx.fillStyle = this.locked ? '#ff6b6b' : '#ffd700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hintText, hintX, hintY - 5);
    }
}
