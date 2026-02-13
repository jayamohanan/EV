    // Vehicle Physics Scene for Hill Climb Game
    class VehicleScene extends Phaser.Scene {
        constructor() {
            super('VehicleScene');
        }

        init() {
            this.vehicle = null;
            this.isForward = false;
            this.isReverse = false;
            
            // Engine sound properties
            this.engineSound = null;
            this.isEngineRunning = false;
            this.currentPlaybackRate = CONFIG.AUDIO.ENGINE_IDLE_RATE;
            this.targetPlaybackRate = CONFIG.AUDIO.ENGINE_IDLE_RATE;
            this.currentVolume = CONFIG.AUDIO.ENGINE_IDLE_VOLUME;
            this.targetVolume = CONFIG.AUDIO.ENGINE_IDLE_VOLUME;
            
            // Charging system properties
            this.chargingSlots = [null, null, null]; // 3 slots for batteries
            this.chargingSlotsUI = [];
            this.carCharge = 0;
            this.maxCharge = 100;
            this.chargingInterval = null;
            this.firstBatteryTime = null;
            this.chargeCycleActive = false;
            this.lastChargeCycle = 0;
        }

        preload() {
            // Load vehicle assets
            this.load.image('chassis', 'graphics/chassis.png');
            this.load.image('tire', 'graphics/tire.png');
            this.load.image('battery', 'graphics/battery.png');
            this.load.image('ground', 'graphics/ground.png');
            
            // Load engine sound
            this.load.audio('car_idle', 'sounds/car_idle.wav');
        }

        create() {
            // Get scene dimensions
            const sceneWidth = this.cameras.main.width;
            const sceneHeight = this.cameras.main.height;
            
            // Add background
            this.add.rectangle(sceneWidth / 2, sceneHeight / 2, sceneWidth, sceneHeight, 0xD3E8EE);
            
            // Add title
            this.add.text(sceneWidth / 2, 70, 'VEHICLE CHARGING', {
                fontSize: '28px',
                fontFamily: CONFIG.FONT_FAMILY,
                color: '#2C5F8D',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(600);
            
            // Add separator line at bottom
            const separator = this.add.graphics();
            separator.lineStyle(4, 0x2C5F8D, 1);
            separator.lineBetween(0, sceneHeight - 2, sceneWidth, sceneHeight - 2);
            separator.setDepth(600);
            
            // Create world bounds
            this.matter.world.setBounds(0, 0, sceneWidth, sceneHeight);
            this.matter.world.setGravity(0, CONFIG.PHYSICS.GRAVITY_Y);
            
            // Create thin ground using ground tiles
            this.createThinGround();
            
            // Create 3 charging slots below ground
            this.createChargingSlots();
            
            // Create vehicle with spring suspension
            this.createVehicle();
            
            // Create charge bar UI
            this.createChargeBar();
            
            // Create UI controls (Gas/Brake buttons)
            this.createControls();
            
            // Setup keyboard controls
            this.cursors = this.input.keyboard.createCursorKeys();
            
            // Setup camera
            this.cameras.main.setBounds(0, 0, sceneWidth, sceneHeight);
            this.cameras.main.scrollX = 0;
            this.cameras.main.scrollY = 0;
            
            // Add debug text
            this.debugText = this.add.text(10, 10, '', {
                fontSize: '16px',
                color: '#000000',
                backgroundColor: '#ffffff88',
                padding: { x: 10, y: 10 }
            }).setScrollFactor(0).setDepth(1000);
            
            // Setup engine sound
            this.setupEngineSound();
            
            // Setup drag and drop for batteries from MergeScene
            this.setupBatteryDropZones();
            
            // Add test buttons for adding batteries (for testing)
            this.createTestButtons();
        }

        createThinGround() {
            const sceneWidth = this.cameras.main.width;
            const sceneHeight = this.cameras.main.height;
            
            // Thin ground positioned in upper section
            const groundY = sceneHeight * 0.35; // Position ground at 35% height
            const groundHeight = 20;
            const tileWidth = 64; // Width of ground tile
            
            // Create ground tiles horizontally
            const numTiles = Math.ceil(sceneWidth / tileWidth) + 1;
            for (let i = 0; i < numTiles; i++) {
                const tile = this.add.image(i * tileWidth, groundY, 'ground');
                tile.setOrigin(0, 0.5);
                tile.setDisplaySize(tileWidth, groundHeight);
                tile.setDepth(20);
            }
            
            // Create thin physics body for ground
            this.groundBody = this.matter.add.rectangle(
                sceneWidth / 2,
                groundY,
                sceneWidth,
                groundHeight,
                {
                    isStatic: true,
                    friction: 0.8,
                    restitution: 0,
                    render: {
                        visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                        lineColor: 0x00FF00,
                        lineWidth: 2
                    }
                }
            );
            
            this.groundY = groundY;
        }
        
        createChargingSlots() {
            const sceneWidth = this.cameras.main.width;
            const sceneHeight = this.cameras.main.height;
            
            // Position slots below where ground will be
            const slotY = sceneHeight * 0.35 + 120; // Below ground
            const slotSize = 120;
            const slotGap = 20;
            const totalWidth = 3 * slotSize + 2 * slotGap;
            const startX = (sceneWidth - totalWidth) / 2;
            
            for (let i = 0; i < 3; i++) {
                const slotX = startX + i * (slotSize + slotGap) + slotSize / 2;
                
                // Slot background (rounded rectangle)
                const slotBg = this.add.graphics();
                slotBg.lineStyle(4, 0x6B9BD1, 1);
                slotBg.strokeRoundedRect(
                    slotX - slotSize / 2,
                    slotY - slotSize / 2,
                    slotSize,
                    slotSize,
                    15
                );
                
                // Slot filled background (hidden initially)
                const slotFilledBg = this.add.graphics();
                slotFilledBg.fillStyle(0x8BC6EC, 1);
                slotFilledBg.fillRoundedRect(
                    slotX - slotSize / 2,
                    slotY - slotSize / 2,
                    slotSize,
                    slotSize,
                    15
                );
                slotFilledBg.setVisible(false);
                
                // Charge rate text (above slot, hidden initially)
                const chargeText = this.add.text(slotX, slotY - slotSize / 2 - 20, '', {
                    fontSize: '18px',
                    fontFamily: CONFIG.FONT_FAMILY,
                    color: '#2C5F8D',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setVisible(false);
                
                // Drop zone for batteries
                const dropZone = this.add.zone(slotX, slotY, slotSize, slotSize);
                dropZone.setRectangleDropZone(slotSize, slotSize);
                dropZone.setData('slotIndex', i);
                
                this.chargingSlotsUI.push({
                    x: slotX,
                    y: slotY,
                    slotBg: slotBg,
                    slotFilledBg: slotFilledBg,
                    chargeText: chargeText,
                    dropZone: dropZone,
                    batterySprite: null,
                    batteryBadge: null,
                    batteryBadgeText: null,
                    batteryLevelText: null
                });
            }
        }
        
        createChargeBar() {
            const sceneWidth = this.cameras.main.width;
            
            // Charge bar at top-center
            const barWidth = 250;
            const barHeight = 28;
            const barX = sceneWidth / 2;
            const barY = 35;
            
            // Background
            this.chargeBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
            this.chargeBarBg.setStrokeStyle(3, 0x000000);
            
            // Charge fill
            this.chargeBarFill = this.add.rectangle(
                barX - barWidth / 2,
                barY,
                0,
                barHeight - 6,
                0x4CAF50
            );
            this.chargeBarFill.setOrigin(0, 0.5);
            
            // Text
            this.chargeText = this.add.text(barX, barY, '⚡ 0/100', {
                fontSize: '18px',
                fontFamily: CONFIG.FONT_FAMILY,
                color: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.chargeBarBg.setDepth(500);
            this.chargeBarFill.setDepth(501);
            this.chargeText.setDepth(502);
        }
        
        setupBatteryDropZones() {
            // This will be used to handle drag/drop from MergeScene
            // For now, we'll use a simple click mechanism to add batteries for testing
            this.input.on('drop', (pointer, gameObject, dropZone) => {
                if (dropZone.getData('slotIndex') !== undefined) {
                    this.handleBatteryDrop(gameObject, dropZone.getData('slotIndex'));
                }
            });
        }
        
        // Method to add battery to charging slot (can be called from MergeScene)
        addBatteryToSlot(slotIndex, level) {
            if (slotIndex < 0 || slotIndex >= 3) return;
            if (this.chargingSlots[slotIndex] !== null) {
                // Slot already occupied
                return;
            }
            
            const slot = this.chargingSlotsUI[slotIndex];
            const chargePerMinute = level * 5;
            
            // Create battery sprite in slot
            const batterySprite = this.add.image(slot.x, slot.y, 'battery').setScale(0.6);
            
            // Add level badge
            const badgeRadius = 18;
            const badgeX = slot.x - 60 + badgeRadius + 5;
            const badgeY = slot.y + 60 - badgeRadius - 5;
            
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
            
            // Level text
            const levelText = this.add.text(slot.x, slot.y + 45, `LVL ${level}`, {
                fontSize: '16px',
                fontFamily: CONFIG.FONT_FAMILY,
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Show charge rate
            slot.chargeText.setText(`+${chargePerMinute}/min`);
            slot.chargeText.setVisible(true);
            slot.slotFilledBg.setVisible(true);
            
            // Store battery data
            slot.batterySprite = batterySprite;
            slot.batteryBadge = badge;
            slot.batteryBadgeText = badgeText;
            slot.batteryLevelText = levelText;
            
            this.chargingSlots[slotIndex] = {
                level: level,
                chargePerMinute: chargePerMinute
            };
            
            // Start charging if this is the first battery
            this.updateChargingSystem();
        }
        
        removeBatteryFromSlot(slotIndex) {
            if (slotIndex < 0 || slotIndex >= 3) return;
            if (this.chargingSlots[slotIndex] === null) return;
            
            const slot = this.chargingSlotsUI[slotIndex];
            
            // Remove UI elements
            if (slot.batterySprite) slot.batterySprite.destroy();
            if (slot.batteryBadge) slot.batteryBadge.destroy();
            if (slot.batteryBadgeText) slot.batteryBadgeText.destroy();
            if (slot.batteryLevelText) slot.batteryLevelText.destroy();
            
            slot.batterySprite = null;
            slot.batteryBadge = null;
            slot.batteryBadgeText = null;
            slot.batteryLevelText = null;
            slot.chargeText.setVisible(false);
            slot.slotFilledBg.setVisible(false);
            
            this.chargingSlots[slotIndex] = null;
            
            // Update charging system
            this.updateChargingSystem();
        }
        
        updateChargingSystem() {
            // Check if all slots are empty
            const allEmpty = this.chargingSlots.every(slot => slot === null);
            
            if (allEmpty) {
                // Stop charging
                if (this.chargingInterval) {
                    this.chargingInterval.remove();
                    this.chargingInterval = null;
                }
                this.firstBatteryTime = null;
                this.chargeCycleActive = false;
                return;
            }
            
            // Start charging if not already started
            if (!this.chargingInterval) {
                // Set first battery time
                this.firstBatteryTime = this.time.now;
                this.chargeCycleActive = false;
                
                // Start charging loop (check every 100ms)
                this.chargingInterval = this.time.addEvent({
                    delay: 100,
                    callback: this.performCharging,
                    callbackScope: this,
                    loop: true
                });
            }
        }
        
        performCharging() {
            if (!this.firstBatteryTime) return;
            
            // Calculate elapsed seconds since first battery
            const elapsed = (this.time.now - this.firstBatteryTime) / 1000;
            
            // Charge cycle is 1 second
            const currentCycle = Math.floor(elapsed);
            
            if (!this.chargeCycleActive) {
                // Wait for next full second
                if (elapsed >= 1) {
                    this.chargeCycleActive = true;
                    this.lastChargeCycle = currentCycle;
                    this.executeChargeEffect();
                }
            } else {
                // Check if next cycle started
                if (currentCycle > this.lastChargeCycle) {
                    this.lastChargeCycle = currentCycle;
                    this.executeChargeEffect();
                }
            }
        }
        
        executeChargeEffect() {
            // Calculate total charge per minute from all batteries
            let totalChargePerMin = 0;
            this.chargingSlots.forEach(slot => {
                if (slot !== null) {
                    totalChargePerMin += slot.chargePerMinute;
                }
            });
            
            // Convert to charge per second
            const chargePerSecond = totalChargePerMin / 60;
            
            // Add charge
            this.carCharge = Math.min(this.carCharge + chargePerSecond, this.maxCharge);
            
            // Update UI
            this.updateChargeBar();
            
            // Car scale animation (slight pulse)
            if (this.vehicle && this.chassisSprite) {
                this.tweens.add({
                    targets: [this.chassisSprite, this.rearWheelSprite, this.frontWheelSprite],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    yoyo: true,
                    ease: 'Sine.easeInOut'
                });
            }
        }
        
        updateChargeBar() {
            const barWidth = 250;
            const fillWidth = (this.carCharge / this.maxCharge) * (barWidth - 6);
            
            this.chargeBarFill.width = fillWidth;
            this.chargeText.setText(`⚡ ${Math.floor(this.carCharge)}/${this.maxCharge}`);
        }
        
        handleBatteryDrop(gameObject, slotIndex) {
            // Handle battery drop from MergeScene (to be implemented)
            console.log('Battery dropped on slot', slotIndex);
        }
        
        createTestButtons() {
            // Test buttons to add batteries (will be removed once drag-drop from MergeScene works)
            const sceneWidth = this.cameras.main.width;
            const btnY = 180;
            const btnGap = 110;
            
            ['Bat1', 'Bat2', 'Bat3'].forEach((label, i) => {
                const btn = this.add.rectangle(
                    (sceneWidth / 2) - btnGap + i * btnGap,
                    btnY,
                    85, 40,
                    0x2196F3
                ).setInteractive({ useHandCursor: true });
                
                const text = this.add.text(
                    (sceneWidth / 2) - btnGap + i * btnGap,
                    btnY,
                    label,
                    { fontSize: '16px', color: '#fff', fontStyle: 'bold' }
                ).setOrigin(0.5);
                
                btn.on('pointerdown', () => {
                    // Add battery level (i+1) to first empty slot
                    for (let slot = 0; slot < 3; slot++) {
                        if (this.chargingSlots[slot] === null) {
                            this.addBatteryToSlot(slot, i + 1);
                            break;
                        }
                    }
                });
            });
            
            // Remove battery button
            const removeBtn = this.add.rectangle(sceneWidth / 2, btnY + 50, 120, 40, 0xF44336)
                .setInteractive({ useHandCursor: true });
            
            const removeText = this.add.text(sceneWidth / 2, btnY + 50, 'Remove All', {
                fontSize: '16px', color: '#fff', fontStyle: 'bold'
            }).setOrigin(0.5);
            
            removeBtn.on('pointerdown', () => {
                for (let i = 0; i < 3; i++) {
                    this.removeBatteryFromSlot(i);
                }
            });
        }

        createVehicle() {
            const vc = CONFIG.VEHICLE;
            const sceneWidth = this.cameras.main.width;
            const sceneHeight = this.cameras.main.height;
            
            // Spawn vehicle on the ground
            const x = sceneWidth / 2;
            const y = this.groundY - 50; // Above ground
            
            // Create collision group for vehicle (like car.ts example)
            const vehicleGroup = this.matter.world.nextGroup(true);
            
            // Create chassis (NO COLLISION with ground or wheels)
            this.vehicle = {
                chassis: this.matter.add.rectangle(x, y, vc.CHASSIS_WIDTH, vc.CHASSIS_HEIGHT, {
                    density: vc.CHASSIS_DENSITY,  // Use density like car.ts example
                    friction: vc.FRICTION,
                    chamfer: { radius: vc.CHASSIS_HEIGHT * 0.5 },  // Rounded corners like car.ts
                    collisionFilter: {
                        group: vehicleGroup  // Use collision group
                    },
                    render: {
                        visible: CONFIG.PHYSICS.DEBUG_CHASSIS_COLLIDER
                    }
                }),
                
                // Create rear wheel (COLLIDES with ground only)
                rearWheel: this.matter.add.circle(
                    x + vc.REAR_WHEEL_OFFSET_X,
                    y + vc.REAR_WHEEL_OFFSET_Y,
                    vc.WHEEL_RADIUS,
                    {
                        density: vc.WHEEL_DENSITY,  // Use density like car.ts example
                        friction: vc.WHEEL_FRICTION,
                        restitution: 0,  // No bounce
                        collisionFilter: {
                            group: vehicleGroup  // Use collision group
                        },
                        render: {
                            visible: CONFIG.PHYSICS.DEBUG_WHEEL_COLLIDER
                        }
                    }
                ),
                
                // Create front wheel (COLLIDES with ground only)
                frontWheel: this.matter.add.circle(
                    x + vc.FRONT_WHEEL_OFFSET_X,
                    y + vc.FRONT_WHEEL_OFFSET_Y,
                    vc.WHEEL_RADIUS,
                    {
                        density: vc.WHEEL_DENSITY,  // Use density like car.ts example
                        friction: vc.WHEEL_FRICTION,
                        restitution: 0,  // No bounce
                        collisionFilter: {
                            group: vehicleGroup  // Use collision group
                        },
                        render: {
                            visible: CONFIG.PHYSICS.DEBUG_WHEEL_COLLIDER
                        }
                    }
                )
            };
            
            // Create rigid axle constraints (like car.ts example)
            // Rigid constraint (length=0, stiffness=0.2) connects wheel to chassis offset point
            // This prevents bouncing while allowing slight compliance
            
            // REAR WHEEL axle (rigid constraint)
            this.vehicle.rearSpring = this.matter.add.constraint(
                this.vehicle.chassis,
                this.vehicle.rearWheel,
                vc.SPRING_LENGTH,  // 0 = rigid constraint
                vc.SPRING_STIFFNESS,  // 0.2 = slight compliance
                {
                    pointA: { x: vc.REAR_WHEEL_OFFSET_X, y: vc.REAR_WHEEL_OFFSET_Y },  // Exact offset point on chassis
                    pointB: { x: 0, y: 0 },  // Center of wheel
                    render: { visible: true }  // Make visible for debugging
                }
            );
            
            // FRONT WHEEL axle (rigid constraint)
            this.vehicle.frontSpring = this.matter.add.constraint(
                this.vehicle.chassis,
                this.vehicle.frontWheel,
                vc.SPRING_LENGTH,  // 0 = rigid constraint
                vc.SPRING_STIFFNESS,  // 0.2 = slight compliance
                {
                    pointA: { x: vc.FRONT_WHEEL_OFFSET_X, y: vc.FRONT_WHEEL_OFFSET_Y },  // Exact offset point on chassis
                    pointB: { x: 0, y: 0 },  // Center of wheel
                    render: { visible: true }  // Make visible for debugging
                }
            );
            
            // Create sprites with proper depth layering:
            // Ground (created in terrain) = depth 20
            // Chassis = depth 10
            // Wheels = depth 5
            this.rearWheelSprite = this.add.image(0, 0, 'tire').setDepth(5);
            this.frontWheelSprite = this.add.image(0, 0, 'tire').setDepth(5);
            this.chassisSprite = this.add.image(0, 0, 'chassis').setDepth(10);
            
            // Scale sprites to match physics bodies
            this.chassisSprite.setDisplaySize(vc.CHASSIS_WIDTH, vc.CHASSIS_HEIGHT);
            this.rearWheelSprite.setDisplaySize(vc.WHEEL_RADIUS * 2, vc.WHEEL_RADIUS * 2);
            this.frontWheelSprite.setDisplaySize(vc.WHEEL_RADIUS * 2, vc.WHEEL_RADIUS * 2);
            
            // Create debug circles for wheel offset visualization
            this.debugCircles = this.add.graphics();
            this.debugCircles.setDepth(100);  // Draw on top of everything
        }

        createControls() {
            const sceneWidth = this.cameras.main.width;
            const sceneHeight = this.cameras.main.height;
            const buttonSize = 90;
            const bottomMargin = 50;
            const sideMargin = 30;
            
            // Brake button (LEFT SIDE)
            this.brakeButton = this.add.rectangle(
                sideMargin + buttonSize / 2,
                sceneHeight - bottomMargin - buttonSize / 2,
                buttonSize, buttonSize, 0xe74c3c
            ).setScrollFactor(0).setInteractive().setDepth(999);
            
            this.brakeText = this.add.text(
                sideMargin + buttonSize / 2,
                sceneHeight - bottomMargin - buttonSize / 2,
                'BRAKE',
                { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
            
            // Gas button (RIGHT SIDE)
            this.gasButton = this.add.rectangle(
                sceneWidth - sideMargin - buttonSize / 2,
                sceneHeight - bottomMargin - buttonSize / 2,
                buttonSize, buttonSize, 0x27ae60
            ).setScrollFactor(0).setInteractive().setDepth(999);
            
            this.gasText = this.add.text(
                sceneWidth - sideMargin - buttonSize / 2,
                sceneHeight - bottomMargin - buttonSize / 2,
                'GAS',
                { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
            
            // Gas button interactions
            this.gasButton.on('pointerdown', () => {
                this.isForward = true;
                this.gasButton.setFillStyle(0x229954);
            });
            
            this.gasButton.on('pointerup', () => {
                this.isForward = false;
                this.gasButton.setFillStyle(0x27ae60);
            });
            
            this.gasButton.on('pointerout', () => {
                this.isForward = false;
                this.gasButton.setFillStyle(0x27ae60);
            });
            
            // Brake button interactions
            this.brakeButton.on('pointerdown', () => {
                this.isReverse = true;
                this.brakeButton.setFillStyle(0xc0392b);
            });
            
            this.brakeButton.on('pointerup', () => {
                this.isReverse = false;
                this.brakeButton.setFillStyle(0xe74c3c);
            });
            
            this.brakeButton.on('pointerout', () => {
                this.isReverse = false;
                this.brakeButton.setFillStyle(0xe74c3c);
            });
        }

        setupEngineSound() {
            // Create looping engine sound
            this.engineSound = this.sound.add('car_idle', {
                loop: true,
                volume: CONFIG.AUDIO.ENGINE_IDLE_VOLUME,
                rate: CONFIG.AUDIO.ENGINE_IDLE_RATE
            });
        }

        startEngine() {
            if (!this.isEngineRunning && this.engineSound) {
                this.engineSound.play();
                this.isEngineRunning = true;
                this.currentPlaybackRate = CONFIG.AUDIO.ENGINE_IDLE_RATE;
                this.currentVolume = CONFIG.AUDIO.ENGINE_IDLE_VOLUME;
            }
        }

        stopEngine() {
            if (this.isEngineRunning && this.engineSound) {
                this.engineSound.stop();
                this.isEngineRunning = false;
            }
        }

        updateEngineSound() {
            if (!this.isEngineRunning || !this.engineSound) return;

            const vc = CONFIG.VEHICLE;
            const ac = CONFIG.AUDIO;
            
            // Check keyboard and button input
            const isAccelerating = this.isForward || this.cursors.right.isDown;
            const isBraking = this.isReverse || this.cursors.left.isDown;
            
            // Get current wheel speed (absolute value for pitch calculation)
            const wheelSpeed = Math.abs(this.vehicle.rearWheel.angularSpeed);
            const maxSpeed = vc.MAX_SPEED;
            
            // Calculate speed ratio (0 to 1)
            const speedRatio = Math.min(wheelSpeed / maxSpeed, 1.0);

            if (isAccelerating) {
                // Forward acceleration - increase pitch and volume
                this.targetPlaybackRate = Phaser.Math.Linear(
                    ac.ENGINE_IDLE_RATE,
                    ac.ENGINE_MAX_RATE,
                    speedRatio
                );
                this.targetVolume = ac.ENGINE_ACTIVE_VOLUME;
                
            } else if (isBraking) {
                // Reverse - lower pitch, moderate volume
                this.targetPlaybackRate = Phaser.Math.Linear(
                    ac.ENGINE_IDLE_RATE,
                    ac.ENGINE_REVERSE_RATE,
                    speedRatio
                );
                this.targetVolume = ac.ENGINE_ACTIVE_VOLUME * 0.8;
                
            } else {
                // Idle/coasting - smooth back to idle with speed-based pitch
                const coastingRate = Phaser.Math.Linear(
                    ac.ENGINE_IDLE_RATE,
                    ac.ENGINE_MAX_RATE * 0.6,
                    speedRatio * 0.5  // Reduced influence when coasting
                );
                this.targetPlaybackRate = coastingRate;
                this.targetVolume = ac.ENGINE_IDLE_VOLUME + (speedRatio * 0.2);
            }

            // Smooth interpolation (lerp) for natural sound transitions
            this.currentPlaybackRate = Phaser.Math.Linear(
                this.currentPlaybackRate,
                this.targetPlaybackRate,
                ac.RATE_LERP_SPEED
            );
            
            this.currentVolume = Phaser.Math.Linear(
                this.currentVolume,
                this.targetVolume,
                ac.VOLUME_LERP_SPEED
            );

            // Apply the smoothed values to the sound
            if (this.engineSound.isPlaying) {
                this.engineSound.setRate(this.currentPlaybackRate);
                this.engineSound.setVolume(this.currentVolume);
            }
        }

        update() {
            if (!this.vehicle) return;
            
            // Start engine on first input
            const hasInput = this.isForward || this.isReverse || 
                           this.cursors.right.isDown || this.cursors.left.isDown;
            if (!this.isEngineRunning && hasInput) {
                this.startEngine();
            }
            
            // Apply motor power
            this.applyMotorPower();
            
            // Update engine sound
            this.updateEngineSound();
            
            // Update sprite positions
            this.updateVehicleGraphics();
            
            // Update debug info
            this.updateDebugText();
        }

        applyMotorPower() {
            const vc = CONFIG.VEHICLE;
            
            // Check keyboard input (Right arrow = forward, Left arrow = brake/reverse)
            const keyboardForward = this.cursors.right.isDown;
            const keyboardReverse = this.cursors.left.isDown;
            
            // Combine button and keyboard inputs
            const isAccelerating = this.isForward || keyboardForward;
            const isBraking = this.isReverse || keyboardReverse;
            
            // Get current wheel angular velocity
            const rearWheel = this.vehicle.rearWheel;
            const frontWheel = this.vehicle.frontWheel;
            
            // Apply angular velocity directly (car.ts approach)
            if (isAccelerating) {
                // Forward acceleration with gradual ramp
                let newSpeed = rearWheel.angularSpeed <= 0 
                    ? vc.MAX_SPEED / 10 
                    : rearWheel.angularSpeed + vc.ACCELERATION;
                if (newSpeed > vc.MAX_SPEED) newSpeed = vc.MAX_SPEED;
                
                this.matter.body.setAngularVelocity(rearWheel, newSpeed);
                this.matter.body.setAngularVelocity(frontWheel, newSpeed);
            } else if (isBraking) {
                // Reverse with gradual ramp
                let newSpeed = rearWheel.angularSpeed >= 0
                    ? -vc.MAX_SPEED_BACKWARDS / 10
                    : rearWheel.angularSpeed - vc.ACCELERATION_BACKWARDS;
                if (newSpeed < -vc.MAX_SPEED_BACKWARDS) newSpeed = -vc.MAX_SPEED_BACKWARDS;
                
                this.matter.body.setAngularVelocity(rearWheel, newSpeed);
                this.matter.body.setAngularVelocity(frontWheel, newSpeed);
            }
        }

        updateVehicleGraphics() {
            // Update chassis sprite
            this.chassisSprite.setPosition(
                this.vehicle.chassis.position.x,
                this.vehicle.chassis.position.y
            );
            this.chassisSprite.setRotation(this.vehicle.chassis.angle);
            
            // Update rear wheel sprite
            this.rearWheelSprite.setPosition(
                this.vehicle.rearWheel.position.x,
                this.vehicle.rearWheel.position.y
            );
            this.rearWheelSprite.setRotation(this.vehicle.rearWheel.angle);
            
            // Update front wheel sprite
            this.frontWheelSprite.setPosition(
                this.vehicle.frontWheel.position.x,
                this.vehicle.frontWheel.position.y
            );
            this.frontWheelSprite.setRotation(this.vehicle.frontWheel.angle);
            
            // Draw debug circles for wheel offset positions
            this.drawDebugOffsets();
        }
        
        drawDebugOffsets() {
            const vc = CONFIG.VEHICLE;
            
            // Clear previous debug graphics
            this.debugCircles.clear();
            
            const chassis = this.vehicle.chassis;
            const cos = Math.cos(chassis.angle);
            const sin = Math.sin(chassis.angle);
            
            // Draw wheel offset circles (yellow)
            if (vc.DEBUG_WHEEL_OFFSET) {
                // Calculate world position of rear wheel offset point
                const rearOffsetWorldX = chassis.position.x + 
                    (vc.REAR_WHEEL_OFFSET_X * cos - vc.REAR_WHEEL_OFFSET_Y * sin);
                const rearOffsetWorldY = chassis.position.y + 
                    (vc.REAR_WHEEL_OFFSET_X * sin + vc.REAR_WHEEL_OFFSET_Y * cos);
                
                // Calculate world position of front wheel offset point
                const frontOffsetWorldX = chassis.position.x + 
                    (vc.FRONT_WHEEL_OFFSET_X * cos - vc.FRONT_WHEEL_OFFSET_Y * sin);
                const frontOffsetWorldY = chassis.position.y + 
                    (vc.FRONT_WHEEL_OFFSET_X * sin + vc.FRONT_WHEEL_OFFSET_Y * cos);
                
                this.debugCircles.fillStyle(0xFFFF00, 1);
                this.debugCircles.fillCircle(rearOffsetWorldX, rearOffsetWorldY, 4);
                this.debugCircles.fillCircle(frontOffsetWorldX, frontOffsetWorldY, 4);
            }
            
            // Draw custom debug point (yellow circle)
            if (vc.DEBUG_POINT_SHOW) {
                // Calculate world position of custom debug point
                const debugPointWorldX = chassis.position.x + 
                    (vc.DEBUG_POINT_OFFSET_X * cos - vc.DEBUG_POINT_OFFSET_Y * sin);
                const debugPointWorldY = chassis.position.y + 
                    (vc.DEBUG_POINT_OFFSET_X * sin + vc.DEBUG_POINT_OFFSET_Y * cos);
                
                this.debugCircles.fillStyle(0xFFFF00, 1);
                this.debugCircles.fillCircle(debugPointWorldX, debugPointWorldY, 4);
            }
        }

        updateDebugText() {
            const chassis = this.vehicle.chassis;
            const speed = Math.sqrt(chassis.velocity.x ** 2 + chassis.velocity.y ** 2).toFixed(1);
            const angle = (chassis.angle * 180 / Math.PI).toFixed(1);
            const wheelSpeed = this.vehicle.rearWheel.angularSpeed.toFixed(2);
            
            this.debugText.setText([
                `Position: ${chassis.position.x.toFixed(0)}, ${chassis.position.y.toFixed(0)}`,
                `Speed: ${speed}`,
                `Angle: ${angle}°`,
                `Wheel Speed: ${wheelSpeed}`
            ]);
        }
    }

    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        backgroundColor: '#87CEEB',
        scene: [VehicleScene, MergeScene],
        
        physics: {
            default: 'matter',
            matter: {
                debug: CONFIG.PHYSICS.DEBUG,
                gravity: { y: CONFIG.PHYSICS.GRAVITY_Y },
                enableSleeping: false,
                timing: {
                    timestamp: 0,
                    timeScale: 1
                },
                positionIterations: CONFIG.PHYSICS.ITERATIONS,
                velocityIterations: CONFIG.PHYSICS.ITERATIONS,
                constraintIterations: CONFIG.PHYSICS.ITERATIONS
            }
        },

        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 720,
            height: 1280,
            resolution: window.devicePixelRatio || 1,
        },

        render: {
            antialias: true,
            pixelArt: false,
        },
    };

    // Only create game instance if this is the main script
    if (typeof window !== 'undefined' && !window.__LEVEL_VIEWER__) {
        const game = new Phaser.Game(config);
        
        // Wait for game to be ready, then configure the split layout
        game.events.once('ready', () => {
            // Start both scenes
            const vehicleScene = game.scene.start('VehicleScene');
            const mergeScene = game.scene.start('MergeScene');
            
            // Set up scene cameras for split layout (portrait mode)
            // Top half: VehicleScene (640px height)
            // Bottom half: MergeScene (640px height)
            game.scene.getScene('VehicleScene').cameras.main.setViewport(0, 0, 720, 640);
            game.scene.getScene('MergeScene').cameras.main.setViewport(0, 640, 720, 640);
        });
    }
