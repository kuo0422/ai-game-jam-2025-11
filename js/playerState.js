// ========================================
// 玩家狀態 (Metroidvania 解鎖能力)
// ========================================
export const PLAYER_STATE = {
    abilities: {
        doubleJump: false,
        // 預留其他能力
        dash: false,
        wallJump: false,
        downSlam: false
    },
    collectedOrbs: [],
    
    // 重置狀態方法
    reset() {
        this.abilities.doubleJump = false;
        this.abilities.dash = false;
        this.abilities.wallJump = false;
        this.abilities.downSlam = false;
        this.collectedOrbs = [];
    }
};
