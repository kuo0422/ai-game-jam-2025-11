// ========================================
// 玩家類別
// ========================================
import { CONFIG } from './config.js';
import { PLAYER_STATE } from './playerState.js';
import { Collision } from './collision.js';
import { SpriteManager } from './spriteManager.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.vx = 0;
        this.vy = 0;
        
        // 狀態
        this.grounded = false;
        this.direction = 1; // 1 = 右, -1 = 左
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.alive = true;
        
        // 經驗值系統
        this.experience = 0;
        this.level = 1;
        
        // 跳躍相關
        this.canJump = true;
        this.hasDoubleJump = false;
        this.coyoteTimer = 0;
        
        // 攻擊相關
        this.attacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.fireballCooldown = 0; // 火球單獨冷卻
        this.attackDirection = 1;
        this.airAttacking = false;
        this.attackType = 'slash'; // 'slash' 或 'fireball'
        
        // 受擊相關
        this.invincible = false;
        this.invincibleTimer = 0;
        this.stunned = false;
        this.stunnedTimer = 0;
        
        // 輸入
        this.keys = {};
        
        // Sprite 系統
        this.spriteManager = new SpriteManager(
            'Assets/Characters/Player/metadata.json',
            'Assets/Characters/Player/'
        );
        this.spriteLoaded = false;
        this.spriteManager.load().then(() => {
            this.spriteLoaded = true;
        });
        
        // 動畫狀態
        this.currentAnimation = 'breathing-idle';
        this.animationFrame = 0;
        this.animationTime = 0;
        this.animationSpeed = 0.15; // 動畫播放速度（秒/幀）
        
        this.setupInput();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // 跳躍
            if (e.key === ' ' || e.key.toLowerCase() === 'w') {
                this.jump();
            }
            
            // 攻擊 - J鍵：火球，K鍵：斬擊
            if (e.key.toLowerCase() === 'k') {
                this.attackSlash();
            } else if (e.key.toLowerCase() === 'j') {
                this.attackFireball();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    update(deltaTime, platforms, enemies, abilityOrbs, experienceOrbs) {
        if (!this.alive) return;
        
        // 更新計時器
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.attacking = false;
                this.airAttacking = false;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.fireballCooldown > 0) {
            this.fireballCooldown -= deltaTime;
        }
        
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.stunnedTimer > 0) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.stunned = false;
            }
        }
        
        // 硬直時不能移動
        if (this.stunned) {
            this.applyGravity(deltaTime);
            this.move(deltaTime, platforms);
            return;
        }
        
        // 水平移動
        this.handleMovement(deltaTime);
        
        // 重力
        this.applyGravity(deltaTime);
        
        // Coyote time
        if (this.grounded) {
            this.coyoteTimer = CONFIG.PLAYER.COYOTE_TIME;
            this.hasDoubleJump = PLAYER_STATE.abilities.doubleJump;
        } else {
            this.coyoteTimer -= deltaTime;
        }
        
        // 移動與碰撞
        this.move(deltaTime, platforms);
        
        // 更新動畫狀態
        this.updateAnimation(deltaTime);
        
        // 攻擊判定（只處理斬擊，火球在特效中處理）
        if (this.attacking && this.attackType === 'slash') {
            this.checkAttackHit(enemies);
        }
        
        // 檢查能力球收集
        this.checkAbilityOrbs(abilityOrbs);
        
        // 經驗值收集在 level.js 中處理（更高效）
        
        // 檢查敵人碰撞
        this.checkEnemyCollision(enemies);
    }
    
    /**
     * 更新動畫狀態
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // 確定當前動畫
        let targetAnimation = 'breathing-idle';
        
        if (!this.grounded && Math.abs(this.vy) > 2) {
            // 跳躍/下降
            targetAnimation = 'jumping-1';
        } else if (Math.abs(this.vx) > 0.5) {
            // 移動
            targetAnimation = 'running-8-frames';
        } else {
            // 待機
            targetAnimation = 'breathing-idle';
        }
        
        // 如果動畫改變，重置幀
        if (this.currentAnimation !== targetAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationFrame = 0;
            this.animationTime = 0;
        }
        
        // 更新動畫幀
        if (this.animationTime >= this.animationSpeed) {
            this.animationTime = 0;
            // 獲取當前動畫的幀數
            const spriteDirection = this.spriteLoaded 
                ? this.spriteManager.getSpriteDirection(
                    this.direction, 
                    Math.abs(this.vx) > 0.5, 
                    this.vy,
                    this.currentAnimation
                  )
                : 'east';
            const frames = this.spriteLoaded 
                ? this.spriteManager.getAnimationFrames(this.currentAnimation, spriteDirection)
                : [];
            
            if (frames.length > 0) {
                this.animationFrame = (this.animationFrame + 1) % frames.length;
            }
        }
    }
    
    handleMovement(deltaTime) {
        const moveLeft = this.keys['a'] || this.keys['arrowleft'];
        const moveRight = this.keys['d'] || this.keys['arrowright'];
        
        if (moveLeft) {
            this.vx -= CONFIG.PLAYER.MOVE_ACCELERATION;
            this.direction = -1;
        } else if (moveRight) {
            this.vx += CONFIG.PLAYER.MOVE_ACCELERATION;
            this.direction = 1;
        } else {
            // 減速
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - CONFIG.PLAYER.MOVE_DECELERATION);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + CONFIG.PLAYER.MOVE_DECELERATION);
            }
        }
        
        // 限制最大速度
        this.vx = Math.max(-CONFIG.PLAYER.MAX_SPEED, 
                           Math.min(CONFIG.PLAYER.MAX_SPEED, this.vx));
    }
    
    applyGravity(deltaTime) {
        this.vy += CONFIG.PLAYER.GRAVITY;
        this.vy = Math.min(this.vy, CONFIG.PLAYER.MAX_FALL_SPEED);
    }
    
    jump() {
        if (this.stunned || this.attacking) return;
        
        // 正常跳躍或 coyote time
        if (this.grounded || this.coyoteTimer > 0) {
            this.vy = CONFIG.PLAYER.JUMP_FORCE;
            this.grounded = false;
            this.coyoteTimer = 0;
        }
        // 二段跳
        else if (this.hasDoubleJump && !this.grounded) {
            this.vy = CONFIG.PLAYER.DOUBLE_JUMP_FORCE;
            this.hasDoubleJump = false;
        }
    }
    
    // 斬擊攻擊 (K鍵)
    attackSlash() {
        if (this.attackCooldown > 0 || this.stunned) return;
        
        this.attacking = true;
        this.attackType = 'slash';
        this.attackTimer = CONFIG.PLAYER.ATTACK_DURATION;
        this.attackCooldown = CONFIG.PLAYER.ATTACK_COOLDOWN;
        this.attackDirection = this.direction;
        
        // 空中攻擊標記
        if (!this.grounded) {
            this.airAttacking = true;
        }
        
        // 通知遊戲創建斬擊特效
        if (window.game && window.game.createSlashEffect) {
            const effectX = this.x + this.width / 2;
            const effectY = this.y + this.height / 2;
            window.game.createSlashEffect(effectX, effectY, this.attackDirection);
        }
    }
    
    // 火球攻擊 (J鍵)
    attackFireball() {
        if (this.fireballCooldown > 0 || this.stunned) return;
        
        this.attacking = true;
        this.attackType = 'fireball';
        this.attackTimer = 0.1; // 火球發射動作很短
        this.fireballCooldown = 0.4; // 火球冷卻稍長
        this.attackDirection = this.direction;
        
        // 通知遊戲創建火球特效
        if (window.game && window.game.createFireballEffect) {
            // 從玩家身體邊緣發射火球，避免穿牆
            const startX = this.attackDirection > 0 
                ? this.x + this.width + 5  // 玩家右側，稍微偏移避免立即碰撞
                : this.x - 5;              // 玩家左側，稍微偏移避免立即碰撞
            const startY = this.y + this.height / 2; // 玩家中心高度
            
            // 傳遞敵人列表和玩家引用供追尾和爆炸擊退使用
            const enemies = window.game.level?.enemies || [];
            window.game.createFireballEffect(startX, startY, this.attackDirection, enemies, this);
        }
    }
    
    checkAttackHit(enemies) {
        const attackBox = this.getAttackBox();
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const enemyBox = {
                x: enemy.x,
                y: enemy.y,
                width: enemy.width,
                height: enemy.height
            };
            
            if (Collision.checkAABB(attackBox, enemyBox) && !enemy.justHit) {
                enemy.takeDamage(CONFIG.PLAYER.ATTACK_DAMAGE);
                enemy.justHit = true;
                setTimeout(() => enemy.justHit = false, 100);
                
                // Pogo 反彈 (空中往下攻擊打到敵人)
                if (this.airAttacking && this.vy > 0) {
                    this.vy = CONFIG.PLAYER.POGO_BOUNCE_FORCE;
                    this.hasDoubleJump = PLAYER_STATE.abilities.doubleJump; // 恢復二段跳
                }
            }
        });
    }
    
    getAttackBox() {
        return {
            x: this.attackDirection > 0 
                ? this.x + this.width 
                : this.x - CONFIG.PLAYER.ATTACK_WIDTH,
            y: this.y + (this.height - CONFIG.PLAYER.ATTACK_HEIGHT) / 2,
            width: CONFIG.PLAYER.ATTACK_WIDTH,
            height: CONFIG.PLAYER.ATTACK_HEIGHT
        };
    }
    
    checkEnemyCollision(enemies) {
        if (this.invincible) return;
        
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const playerBox = { x: this.x, y: this.y, width: this.width, height: this.height };
            const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
            
            if (Collision.checkAABB(playerBox, enemyBox)) {
                this.takeDamage(enemy.damage, enemy.x + enemy.width / 2);
            }
        });
    }
    
    takeDamage(damage, sourceX) {
        this.health -= damage;
        this.invincible = true;
        this.invincibleTimer = CONFIG.PLAYER.HIT_INVINCIBLE_TIME;
        this.stunned = true;
        this.stunnedTimer = CONFIG.PLAYER.HIT_STUN_TIME;
        
        // 擊退
        const knockbackDir = sourceX < this.x ? 1 : -1;
        this.vx = knockbackDir * CONFIG.PLAYER.HIT_KNOCKBACK;
        this.vy = CONFIG.PLAYER.JUMP_FORCE * 0.5;
        
        if (this.health <= 0) {
            this.die();
        }
        
        // 通知遊戲更新 UI
        if (window.game) {
            window.game.updateHealthUI();
        }
    }
    
    checkAbilityOrbs(orbs) {
        orbs.forEach(orb => {
            if (orb.collected) return;
            
            const distance = Math.sqrt(
                Math.pow(this.x + this.width/2 - orb.x, 2) + 
                Math.pow(this.y + this.height/2 - orb.y, 2)
            );
            
            if (distance < CONFIG.ABILITY_ORB.RADIUS + 30) {
                orb.collect();
            }
        });
    }
    
    addExperience(amount) {
        this.experience += amount;
        
        // 檢查升級
        this.checkLevelUp();
        
        // 更新 UI
        if (window.game && window.game.updateExpUI) {
            window.game.updateExpUI();
        }
    }
    
    checkLevelUp() {
        if (this.level >= CONFIG.PLAYER_EXP.MAX_LEVEL) {
            return; // 已達最高等級
        }
        
        const expRequired = CONFIG.PLAYER_EXP.EXP_PER_LEVEL[this.level] || 999;
        
        if (this.experience >= expRequired) {
            this.level++;
            // 升級效果（可以添加更多功能）
            if (window.game && window.game.onPlayerLevelUp) {
                window.game.onPlayerLevelUp(this.level);
            }
        }
    }
    
    die() {
        this.alive = false;
        if (window.game) {
            window.game.showDeathScreen();
        }
    }
    
    respawn(spawnPoint) {
        this.x = spawnPoint.x;
        this.y = spawnPoint.y;
        this.vx = 0;
        this.vy = 0;
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.alive = true;
        this.invincible = false;
        this.stunned = false;
        this.attacking = false;
        if (window.game) {
            window.game.updateHealthUI();
        }
    }
    
    move(deltaTime, platforms) {
        // 水平移動
        this.x += this.vx;
        this.checkPlatformCollisionX(platforms);
        
        // 垂直移動
        this.y += this.vy;
        this.grounded = false;
        this.checkPlatformCollisionY(platforms);
    }
    
    checkPlatformCollisionX(platforms) {
        platforms.forEach(platform => {
            if (Collision.checkAABB(this, platform)) {
                if (this.vx > 0) {
                    this.x = platform.x - this.width;
                } else if (this.vx < 0) {
                    this.x = platform.x + platform.width;
                }
                this.vx = 0;
            }
        });
    }
    
    checkPlatformCollisionY(platforms) {
        platforms.forEach(platform => {
            if (Collision.checkAABB(this, platform)) {
                if (this.vy > 0) {
                    // 落地
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                } else if (this.vy < 0) {
                    // 撞到天花板
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
            }
        });
    }
    
    draw(ctx) {
        if (!this.alive) return;
        
        // 無敵時閃爍
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // 使用 sprite 繪製
        if (this.spriteLoaded) {
            this.drawSprite(ctx);
        } else {
            // Sprite 未載入時使用簡單矩形
            ctx.fillStyle = CONFIG.PLAYER.COLOR;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.globalAlpha = 1;
        
        // // 繪製攻擊框 (debug) - 已移除
        // if (this.attacking) {
        //     const attackBox = this.getAttackBox();
        //     ctx.strokeStyle = '#ffff00';
        //     ctx.lineWidth = 2;
        //     ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
        // }
    }
    
    /**
     * 繪製 sprite
     */
    drawSprite(ctx) {
        // 獲取當前動畫方向
        const spriteDirection = this.spriteManager.getSpriteDirection(
            this.direction, 
            Math.abs(this.vx) > 0.5, 
            this.vy,
            this.currentAnimation
        );
        
        // 獲取當前幀
        const frames = this.spriteManager.getAnimationFrames(
            this.currentAnimation,
            spriteDirection
        );
        
        let currentImage = null;
        
        if (frames.length > 0) {
            // 使用動畫幀
            currentImage = frames[this.animationFrame] || frames[0];
        } else {
            // 如果沒有動畫，使用靜態旋轉圖片
            currentImage = this.spriteManager.getRotation(spriteDirection);
        }
        
        if (currentImage) {
            // 計算繪製位置（中心對齊）
            const metadata = this.spriteManager?.metadata;
            const spriteWidth = metadata?.character?.size?.width || 64;
            const spriteHeight = metadata?.character?.size?.height || 64;
            
            // 調整繪製位置使其對齊角色碰撞盒
            const drawX = this.x + (this.width - spriteWidth) / 2;
            const drawY = this.y + (this.height - spriteHeight);
            
            // 繪製 sprite（方向已經在 getSpriteDirection 中處理）
            ctx.drawImage(currentImage, drawX, drawY, spriteWidth, spriteHeight);
        } else {
            // 備用：繪製簡單矩形
            ctx.fillStyle = CONFIG.PLAYER.COLOR;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
}
