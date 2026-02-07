// Vehicle Physics Scene for Hill Climb Game
class VehicleScene extends Phaser.Scene {
    constructor() {
        super('VehicleScene');
    }

    init() {
        this.vehicle = null;
        this.motorPower = 0;
        this.isForward = false;
        this.isReverse = false;
    }

    preload() {
        // Load vehicle assets
        this.load.image('chassis', 'graphics/chassis.png');
        this.load.image('tire', 'graphics/tire.png');
    }

    create() {
        // Add background
        this.add.rectangle(1200, 640, 2400, 1280, 0x87CEEB);
        
        // Create world bounds
        this.matter.world.setBounds(0, 0, 2400, 1280);
        this.matter.world.setGravity(0, CONFIG.PHYSICS.GRAVITY_Y);
        
        // Create terrain with slope
        this.createTerrain();
        
        // Create vehicle with spring suspension
        this.createVehicle();
        
        // Create UI controls (Forward/Reverse buttons)
        this.createControls();
        
        // Setup camera
        this.cameras.main.setBounds(0, 0, 2400, 1280);
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 0;
        
        // Add debug text
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '16px',
            color: '#000000',
            backgroundColor: '#ffffff88',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0).setDepth(1000);
    }

    createTerrain() {
        // Draw terrain with thick visible lines and filled rectangles
        const graphics = this.add.graphics();
        graphics.fillStyle(0x8B4513, 1);
        graphics.lineStyle(5, 0x654321, 1);
        
        // Flat ground - draw filled rectangle
        graphics.fillRect(0, 870, 1200, 60);
        graphics.strokeRect(0, 870, 1200, 60);
        this.matter.add.rectangle(600, 900, 1200, 60, {
            isStatic: true,
            friction: 1
        });
        
        // Slope - visual
        graphics.fillStyle(0x8B4513, 1);
        graphics.beginPath();
        graphics.moveTo(1200, 870);
        graphics.lineTo(1600, 720);
        graphics.lineTo(1600, 780);
        graphics.lineTo(1200, 930);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
        
        // Slope physics body
        this.matter.add.rectangle(1400, 795, 450, 60, {
            isStatic: true,
            friction: 1,
            angle: -0.35
        });
        
        // Top platform
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(1600, 720, 600, 60);
        graphics.strokeRect(1600, 720, 600, 60);
        this.matter.add.rectangle(1900, 750, 600, 60, {
            isStatic: true,
            friction: 1
        });
    }

    createVehicle() {
        const vc = CONFIG.VEHICLE;
        const x = vc.START_X;
        const y = vc.START_Y;
        
        // Create chassis
        this.vehicle = {
            chassis: this.matter.add.rectangle(x, y, vc.CHASSIS_WIDTH, vc.CHASSIS_HEIGHT, {
                density: 0.001,
                friction: vc.FRICTION
            }),
            
            // Create rear wheel
            rearWheel: this.matter.add.circle(
                x - vc.WHEEL_SPACING / 2,
                y + vc.WHEEL_OFFSET_Y,
                vc.WHEEL_RADIUS,
                {
                    density: 0.001,
                    friction: vc.WHEEL_FRICTION
                }
            ),
            
            // Create front wheel
            frontWheel: this.matter.add.circle(
                x + vc.WHEEL_SPACING / 2,
                y + vc.WHEEL_OFFSET_Y,
                vc.WHEEL_RADIUS,
                {
                    density: 0.001,
                    friction: vc.WHEEL_FRICTION
                }
            )
        };
        
        // Create spring constraints (suspension)
        this.vehicle.rearSpring = this.matter.add.constraint(
            this.vehicle.chassis,
            this.vehicle.rearWheel,
            vc.SPRING_LENGTH,
            vc.SPRING_STIFFNESS,
            {
                pointA: { x: -vc.WHEEL_SPACING / 2, y: vc.CHASSIS_HEIGHT / 2 },
                pointB: { x: 0, y: 0 },
                damping: vc.SPRING_DAMPING
            }
        );
        
        this.vehicle.frontSpring = this.matter.add.constraint(
            this.vehicle.chassis,
            this.vehicle.frontWheel,
            vc.SPRING_LENGTH,
            vc.SPRING_STIFFNESS,
            {
                pointA: { x: vc.WHEEL_SPACING / 2, y: vc.CHASSIS_HEIGHT / 2 },
                pointB: { x: 0, y: 0 },
                damping: vc.SPRING_DAMPING
            }
        );
        
        // Create sprites for visual representation
        this.chassisSprite = this.add.image(0, 0, 'chassis').setDepth(10);
        this.rearWheelSprite = this.add.image(0, 0, 'tire').setDepth(5);
        this.frontWheelSprite = this.add.image(0, 0, 'tire').setDepth(5);
        
        // Scale sprites to match physics bodies
        this.chassisSprite.setDisplaySize(vc.CHASSIS_WIDTH, vc.CHASSIS_HEIGHT);
        this.rearWheelSprite.setDisplaySize(vc.WHEEL_RADIUS * 2, vc.WHEEL_RADIUS * 2);
        this.frontWheelSprite.setDisplaySize(vc.WHEEL_RADIUS * 2, vc.WHEEL_RADIUS * 2);
    }

    createControls() {
        const buttonWidth = 150;
        const buttonHeight = 80;
        const bottomMargin = 50;
        const spacing = 20;
        
        // Forward button
        this.forwardButton = this.add.rectangle(
            180, 1280 - bottomMargin - buttonHeight / 2,
            buttonWidth, buttonHeight, 0x27ae60
        ).setScrollFactor(0).setInteractive().setDepth(999);
        
        this.forwardText = this.add.text(
            180, 1280 - bottomMargin - buttonHeight / 2, 'FORWARD',
            { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Reverse button
        this.reverseButton = this.add.rectangle(
            180 + buttonWidth + spacing, 1280 - bottomMargin - buttonHeight / 2,
            buttonWidth, buttonHeight, 0xe74c3c
        ).setScrollFactor(0).setInteractive().setDepth(999);
        
        this.reverseText = this.add.text(
            180 + buttonWidth + spacing, 1280 - bottomMargin - buttonHeight / 2, 'REVERSE',
            { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Button interactions
        this.forwardButton.on('pointerdown', () => {
            this.isForward = true;
            this.forwardButton.setFillStyle(0x229954);
        });
        
        this.forwardButton.on('pointerup', () => {
            this.isForward = false;
            this.forwardButton.setFillStyle(0x27ae60);
        });
        
        this.forwardButton.on('pointerout', () => {
            this.isForward = false;
            this.forwardButton.setFillStyle(0x27ae60);
        });
        
        this.reverseButton.on('pointerdown', () => {
            this.isReverse = true;
            this.reverseButton.setFillStyle(0xc0392b);
        });
        
        this.reverseButton.on('pointerup', () => {
            this.isReverse = false;
            this.reverseButton.setFillStyle(0xe74c3c);
        });
        
        this.reverseButton.on('pointerout', () => {
            this.isReverse = false;
            this.reverseButton.setFillStyle(0xe74c3c);
        });
    }

    update() {
        if (!this.vehicle) return;
        
        // Apply motor power
        this.applyMotorPower();
        
        // Update sprite positions
        this.updateVehicleGraphics();
        
        // Update debug info
        this.updateDebugText();
    }

    applyMotorPower() {
        const vc = CONFIG.VEHICLE;
        
        // Determine target power
        let targetPower = 0;
        if (this.isForward) {
            targetPower = vc.MAX_POWER;
        } else if (this.isReverse) {
            targetPower = -vc.MAX_POWER;
        }
        
        // Smooth power transition
        this.motorPower = Phaser.Math.Linear(this.motorPower, targetPower, 0.1);
        
        // Apply torque to wheels
        if (Math.abs(this.motorPower) > 0.001) {
            const torque = this.motorPower;
            
            this.matter.body.setAngularVelocity(
                this.vehicle.rearWheel,
                this.vehicle.rearWheel.angularVelocity + torque * vc.WHEEL_GRIP
            );
            
            this.matter.body.setAngularVelocity(
                this.vehicle.frontWheel,
                this.vehicle.frontWheel.angularVelocity + torque * vc.WHEEL_GRIP
            );
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
    }

    updateDebugText() {
        const chassis = this.vehicle.chassis;
        const speed = Math.sqrt(chassis.velocity.x ** 2 + chassis.velocity.y ** 2).toFixed(1);
        const angle = (chassis.angle * 180 / Math.PI).toFixed(1);
        
        this.debugText.setText([
            `Position: ${chassis.position.x.toFixed(0)}, ${chassis.position.y.toFixed(0)}`,
            `Speed: ${speed}`,
            `Angle: ${angle}°`,
            `Power: ${(this.motorPower * 100).toFixed(1)}%`
        ]);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: [VehicleScene],
    
    physics: {
        default: 'matter',
        matter: {
            debug: CONFIG.PHYSICS.DEBUG,
            gravity: { y: CONFIG.PHYSICS.GRAVITY_Y },
            enableSleeping: false
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
}
