// ========================================
// 音訊管理器
// ========================================

export class AudioManager {
    constructor() {
        this.bgm = null;
        this.sfx = {};
        this.bgmVolume = 0.5; // BGM 音量 (0-1)
        this.sfxVolume = 0.7; // 音效音量 (0-1)
    }
    
    /**
     * 載入並播放 BGM
     * @param {string} path - 音訊檔案路徑
     * @param {boolean} loop - 是否循環播放
     */
    playBGM(path, loop = true) {
        // 如果已經有 BGM 在播放，先停止
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
        
        // 創建新的音訊物件
        this.bgm = new Audio(path);
        this.bgm.volume = this.bgmVolume;
        this.bgm.loop = loop;
        
        // 播放 BGM（可能需要使用者互動後才能自動播放）
        const playPromise = this.bgm.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // 播放成功
                    console.log('BGM 開始播放');
                })
                .catch(error => {
                    // 自動播放被阻止（通常需要使用者互動）
                    console.log('BGM 自動播放被阻止，等待使用者互動');
                    // 監聽第一次使用者互動後再播放
                    const playOnInteraction = () => {
                        this.bgm.play().catch(e => console.error('BGM 播放失敗:', e));
                        document.removeEventListener('click', playOnInteraction);
                        document.removeEventListener('keydown', playOnInteraction);
                    };
                    document.addEventListener('click', playOnInteraction);
                    document.addEventListener('keydown', playOnInteraction);
                });
        }
    }
    
    /**
     * 停止 BGM
     */
    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    }
    
    /**
     * 暫停 BGM
     */
    pauseBGM() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }
    
    /**
     * 恢復 BGM
     */
    resumeBGM() {
        if (this.bgm) {
            this.bgm.play().catch(e => console.error('BGM 恢復播放失敗:', e));
        }
    }
    
    /**
     * 設定 BGM 音量
     * @param {number} volume - 音量 (0-1)
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
    }
    
    /**
     * 播放音效
     * @param {string} path - 音訊檔案路徑
     * @param {number} volume - 音量 (0-1)，預設使用 sfxVolume
     */
    playSFX(path, volume = null) {
        const audio = new Audio(path);
        audio.volume = volume !== null ? volume : this.sfxVolume;
        audio.play().catch(e => console.error('音效播放失敗:', e));
    }
    
    /**
     * 設定音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * 播放短時間的音效片段（使用BGM的一小段）
     * @param {number} duration - 播放時長（毫秒）
     * @param {number} volume - 音量 (0-1)
     */
    playShortSFX(duration = 200, volume = 0.3) {
        const audio = new Audio('Assets/Audio/BGM/Gameplay/Sacred Hollow.mp3');
        audio.volume = volume;
        audio.play().catch(e => console.error('音效播放失敗:', e));
        
        setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
        }, duration);
    }
    
    /**
     * 播放按鈕點擊音效
     */
    playButtonClick() {
        this.playShortSFX(150, 0.4);
    }
    
    /**
     * 播放存檔音效
     */
    playSaveSound() {
        this.playShortSFX(300, 0.5);
    }
    
    /**
     * 播放門開啟音效
     */
    playDoorOpen() {
        this.playShortSFX(500, 0.6);
    }
    
    /**
     * 播放勝利音效
     */
    playVictory() {
        this.playShortSFX(1000, 0.7);
    }
}

