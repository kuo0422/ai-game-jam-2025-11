// ========================================
// 敵人類別
// ========================================
import { CONFIG } from './config.js';
import { Collision } from './collision.js';
import { SpriteManager } from './spriteManager.js';

// ========================================
// 敵人基底類別
// ========================================
export class Enemy {
    constructor(x, y, config, enemyType = 'PATROL') {
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
        this.enemyType = enemyType; // 用於判斷經驗值
        this.willDropExp = true; // 標記是否會掉落經驗值
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
            // 通知遊戲掉落經驗值（通過回調）
            if (this.onDeath && this.willDropExp) {
                const expAmount = CONFIG.EXPERIENCE.ENEMY_EXP[this.enemyType] || 5;
                this.onDeath(this.x + this.width / 2, this.y + this.height / 2, expAmount);
            }
        }
    }
    
    // 設置死亡回調
    setDeathCallback(callback) {
        this.onDeath = callback;
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
        super(x, y, CONFIG.ENEMY.PATROL, 'PATROL');
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
        super(x, y, CONFIG.ENEMY.CHASER, 'CHASER');
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

// ========================================
// 哨兵敵人 - 視野內會射線攻擊
// ========================================
export class SentryEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, CONFIG.ENEMY.SENTRY, 'SENTRY');
        this.detectionRange = CONFIG.ENEMY.SENTRY.DETECTION_RANGE;
        this.attackCooldown = 0;
        this.state = 'idle'; // 'idle', 'charging', 'attacking', 'cooldown'
        this.chargeTimer = 0;
        this.lastPlayerPos = { x: 0, y: 0 };

        // Sprite 系統
        this.spriteManager = new SpriteManager(
            'Assets/Characters/monster_1/metadata.json',
            'Assets/Characters/monster_1/'
        );
        this.spriteLoaded = false;
        this.spriteManager.load().then(() => {
            this.spriteLoaded = true;
        });

        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 0.1;
    }

    update(deltaTime, platforms, player) {
        if (!this.alive) return;

        this.applyGravity();
        this.move(platforms);

        const distanceToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
        const selfCenter = { x: this.x + this.width / 2, y: this.y + this.height / 2 };

        // 狀態機
        switch (this.state) {
            case 'idle':
                if (player.alive && distanceToPlayer < this.detectionRange) {
                    if (Collision.checkLineOfSight(selfCenter, playerCenter, platforms)) {
                        this.state = 'charging';
                        this.chargeTimer = CONFIG.ENEMY.SENTRY.CHARGE_TIME;
                    }
                }
                break;

            case 'charging':
                this.chargeTimer -= deltaTime;
                this.direction = player.x > this.x ? 1 : -1; // 持續面向玩家
                
                // 如果在蓄力期間玩家離開視野或距離，取消攻擊
                if (!player.alive || distanceToPlayer > this.detectionRange * 1.2 || !Collision.checkLineOfSight(selfCenter, playerCenter, platforms)) {
                    this.state = 'idle';
                } else if (this.chargeTimer <= 0) {
                    this.state = 'attacking';
                    this.lastPlayerPos = { ...playerCenter }; // 鎖定攻擊位置
                    this.fire();
                }
                break;

            case 'attacking':
                // 攻擊動畫/效果的短暫持續狀態
                this.state = 'cooldown';
                this.attackCooldown = CONFIG.ENEMY.SENTRY.ATTACK_COOLDOWN;
                break;

            case 'cooldown':
                this.attackCooldown -= deltaTime;
                if (this.attackCooldown <= 0) {
                    this.state = 'idle';
                }
                break;
        }

        this.updateAnimation(deltaTime);
    }

    fire() {
        if (window.game && window.game.createRayEffect) {
            // 獲取 Sprite 的實際高度，如果未載入則使用預設值
            const spriteHeight = this.spriteLoaded ? this.spriteManager.metadata.character.size.height : this.height;
            // 計算 Sprite 的繪製 Y 座標
            const drawY = this.y + (this.height - spriteHeight);
            
            const startX = this.x + this.width / 2;
            const startY = drawY + spriteHeight * 0.3; // 從 Sprite 頂部向下約 35% 的位置發射，模擬眼睛位置
            window.game.createRayEffect(startX, startY, this.lastPlayerPos.x, this.lastPlayerPos.y, window.game.player);
        }
    }

    updateAnimation(deltaTime) {
        // monster_1 的 metadata 中只有 'walk' 動畫。
        // 我們用 'walk' 來代表所有活動狀態，用第一幀代表待機。
        let targetAnimation = 'walk';

        // 如果敵人是靜止的 'idle' 狀態，我們讓它停在走路動畫的第一幀
        if (this.state === 'idle') {
            this.animationFrame = 0;
            return; // 不更新動畫時間，保持靜止
        } 

        this.animationTime += deltaTime;
        if (this.animationTime >= this.animationSpeed) {
            this.animationTime = 0;
            const frames = this.spriteLoaded ? this.spriteManager.getAnimationFrames(targetAnimation, this.direction > 0 ? 'east' : 'west') : [];
            if (frames.length > 0) {
                this.animationFrame = (this.animationFrame + 1) % frames.length;
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // 使用 Sprite 繪製
        if (this.spriteLoaded) {
            // 統一使用 'walk' 動畫
            const animName = 'walk';
            const dir = this.direction > 0 ? 'east' : 'west';
            const frames = this.spriteManager.getAnimationFrames(animName, dir);
            
            // 確保 animationFrame 不會超出範圍
            const frameIndex = Math.min(this.animationFrame, frames.length - 1);
            const image = frames[frameIndex] || frames[0];

            if (image) {
                const drawX = this.x + (this.width - image.width) / 2;
                const drawY = this.y + (this.height - image.height);
                // 修正：傳入圖片的寬度和高度進行繪製
                ctx.drawImage(image, drawX, drawY, image.width, image.height);

                // 直接在這裡繪製血條，並基於 Sprite 的位置
                const healthBarWidth = this.width;
                const healthBarHeight = 4;
                const healthPercent = this.health / this.maxHealth;
                
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x, drawY - 10, healthBarWidth, healthBarHeight);
                ctx.fillStyle = '#f00';
                ctx.fillRect(this.x, drawY - 10, healthBarWidth * healthPercent, healthBarHeight);
            }
        } else {
            // Sprite 未載入時的備用繪製
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

    }
}

// ========================================
// 遠程敵人 - 視野內會射線攻擊
// ========================================
export class RangedEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, CONFIG.ENEMY.RANGED, 'RANGED');
        this.detectionRange = CONFIG.ENEMY.RANGED.DETECTION_RANGE;
        this.attackCooldown = 0;
        this.isCharging = false;
        this.chargeTimer = 0;
    }

    update(deltaTime, platforms, player) {
        if (!this.alive) return;

        this.applyGravity();
        this.move(platforms);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        const distanceToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // 如果玩家在偵測範圍內且存活
        if (distanceToPlayer < this.detectionRange && player.alive && this.attackCooldown <= 0 && !this.isCharging) {
            const start = { x: this.x + this.width / 2, y: this.y + this.height / 2 };
            const end = { x: player.x + player.width / 2, y: player.y + player.height / 2 };

            // 檢查視野
            if (Collision.checkLineOfSight(start, end, platforms)) {
                this.isCharging = true;
                this.chargeTimer = CONFIG.ENEMY.RANGED.CHARGE_TIME;
                this.direction = player.x > this.x ? 1 : -1;
            }
        }

        // 蓄力邏輯
        if (this.isCharging) {
            this.chargeTimer -= deltaTime;
            if (this.chargeTimer <= 0) {
                this.fire(player);
                this.isCharging = false;
                this.attackCooldown = CONFIG.ENEMY.RANGED.ATTACK_COOLDOWN;
            }
        }
    }

    fire(player) {
        if (window.game && window.game.createRayEffect) {
            const startX = this.x + this.width / 2;
            const startY = this.y + this.height / 2;
            const endX = player.x + player.width / 2;
            const endY = player.y + player.height / 2;
            window.game.createRayEffect(startX, startY, endX, endY, player);
        }
    }

    draw(ctx) {
        super.draw(ctx);

        // 蓄力時顯示特效
        if (this.isCharging) {
            const chargeProgress = 1 - (this.chargeTimer / CONFIG.ENEMY.RANGED.CHARGE_TIME);
            const glowRadius = 5 + chargeProgress * 15;
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
