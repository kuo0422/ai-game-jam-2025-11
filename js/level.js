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
        this.benches = this.data.benches || [];
        this.doors = this.data.doors || [];
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

        // 檢查玩家是否靠近存檔點
        this.checkBenchInteraction(player);
        
        // 檢查玩家是否靠近 Boss 門
        this.checkDoorInteraction(player);
    }
    
    checkBenchInteraction(player) {
        this.benches.forEach(bench => {
            const distance = Math.sqrt(
                Math.pow(player.x + player.width / 2 - (bench.x + bench.width / 2), 2) +
                Math.pow(player.y + player.height / 2 - (bench.y + bench.height / 2), 2)
            );
            
            // 如果玩家靠近存檔點（100 像素內）
            if (distance < 100) {
                bench.nearby = true;
                
                // 按 E 鍵互動（後續實作）
                // if (player.keys['e'] && !bench.activated) {
                //     bench.activated = true;
                //     player.heal(); // 恢復血量
                // }
            } else {
                bench.nearby = false;
            }
        });
    }
    
    checkDoorInteraction(player) {
        this.doors.forEach(door => {
            const distance = Math.sqrt(
                Math.pow(player.x + player.width / 2 - (door.x + door.width / 2), 2) +
                Math.pow(player.y + player.height / 2 - (door.y + door.height / 2), 2)
            );
            
            // 如果玩家靠近門（150 像素內）
            if (distance < 150) {
                door.nearby = true;
                
                // 檢查是否滿足開門條件
                if (door.locked && door.requiredAbility) {
                    door.canOpen = PLAYER_STATE.abilities[door.requiredAbility];
                } else {
                    door.canOpen = !door.locked;
                }
            } else {
                door.nearby = false;
            }
        });
       
    }
    
    draw(ctx) {
        // 繪製平台
        this.platforms.forEach((platform, index) => {
            ctx.fillStyle = CONFIG.PLATFORM.COLOR;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            ctx.strokeStyle = CONFIG.PLATFORM.OUTLINE_COLOR;
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            
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
        
        // 繪製存檔點（長椅）
        this.benches.forEach(bench => {
            // 長椅本體
            ctx.fillStyle = bench.activated ? '#8b4513' : '#654321';
            ctx.fillRect(bench.x, bench.y, bench.width, bench.height);
            
            // 長椅輪廓
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.strokeRect(bench.x, bench.y, bench.width, bench.height);
            
            // 如果玩家靠近，顯示提示
            if (bench.nearby) {
                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('按 E 休息', bench.x + bench.width / 2, bench.y - 10);
            }
        });
        
        // 繪製 Boss 門
        this.doors.forEach(door => {
            // 門本體
            if (door.locked) {
                ctx.fillStyle = door.canOpen ? '#ffd700' : '#666';
            } else {
                ctx.fillStyle = '#4a4a4a';
            }
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            // 門框
            ctx.strokeStyle = door.locked ? '#ff6b6b' : '#888';
            ctx.lineWidth = 4;
            ctx.strokeRect(door.x, door.y, door.width, door.height);
            
            // 鎖的符號
            if (door.locked) {
                ctx.fillStyle = door.canOpen ? '#ffd700' : '#ff6b6b';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', door.x + door.width / 2, door.y + door.height / 2 + 15);
            }
            
            // 如果玩家靠近，顯示提示
            if (door.nearby) {
                ctx.fillStyle = '#fff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                
                if (door.locked && !door.canOpen) {
                    ctx.fillText(door.description || '需要特殊能力', door.x + door.width / 2, door.y - 20);
                } else if (door.canOpen) {
                    ctx.fillText('按 E 開啟', door.x + door.width / 2, door.y - 20);
                }
            }
        });
        
        // 繪製敵人
        this.enemies.forEach(enemy => enemy.draw(ctx));
        
        // 繪製經驗值掉落物
        this.experienceOrbs.forEach(orb => orb.draw(ctx));
        
        // 繪製能力球
        this.abilityOrbs.forEach(orb => orb.draw(ctx));
    }
}
