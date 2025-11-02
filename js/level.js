// ========================================
// 關卡類別 - 管理地圖資料
// ========================================
import { CONFIG } from './config.js';
import { LEVEL_DATA } from './levelData.js';
import { PLAYER_STATE } from './playerState.js';
import { PatrolEnemy, ChaserEnemy } from './enemy.js';
import { AbilityOrb } from './abilityOrb.js';

export class Level {
    constructor(areaKey) {
        this.areaKey = areaKey;
        this.data = LEVEL_DATA.areas[areaKey];
        this.platforms = this.data.platforms;
        this.enemies = [];
        this.abilityOrbs = [];
        
        this.loadEnemies();
        this.loadAbilityOrbs();
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
        
        // 繪製能力球
        this.abilityOrbs.forEach(orb => orb.draw(ctx));
    }
}
