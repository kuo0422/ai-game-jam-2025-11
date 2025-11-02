// ========================================
// 敵人類別
// ========================================
import { CONFIG } from './config.js';
import { Collision } from './collision.js';

// ========================================
// 敵人基底類別
// ========================================
export class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.width = config.WIDTH;
        this.height = config.HEIGHT;
        this.color = config.COLOR;
        this.speed = config.SPEED;
        this.maxHealth = config.HEALTH;
        this.health = config.HEALTH;
        this.damage = config.DAMAGE;
        this.alive = true;
        this.direction = 1;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.justHit = false;
    }
    
    update(deltaTime, platforms, player) {
        // 子類別實作
    }
    
    applyGravity() {
        this.vy += CONFIG.PLAYER.GRAVITY * 0.8;
        this.vy = Math.min(this.vy, CONFIG.PLAYER.MAX_FALL_SPEED);
    }
    
    move(platforms) {
        this.x += this.vx;
        this.y += this.vy;
        
        this.grounded = false;
        this.checkPlatformCollision(platforms);
    }
    
    checkPlatformCollision(platforms) {
        platforms.forEach(platform => {
            if (Collision.checkAABB(this, platform)) {
                if (this.vy > 0) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                } else if (this.vy < 0) {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
                
                if (this.vx > 0) {
                    this.x = platform.x - this.width;
                    this.direction = -1;
                } else if (this.vx < 0) {
                    this.x = platform.x + platform.width;
                    this.direction = 1;
                }
            }
        });
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 血量條
        const healthBarWidth = this.width;
        const healthBarHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth * healthPercent, healthBarHeight);
    }
}

// ========================================
// 巡邏敵人 - 左右來回走動
// ========================================
export class PatrolEnemy extends Enemy {
    constructor(x, y, patrolLeft, patrolRight) {
        super(x, y, CONFIG.ENEMY.PATROL);
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.direction = 1;
    }
    
    update(deltaTime, platforms, player) {
        if (!this.alive) return;
        
        // 巡邏邏輯
        if (this.x <= this.patrolLeft) {
            this.direction = 1;
        } else if (this.x >= this.patrolRight - this.width) {
            this.direction = -1;
        }
        
        this.vx = this.speed * this.direction;
        
        this.applyGravity();
        this.move(platforms);
    }
}

// ========================================
// 追擊敵人 - 看到玩家就追過來
// ========================================
export class ChaserEnemy extends Enemy {
    constructor(x, y, patrolLeft, patrolRight) {
        super(x, y, CONFIG.ENEMY.CHASER);
        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.direction = 1;
        this.chasing = false;
    }
    
    update(deltaTime, platforms, player) {
        if (!this.alive) return;
        
        // 偵測玩家
        const distanceToPlayer = Math.abs(player.x - this.x);
        
        if (distanceToPlayer < CONFIG.ENEMY.CHASER.DETECTION_RANGE && player.alive) {
            // 追擊模式
            this.chasing = true;
            this.direction = player.x > this.x ? 1 : -1;
        } else {
            // 巡邏模式
            this.chasing = false;
            if (this.x <= this.patrolLeft) {
                this.direction = 1;
            } else if (this.x >= this.patrolRight - this.width) {
                this.direction = -1;
            }
        }
        
        this.vx = this.speed * this.direction * (this.chasing ? 1.5 : 1);
        
        this.applyGravity();
        this.move(platforms);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 追擊時顯示驚嘆號
        if (this.chasing) {
            ctx.fillStyle = '#ff0';
            ctx.font = '20px Arial';
            ctx.fillText('!', this.x + this.width / 2 - 5, this.y - 15);
        }
    }
}
