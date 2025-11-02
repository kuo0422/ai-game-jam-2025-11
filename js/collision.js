// ========================================
// 碰撞檢測工具類別
// ========================================
export class Collision {
    /**
     * AABB 碰撞檢測
     */
    static checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 點與矩形碰撞
     */
    static pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }
    
    /**
     * 圓形碰撞檢測
     */
    static checkCircle(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
    }
    
    /**
     * 檢查兩條線段是否相交
     */
    static lineIntersectsLine(p1, p2, p3, p4) {
        const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (den === 0) return false; // 平行

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
        const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

        return t > 0 && t < 1 && u > 0 && u < 1;
    }

    /**
     * 檢查一條線段是否與一個矩形相交 (視野檢測)
     * @param {object} start - 線段起點 {x, y}
     * @param {object} end - 線段終點 {x, y}
     * @param {object} rect - 矩形障礙物 {x, y, width, height}
     * @returns {boolean} 是否相交
     */
    static lineIntersectsRect(start, end, rect) {
        const left =   { x: rect.x, y: rect.y };
        const right =  { x: rect.x + rect.width, y: rect.y };
        const top =    { x: rect.x, y: rect.y + rect.height };
        const bottom = { x: rect.x + rect.width, y: rect.y + rect.height };

        const intersects = 
            this.lineIntersectsLine(start, end, left, right) ||
            this.lineIntersectsLine(start, end, right, bottom) ||
            this.lineIntersectsLine(start, end, bottom, top) ||
            this.lineIntersectsLine(start, end, top, left);

        return intersects;
    }

    /**
     * 視野檢測 (Raycasting)
     * @param {object} start - 視野起點 {x, y}
     * @param {object} end - 視野終點 {x, y}
     * @param {Array} obstacles - 障礙物 (平台) 列表
     * @returns {boolean} 視野是否清晰 (true: 清晰, false: 被阻擋)
     */
    static checkLineOfSight(start, end, obstacles) {
        for (const obstacle of obstacles) {
            if (this.lineIntersectsRect(start, end, obstacle)) return false;
        }
        return true;
    }
}
