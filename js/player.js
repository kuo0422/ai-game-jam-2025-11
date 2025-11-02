// ========================================
// 玩家類別
// ========================================
import { CONFIG } from './config.js';
import { PLAYER_STATE } from './playerState.js';
import { Collision } from './collision.js';

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
        this.attackDirection = 1;
        this.airAttacking = false;
        
        // 受擊相關
        this.invincible = false;
        this.invincibleTimer = 0;
        this.stunned = false;
        this.stunnedTimer = 0;
        
        // 輸入
        this.keys = {};
        
        this.setupInput();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // 跳躍
            if (e.key === ' ' || e.key.toLowerCase() === 'w') {
                this.jump();
            }
            
            // 攻擊
            if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'k') {
                this.attack();
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
        
        // 攻擊判定
        if (this.attacking) {
            this.checkAttackHit(enemies);
        }
        
        // 檢查能力球收集
        this.checkAbilityOrbs(abilityOrbs);
        
        // 經驗值收集在 level.js 中處理（更高效）
        
        // 檢查敵人碰撞
        this.checkEnemyCollision(enemies);
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
    
    attack() {
        if (this.attackCooldown > 0 || this.stunned) return;
        
        this.attacking = true;
        this.attackTimer = CONFIG.PLAYER.ATTACK_DURATION;
        this.attackCooldown = CONFIG.PLAYER.ATTACK_COOLDOWN;
        this.attackDirection = this.direction;
        
        // 空中攻擊標記
        if (!this.grounded) {
            this.airAttacking = true;
        }
        
        // 通知遊戲創建斬擊特效
        if (window.game && window.game.createSlashEffect) {
            const attackBox = this.getAttackBox();
            const centerX = attackBox.x + attackBox.width / 2;
            const centerY = attackBox.y + attackBox.height / 2;
            window.game.createSlashEffect(centerX, centerY, this.attackDirection);
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
        
        // 繪製玩家
        ctx.fillStyle = CONFIG.PLAYER.COLOR;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 繪製方向指示
        ctx.fillStyle = '#fff';
        ctx.fillRect(
            this.direction > 0 ? this.x + this.width - 5 : this.x,
            this.y + 10,
            5,
            10
        );
        
        ctx.globalAlpha = 1;
        
        // 繪製攻擊框 (debug)
        if (this.attacking) {
            const attackBox = this.getAttackBox();
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
        }
    }
}
