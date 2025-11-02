// ========================================
// 關卡類別 - 管理地圖資料
// ========================================
import { CONFIG } from './config.js';
import { LEVEL_DATA } from './levelData.js';
import { PLAYER_STATE } from './playerState.js';
import { PatrolEnemy, ChaserEnemy, SentryEnemy } from './enemy.js';
import { AbilityOrb } from './abilityOrb.js';
import { ExperienceOrb } from './experience.js';
import { PlatformRenderer } from './platformRenderer.js';
import { Door } from './door.js';
import { SavePoint } from './savePoint.js';

export class Level {
    constructor(areaKey) {
        this.areaKey = areaKey;
        this.data = LEVEL_DATA.areas[areaKey];
        this.platforms = this.data.platforms;
        this.enemies = [];
        this.abilityOrbs = [];
        this.doors = [];
        this.savePoints = [];
        this.experienceOrbs = [];
        
        this.loadEnemies();
        this.loadAbilityOrbs();
        this.loadDoors();
        this.loadSavePoints();
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
            } else if (enemyData.type === 'sentry') {
                enemy = new SentryEnemy(enemyData.x, enemyData.y);
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
    
    /**
     * 載入門
     */
    loadDoors() {
        if (!this.data.doors) return;
        
        this.data.doors.forEach(doorData => {
            const door = new Door(
                doorData.x,
                doorData.y,
                doorData.width,
                doorData.height,
                'boss' // 類型
            );
            door.locked = doorData.locked !== undefined ? doorData.locked : true;
            door.requiredAbility = doorData.requiredAbility;
            door.name = doorData.name;
            this.doors.push(door);
        });
    }
    
    /**
     * 載入存檔點（benches）
     */
    loadSavePoints() {
        if (!this.data.benches) return;
        
        this.data.benches.forEach(benchData => {
            // 將 bench 的位置轉換為存檔點的中心位置
            const savePoint = new SavePoint(
                benchData.x + benchData.width / 2,
                benchData.y + benchData.height / 2
            );
            savePoint.name = benchData.name;
            this.savePoints.push(savePoint);
        });
    }
    
    update(deltaTime, player) {
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.platforms, player));
        this.abilityOrbs.forEach(orb => orb.update(deltaTime));
        
        // 更新門和存檔點
        this.doors.forEach(door => door.update(deltaTime));
        this.savePoints.forEach(savePoint => savePoint.update(deltaTime));
        
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
        // 繪製平台（使用像素風格渲染器）
        this.platforms.forEach((platform, index) => {
            // 使用 PlatformRenderer 繪製平台
            PlatformRenderer.draw(ctx, platform);
            
            // 在平台上標記數字（開發者模式）
            if (CONFIG.DEBUG.SHOW_PLATFORM_NUMBERS) {
                // 使用平台的 id 屬性，如果沒有則使用索引
                const displayNumber = platform.id || (index + 1);
                
                ctx.fillStyle = CONFIG.DEBUG.PLATFORM_NUMBER_COLOR;
                ctx.font = `bold ${CONFIG.DEBUG.PLATFORM_NUMBER_SIZE}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 數字外框（陰影效果）
                ctx.strokeStyle = CONFIG.DEBUG.PLATFORM_NUMBER_OUTLINE;
                ctx.lineWidth = 3;
                ctx.strokeText(displayNumber, platform.x + platform.width / 2, platform.y + platform.height / 2);
                
                // 數字本體
                ctx.fillText(displayNumber, platform.x + platform.width / 2, platform.y + platform.height / 2);
            }
        });
        
        // 繪製門
        this.doors.forEach(door => door.draw(ctx));
        
        // 繪製存檔點
        this.savePoints.forEach(savePoint => savePoint.draw(ctx));
        
        // 繪製敵人
        this.enemies.forEach(enemy => enemy.draw(ctx));
        
        // 繪製經驗值掉落物
        this.experienceOrbs.forEach(orb => orb.draw(ctx));
        
        // 繪製能力球
        this.abilityOrbs.forEach(orb => orb.draw(ctx));
    }
}

