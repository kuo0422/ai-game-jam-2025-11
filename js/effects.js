// ========================================
// 特效系統
// ========================================

/**
 * 斬擊特效
 */
export class SlashEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 1 = 右, -1 = 左
        this.lifetime = 0.15; // 持續時間（秒）
        this.age = 0;
        this.active = true;
        
        // 斬擊弧線的參數
        this.width = 80;
        this.height = 60;
        this.startAngle = direction > 0 ? -Math.PI / 4 : 3 * Math.PI / 4;
        this.endAngle = direction > 0 ? Math.PI / 4 : 5 * Math.PI / 4;
        
        // 粒子效果
        this.particles = [];
        this.createParticles();
    }
    
    createParticles() {
        // 創建斬擊軌跡的粒子
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = this.startAngle + (this.endAngle - this.startAngle) * (i / particleCount);
            const distance = this.width * 0.5;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            this.particles.push({
                x: this.x + offsetX,
                y: this.y + offsetY,
                vx: Math.cos(angle + Math.PI / 2) * 30 * this.direction,
                vy: Math.sin(angle + Math.PI / 2) * 30,
                size: 3 + Math.random() * 3,
                lifetime: 0.1 + Math.random() * 0.1,
                age: 0
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        
        // 更新粒子
        this.particles.forEach(particle => {
            particle.age += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vx *= 0.9; // 摩擦力
            particle.vy *= 0.9;
        });
        
        // 檢查是否過期
        if (this.age >= this.lifetime) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const progress = this.age / this.lifetime;
        const alpha = 1 - progress;
        
        ctx.save();
        
        // 繪製主要斬擊軌跡
        const centerX = this.x;
        const centerY = this.y;
        
        // 斬擊主體 - 弧線
        const gradient = ctx.createLinearGradient(
            centerX - this.width / 2 * this.direction,
            centerY,
            centerX + this.width / 2 * this.direction,
            centerY
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.6})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // 繪製弧形軌跡
        ctx.beginPath();
        const startX = centerX + Math.cos(this.startAngle) * this.width * 0.3;
        const startY = centerY + Math.sin(this.startAngle) * this.height * 0.3;
        const endX = centerX + Math.cos(this.endAngle) * this.width * 0.3;
        const endY = centerY + Math.sin(this.endAngle) * this.height * 0.3;
        
        ctx.moveTo(startX, startY);
        
        // 使用二次貝塞爾曲線創建弧形
        const controlX = centerX + this.width * 0.5 * this.direction;
        const controlY = centerY;
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
        
        // 繪製核心亮點
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
        
        // 繪製粒子
        this.particles.forEach(particle => {
            if (particle.age < particle.lifetime) {
                const particleProgress = particle.age / particle.lifetime;
                const particleAlpha = (1 - particleProgress) * alpha;
                ctx.fillStyle = `rgba(150, 200, 255, ${particleAlpha})`;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * (1 - particleProgress), 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}

