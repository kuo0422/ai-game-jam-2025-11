// ========================================
// 特效系統
// ========================================
import { Collision } from './collision.js';
import { CONFIG } from './config.js';
/**
 * 增強斬擊特效 (K鍵) - 帶有多層粒子、漸層和光暈效果
 * 注意：斬擊特效位置固定在世界坐標，不會跟隨角色移動
 */
export class SlashEffect {
    constructor(x, y, direction) {
        // 世界坐標位置（固定，不會改變）
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 = 右, -1 = 左
        this.lifetime = 0.3; // 持續時間（秒）
        this.age = 0;
        this.active = true;
        
        // 斬擊弧線的參數
        this.width = 150;
        this.height = 100;
        this.startAngle = direction > 0 ? -Math.PI / 3 : 2 * Math.PI / 3;
        this.endAngle = direction > 0 ? Math.PI / 3 : 4 * Math.PI / 3;
        
        // 粒子系統
        this.mainParticles = [];
        this.sparkParticles = [];
        this.distortionLayer = []; // 新增：空間裂縫/扭曲層
        this.glints = []; // 新增：閃光粒子
        
        // 衝擊波
        this.shockwave = null;
        
        this.createParticles();
    }
    
    createParticles() {
        // 主要斬擊軌跡粒子
        const mainCount = 15; // 減少粒子數量，使其更像拖尾而不是主體
        for (let i = 0; i < mainCount; i++) {
            const progress = i / (mainCount - 1);
            const angle = this.startAngle + (this.endAngle - this.startAngle) * progress;
            const distance = this.width * 0.5;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            // 根據在弧線上的位置，模擬透視 (中間的粒子更大)
            const perspectiveScale = 1 + Math.sin(progress * Math.PI) * 0.4;

            // 創建兩層粒子：後層和前層
            for (let j = 0; j < 2; j++) {
                const isFrontLayer = j === 1;
                const layerOffset = (isFrontLayer ? 4 : -4) * perspectiveScale; // 減小層間距
                
                // 粒子顏色和大小根據前後層調整
                const brightness = isFrontLayer ? 85 : 70;
                const size = (isFrontLayer ? 4 : 2) + Math.random() * 2; // 減小粒子大小

                this.mainParticles.push({
                    x: this.x + offsetX + Math.cos(angle + Math.PI / 2) * layerOffset * this.direction,
                    y: this.y + offsetY + Math.sin(angle + Math.PI/2) * layerOffset,
                    prevX: this.x + offsetX,
                    prevY: this.y + offsetY,
                    vx: Math.cos(angle + Math.PI / 2) * (20 + Math.random() * 10) * this.direction, // 減小粒子發散速度
                    vy: Math.sin(angle + Math.PI / 2) * (20 + Math.random() * 10),
                    size: size * perspectiveScale,
                    lifetime: 0.2 + Math.random() * 0.1, // 延長一點壽命
                    age: 0,
                    color: `hsl(220, 80%, ${brightness + Math.random() * 10}%)`, // 改為更中性的淡白色/淡藍色
                    isFront: isFrontLayer
                });
            }
        }
        
        // 火花粒子（小顆粒） - 大幅減少數量以降低爆炸感
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 80;
            this.sparkParticles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2.5,
                lifetime: 0.2 + Math.random() * 0.15,
                age: 0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        // 創建衝擊波
        this.shockwave = {
            radius: 0,
            maxRadius: 160, // 稍微減小衝擊波範圍
            lifetime: 0.25,
            age: 0
        };
        
        // 創建閃光粒子
        const glintCount = 7;
        for (let i = 0; i < glintCount; i++) {
            const angle = this.startAngle + (this.endAngle - this.startAngle) * Math.random();
            const distance = this.width * 0.4 + (Math.random() - 0.5) * 20;
            this.glints.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                size: 12 + Math.random() * 15, // 減小閃光大小
                lifetime: 0.1 + Math.random() * 0.1,
                age: 0,
                rotation: Math.random() * Math.PI
            });
        }

        // 創建空間裂縫圖層
        const riftPointCount = 30;
        for (let i = 0; i < riftPointCount; i++) {
            const progress = i / (riftPointCount - 1);
            const angle = this.startAngle + (this.endAngle - this.startAngle) * progress;
            this.distortionLayer.push({
                angle: angle,
                // 裂縫寬度隨時間變化，初始為0
                width: 0
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        
        // 更新主要粒子
        this.mainParticles.forEach(particle => {
            particle.age += deltaTime;
            particle.prevX = particle.x;
            particle.prevY = particle.y;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.92;
            particle.vy *= 0.92;
        });
        
        // 更新火花粒子
        this.sparkParticles.forEach(particle => {
            particle.age += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.88;
            particle.vy *= 0.88;
            particle.rotation += particle.rotationSpeed * deltaTime;
        });
        
        // 更新閃光粒子
        this.glints.forEach(glint => {
            glint.age += deltaTime;
        });
        
        // 更新衝擊波
        if (this.shockwave && this.shockwave.age < this.shockwave.lifetime) {
            this.shockwave.age += deltaTime;
            this.shockwave.radius = (this.shockwave.age / this.shockwave.lifetime) * this.shockwave.maxRadius;
        }

        // 更新空間裂縫效果
        const riftProgress = Math.min(this.age / (this.lifetime * 0.5), 1); // 裂縫快速形成
        const riftWidth = Math.sin(riftProgress * Math.PI) * 25; // 調整裂縫寬度，使其更像一道利刃
        this.distortionLayer.forEach((point, i) => {
            const progressOnArc = i / (this.distortionLayer.length - 1);
            point.width = riftWidth * Math.sin(progressOnArc * Math.PI); // 弧線中間最寬
        });
        
        // 檢查是否過期
        if (this.age >= this.lifetime) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const progress = this.age / this.lifetime;
        const alpha = 1 - progress * progress; // 二次衰減，更平滑
        
        ctx.save();
        
        const centerX = this.x;
        const centerY = this.y;
        
        // 原本的多層斬擊軌跡已被移除
        
        // 1. 繪製空間裂縫 (最底層)
        ctx.globalCompositeOperation = 'lighter';
        const riftAlpha = alpha * 0.8; // 提高裂縫的整體不透明度，使其成為主體
        const riftGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width * 0.8);
        riftGradient.addColorStop(0, `rgba(255, 255, 255, ${riftAlpha * 0.8})`); // 核心更亮
        riftGradient.addColorStop(0.4, `rgba(220, 230, 255, ${riftAlpha * 0.5})`); // 中間改為更亮的淡藍色光暈
        riftGradient.addColorStop(1, `rgba(180, 200, 255, 0)`); // 外圍完全透明

        ctx.beginPath();
        this.distortionLayer.forEach((point, i) => {
            const x1 = centerX + Math.cos(point.angle) * (this.width * 0.5 - point.width / 2);
            const y1 = centerY + Math.sin(point.angle) * (this.height * 0.5 - point.width / 2);
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
        });
        // 繪製另一邊
        [...this.distortionLayer].reverse().forEach((point, i) => {
            const x2 = centerX + Math.cos(point.angle) * (this.width * 0.5 + point.width / 2);
            const y2 = centerY + Math.sin(point.angle) * (this.height * 0.5 + point.width / 2);
            ctx.lineTo(x2, y2);
        });
        ctx.closePath();
        ctx.fillStyle = riftGradient;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';


        // 繪製主要粒子（彩色拖尾）
        // 分兩次繪製，先畫後層，再畫前層
        for (let layer = 0; layer < 2; layer++) {
            this.mainParticles.forEach(particle => {
                if ((layer === 0 && !particle.isFront) || (layer === 1 && particle.isFront)) {
                    if (particle.age < particle.lifetime) {
                        const pProgress = particle.age / particle.lifetime;
                        const pAlpha = (1 - pProgress) * alpha * (particle.isFront ? 0.5 : 0.2); // 進一步降低粒子不透明度，使其更像殘影
                        const size = particle.size * (1 - pProgress * 0.5);
                        
                        ctx.strokeStyle = particle.color.replace(')', `, ${pAlpha})`).replace('hsl', 'hsla');
                        ctx.lineWidth = size;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(particle.prevX, particle.prevY);
                        ctx.lineTo(particle.x, particle.y);
                        ctx.stroke();
                    }
                }
            });
        }
        
        // 繪製火花粒子（星星形狀）
        this.sparkParticles.forEach(particle => {
            if (particle.age < particle.lifetime) {
                const pProgress = particle.age / particle.lifetime;
                const pAlpha = (1 - pProgress) * alpha;
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.globalAlpha = pAlpha;
                ctx.fillStyle = `rgba(255, 255, 200, ${pAlpha})`;
                ctx.beginPath();
                // 繪製星星
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
                    const x = Math.cos(angle) * particle.size;
                    const y = Math.sin(angle) * particle.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 繪製閃光粒子
        this.glints.forEach(glint => {
            if (glint.age < glint.lifetime) {
                const pProgress = glint.age / glint.lifetime;
                const pAlpha = Math.sin(pProgress * Math.PI) * alpha; // 淡入淡出
                
                ctx.save();
                ctx.translate(glint.x, glint.y);
                ctx.rotate(glint.rotation);
                
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glint.size);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${pAlpha})`);
                gradient.addColorStop(0.3, `rgba(230, 240, 255, ${pAlpha * 0.7})`); // 閃光顏色改為更冷的淡藍色
                gradient.addColorStop(1, `rgba(200, 230, 255, 0)`);
                
                ctx.fillStyle = gradient;
                
                // 繪製十字星光
                ctx.fillRect(-glint.size, -glint.size * 0.1, glint.size * 2, glint.size * 0.2);
                ctx.fillRect(-glint.size * 0.1, -glint.size, glint.size * 0.2, glint.size * 2);
                
                ctx.restore();
            }
        });
        
        // 繪製衝擊波
        if (this.shockwave && this.shockwave.age < this.shockwave.lifetime) {
            const shockProgress = this.shockwave.age / this.shockwave.lifetime;
            const shockAlpha = (1 - shockProgress) * alpha * 0.8;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${shockAlpha * 0.7})`; // 降低衝擊波不透明度
            ctx.lineWidth = 2 * (1 - shockProgress); // 讓線條更細
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.shockwave.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${shockAlpha * 0.3})`; // 第二層衝擊波更透明
            ctx.lineWidth = 4 * (1 - shockProgress); // 第二層線條也變細
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.shockwave.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

/**
 * 火球特效 (J鍵) - 帶有追尾、粒子軌跡和爆炸效果
 */
export class FireballEffect {
    constructor(x, y, direction, targetEnemies = [], player = null) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 = 右, -1 = 左
        this.targetEnemies = targetEnemies;
        this.target = null;
        this.active = true;
        this.player = player; // 玩家引用，用於爆炸擊退
        
        // 火球基本屬性
        this.radius = 12;
        this.speed = 600; // 像素/秒
        this.maxDistance = 400; // 最大飛行距離
        this.distanceTraveled = 0;
        
        // 追尾相關
        this.findTarget();
        
        // 粒子系統
        this.trailParticles = [];
        this.sparkParticles = [];
        this.explosionParticles = [];
        this.explosionShockwave = null; // 爆炸衝擊波
        this.exploded = false;
        this.explosionTime = 0; // 爆炸時間追蹤
        this.explosionLifetime = 0.8; // 爆炸效果持續時間（固定，類似斬擊）
        
        // 旋轉動畫
        this.rotation = 0;
        this.rotationSpeed = 8;
    }
    
    findTarget() {
        if (this.targetEnemies.length === 0) {
            // 沒有目標時直線飛行
            this.target = null;
            return;
        }
        
        // 找到最近的敵人
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.targetEnemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = enemy.x + enemy.width / 2 - this.startX;
            const dy = enemy.y + enemy.height / 2 - this.startY;
            
            // 只考慮前方目標
            if ((this.direction > 0 && dx > 0) || (this.direction < 0 && dx < 0)) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < nearestDistance && distance < this.maxDistance * 1.5) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            }
        });
        
        this.target = nearestEnemy;
    }
    
    update(deltaTime, platforms = []) {
        if (!this.active) return;
        
        // 如果已爆炸，只更新爆炸效果，不更新移動
        if (this.exploded) {
            this.explosionTime += deltaTime;
            
            // 更新爆炸粒子
            this.explosionParticles.forEach(particle => {
                particle.age += deltaTime;
                particle.x += particle.vx * deltaTime;
                particle.y += particle.vy * deltaTime;
                particle.vx *= 0.93; // 稍微減速
                particle.vy *= 0.93;
                particle.size *= 0.97; // 稍微縮小
            });
            this.explosionParticles = this.explosionParticles.filter(p => p.age < p.lifetime);
            
            // 更新衝擊波
            if (this.explosionShockwave) {
                this.explosionShockwave.age += deltaTime;
                const progress = this.explosionShockwave.age / this.explosionShockwave.lifetime;
                this.explosionShockwave.radius = this.explosionShockwave.maxRadius * progress;
                
                // 衝擊波結束後移除
                if (progress >= 1) {
                    this.explosionShockwave = null;
                }
            }
            
            // 爆炸結束後清理（使用固定生命週期，類似斬擊特效）
            if (this.explosionTime >= this.explosionLifetime) {
                this.active = false;
            }
            return; // 爆炸後不再更新移動邏輯
        }
        
        this.rotation += this.rotationSpeed * deltaTime;
        
        // 更新目標（敵人可能移動）
        if (this.target && !this.target.alive) {
            this.findTarget();
        }
        
        // 計算移動方向
        let targetX = this.x + this.direction * this.speed * deltaTime;
        let targetY = this.y;
        
        if (this.target && this.target.alive) {
            const targetCenterX = this.target.x + this.target.width / 2;
            const targetCenterY = this.target.y + this.target.height / 2;
            
            const dx = targetCenterX - this.x;
            const dy = targetCenterY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                // 追尾：混合直線和目標方向
                const targetDirX = dx / distance;
                const targetDirY = dy / distance;
                
                // 70% 追尾，30% 保持原方向
                const followStrength = 0.7;
                targetX = this.x + (this.direction * (1 - followStrength) + targetDirX * followStrength) * this.speed * deltaTime;
                targetY = this.y + targetDirY * this.speed * followStrength * deltaTime;
            } else {
                // 擊中目標，爆炸
                this.explode(targetCenterX, targetCenterY);
                return;
            }
        }
        
        // 檢查平台碰撞（在移動前就檢查，避免穿牆）
        const fireballBox = {
            x: targetX - this.radius,
            y: targetY - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
        
        let hitPlatform = false;
        platforms.forEach(platform => {
            if (Collision.checkAABB(fireballBox, platform)) {
                hitPlatform = true;
            }
        });
        
        if (hitPlatform) {
            // 碰撞到平台，在碰撞點爆炸
            // 計算實際碰撞位置（火球中心應該在平台邊緣）
            const fireballCenterX = targetX;
            const fireballCenterY = targetY;
            
            // 找到最近的碰撞邊緣
            let explodeX = fireballCenterX;
            let explodeY = fireballCenterY;
            
            // 簡單處理：如果火球會撞到牆，在當前位置前一點就爆炸
            if (this.direction > 0) {
                explodeX = this.x; // 使用當前x而不是targetX
            } else {
                explodeX = this.x;
            }
            
            this.explode(explodeX, explodeY);
            return;
        }
        
        // 移動火球
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const moveDistance = Math.sqrt(dx * dx + dy * dy);
        this.distanceTraveled += moveDistance;
        
        this.x = targetX;
        this.y = targetY;
        
        // 創建軌跡粒子
        this.createTrailParticle();
        
        // 更新軌跡粒子
        this.trailParticles.forEach(particle => {
            particle.age += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.85;
            particle.vy *= 0.85;
            particle.size *= 0.95;
        });
        this.trailParticles = this.trailParticles.filter(p => p.age < p.lifetime);
        
        // 創建火花
        if (Math.random() < 0.3) {
            this.createSparkParticle();
        }
        
        // 更新火花粒子
        this.sparkParticles.forEach(particle => {
            particle.age += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.rotation += particle.rotationSpeed * deltaTime;
        });
        this.sparkParticles = this.sparkParticles.filter(p => p.age < p.lifetime);
        
        // 檢查是否超過最大距離
        if (this.distanceTraveled >= this.maxDistance) {
            this.explode(this.x, this.y);
        }
    }
    
    createTrailParticle() {
        this.trailParticles.push({
            x: this.x + (Math.random() - 0.5) * 4,
            y: this.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: 3 + Math.random() * 3,
            lifetime: 0.15 + Math.random() * 0.1,
            age: 0,
            color: `hsl(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%)`
        });
    }
    
    createSparkParticle() {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 40;
        this.sparkParticles.push({
            x: this.x + (Math.random() - 0.5) * 8,
            y: this.y + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1.5 + Math.random() * 2,
            lifetime: 0.1 + Math.random() * 0.15,
            age: 0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 15
        });
    }
    
    explode(x, y) {
        if (this.exploded) return;
        
        this.exploded = true;
        this.explosionTime = 0;
        this.x = x;
        this.y = y;
        
        // 停止移動，清除軌跡粒子
        this.trailParticles = [];
        this.sparkParticles = [];
        
        // 創建大量爆炸粒子（增加視覺衝擊）
        const explosionCount = 80; // 增加粒子數量
        for (let i = 0; i < explosionCount; i++) {
            const angle = (Math.PI * 2 / explosionCount) * i + Math.random() * 0.8;
            const speed = 100 + Math.random() * 150; // 更快的速度
            
            this.explosionParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 8, // 更大的粒子
                lifetime: 0.4 + Math.random() * 0.4, // 更長的壽命
                age: 0,
                color: `hsl(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%)`,
                glow: Math.random() > 0.7 // 某些粒子有光暈效果
            });
        }
        
        // 創建爆炸衝擊波
        this.explosionShockwave = {
            radius: 0,
            maxRadius: 120,
            lifetime: 0.5,
            age: 0
        };
        
        // 檢查是否擊中敵人（擴大範圍）
        const explosionRadius = 80;
        this.targetEnemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = enemy.x + enemy.width / 2 - x;
            const dy = enemy.y + enemy.height / 2 - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosionRadius) {
                // 擊中敵人（傷害在遊戲中處理）
                if (enemy.takeDamage) {
                    enemy.takeDamage(1);
                }
            }
        });
        
        // 檢查是否擊中玩家（彈飛效果）
        if (this.player && this.player.alive) {
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            
            const dx = playerCenterX - x;
            const dy = playerCenterY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < explosionRadius) {
                // 計算擊退方向（從爆炸中心指向玩家）
                const knockbackForce = 12; // 擊退力度
                const knockbackDirX = dx / distance;
                const knockbackDirY = dy / distance;
                
                // 根據距離調整力度（越近擊退越強）
                const distanceFactor = 1 - (distance / explosionRadius) * 0.5;
                const finalForce = knockbackForce * distanceFactor;
                
                // 施加擊退
                this.player.vx += knockbackDirX * finalForce;
                this.player.vy += knockbackDirY * finalForce * 0.8; // 垂直方向稍弱
                
                // 造成傷害（如果玩家不是無敵狀態）
                if (!this.player.invincible) {
                    this.player.takeDamage(1, x);
                }
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        if (!this.exploded) {
            // 繪製火球
            const flameGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius * 2
            );
            flameGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            flameGradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.9)');
            flameGradient.addColorStop(0.6, 'rgba(255, 80, 0, 0.7)');
            flameGradient.addColorStop(1, 'rgba(200, 30, 0, 0)');
            
            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心火球
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.9)');
            coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0.7)');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            // 繪製火焰形狀
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = this.radius * (0.7 + Math.sin(this.rotation * 2 + i) * 0.3);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            // 繪製軌跡粒子
            this.trailParticles.forEach(particle => {
                if (particle.age < particle.lifetime) {
                    const pProgress = particle.age / particle.lifetime;
                    const pAlpha = 1 - pProgress;
                    
                    const trailGradient = ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    trailGradient.addColorStop(0, particle.color.replace(')', `, ${pAlpha})`).replace('hsl', 'hsla'));
                    trailGradient.addColorStop(1, particle.color.replace(')', ', 0)').replace('hsl', 'hsla'));
                    
                    ctx.fillStyle = trailGradient;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // 繪製火花
            this.sparkParticles.forEach(particle => {
                if (particle.age < particle.lifetime) {
                    const pProgress = particle.age / particle.lifetime;
                    const pAlpha = 1 - pProgress;
                    
                    ctx.save();
                    ctx.translate(particle.x, particle.y);
                    ctx.rotate(particle.rotation);
                    ctx.globalAlpha = pAlpha;
                    ctx.fillStyle = `rgba(255, 255, 150, ${pAlpha})`;
                    ctx.beginPath();
                    for (let i = 0; i < 4; i++) {
                        const angle = (i * Math.PI * 2 / 4) - Math.PI / 4;
                        const x = Math.cos(angle) * particle.size;
                        const y = Math.sin(angle) * particle.size;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // 繪製爆炸效果
        if (this.exploded) {
            const explosionProgress = Math.min(this.explosionTime / 0.6, 1);
            const explosionAlpha = 1 - explosionProgress * explosionProgress; // 二次衰減
            
            // 外層大範圍光暈
            const outerGlow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, 150
            );
            outerGlow.addColorStop(0, `rgba(255, 220, 150, ${explosionAlpha * 0.4})`);
            outerGlow.addColorStop(0.3, `rgba(255, 150, 50, ${explosionAlpha * 0.25})`);
            outerGlow.addColorStop(0.6, `rgba(255, 80, 0, ${explosionAlpha * 0.15})`);
            outerGlow.addColorStop(1, `rgba(200, 30, 0, 0)`);
            
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 150, 0, Math.PI * 2);
            ctx.fill();
            
            // 中層爆炸核心光暈（脈衝效果）
            const corePulse = 1 + Math.sin(this.explosionTime * 15) * 0.2;
            const coreSize = 100 * (1 - explosionProgress * 0.5) * corePulse;
            const coreGlow = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, coreSize
            );
            coreGlow.addColorStop(0, `rgba(255, 255, 200, ${explosionAlpha})`);
            coreGlow.addColorStop(0.2, `rgba(255, 200, 100, ${explosionAlpha * 0.9})`);
            coreGlow.addColorStop(0.5, `rgba(255, 120, 0, ${explosionAlpha * 0.7})`);
            coreGlow.addColorStop(1, `rgba(255, 50, 0, 0)`);
            
            ctx.fillStyle = coreGlow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 內層最亮核心
            const innerCoreSize = 40 * (1 - explosionProgress);
            const innerGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, innerCoreSize
            );
            innerGradient.addColorStop(0, `rgba(255, 255, 255, ${explosionAlpha})`);
            innerGradient.addColorStop(0.5, `rgba(255, 255, 150, ${explosionAlpha * 0.8})`);
            innerGradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
            
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, innerCoreSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 繪製衝擊波
            if (this.explosionShockwave) {
                const shockProgress = this.explosionShockwave.age / this.explosionShockwave.lifetime;
                const shockAlpha = (1 - shockProgress) * 0.6;
                const shockRadius = this.explosionShockwave.radius;
                
                ctx.strokeStyle = `rgba(255, 200, 100, ${shockAlpha})`;
                ctx.lineWidth = 8 - shockProgress * 6;
                ctx.beginPath();
                ctx.arc(this.x, this.y, shockRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 第二層衝擊波
                ctx.strokeStyle = `rgba(255, 150, 50, ${shockAlpha * 0.7})`;
                ctx.lineWidth = 4 - shockProgress * 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, shockRadius * 0.8, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 爆炸粒子（多層次繪製）
            this.explosionParticles.forEach(particle => {
                if (particle.age < particle.lifetime) {
                    const pProgress = particle.age / particle.lifetime;
                    const pAlpha = (1 - pProgress) * explosionAlpha;
                    
                    // 主粒子
                    const pGradient = ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    pGradient.addColorStop(0, particle.color.replace(')', `, ${pAlpha})`).replace('hsl', 'hsla'));
                    pGradient.addColorStop(0.7, particle.color.replace(')', `, ${pAlpha * 0.6})`).replace('hsl', 'hsla'));
                    pGradient.addColorStop(1, particle.color.replace(')', ', 0)').replace('hsl', 'hsla'));
                    
                    ctx.fillStyle = pGradient;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 帶光暈的粒子額外繪製外層光
                    if (particle.glow) {
                        const glowSize = particle.size * 1.5;
                        const glowGradient = ctx.createRadialGradient(
                            particle.x, particle.y, 0,
                            particle.x, particle.y, glowSize
                        );
                        glowGradient.addColorStop(0, particle.color.replace(')', `, ${pAlpha * 0.4})`).replace('hsl', 'hsla'));
                        glowGradient.addColorStop(1, particle.color.replace(')', ', 0)').replace('hsl', 'hsla'));
                        
                        ctx.fillStyle = glowGradient;
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }
        
        ctx.restore();
    }
    
    // 檢查是否擊中敵人（用於碰撞檢測）
    checkHit(enemy) {
        if (this.exploded) return false;
        
        const dx = enemy.x + enemy.width / 2 - this.x;
        const dy = enemy.y + enemy.height / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.radius + Math.max(enemy.width, enemy.height) / 2;
    }
}

/**
 * 射線特效 (哨兵敵人攻擊)
 */
export class RayEffect {
    constructor(startX, startY, endX, endY, player) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.player = player;

        this.lifetime = 0.4; // 特效持續時間
        this.age = 0;
        this.active = true;

        this.sparks = [];
        this.hitTarget = false;

        this.checkHit();
    }

    checkHit() {
        // 簡單的線段與玩家AABB碰撞檢測
        const playerBox = { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height };
        
        // 檢查玩家是否在射線的路徑上 (簡化版)
        // 這裡我們假設射線很寬，只要玩家在終點附近就算擊中
        const distance = Math.hypot(this.endX - (playerBox.x + playerBox.width / 2), this.endY - (playerBox.y + playerBox.height / 2));

        if (distance < playerBox.width) { // 如果射線終點離玩家很近
            this.hitTarget = true;
            if (this.player.takeDamage) {
                this.player.takeDamage(CONFIG.ENEMY.SENTRY.DAMAGE, this.startX);
            }
            // 在玩家身上產生火花
            this.createSparks(this.endX, this.endY);
        } else {
            // 如果沒打中玩家，就在射線終點產生火花
            this.createSparks(this.endX, this.endY);
        }
    }

    createSparks(x, y) {
        const sparkCount = 15;
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                lifetime: 0.2 + Math.random() * 0.2,
                age: 0
            });
        }
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }

        // 更新火花粒子
        this.sparks.forEach(spark => {
            spark.age += deltaTime;
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.vx *= 0.9;
            spark.vy *= 0.9;
        });
        this.sparks = this.sparks.filter(s => s.age < s.lifetime);
    }

    draw(ctx) {
        if (!this.active) return;

        const progress = this.age / this.lifetime;
        const alpha = Math.sin((1 - progress) * Math.PI); // 淡出效果

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // 繪製外層光暈
        ctx.strokeStyle = `rgba(255, 150, 150, ${alpha * 0.5})`;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();

        // 繪製核心光束
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();

        // 繪製火花
        this.sparks.forEach(spark => {
            const pAlpha = (1 - spark.age / spark.lifetime) * alpha;
            ctx.fillStyle = `rgba(255, 200, 200, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

/**
 * 敵人死亡消融特效
 */
export class DissolveEffect {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color || '#ffffff'; // 如果沒有提供顏色，預設為白色

        this.lifetime = 1.0; // 特效持續時間（秒）
        this.age = 0;
        this.active = true;

        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        const density = Math.sqrt(this.width * this.height) / 8;
        const numParticles = Math.floor(density * 20);

        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 30, // 輕微的水平擴散
                vy: -Math.random() * 60 - 20,   // 主要向上漂浮
                size: 1 + Math.random() * 2.5,
                lifetime: 0.6 + Math.random() * 0.4,
                age: 0,
                alpha: 0.7 + Math.random() * 0.3
            });
        }
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }

        this.particles.forEach(p => {
            p.age += deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy *= 0.98; // 向上速度逐漸減慢
            p.alpha = Math.max(0, p.alpha - deltaTime * 1.5); // 逐漸變透明
        });
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // 混合模式，讓粒子發光

        this.particles.forEach(p => {
            if (p.age < p.lifetime) {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }
}
