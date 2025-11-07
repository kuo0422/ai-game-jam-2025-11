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
        
        // 使用 60fps 作為基準幀率
        const frameMultiplier = deltaTime * 60;
        
        // 初始掉落效果
        if (!this.collecting && Math.abs(this.vy) > 0.1) {
            this.vy += this.gravity * frameMultiplier;
            this.x += this.vx * frameMultiplier;
            this.y += this.vy * frameMultiplier;
            
            // 減速
            this.vx *= Math.pow(0.9, frameMultiplier);
            if (Math.abs(this.vy) > 0.1) {
                this.vy *= Math.pow(0.95, frameMultiplier);
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
            
            // 被吸引向玩家（使用秒為單位的速度，避免因幀率不同出現抖動）
            if (this.collecting) {
                // 如果距離非常小，直接標記為收集
                if (distance < 6) {
                    this.collected = true;
                } else {
                    // 使用 deltaTime 為單位的移動量（collectionSpeed 為 px / sec）
                    const moveDist = this.collectionSpeed * deltaTime;

                    // 計算正規化方向
                    const invDist = 1 / distance;
                    const dirX = dx * invDist;
                    const dirY = dy * invDist;

                    // 若移動距離會超過目標，直接置於玩家位置並標記收集
                    if (moveDist >= distance) {
                        this.x = playerX;
                        this.y = playerY;
                        this.collected = true;
                    } else {
                        this.x += dirX * moveDist;
                        this.y += dirY * moveDist;
                    }
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

