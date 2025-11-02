// ========================================
// 遊戲設定檔 - 所有數值都在這裡調整
// ========================================
export const CONFIG = {
    // 畫布設定
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    
    // 玩家設定
    PLAYER: {
        WIDTH: 30,
        HEIGHT: 50,
        COLOR: '#4a90e2',
        MAX_HEALTH: 5,
        
        // 移動
        MOVE_ACCELERATION: 0.8,
        MOVE_DECELERATION: 0.6,
        AIR_MOVE_ACCELERATION: 0.3, // 空中移動加速度
        AIR_MOVE_DECELERATION: 0.2, // 空中移動減速度
        MAX_SPEED: 5,
        
        // 跳躍
        JUMP_FORCE: -12,
        GRAVITY: 0.6,
        MAX_FALL_SPEED: 15,
        COYOTE_TIME: 0.1, // 秒
        
        // 攻擊
        ATTACK_RANGE: 50,
        ATTACK_WIDTH: 60,
        ATTACK_HEIGHT: 40,
        ATTACK_COOLDOWN: 0.3, // 秒
        ATTACK_DURATION: 0.2, // 秒
        ATTACK_DAMAGE: 1,
        ATTACK_STUN_DURATION: 0.1, // 斬擊後的僵直時間（秒）
        
        // 受擊
        HIT_INVINCIBLE_TIME: 0.5, // 秒
        HIT_KNOCKBACK: 8,
        HIT_STUN_TIME: 0.3, // 秒
        
        // 進階能力
        DOUBLE_JUMP_FORCE: -10,
        POGO_BOUNCE_FORCE: -8,
        DASH_SPEED: 12,
        DASH_DURATION: 0.2
    },
    
    // 敵人設定
    ENEMY: {
        PATROL: {
            WIDTH: 40,
            HEIGHT: 40,
            COLOR: '#e74c3c',
            SPEED: 2,
            HEALTH: 3,
            DAMAGE: 1,
            DETECTION_RANGE: 0 // 不偵測玩家
        },
        CHASER: {
            WIDTH: 45,
            HEIGHT: 45,
            COLOR: '#c0392b',
            SPEED: 3.5,
            HEALTH: 4,
            DAMAGE: 1,
            DETECTION_RANGE: 300
        },
        SENTRY: {
            WIDTH: 48,
            HEIGHT: 48,
            COLOR: '#9b59b6', // 紫色
            SPEED: 0, // 不移動
            HEALTH: 3,
            DAMAGE: 1,
            DETECTION_RANGE: 600,
            ATTACK_COOLDOWN: 3.0, // 秒
            CHARGE_TIME: 1.2 // 蓄力時間（秒）
        }
    },
    
    // 平台設定
    PLATFORM: {
        COLOR: '#34495e',
        OUTLINE_COLOR: '#2c3e50'
    },
    
    // 能力球設定
    ABILITY_ORB: {
        RADIUS: 20,
        COLOR: '#f39c12',
        GLOW_COLOR: '#f1c40f'
    },
    
    // 相機設定
    CAMERA: {
        FOLLOW_SMOOTHNESS: 0.1,
        EDGE_MARGIN: 200
    },
    
    // 視差背景層
    PARALLAX_LAYERS: [
        { speed: 0.2, color: '#a6d46aff', alpha: 1.0 },
        { speed: 0.4, color: '#5757a1ff', alpha: 0.7 },
        { speed: 0.6, color: '#ba4294ff', alpha: 0.5 }
    ],
    
    // 開發者工具設定
    DEBUG: {
        SHOW_PLATFORM_NUMBERS: true,  // 顯示平台編號（方便調整地圖）
        PLATFORM_NUMBER_COLOR: '#ffeb3b',  // 數字顏色（黃色）
        PLATFORM_NUMBER_OUTLINE: '#000',   // 數字外框顏色（黑色）
        PLATFORM_NUMBER_SIZE: 14           // 數字大小
    },
    
    // 特效設定
    EFFECTS: {
        SLASH_DURATION: 0.15 // 斬擊特效持續時間（秒）
    },
    
    // 經驗值設定
    EXPERIENCE: {
        COLOR: '#00ff88',
        GLOW_COLOR: '#66ffaa',
        COLLECTION_DISTANCE: 150, // 吸收距離（像素）
        COLLECTION_SPEED: 400, // 吸收速度（像素/秒）
        // 敵人類型對應的經驗值數量
        ENEMY_EXP: {
            PATROL: 5,
            CHASER: 8,
            SENTRY: 12
        }
    },
    
    // 玩家經驗值設定
    PLAYER_EXP: {
        MAX_LEVEL: 10,
        EXP_PER_LEVEL: [0, 10, 25, 45, 70, 100, 135, 175, 220, 270], // 每級所需經驗值
        DAMAGE_PER_LEVEL: 0.5 // 每升一級增加的傷害（0.5 表示每級 +0.5 傷害）
    }
};
