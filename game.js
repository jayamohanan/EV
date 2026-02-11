    // Vehicle Physics Scene for Hill Climb Game
    class VehicleScene extends Phaser.Scene {
        constructor() {
            super('VehicleScene');
        }

        init() {
            this.vehicle = null;
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
            
            // Create UI controls (Gas/Brake buttons)
            this.createControls();
            
            // Setup keyboard controls
            this.cursors = this.input.keyboard.createCursorKeys();
            
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
            
            const tc = CONFIG.TERRAIN;  // Terrain config
            
            // Store ground bodies for reference
            this.groundBodies = [];
            
            // Flat ground - fill entire bottom area
            const groundHeight = tc.WORLD_HEIGHT - tc.FLAT_GROUND_Y;
            graphics.fillRect(tc.FLAT_GROUND_X_START, tc.FLAT_GROUND_Y, tc.FLAT_GROUND_WIDTH, groundHeight);
            graphics.strokeRect(tc.FLAT_GROUND_X_START, tc.FLAT_GROUND_Y, tc.FLAT_GROUND_WIDTH, groundHeight);
            // Physics body: thick collider covering the entire ground volume
            const groundCenterY = tc.FLAT_GROUND_Y + groundHeight / 2;
            this.groundBodies.push(
                this.matter.add.rectangle(
                    tc.FLAT_GROUND_X_START + tc.FLAT_GROUND_WIDTH / 2,
                    groundCenterY,
                    tc.FLAT_GROUND_WIDTH,
                    groundHeight,
                    {
                        isStatic: true,
                        friction: 0.8,  // Match car.ts terrain friction
                        restitution: 0,  // No bounce
                        render: {
                            visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                            lineColor: 0x00FF00,
                            lineWidth: 2
                        }
                    }
                )
            );
            
            // Slope - visual (fill to bottom)
            graphics.fillStyle(0x8B4513, 1);
            graphics.beginPath();
            graphics.moveTo(tc.SLOPE_START_X, tc.SLOPE_BOTTOM_Y);  // Start at flat ground top
            graphics.lineTo(tc.SLOPE_END_X, tc.SLOPE_TOP_Y);       // Top of slope
            graphics.lineTo(tc.SLOPE_END_X, tc.WORLD_HEIGHT);      // Bottom right
            graphics.lineTo(tc.SLOPE_START_X, tc.WORLD_HEIGHT);    // Bottom left
            graphics.closePath();
            graphics.fillPath();
            graphics.strokePath();
            
            // Slope physics body - thick collider
            const slopeHeight = 180;  // Thick collider
            const slopeCenterX = (tc.SLOPE_START_X + tc.SLOPE_END_X) / 2;
            this.groundBodies.push(
                this.matter.add.rectangle(
                    slopeCenterX,
                    tc.SLOPE_TOP_Y + slopeHeight / 2,
                    tc.SLOPE_WIDTH,
                    slopeHeight,
                    {
                        isStatic: true,
                        friction: 0.8,  // Match car.ts terrain friction
                        restitution: 0,  // No bounce
                        angle: tc.SLOPE_ANGLE,
                        render: {
                            visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                            lineColor: 0x00FF00,
                            lineWidth: 2
                        }
                    }
                )
            );
            
            // Top platform - fill to bottom
            graphics.fillStyle(0x8B4513, 1);
            const platformHeight = tc.WORLD_HEIGHT - tc.PLATFORM_Y;
            graphics.fillRect(tc.PLATFORM_X, tc.PLATFORM_Y, tc.PLATFORM_WIDTH, platformHeight);
            graphics.strokeRect(tc.PLATFORM_X, tc.PLATFORM_Y, tc.PLATFORM_WIDTH, platformHeight);
            const platformCenterY = tc.PLATFORM_Y + platformHeight / 2;
            const platformCenterX = tc.PLATFORM_X + tc.PLATFORM_WIDTH / 2;
            this.groundBodies.push(
                this.matter.add.rectangle(
                    platformCenterX,
                    platformCenterY,
                    tc.PLATFORM_WIDTH,
                    platformHeight,
                    {
                        isStatic: true,
                        friction: 0.8,  // Match car.ts terrain friction
                        restitution: 0,  // No bounce
                        render: {
                            visible: CONFIG.PHYSICS.DEBUG_GROUND_COLLIDER,
                            lineColor: 0x00FF00,
                            lineWidth: 2
                        }
                    }
                )
            );
        }

        createVehicle() {
            const vc = CONFIG.VEHICLE;
            const x = vc.START_X;
            const y = vc.SPAWN_HEIGHT;
            
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
            const buttonSize = 120;  // Square buttons
            const bottomMargin = 80;
            const sideMargin = 40;
            
            // Brake button (LEFT SIDE)
            this.brakeButton = this.add.rectangle(
                sideMargin + buttonSize / 2,
                1280 - bottomMargin - buttonSize / 2,
                buttonSize, buttonSize, 0xe74c3c
            ).setScrollFactor(0).setInteractive().setDepth(999);
            
            this.brakeText = this.add.text(
                sideMargin + buttonSize / 2,
                1280 - bottomMargin - buttonSize / 2,
                'BRAKE',
                { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
            
            // Gas button (RIGHT SIDE)
            this.gasButton = this.add.rectangle(
                720 - sideMargin - buttonSize / 2,
                1280 - bottomMargin - buttonSize / 2,
                buttonSize, buttonSize, 0x27ae60
            ).setScrollFactor(0).setInteractive().setDepth(999);
            
            this.gasText = this.add.text(
                720 - sideMargin - buttonSize / 2,
                1280 - bottomMargin - buttonSize / 2,
                'GAS',
                { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
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
        scene: [VehicleScene],
        
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
    }
