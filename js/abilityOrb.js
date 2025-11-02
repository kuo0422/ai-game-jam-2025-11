// ========================================
// 能力球類別
// ========================================
import { CONFIG } from './config.js';
import { PLAYER_STATE } from './playerState.js';

export class AbilityOrb {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = CONFIG.ABILITY_ORB.RADIUS;
        this.collected = false;
        this.animationOffset = Math.random() * Math.PI * 2;
    }
    
    collect() {
        this.collected = true;
        PLAYER_STATE.collectedOrbs.push(this.type);
        
        // 解鎖能力
        switch(this.type) {
            case 'doubleJump':
                PLAYER_STATE.abilities.doubleJump = true;
                if (window.game) {
                    window.game.showAbilityNotification('獲得能力：二段跳！');
                }
                break;
            // 預留其他能力
            case 'dash':
                PLAYER_STATE.abilities.dash = true;
                if (window.game) {
                    window.game.showAbilityNotification('獲得能力：衝刺！');
                }
                break;
            case 'wallJump':
                PLAYER_STATE.abilities.wallJump = true;
                if (window.game) {
                    window.game.showAbilityNotification('獲得能力：牆跳！');
                }
                break;
        }
    }
    
    update(deltaTime) {
        // 浮動動畫
        this.animationOffset += deltaTime * 3;
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        const floatOffset = Math.sin(this.animationOffset) * 10;
        const currentY = this.y + floatOffset;
        
        // 外圈光暈
        const gradient = ctx.createRadialGradient(
            this.x, currentY, 0,
            this.x, currentY, this.radius * 2
        );
        gradient.addColorStop(0, CONFIG.ABILITY_ORB.GLOW_COLOR + '88');
        gradient.addColorStop(1, CONFIG.ABILITY_ORB.GLOW_COLOR + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心
        ctx.fillStyle = CONFIG.ABILITY_ORB.COLOR;
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 內圈高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, currentY - 5, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}
