// ========================================
// Sprite 管理器 - 處理角色動畫和圖片載入
// ========================================

export class SpriteManager {
    constructor(metadataPath, basePath = '') {
        this.metadataPath = metadataPath;
        this.basePath = basePath;
        this.metadata = null;
        this.images = {};
        this.loaded = false;
        this.loadPromise = null;
    }
    
    /**
     * 載入 metadata.json 和所有圖片
     */
    async load() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        
        this.loadPromise = (async () => {
            try {
                // 載入 metadata.json
                const response = await fetch(this.metadataPath);
                this.metadata = await response.json();
                
                // 預載入所有圖片
                const imagePromises = [];
                
                // 載入 rotations
                if (this.metadata.frames.rotations) {
                    Object.keys(this.metadata.frames.rotations).forEach(direction => {
                        const path = this.basePath + this.metadata.frames.rotations[direction];
                        imagePromises.push(this.loadImage(path, `rotation_${direction}`));
                    });
                }
                
                // 載入 animations
                if (this.metadata.frames.animations) {
                    Object.keys(this.metadata.frames.animations).forEach(animationName => {
                        const animation = this.metadata.frames.animations[animationName];
                        Object.keys(animation).forEach(direction => {
                            const frames = animation[direction];
                            frames.forEach((framePath, index) => {
                                const path = this.basePath + framePath;
                                const key = `${animationName}_${direction}_${index}`;
                                imagePromises.push(this.loadImage(path, key));
                            });
                        });
                    });
                }
                
                await Promise.all(imagePromises);
                this.loaded = true;
                console.log('Sprite 載入完成');
            } catch (error) {
                console.error('Sprite 載入失敗:', error);
                throw error;
            }
        })();
        
        return this.loadPromise;
    }
    
    /**
     * 載入單張圖片
     */
    loadImage(path, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`圖片載入失敗: ${path}`);
                resolve(null); // 即使失敗也繼續
            };
            img.src = path;
        });
    }
    
    /**
     * 獲取圖片
     */
    getImage(key) {
        return this.images[key] || null;
    }
    
    /**
     * 獲取動畫幀列表
     */
    getAnimationFrames(animationName, direction) {
        const frames = [];
        const maxFrames = 20; // 最大幀數
        for (let i = 0; i < maxFrames; i++) {
            const key = `${animationName}_${direction}_${i}`;
            const img = this.images[key];
            if (img) {
                frames.push(img);
            } else {
                break;
            }
        }
        return frames;
    }
    
    /**
     * 獲取旋轉圖片（靜態）
     */
    getRotation(direction) {
        return this.images[`rotation_${direction}`] || null;
    }
    
    /**
     * 將遊戲方向轉換為 sprite 方向
     * 遊戲中: direction = 1 (右), -1 (左)
     * Sprite: east, west, south, north, south-east, south-west, north-east, north-west
     */
    getSpriteDirection(gameDirection, isMoving, vy = 0, animationName = '') {
        // 根據垂直速度判斷是否在跳躍/下降
        if (vy < -2) {
            // 向上跳躍 - 使用 east/west
            return gameDirection > 0 ? 'east' : 'west';
        } else if (vy > 2) {
            // 下降 - 使用 south-east/south-west（如果可用）或 east/west
            const hasSouthEast = gameDirection > 0 && this.getImage('jumping-1_south-east_0');
            const hasSouthWest = gameDirection < 0 && this.getImage('jumping-1_south-west_0');
            
            if (hasSouthEast) return 'south-east';
            if (hasSouthWest) return 'south-west';
            return gameDirection > 0 ? 'east' : 'west';
        } else {
            // 水平移動或靜止
            // 檢查當前動畫有哪些方向可用
            if (animationName) {
                const availableDirections = [];
                if (this.getImage(`${animationName}_east_0`)) availableDirections.push('east');
                if (this.getImage(`${animationName}_west_0`)) availableDirections.push('west');
                if (this.getImage(`${animationName}_south-east_0`)) availableDirections.push('south-east');
                if (this.getImage(`${animationName}_south-west_0`)) availableDirections.push('south-west');
                if (this.getImage(`${animationName}_south_0`)) availableDirections.push('south');
                
                // 優先使用 east/west，如果沒有則使用 south-east/south-west
                if (availableDirections.includes(gameDirection > 0 ? 'east' : 'west')) {
                    return gameDirection > 0 ? 'east' : 'west';
                } else if (availableDirections.includes(gameDirection > 0 ? 'south-east' : 'south-west')) {
                    return gameDirection > 0 ? 'south-east' : 'south-west';
                } else if (availableDirections.includes('south')) {
                    return 'south';
                }
            }
            
            // 默認使用 east/west
            return gameDirection > 0 ? 'east' : 'west';
        }
    }
}

