// Merge Scene - Bottom Section with 3x3 Grid
class MergeScene extends Phaser.Scene {
    constructor() {
        super('MergeScene');
    }

    init() {
        this.coins = 1000;
        this.grid = Array(3).fill(null).map(() => Array(3).fill(null)); // 3x3 grid
        this.gridCells = [];
        this.batteries = [];
        this.draggingBattery = null;
        this.hasStartedPlaying = false;
        this.spawnButtonLevel = 1;
        this.spawnCost = 10;
        this.highestBatteryLevel = 1;
        this.levelUpAvailable = false;
        this.levelUpTimer = null;
        
        // Grid layout constants
        this.GRID_START_Y = 100;
        this.CELL_SIZE = 100;
        this.CELL_GAP = 15;
        this.CELL_RADIUS = 15;
        this.GRID_COLS = 3;
        this.GRID_ROWS = 3;
    }

    preload() {
        this.load.image('battery', 'graphics/battery.png');
    }

    create() {
        // Get scene dimensions (portrait: bottom half)
        const sceneHeight = this.cameras.main.height;
        const sceneWidth = this.cameras.main.width;
        
        // Background for merge section
        this.add.rectangle(sceneWidth / 2, sceneHeight / 2, sceneWidth, sceneHeight, 0xEEF5F8);
        
        // Calculate grid center position
        const gridWidth = this.GRID_COLS * this.CELL_SIZE + (this.GRID_COLS - 1) * this.CELL_GAP;
        const gridHeight = this.GRID_ROWS * this.CELL_SIZE + (this.GRID_ROWS - 1) * this.CELL_GAP;
        this.gridStartX = (sceneWidth - gridWidth) / 2 + this.CELL_SIZE / 2;
        
        // Add title
        this.add.text(sceneWidth / 2, 30, 'BATTERY LAB', {
            fontSize: '28px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#2C5F8D',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Create coin display
        this.createCoinDisplay();
        
        // Create 3x3 grid
        this.createGrid();
        
        // Spawn initial battery in grid
        this.spawnBatteryInGrid(0, 0, 1);
        
        // Create spawn button and level-up button
        this.createButtons();
        
        // Show initial overlay
        this.createStartOverlay();
        
        // Setup input handlers
        this.input.on('dragstart', this.onDragStart, this);
        this.input.on('drag', this.onDrag, this);
        this.input.on('dragend', this.onDragEnd, this);
    }

    createCoinDisplay() {
        const sceneWidth = this.cameras.main.width;
        
        // Coin container
        const coinBg = this.add.rectangle(sceneWidth - 100, 75, 160, 50, 0xFFD700, 1);
        coinBg.setStrokeStyle(3, 0xFFA500);
        
        this.coinText = this.add.text(sceneWidth - 100, 75, `💰 ${this.coins}`, {
            fontSize: '24px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createGrid() {
        const sceneHeight = this.cameras.main.height;
        
        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.gridCells[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const x = this.gridStartX + col * (this.CELL_SIZE + this.CELL_GAP);
                const y = this.GRID_START_Y + row * (this.CELL_SIZE + this.CELL_GAP);
                
                // Empty cell background (rounded rectangle)
                const cell = this.add.graphics();
                cell.lineStyle(3, 0xBBDDEE, 1);
                cell.strokeRoundedRect(
                    x - this.CELL_SIZE / 2,
                    y - this.CELL_SIZE / 2,
                    this.CELL_SIZE,
                    this.CELL_SIZE,
                    this.CELL_RADIUS
                );
                
                // Filled cell background (hidden initially)
                const filledBg = this.add.graphics();
                filledBg.fillStyle(0xA8D8EA, 1);
                filledBg.fillRoundedRect(
                    x - this.CELL_SIZE / 2,
                    y - this.CELL_SIZE / 2,
                    this.CELL_SIZE,
                    this.CELL_SIZE,
                    this.CELL_RADIUS
                );
                filledBg.setVisible(false);
                
                this.gridCells[row][col] = {
                    x: x,
                    y: y,
                    row: row,
                    col: col,
                    isEmpty: true,
                    cell: cell,
                    filledBg: filledBg
                };
            }
        }
    }

    createButtons() {
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;
        const buttonY = sceneHeight - 80;
        
        // Spawn button
        const spawnButton = this.add.container(sceneWidth / 2, buttonY);
        
        const spawnBg = this.add.rectangle(0, 0, 200, 70, 0x4CAF50);
        spawnBg.setStrokeStyle(4, 0x2E7D32);
        spawnBg.setInteractive({ useHandCursor: true });
        
        // Battery icon on button
        const spawnIcon = this.add.image(-60, 0, 'battery').setScale(0.4);
        
        this.spawnButtonText = this.add.text(15, 0, `10 💰`, {
            fontSize: '24px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        spawnButton.add([spawnBg, spawnIcon, this.spawnButtonText]);
        
        spawnBg.on('pointerdown', () => {
            this.spawnBattery();
        });
        
        this.spawnButton = spawnButton;
        this.spawnButtonBg = spawnBg;
        
        // Level-up button (left of spawn button)
        const levelUpButton = this.add.container(sceneWidth / 2 - 220, buttonY);
        
        const levelUpBg = this.add.rectangle(0, 0, 180, 70, 0xFF9800);
        levelUpBg.setStrokeStyle(4, 0xE65100);
        levelUpBg.setInteractive({ useHandCursor: true });
        levelUpBg.setAlpha(0.5); // Initially disabled
        
        const levelUpText = this.add.text(0, 0, '📺 Level Up\nAll', {
            fontSize: '18px',
            fontFamily: CONFIG.FONT_FAMILY,
            align: 'center',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        levelUpButton.add([levelUpBg, levelUpText]);
        
        levelUpBg.on('pointerdown', () => {
            if (this.levelUpAvailable) {
                this.levelUpAll();
            }
        });
        
        this.levelUpButton = levelUpButton;
        this.levelUpButtonBg = levelUpBg;
        
        // Start level-up timer after player starts playing
        this.time.addEvent({
            delay: 1000,
            callback: this.checkLevelUpTimer,
            callbackScope: this,
            loop: true
        });
    }

    createStartOverlay() {
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;
        
        // Semi-transparent overlay
        this.startOverlay = this.add.rectangle(
            sceneWidth / 2,
            sceneHeight / 2,
            sceneWidth,
            sceneHeight,
            0x000000,
            0.6
        );
        
        // Highlight spawn button with pulsing effect
        const highlight = this.add.rectangle(
            this.spawnButton.x,
            this.spawnButton.y,
            220,
            90,
            0xFFFF00,
            0
        );
        highlight.setStrokeStyle(5, 0xFFFF00);
        
        this.tweens.add({
            targets: highlight,
            alpha: 0.8,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Arrow pointing to spawn button
        const arrowText = this.add.text(
            this.spawnButton.x,
            this.spawnButton.y - 100,
            '👇 Click to Spawn Battery',
            {
                fontSize: '28px',
                fontFamily: CONFIG.FONT_FAMILY,
                color: '#FFFFFF',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        this.startOverlay.setDepth(100);
        highlight.setDepth(101);
        arrowText.setDepth(102);
        
        this.startHighlight = highlight;
        this.startArrowText = arrowText;
    }

    removeStartOverlay() {
        if (this.startOverlay) {
            this.startOverlay.destroy();
            this.startHighlight.destroy();
            this.startArrowText.destroy();
            this.startOverlay = null;
            this.hasStartedPlaying = true;
            
            // Start level-up timer
            this.levelUpTimer = this.time.now;
        }
    }

    spawnBattery() {
        // Check if player can afford
        if (this.coins < this.spawnCost) {
            this.showMessage('Not enough coins!');
            return;
        }
        
        // Find first empty cell (top-left to bottom-right)
        let emptyCell = null;
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                if (this.grid[row][col] === null) {
                    emptyCell = { row, col };
                    break;
                }
            }
            if (emptyCell) break;
        }
        
        if (!emptyCell) {
            this.showMessage('Grid is full!');
            return;
        }
        
        // Deduct coins
        this.coins -= this.spawnCost;
        this.updateCoinDisplay();
        
        // Spawn battery
        this.spawnBatteryInGrid(emptyCell.row, emptyCell.col, this.spawnButtonLevel);
        
        // Remove overlay if first spawn
        if (this.startOverlay) {
            this.removeStartOverlay();
        }
        
        // Update spawn button state
        this.updateSpawnButton();
    }

    spawnBatteryInGrid(row, col, level) {
        const cellData = this.gridCells[row][col];
        
        // Create battery sprite
        const battery = this.add.image(cellData.x, cellData.y, 'battery');
        battery.setScale(0.6);
        battery.setInteractive({ draggable: true });
        
        // Add level badge (circle with number on bottom left)
        const badgeRadius = 18;
        const badgeX = cellData.x - this.CELL_SIZE / 2 + badgeRadius + 5;
        const badgeY = cellData.y + this.CELL_SIZE / 2 - badgeRadius - 5;
        
        const badge = this.add.graphics();
        badge.fillStyle(0xFF6B6B, 1);
        badge.fillCircle(badgeX, badgeY, badgeRadius);
        badge.lineStyle(2, 0xFFFFFF, 1);
        badge.strokeCircle(badgeX, badgeY, badgeRadius);
        
        const badgeText = this.add.text(badgeX, badgeY, level.toString(), {
            fontSize: '20px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add level text below battery
        const levelText = this.add.text(cellData.x, cellData.y + 35, `LVL ${level}`, {
            fontSize: '16px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const batteryData = {
            sprite: battery,
            badge: badge,
            badgeText: badgeText,
            levelText: levelText,
            level: level,
            row: row,
            col: col,
            originalX: cellData.x,
            originalY: cellData.y,
            inGrid: true,
            inChargingSlot: false
        };
        
        battery.setData('batteryData', batteryData);
        
        this.batteries.push(batteryData);
        this.grid[row][col] = batteryData;
        
        // Show filled background
        cellData.filledBg.setVisible(true);
        cellData.isEmpty = false;
        
        return batteryData;
    }

    onDragStart(pointer, gameObject) {
        if (!gameObject.getData('batteryData')) return;
        
        const batteryData = gameObject.getData('batteryData');
        this.draggingBattery = batteryData;
        
        // Bring to front
        batteryData.sprite.setDepth(1000);
        batteryData.badge.setDepth(1001);
        batteryData.badgeText.setDepth(1002);
        batteryData.levelText.setDepth(1003);
        
        // Remove start overlay on first drag
        if (this.startOverlay) {
            this.removeStartOverlay();
        }
    }

    onDrag(pointer, gameObject, dragX, dragY) {
        if (!gameObject.getData('batteryData')) return;
        
        const batteryData = gameObject.getData('batteryData');
        
        // Move battery and its UI elements
        batteryData.sprite.x = dragX;
        batteryData.sprite.y = dragY;
        
        const badgeRadius = 18;
        const offsetX = -this.CELL_SIZE / 2 + badgeRadius + 5;
        const offsetY = this.CELL_SIZE / 2 - badgeRadius - 5;
        
        batteryData.badge.clear();
        batteryData.badge.fillStyle(0xFF6B6B, 1);
        batteryData.badge.fillCircle(dragX + offsetX, dragY + offsetY, badgeRadius);
        batteryData.badge.lineStyle(2, 0xFFFFFF, 1);
        batteryData.badge.strokeCircle(dragX + offsetX, dragY + offsetY, badgeRadius);
        
        batteryData.badgeText.setPosition(dragX + offsetX, dragY + offsetY);
        batteryData.levelText.setPosition(dragX, dragY + 35);
        
        // Check if battery left original cell
        if (batteryData.inGrid) {
            const cellData = this.gridCells[batteryData.row][batteryData.col];
            const bounds = new Phaser.Geom.Rectangle(
                cellData.x - this.CELL_SIZE / 2,
                cellData.y - this.CELL_SIZE / 2,
                this.CELL_SIZE,
                this.CELL_SIZE
            );
            
            if (!Phaser.Geom.Rectangle.Contains(bounds, dragX, dragY)) {
                cellData.filledBg.setVisible(false);
            } else {
                cellData.filledBg.setVisible(true);
            }
        }
    }

    onDragEnd(pointer, gameObject) {
        if (!gameObject.getData('batteryData')) return;
        
        const batteryData = gameObject.getData('batteryData');
        const dropX = batteryData.sprite.x;
        const dropY = batteryData.sprite.y;
        
        // Find which cell was dropped on
        let targetCell = null;
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const cellData = this.gridCells[row][col];
                const bounds = new Phaser.Geom.Rectangle(
                    cellData.x - this.CELL_SIZE / 2,
                    cellData.y - this.CELL_SIZE / 2,
                    this.CELL_SIZE,
                    this.CELL_SIZE
                );
                
                if (Phaser.Geom.Rectangle.Contains(bounds, dropX, dropY)) {
                    targetCell = { row, col, cellData };
                    break;
                }
            }
            if (targetCell) break;
        }
        
        if (targetCell) {
            this.handleDrop(batteryData, targetCell);
        } else {
            // Return to original position
            this.returnBatteryToPosition(batteryData);
        }
        
        this.draggingBattery = null;
    }

    handleDrop(batteryData, targetCell) {
        const targetBattery = this.grid[targetCell.row][targetCell.col];
        
        if (targetBattery === null) {
            // Empty cell - move battery
            this.moveBattery(batteryData, targetCell.row, targetCell.col);
        } else if (targetBattery === batteryData) {
            // Same cell - return to position
            this.returnBatteryToPosition(batteryData);
        } else if (targetBattery.level === batteryData.level) {
            // Same level - merge
            this.mergeBatteries(batteryData, targetBattery, targetCell.row, targetCell.col);
        } else {
            // Different level - swap
            this.swapBatteries(batteryData, targetBattery);
        }
    }

    moveBattery(batteryData, newRow, newCol) {
        // Clear old position
        if (batteryData.inGrid) {
            this.grid[batteryData.row][batteryData.col] = null;
            this.gridCells[batteryData.row][batteryData.col].filledBg.setVisible(false);
            this.gridCells[batteryData.row][batteryData.col].isEmpty = true;
        }
        
        // Update position
        batteryData.row = newRow;
        batteryData.col = newCol;
        this.grid[newRow][newCol] = batteryData;
        
        const cellData = this.gridCells[newRow][newCol];
        batteryData.originalX = cellData.x;
        batteryData.originalY = cellData.y;
        
        // Animate to new position
        this.returnBatteryToPosition(batteryData);
        
        // Show filled background
        cellData.filledBg.setVisible(true);
        cellData.isEmpty = false;
    }

    mergeBatteries(draggedBattery, targetBattery, targetRow, targetCol) {
        // Remove dragged battery
        this.removeBattery(draggedBattery);
        
        // Remove target battery
        this.removeBattery(targetBattery);
        
        // Create new battery at target position with level + 1
        const newLevel = targetBattery.level + 1;
        this.spawnBatteryInGrid(targetRow, targetCol, newLevel);
        
        // Update highest level
        if (newLevel > this.highestBatteryLevel) {
            this.highestBatteryLevel = newLevel;
            this.updateSpawnButton();
        }
        
        // Merge animation effect
        this.createMergeEffect(this.gridCells[targetRow][targetCol].x, this.gridCells[targetRow][targetCol].y);
    }

    swapBatteries(battery1, battery2) {
        const row1 = battery1.row;
        const col1 = battery1.col;
        const row2 = battery2.row;
        const col2 = battery2.col;
        
        // Swap in grid
        this.grid[row1][col1] = battery2;
        this.grid[row2][col2] = battery1;
        
        // Update positions
        battery1.row = row2;
        battery1.col = col2;
        battery1.originalX = this.gridCells[row2][col2].x;
        battery1.originalY = this.gridCells[row2][col2].y;
        
        battery2.row = row1;
        battery2.col = col1;
        battery2.originalX = this.gridCells[row1][col1].x;
        battery2.originalY = this.gridCells[row1][col1].y;
        
        // Animate both
        this.returnBatteryToPosition(battery1);
        this.returnBatteryToPosition(battery2);
    }

    removeBattery(batteryData) {
        // Remove from grid
        if (batteryData.inGrid) {
            this.grid[batteryData.row][batteryData.col] = null;
            this.gridCells[batteryData.row][batteryData.col].filledBg.setVisible(false);
            this.gridCells[batteryData.row][batteryData.col].isEmpty = true;
        }
        
        // Remove from batteries array
        const index = this.batteries.indexOf(batteryData);
        if (index > -1) {
            this.batteries.splice(index, 1);
        }
        
        // Destroy sprites
        batteryData.sprite.destroy();
        batteryData.badge.destroy();
        batteryData.badgeText.destroy();
        batteryData.levelText.destroy();
    }

    returnBatteryToPosition(batteryData) {
        batteryData.sprite.setDepth(0);
        batteryData.badge.setDepth(1);
        batteryData.badgeText.setDepth(2);
        batteryData.levelText.setDepth(3);
        
        // Animate back to original position
        this.tweens.add({
            targets: batteryData.sprite,
            x: batteryData.originalX,
            y: batteryData.originalY,
            duration: 200,
            ease: 'Back.easeOut'
        });
        
        const badgeRadius = 18;
        const offsetX = -this.CELL_SIZE / 2 + badgeRadius + 5;
        const offsetY = this.CELL_SIZE / 2 - badgeRadius - 5;
        
        this.tweens.add({
            targets: batteryData.badgeText,
            x: batteryData.originalX + offsetX,
            y: batteryData.originalY + offsetY,
            duration: 200,
            ease: 'Back.easeOut',
            onUpdate: () => {
                batteryData.badge.clear();
                batteryData.badge.fillStyle(0xFF6B6B, 1);
                batteryData.badge.fillCircle(
                    batteryData.badgeText.x,
                    batteryData.badgeText.y,
                    badgeRadius
                );
                batteryData.badge.lineStyle(2, 0xFFFFFF, 1);
                batteryData.badge.strokeCircle(
                    batteryData.badgeText.x,
                    batteryData.badgeText.y,
                    badgeRadius
                );
            }
        });
        
        this.tweens.add({
            targets: batteryData.levelText,
            x: batteryData.originalX,
            y: batteryData.originalY + 35,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    createMergeEffect(x, y) {
        // Particle burst effect
        const circle = this.add.circle(x, y, 50, 0xFFFFFF, 0.8);
        this.tweens.add({
            targets: circle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }

    updateSpawnButton() {
        // Update spawn button based on highest level
        // Level 9 -> button level 2 (20 coins)
        // Level 10 -> button level 3 (30 coins)
        // Level 11 -> button level 4 (40 coins)
        // etc.
        
        if (this.highestBatteryLevel >= 9) {
            const newButtonLevel = this.highestBatteryLevel - 7; // 9->2, 10->3, 11->4
            if (newButtonLevel > this.spawnButtonLevel) {
                this.spawnButtonLevel = newButtonLevel;
                this.spawnCost = newButtonLevel * 10;
                this.spawnButtonText.setText(`${this.spawnCost} 💰`);
            }
        }
        
        // Disable button if not enough coins
        if (this.coins < this.spawnCost) {
            this.spawnButtonBg.setFillStyle(0x888888);
            this.spawnButtonBg.disableInteractive();
        } else {
            this.spawnButtonBg.setFillStyle(0x4CAF50);
            this.spawnButtonBg.setInteractive({ useHandCursor: true });
        }
    }

    checkLevelUpTimer() {
        if (!this.hasStartedPlaying) return;
        
        if (this.levelUpTimer && !this.levelUpAvailable) {
            const elapsed = this.time.now - this.levelUpTimer;
            if (elapsed >= 30000) { // 30 seconds
                this.levelUpAvailable = true;
                this.levelUpButtonBg.setAlpha(1);
            }
        }
    }

    levelUpAll() {
        // Simulate watching ad (would normally show ad here)
        this.showMessage('All batteries upgraded!');
        
        // Upgrade all batteries in grid
        this.batteries.forEach(battery => {
            if (battery.inGrid) {
                battery.level += 1;
                battery.badgeText.setText(battery.level.toString());
                battery.levelText.setText(`LVL ${battery.level}`);
                
                // Update highest level
                if (battery.level > this.highestBatteryLevel) {
                    this.highestBatteryLevel = battery.level;
                }
            }
        });
        
        // Update spawn button
        this.updateSpawnButton();
        
        // Reset timer
        this.levelUpAvailable = false;
        this.levelUpButtonBg.setAlpha(0.5);
        this.levelUpTimer = this.time.now;
        
        // TODO: Also upgrade batteries in charging slots (Section 2)
        // This will be handled when we integrate with VehicleScene
    }

    updateCoinDisplay() {
        this.coinText.setText(`💰 ${this.coins}`);
        this.updateSpawnButton();
    }

    showMessage(text) {
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;
        
        const messageBg = this.add.rectangle(sceneWidth / 2, sceneHeight / 2, 300, 100, 0x000000, 0.8);
        messageBg.setDepth(200);
        
        const messageText = this.add.text(sceneWidth / 2, sceneHeight / 2, text, {
            fontSize: '24px',
            fontFamily: CONFIG.FONT_FAMILY,
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);
        
        this.time.delayedCall(2000, () => {
            messageBg.destroy();
            messageText.destroy();
        });
    }

    // Method to get battery data for charging slots (will be called from VehicleScene)
    getBatteryForCharging(level) {
        // Find a battery of the requested level in the grid
        for (let battery of this.batteries) {
            if (battery.inGrid && battery.level === level) {
                return battery;
            }
        }
        return null;
    }

    update() {
        // Update loop if needed
    }
}
