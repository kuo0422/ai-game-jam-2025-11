// ========================================
// 平台渲染器 - 高品質地下城像素風格繪製系統
// ========================================

export class PlatformRenderer {
    /**
     * 繪製地板（地下城石磚地板）
     */
    static drawFloor(ctx, x, y, width, height) {
        const tileSize = 32; // 更大的磚塊
        
        // 繪製地板磚塊
        for (let tx = 0; tx < Math.ceil(width / tileSize); tx++) {
            for (let ty = 0; ty < Math.ceil(height / tileSize); ty++) {
                const tileX = x + tx * tileSize;
                const tileY = y + ty * tileSize;
                const actualWidth = Math.min(tileSize, x + width - tileX);
                const actualHeight = Math.min(tileSize, y + height - tileY);
                
                // 隨機變化，讓每塊磚看起來不同
                const variant = (tx * 3 + ty * 7) % 3;
                
                // 主體顏色（深灰藍色石頭）
                const baseColors = ['#3d4e5a', '#3a4a56', '#414f5c'];
                ctx.fillStyle = baseColors[variant];
                ctx.fillRect(tileX, tileY, actualWidth, actualHeight);
                
                // 內部陰影邊框（深色）
                ctx.fillStyle = '#252e36';
                ctx.fillRect(tileX, tileY, actualWidth, 2); // 頂部
                ctx.fillRect(tileX, tileY, 2, actualHeight); // 左側
                
                // 外部高光邊框（亮色）
                ctx.fillStyle = '#5a6d7a';
                ctx.fillRect(tileX, tileY + actualHeight - 2, actualWidth, 2); // 底部
                ctx.fillRect(tileX + actualWidth - 2, tileY, 2, actualHeight); // 右側
                
                // 中間高光
                ctx.fillStyle = '#4a5d6a';
                ctx.fillRect(tileX + 4, tileY + 4, actualWidth - 8, actualHeight - 8);
                
                // 添加細節紋理
                if (actualWidth >= 16 && actualHeight >= 16) {
                    // 中心裝飾
                    ctx.fillStyle = '#4f6270';
                    ctx.fillRect(tileX + actualWidth/2 - 2, tileY + actualHeight/2 - 2, 4, 4);
                    
                    // 四個角落的小點
                    ctx.fillStyle = '#2a353d';
                    ctx.fillRect(tileX + 6, tileY + 6, 2, 2);
                    ctx.fillRect(tileX + actualWidth - 8, tileY + 6, 2, 2);
                    ctx.fillRect(tileX + 6, tileY + actualHeight - 8, 2, 2);
                    ctx.fillRect(tileX + actualWidth - 8, tileY + actualHeight - 8, 2, 2);
                }
                
                // 磚塊接縫
                ctx.strokeStyle = '#1a2128';
                ctx.lineWidth = 2;
                ctx.strokeRect(tileX, tileY, actualWidth, actualHeight);
            }
        }
    }

    /**
     * 繪製平台（魔法浮空水晶平台）
     */
    static drawPlatform(ctx, x, y, width, height) {
        // 主體 - 深紫藍色水晶
        const gradient1 = ctx.createLinearGradient(x, y, x, y + height);
        gradient1.addColorStop(0, '#4a5f8f');
        gradient1.addColorStop(0.5, '#3d4e75');
        gradient1.addColorStop(1, '#2d3a5a');
        ctx.fillStyle = gradient1;
        ctx.fillRect(x, y, width, height);
        
        // 頂部發光邊緣（魔法光暈）
        const glowGradient = ctx.createLinearGradient(x, y, x, y + Math.min(height * 0.4, 8));
        glowGradient.addColorStop(0, '#7a9fd4');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(x + 2, y, width - 4, Math.min(height * 0.4, 8));
        
        // 底部陰影
        ctx.fillStyle = '#1a2438';
        ctx.fillRect(x + 2, y + height - Math.max(3, height * 0.2), width - 4, Math.max(3, height * 0.2));
        
        // 水晶切面效果（斜線裝飾）
        ctx.strokeStyle = '#5a7faf';
        ctx.lineWidth = 1;
        const segmentWidth = 20;
        for (let i = segmentWidth; i < width; i += segmentWidth) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + 2);
            ctx.lineTo(x + i, y + height - 2);
            ctx.stroke();
        }
        
        // 頂部高光線
        ctx.strokeStyle = '#9abfef';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 1);
        ctx.lineTo(x + width - 3, y + 1);
        ctx.stroke();
        
        // 能量粒子效果（小亮點）
        ctx.fillStyle = '#8fb4e8';
        const particleCount = Math.floor(width / 30);
        for (let i = 0; i < particleCount; i++) {
            const px = x + 10 + (i * 30);
            const py = y + height / 2;
            ctx.fillRect(px, py - 1, 2, 2);
            ctx.fillRect(px - 1, py, 1, 1);
            ctx.fillRect(px + 2, py, 1, 1);
        }
        
        // 邊框
        ctx.strokeStyle = '#1a2438';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    /**
     * 繪製牆壁（地下城古老石牆）
     */
    static drawWall(ctx, x, y, width, height) {
        const brickWidth = 32;
        const brickHeight = 16;
        
        for (let by = 0; by < Math.ceil(height / brickHeight); by++) {
            const offsetX = (by % 2) * (brickWidth / 2);
            
            for (let bx = 0; bx < Math.ceil(width / brickWidth) + 1; bx++) {
                const brickX = x + bx * brickWidth - offsetX;
                const brickY = y + by * brickHeight;
                
                // 跳過超出範圍的磚塊
                if (brickX + brickWidth < x || brickX > x + width) continue;
                if (brickY + brickHeight > y + height) continue;
                
                // 計算實際繪製尺寸
                const actualWidth = Math.min(brickWidth, x + width - brickX);
                const actualHeight = Math.min(brickHeight, y + height - brickY);
                
                // 隨機變化
                const variant = (bx * 5 + by * 3) % 4;
                
                // 磚塊主體（深褐灰色）
                const brickColors = ['#4a3f3a', '#453a36', '#4f4440', '#443935'];
                ctx.fillStyle = brickColors[variant];
                ctx.fillRect(brickX, brickY, actualWidth, actualHeight);
                
                // 磚塊立體感 - 左上高光
                ctx.fillStyle = '#6a5f5a';
                ctx.fillRect(brickX + 1, brickY + 1, actualWidth - 2, 2);
                ctx.fillRect(brickX + 1, brickY + 1, 2, actualHeight - 2);
                
                // 磚塊立體感 - 右下陰影
                ctx.fillStyle = '#2a221f';
                ctx.fillRect(brickX + 2, brickY + actualHeight - 3, actualWidth - 3, 2);
                ctx.fillRect(brickX + actualWidth - 3, brickY + 2, 2, actualHeight - 3);
                
                // 磚塊中心質感
                if (actualWidth >= 16 && actualHeight >= 10) {
                    ctx.fillStyle = '#524740';
                    ctx.fillRect(brickX + 4, brickY + 4, actualWidth - 8, actualHeight - 8);
                    
                    // 裂痕效果
                    if (variant === 0 || variant === 2) {
                        ctx.strokeStyle = '#3a2f2a';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(brickX + 8, brickY + 4);
                        ctx.lineTo(brickX + actualWidth - 8, brickY + actualHeight - 4);
                        ctx.stroke();
                    }
                }
                
                // 青苔效果（隨機）
                if (variant === 1) {
                    ctx.fillStyle = '#3a4a3f';
                    ctx.fillRect(brickX + 3, brickY + actualHeight - 5, 4, 2);
                }
                
                // 磚塊深色邊框
                ctx.strokeStyle = '#1a1410';
                ctx.lineWidth = 2;
                ctx.strokeRect(brickX, brickY, actualWidth, actualHeight);
            }
        }
    }

    /**
     * 繪製天花板（地下城鐘乳石洞頂）
     */
    static drawCeiling(ctx, x, y, width, height) {
        const tileSize = 32;
        
        // 繪製天花板磚塊
        for (let tx = 0; tx < Math.ceil(width / tileSize); tx++) {
            for (let ty = 0; ty < Math.ceil(height / tileSize); ty++) {
                const tileX = x + tx * tileSize;
                const tileY = y + ty * tileSize;
                const actualWidth = Math.min(tileSize, x + width - tileX);
                const actualHeight = Math.min(tileSize, y + height - tileY);
                
                const variant = (tx * 7 + ty * 5) % 3;
                
                // 主體顏色（深灰黑色岩石）
                const baseColors = ['#2a2d35', '#252831', '#2d3038'];
                ctx.fillStyle = baseColors[variant];
                ctx.fillRect(tileX, tileY, actualWidth, actualHeight);
                
                // 頂部最深處（完全黑暗）
                ctx.fillStyle = '#15171c';
                ctx.fillRect(tileX + 1, tileY + 1, actualWidth - 2, Math.min(4, actualHeight - 2));
                
                // 底部邊緣高光（微弱光線）
                ctx.fillStyle = '#3a3d45';
                ctx.fillRect(tileX + 2, tileY + actualHeight - 3, actualWidth - 4, 2);
                
                // 中間區域
                if (actualHeight > 8) {
                    ctx.fillStyle = '#32353d';
                    ctx.fillRect(tileX + 3, tileY + 5, actualWidth - 6, actualHeight - 8);
                }
                
                // 添加鐘乳石效果（隨機向下的尖刺）
                if (variant === 0 && actualHeight >= 16) {
                    ctx.fillStyle = '#3a3d45';
                    ctx.beginPath();
                    ctx.moveTo(tileX + actualWidth/2 - 2, tileY + actualHeight - 6);
                    ctx.lineTo(tileX + actualWidth/2, tileY + actualHeight);
                    ctx.lineTo(tileX + actualWidth/2 + 2, tileY + actualHeight - 6);
                    ctx.fill();
                }
                
                // 水滴效果（濕潤的洞頂）
                if (variant === 1) {
                    ctx.fillStyle = '#4a5d6a80';
                    ctx.fillRect(tileX + actualWidth/2, tileY + actualHeight - 4, 2, 2);
                }
                
                // 磚塊接縫
                ctx.strokeStyle = '#0f1115';
                ctx.lineWidth = 2;
                ctx.strokeRect(tileX, tileY, actualWidth, actualHeight);
                
                // 添加一些隨機的深色斑點（模擬粗糙表面）
                const spotCount = Math.floor(Math.random() * 3);
                for (let i = 0; i < spotCount; i++) {
                    if (actualWidth > 8 && actualHeight > 8) {
                        ctx.fillStyle = '#1a1d22';
                        const spotX = tileX + 3 + Math.floor(Math.random() * (actualWidth - 6));
                        const spotY = tileY + 3 + Math.floor(Math.random() * (actualHeight - 6));
                        ctx.fillRect(spotX, spotY, 2, 2);
                    }
                }
            }
        }
    }

    /**
     * 根據平台類型選擇對應的繪製方法
     */
    static draw(ctx, platform) {
        const type = platform.type || 'floor';
        
        switch (type) {
            case 'floor':
                this.drawFloor(ctx, platform.x, platform.y, platform.width, platform.height);
                break;
            case 'platform':
                this.drawPlatform(ctx, platform.x, platform.y, platform.width, platform.height);
                break;
            case 'wall':
                this.drawWall(ctx, platform.x, platform.y, platform.width, platform.height);
                break;
            case 'ceiling':
                this.drawCeiling(ctx, platform.x, platform.y, platform.width, platform.height);
                break;
            default:
                this.drawFloor(ctx, platform.x, platform.y, platform.width, platform.height);
        }
    }
}
