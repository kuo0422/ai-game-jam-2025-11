// ========================================
// 特效系統
// ========================================
import { Collision } from './collision.js';

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
        this.lifetime = 0.25; // 持續時間（秒）
        this.age = 0;
        this.active = true;
        
        // 斬擊弧線的參數
        this.width = 100;
        this.height = 70;
        this.startAngle = direction > 0 ? -Math.PI / 3 : 2 * Math.PI / 3;
        this.endAngle = direction > 0 ? Math.PI / 3 : 4 * Math.PI / 3;
        
        // 多層粒子效果
        this.mainParticles = [];
        this.sparkParticles = [];
        this.energyParticles = [];
        this.createParticles();
    }
    
    createParticles() {
        // 主要斬擊軌跡粒子
        const mainCount = 15;
        for (let i = 0; i < mainCount; i++) {
            const angle = this.startAngle + (this.endAngle - this.startAngle) * (i / mainCount);
            const distance = this.width * 0.5;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            this.mainParticles.push({
                x: this.x + offsetX,
                y: this.y + offsetY,
                vx: Math.cos(angle + Math.PI / 2) * (40 + Math.random() * 20) * this.direction,
                vy: Math.sin(angle + Math.PI / 2) * (40 + Math.random() * 20),
                size: 4 + Math.random() * 4,
                lifetime: 0.15 + Math.random() * 0.1,
                age: 0,
                color: `hsl(${180 + Math.random() * 40}, 100%, ${60 + Math.random() * 20}%)`
            });
        }
        
        // 火花粒子（小顆粒）
        const sparkCount = 25;
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            this.sparkParticles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                lifetime: 0.2 + Math.random() * 0.15,
                age: 0,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        // 能量粒子（大顆，慢速）
        const energyCount = 8;
        for (let i = 0; i < energyCount; i++) {
            const angle = (Math.PI / 2) * this.direction + (Math.random() - 0.5) * Math.PI / 2;
            this.energyParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 30,
                vy: Math.sin(angle) * 30,
                size: 6 + Math.random() * 6,
                lifetime: 0.3 + Math.random() * 0.2,
                age: 0,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        
        // 更新主要粒子
        this.mainParticles.forEach(particle => {
            particle.age += deltaTime;
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
        
        // 更新能量粒子
        this.energyParticles.forEach(particle => {
            particle.age += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.94;
            particle.vy *= 0.94;
            particle.pulse += deltaTime * 8;
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
        
        // 外層光暈（大範圍）
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.width * 1.5
        );
        glowGradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.3})`);
        glowGradient.addColorStop(0.5, `rgba(150, 220, 255, ${alpha * 0.15})`);
        glowGradient.addColorStop(1, `rgba(200, 240, 255, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.fillRect(centerX - this.width * 1.5, centerY - this.width * 1.5, 
                     this.width * 3, this.width * 3);
        
        // 多層斬擊軌跡
        for (let layer = 0; layer < 3; layer++) {
            const layerProgress = layer / 2;
            const layerAlpha = alpha * (1 - layerProgress * 0.5);
            const layerWidth = 8 - layer * 2;
            const layerOffset = layer * 3;
            
            // 漸層顏色
            const gradient = ctx.createLinearGradient(
                centerX - this.width / 2 * this.direction,
                centerY,
                centerX + this.width / 2 * this.direction,
                centerY
            );
            
            if (layer === 0) {
                // 最外層 - 白色光
                gradient.addColorStop(0, `rgba(255, 255, 255, ${layerAlpha * 0.9})`);
                gradient.addColorStop(0.3, `rgba(150, 220, 255, ${layerAlpha})`);
                gradient.addColorStop(0.7, `rgba(100, 180, 255, ${layerAlpha})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${layerAlpha * 0.8})`);
            } else if (layer === 1) {
                // 中層 - 藍色
                gradient.addColorStop(0, `rgba(100, 200, 255, ${layerAlpha * 0.7})`);
                gradient.addColorStop(0.5, `rgba(50, 150, 255, ${layerAlpha})`);
                gradient.addColorStop(1, `rgba(100, 200, 255, ${layerAlpha * 0.7})`);
            } else {
                // 內層 - 深藍
                gradient.addColorStop(0, `rgba(50, 100, 200, ${layerAlpha * 0.6})`);
                gradient.addColorStop(0.5, `rgba(30, 80, 180, ${layerAlpha})`);
                gradient.addColorStop(1, `rgba(50, 100, 200, ${layerAlpha * 0.6})`);
            }
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = layerWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            const startAngle = this.startAngle + layerOffset * 0.01;
            const endAngle = this.endAngle - layerOffset * 0.01;
            const startX = centerX + Math.cos(startAngle) * (this.width * 0.4);
            const startY = centerY + Math.sin(startAngle) * (this.height * 0.4);
            const endX = centerX + Math.cos(endAngle) * (this.width * 0.4);
            const endY = centerY + Math.sin(endAngle) * (this.height * 0.4);
            
            ctx.moveTo(startX, startY);
            const controlX = centerX + (this.width * 0.6 + layerOffset) * this.direction;
            const controlY = centerY;
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            ctx.stroke();
        }
        
        // 核心能量球（脈衝效果）
        const coreSize = (12 + Math.sin(this.age * 20) * 3) * (1 - progress);
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.5, `rgba(150, 220, 255, ${alpha * 0.8})`);
        coreGradient.addColorStop(1, `rgba(100, 180, 255, 0)`);
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製主要粒子（彩色拖尾）
        this.mainParticles.forEach(particle => {
            if (particle.age < particle.lifetime) {
                const pProgress = particle.age / particle.lifetime;
                const pAlpha = (1 - pProgress) * alpha;
                ctx.fillStyle = particle.color.replace(')', `, ${pAlpha})`).replace('hsl', 'hsla');
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * (1 - pProgress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
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
        
        // 繪製能量粒子（脈衝球）
        this.energyParticles.forEach(particle => {
            if (particle.age < particle.lifetime) {
                const pProgress = particle.age / particle.lifetime;
                const pAlpha = (1 - pProgress) * alpha;
                const pulseSize = particle.size * (1 + Math.sin(particle.pulse) * 0.3);
                
                const pGradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, pulseSize
                );
                pGradient.addColorStop(0, `rgba(200, 240, 255, ${pAlpha})`);
                pGradient.addColorStop(0.7, `rgba(100, 180, 255, ${pAlpha * 0.6})`);
                pGradient.addColorStop(1, `rgba(50, 120, 200, 0)`);
                
                ctx.fillStyle = pGradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}

/**
 * 火球特效 (J鍵) - 帶有追尾、粒子軌跡和爆炸效果
 */
export class FireballEffect {
    constructor(x, y, direction, targetEnemies = []) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 = 右, -1 = 左
        this.targetEnemies = targetEnemies;
        this.target = null;
        this.active = true;
        
        // 火球基本屬性
        this.radius = 12;
        this.speed = 300; // 像素/秒
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
        
        // 檢查平台碰撞
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
            // 碰撞到平台，爆炸
            this.explode(targetX, targetY);
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

