// ========================================
// 關卡資料結構
// ========================================
export const LEVEL_DATA = {
    areas: {
        'start': {
            name: '遺忘的十字路',
            bounds: { x: 0, y: 0, width: 2000, height: 1200 },
            spawnPoint: { x: 100, y: 500 },
            platforms: [
                // 地面
                { x: 0, y: 1100, width: 800, height: 100 },
                { x: 900, y: 1100, width: 1100, height: 100 },
                
                // 中層平台
                { x: 300, y: 900, width: 200, height: 30 },
                { x: 600, y: 750, width: 250, height: 30 },
                { x: 1000, y: 850, width: 200, height: 30 },
                { x: 1300, y: 700, width: 200, height: 30 },
                
                // 高層平台
                { x: 200, y: 600, width: 150, height: 30 },
                { x: 500, y: 500, width: 200, height: 30 },
                { x: 900, y: 550, width: 180, height: 30 },
                { x: 1200, y: 400, width: 200, height: 30 },
                
                // 牆壁
                { x: -50, y: 0, width: 50, height: 1200 },
                { x: 2000, y: 0, width: 50, height: 1200 }
            ],
            enemies: [
                { type: 'patrol', x: 400, y: 850, patrolLeft: 300, patrolRight: 500 },
                { type: 'patrol', x: 1100, y: 800, patrolLeft: 1000, patrolRight: 1200 },
                { type: 'chaser', x: 700, y: 700, patrolLeft: 600, patrolRight: 1400 },
                { type: 'chaser', x: 1400, y: 350, patrolLeft: 1200, patrolRight: 1600 }
            ],
            abilityOrbs: [
                { type: 'doubleJump', x: 1300, y: 350, collected: false }
            ],
            doors: [
                // 預留：之後可以加鎖門
                // { x: 1800, y: 1000, width: 100, height: 100, locked: true, requiredKey: 'bossKey' }
            ]
        }
        // 可以繼續添加其他區域
        // 'area2': { ... }
    },
    currentArea: 'start'
};
