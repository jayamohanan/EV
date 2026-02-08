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
        // Ground graphics set to depth 20 to be above chassis (10) and wheels (5)
        const graphics = this.add.graphics();
        graphics.setDepth(20);
        graphics.fillStyle(0x8B4513, 1);
        graphics.lineStyle(5, 0x654321, 1);
        
        // Define collision category for ground
        const groundCategory = 0x0001;
        
        // Store ground bodies for reference
        this.groundBodies = [];
        
        // Flat ground - draw filled rectangle
        graphics.fillRect(0, 870, 1200, 60);
        graphics.strokeRect(0, 870, 1200, 60);
        // Physics body: top at y=870, extends downward 40px
        // Matter.js needs volume for collision, can't use single line
        this.groundBodies.push(
            this.matter.add.rectangle(600, 890, 1200, 40, {
                isStatic: true,
                friction: 1,
                collisionFilter: {
                    category: groundCategory,
                    mask: 0xFFFFFFFF  // Collide with everything
                },
                render: {
                    visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                    lineColor: 0x00FF00,
                    lineWidth: 2
                }
            })
        );
        
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
        
        // Slope physics body - thick enough to prevent tunneling
        this.groundBodies.push(
            this.matter.add.rectangle(1400, 805, 450, 40, {
                isStatic: true,
                friction: 1,
                angle: -0.35,
                collisionFilter: {
                    category: groundCategory,
                    mask: 0xFFFFFFFF  // Collide with everything
                },
                render: {
                    visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                    lineColor: 0x00FF00,
                    lineWidth: 2
                }
            })
        );
        
        // Top platform - thick collider with top aligned to visual
        graphics.fillStyle(0x8B4513, 1);
        graphics.fillRect(1600, 720, 600, 60);
        graphics.strokeRect(1600, 720, 600, 60);
        this.groundBodies.push(
            this.matter.add.rectangle(1900, 740, 600, 40, {
                isStatic: true,
                friction: 1,
                collisionFilter: {
                    category: groundCategory,
                    mask: 0xFFFFFFFF  // Collide with everything
                },
                render: {
                    visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                    lineColor: 0x00FF00,
                    lineWidth: 2
                }
            })
        );
    }

    createVehicle() {
        const vc = CONFIG.VEHICLE;
        const x = vc.START_X;
        const y = vc.SPAWN_HEIGHT;
        
        // Define collision categories
        const chassisCategory = 0x0002;
        const wheelCategory = 0x0004;
        const groundCategory = 0x0001;
        
        // Create chassis (NO COLLISION with ground or wheels)
        // Chassis weight is 10x wheel weight (density 0.01 vs 0.001)
        this.vehicle = {
            chassis: this.matter.add.rectangle(x, y, vc.CHASSIS_WIDTH, vc.CHASSIS_HEIGHT, {
                density: 0.01 * vc.WEIGHT_MULTIPLIER,  // 10x wheel density, multiplied
                friction: vc.FRICTION,
                collisionFilter: {
                    category: chassisCategory,
                    mask: 0  // Don't collide with anything
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
                    density: 0.001 * vc.WEIGHT_MULTIPLIER,  // Base wheel density, multiplied
                    friction: vc.WHEEL_FRICTION,
                    collisionFilter: {
                        category: wheelCategory,
                        mask: groundCategory  // Collide with ground only
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
                    density: 0.001 * vc.WEIGHT_MULTIPLIER,  // Base wheel density, multiplied,
                    friction: vc.WHEEL_FRICTION,
                    collisionFilter: {
                        category: wheelCategory,
                        mask: groundCategory  // Collide with ground only
                    },
                    render: {
                        visible: CONFIG.PHYSICS.DEBUG_WHEEL_COLLIDER
                    }
                }
            )
        };
        
        // Create suspension - single spring per wheel
        // Spring connects from wheel center (pointB: 0,0) to offset point on chassis
        // When idle, these points should coincide
        
        // REAR WHEEL spring
        this.vehicle.rearSpring = this.matter.add.constraint(
            this.vehicle.chassis,
            this.vehicle.rearWheel,
            vc.SPRING_LENGTH,
            vc.SPRING_STIFFNESS,
            {
                pointA: { x: vc.REAR_WHEEL_OFFSET_X, y: vc.REAR_WHEEL_OFFSET_Y },  // Offset point on chassis
                pointB: { x: 0, y: 0 },  // Center of wheel
                damping: vc.SPRING_DAMPING,
                render: { visible: true }  // Make visible for debugging
            }
        );
        
        // FRONT WHEEL spring
        this.vehicle.frontSpring = this.matter.add.constraint(
            this.vehicle.chassis,
            this.vehicle.frontWheel,
            vc.SPRING_LENGTH,
            vc.SPRING_STIFFNESS,
            {
                pointA: { x: vc.FRONT_WHEEL_OFFSET_X, y: vc.FRONT_WHEEL_OFFSET_Y },  // Offset point on chassis
                pointB: { x: 0, y: 0 },  // Center of wheel
                damping: vc.SPRING_DAMPING,
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
