// ========================================
// 環境氛圍系統 (粒子、霧氣、光暈)
// ========================================

/**
 * 創建一個粒子
 * @param {number} areaWidth - 粒子活動區域寬度
 * @param {number} areaHeight - 粒子活動區域高度
 * @returns {object} 粒子對象
 */
function createParticle(areaWidth, areaHeight) {
    const type = Math.random();
    if (type < 0.9) { // 90% 是普通灰塵
        return {
            x: Math.random() * areaWidth,
            y: Math.random() * areaHeight,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            radius: Math.random() * 1.5,
            alpha: 0.1 + Math.random() * 0.3,
            type: 'dust'
        };
    } else { // 40% 是發光粒子
        return {
            x: Math.random() * areaWidth,
            y: Math.random() * areaHeight,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            radius: Math.random() * 2 + 1,
            alpha: 0,
            maxAlpha: 0.2 + Math.random() * 0.3, // 降低最大亮度
            lifetime: 3 + Math.random() * 5,
            age: 0,
            type: 'glow'
        };
    }
}

export class Atmosphere {
    constructor(canvasWidth, canvasHeight, levelBounds) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.levelBounds = levelBounds;

        this.particles = [];
        this.particleCount = 150; // 粒子總數

        // 霧氣
        this.fogCanvases = [];
        this.fogLayerCount = 2;
        this.fogSpeed = [10, 15];
        this.fogOffset = [0, 0];

        this.init();
    }

    init() {
        // 初始化粒子
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(createParticle(this.levelBounds.width, this.levelBounds.height));
        }

        // 初始化霧氣 (預渲染)
        this.createFogLayers();
    }

    createFogLayers() {
        for (let i = 0; i < this.fogLayerCount; i++) {
            const fogCanvas = document.createElement('canvas');
            const fogCtx = fogCanvas.getContext('2d');
            const width = this.canvasWidth * 2; // 創建兩倍寬度以實現無縫滾動
            const height = 250;
            fogCanvas.width = width;
            fogCanvas.height = height;

            const gradient = fogCtx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, `rgba(150, 160, 180, 0)`);
            gradient.addColorStop(0.5, `rgba(120, 130, 150, ${0.1 + i * 0.05})`);
            gradient.addColorStop(1, `rgba(100, 110, 130, ${0.2 + i * 0.1})`);
            fogCtx.fillStyle = gradient;

            for (let j = 0; j < 50; j++) {
                fogCtx.beginPath();
                fogCtx.arc(
                    Math.random() * width,
                    Math.random() * height,
                    20 + Math.random() * 40,
                    0, Math.PI * 2
                );
                fogCtx.fill();
            }
            this.fogCanvases.push(fogCanvas);
        }
    }

    update(deltaTime) {
        // 更新粒子位置
        this.particles.forEach(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // 邊界循環
            if (p.x < 0) p.x = this.levelBounds.width;
            if (p.x > this.levelBounds.width) p.x = 0;
            if (p.y < 0) p.y = this.levelBounds.height;
            if (p.y > this.levelBounds.height) p.y = 0;

            // 更新發光粒子的生命週期
            if (p.type === 'glow') {
                p.age += deltaTime;
                // 使用 sin 函數實現平滑的淡入淡出
                p.alpha = Math.sin((p.age / p.lifetime) * Math.PI) * p.maxAlpha;

                if (p.age >= p.lifetime) {
                    // 重置粒子
                    Object.assign(p, createParticle(this.levelBounds.width, this.levelBounds.height));
                }
            }
        });

        // 更新霧氣滾動
        for (let i = 0; i < this.fogLayerCount; i++) {
            this.fogOffset[i] += this.fogSpeed[i] * deltaTime;
        }
    }

    draw(ctx, camera) {
        ctx.save();

        // === 繪製粒子 ===
        // 為了性能，只繪製在鏡頭內的粒子
        const viewRect = {
            x: camera.x,
            y: camera.y,
            width: this.canvasWidth,
            height: this.canvasHeight
        };

        // 繪製發光粒子 (模擬 Bloom)
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            if (p.type === 'glow' && p.x > viewRect.x && p.x < viewRect.x + viewRect.width && p.y > viewRect.y && p.y < viewRect.y + viewRect.height) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5); // 縮小光暈範圍
                gradient.addColorStop(0, `rgba(200, 220, 255, ${p.alpha * 0.8})`); // 讓中心更透明
                gradient.addColorStop(0.5, `rgba(150, 180, 255, ${p.alpha * 0.4})`);
                gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2); // 縮小繪製範圍
                ctx.fill();
            }
        });
        ctx.globalCompositeOperation = 'source-over';

        // 繪製灰塵粒子
        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        this.particles.forEach(p => {
            if (p.type === 'dust' && p.x > viewRect.x && p.x < viewRect.x + viewRect.width && p.y > viewRect.y && p.y < viewRect.y + viewRect.height) {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    }

    drawFog(ctx, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.fogLayerCount; i++) {
            const fogCanvas = this.fogCanvases[i];
            const yPos = this.canvasHeight - fogCanvas.height + 50;
            const offset = (this.fogOffset[i] + camera.x * (0.2 * (i + 1))) % this.canvasWidth;

            ctx.globalAlpha = 0.4 + i * 0.2;
            ctx.drawImage(fogCanvas, -offset, yPos);
            ctx.drawImage(fogCanvas, -offset + this.canvasWidth, yPos);
        }
        ctx.restore();
    }
}