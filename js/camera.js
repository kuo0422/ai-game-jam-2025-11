// ========================================
// 相機類別 - 跟隨玩家並做視差背景
// ========================================
import { CONFIG } from './config.js';

export class Camera {
    constructor(levelBounds) {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.levelBounds = levelBounds;
    }
    
    follow(player, canvasWidth, canvasHeight) {
        // 計算目標位置 (玩家置中)
        this.targetX = player.x + player.width / 2 - canvasWidth / 2;
        this.targetY = player.y + player.height / 2 - canvasHeight / 2;
        
        // 限制在關卡範圍內
        this.targetX = Math.max(0, Math.min(this.targetX, 
            this.levelBounds.width - canvasWidth));
        this.targetY = Math.max(0, Math.min(this.targetY, 
            this.levelBounds.height - canvasHeight));
        
        // 平滑跟隨
        this.x += (this.targetX - this.x) * CONFIG.CAMERA.FOLLOW_SMOOTHNESS;
        this.y += (this.targetY - this.y) * CONFIG.CAMERA.FOLLOW_SMOOTHNESS;
    }
    
    apply(ctx) {
        ctx.translate(-this.x, -this.y);
    }
    
    reset(ctx) {
        ctx.translate(this.x, this.y);
    }
}
