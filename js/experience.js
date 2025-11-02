// ========================================
// 經驗值掉落物系統
// ========================================
import { CONFIG } from './config.js';

export class ExperienceOrb {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.collected = false;
        
        // 視覺屬性
        this.radius = 8;
        this.collectedRadius = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 2;
        
        // 收集相關
        this.collectionDistance = CONFIG.EXPERIENCE.COLLECTION_DISTANCE;
        this.collectionSpeed = CONFIG.EXPERIENCE.COLLECTION_SPEED;
        this.collecting = false;
        
        // 初始速度（掉落效果）
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -3;
        this.gravity = 0.3;
        
        // 生命週期（防止永久存在）
        this.maxAge = 30; // 30秒後消失
        this.age = 0;
    }
    
    update(deltaTime, playerX, playerY) {
        if (this.collected) return;
        
        this.age += deltaTime;
        if (this.age >= this.maxAge) {
            this.collected = true;
            return;
        }
        
        // 初始掉落效果
        if (!this.collecting && Math.abs(this.vy) > 0.1) {
            this.vy += this.gravity;
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // 減速
            this.vx *= 0.9;
            if (Math.abs(this.vy) > 0.1) {
                this.vy *= 0.95;
            } else {
                this.vy = 0;
                this.vx = 0;
            }
        } else {
            // 檢查玩家距離
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.collectionDistance) {
                this.collecting = true;
            }
            
            // 被吸引向玩家
            if (this.collecting) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                this.x += dirX * this.collectionSpeed * deltaTime;
                this.y += dirY * this.collectionSpeed * deltaTime;
                
                // 如果非常接近玩家，標記為已收集
                if (distance < 10) {
                    this.collected = true;
                }
            }
        }
        
        // 浮動動畫
        this.floatOffset += deltaTime * this.floatSpeed;
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        const floatY = this.y + Math.sin(this.floatOffset) * 3;
        
        // 外圈光暈
        const gradient = ctx.createRadialGradient(
            this.x, floatY, 0,
            this.x, floatY, this.radius * 2
        );
        gradient.addColorStop(0, CONFIG.EXPERIENCE.GLOW_COLOR + '88');
        gradient.addColorStop(0.5, CONFIG.EXPERIENCE.GLOW_COLOR + '44');
        gradient.addColorStop(1, CONFIG.EXPERIENCE.GLOW_COLOR + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, floatY, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心
        ctx.fillStyle = CONFIG.EXPERIENCE.COLOR;
        ctx.beginPath();
        ctx.arc(this.x, floatY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 內部高光
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 2, floatY - 2, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // 顯示經驗值（可選，如果數量較大）
        if (this.amount > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.amount.toString(), this.x, floatY - this.radius - 5);
        }
    }
}

