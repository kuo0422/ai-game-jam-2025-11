// ========================================
// 關卡類別 - 管理地圖資料
// ========================================
import { CONFIG } from './config.js';
import { LEVEL_DATA } from './levelData.js';
import { PLAYER_STATE } from './playerState.js';
import { PatrolEnemy, ChaserEnemy } from './enemy.js';
import { AbilityOrb } from './abilityOrb.js';
import { ExperienceOrb } from './experience.js';

export class Level {
    constructor(areaKey) {
        this.areaKey = areaKey;
        this.data = LEVEL_DATA.areas[areaKey];
        this.platforms = this.data.platforms;
        this.enemies = [];
        this.abilityOrbs = [];
        this.experienceOrbs = [];
        
        this.loadEnemies();
        this.loadAbilityOrbs();
    }
    
    // 設置敵人死亡回調（由遊戲類別調用）
    setEnemyDeathCallback(callback) {
        this.enemies.forEach(enemy => {
            enemy.setDeathCallback(callback);
        });
    }
    
    // 添加經驗值掉落物
    addExperienceOrb(x, y, amount) {
        const orb = new ExperienceOrb(x, y, amount);
        this.experienceOrbs.push(orb);
    }
    
    loadEnemies() {
        this.data.enemies.forEach(enemyData => {
            let enemy;
            if (enemyData.type === 'patrol') {
                enemy = new PatrolEnemy(
                    enemyData.x, 
                    enemyData.y, 
                    enemyData.patrolLeft, 
                    enemyData.patrolRight
                );
            } else if (enemyData.type === 'chaser') {
                enemy = new ChaserEnemy(
                    enemyData.x, 
                    enemyData.y, 
                    enemyData.patrolLeft, 
                    enemyData.patrolRight
                );
            }
            // 設置死亡回調
            enemy.setDeathCallback((x, y, amount) => {
                this.addExperienceOrb(x, y, amount);
            });
            this.enemies.push(enemy);
        });
    }
    
    loadAbilityOrbs() {
        this.data.abilityOrbs.forEach(orbData => {
            const orb = new AbilityOrb(orbData.type, orbData.x, orbData.y);
            // 檢查是否已收集
            if (PLAYER_STATE.collectedOrbs.includes(orbData.type)) {
                orb.collected = true;
            }
            this.abilityOrbs.push(orb);
        });
    }
    
    update(deltaTime, player) {
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.platforms, player));
        this.abilityOrbs.forEach(orb => orb.update(deltaTime));
        
        // 更新經驗值掉落物
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        this.experienceOrbs.forEach(orb => {
            orb.update(deltaTime, playerCenterX, playerCenterY);
            // 如果經驗值非常接近玩家，標記為已收集
            const dx = playerCenterX - orb.x;
            const dy = playerCenterY - orb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10 && !orb.collected) {
                orb.collected = true;
                player.addExperience(orb.amount);
            }
        });
        
        // 移除已收集的經驗值
        this.experienceOrbs = this.experienceOrbs.filter(orb => !orb.collected);
    }
    
    draw(ctx) {
        // 繪製平台
        this.platforms.forEach(platform => {
            ctx.fillStyle = CONFIG.PLATFORM.COLOR;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            ctx.strokeStyle = CONFIG.PLATFORM.OUTLINE_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // 繪製敵人
        this.enemies.forEach(enemy => enemy.draw(ctx));
        
        // 繪製經驗值掉落物
        this.experienceOrbs.forEach(orb => orb.draw(ctx));
        
        // 繪製能力球
        this.abilityOrbs.forEach(orb => orb.draw(ctx));
    }
}
