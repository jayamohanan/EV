// Letter Extraction Spelling Game
// Players spell target words by clicking option images (always first letter)

class GameName extends Phaser.Scene {
    constructor() {
        super('GameName');
    }

    init(data) {
        // Level progression
        this.currentLevelIndex = data.currentLevelIndex || 0;
        this.levelsData = null;
        
        // Game state
        this.currentLevel = null;
        this.clickedOptions = []; // Store clicked option data
        this.answerCells = [];
        this.optionImages = [];
        this.isLocked = false; // Lock after answer is complete
    }

    preload() {
        // Load levels data
        this.load.json('levels', 'levels.json');
    }

    create() {
        
    }

}

// Export for use in other scenes
export default GameName;

const config = {
    type: Phaser.WEBGL,
    parent: 'game-container',
    transparent: true,
    scene: [GameName, WinScene],

    roundPixels: true,
    antialias: true,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 720,
        height: 1280,
        resolution: window.devicePixelRatio || 1,
    },

    render: {
        antialiasGL: true,
        pixelArt: false,
    },
};

// Only create game instance if this is the main script
if (typeof window !== 'undefined' && !window.__LEVEL_VIEWER__) {
    const game = new Phaser.Game(config);
}
