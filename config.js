// Shared config for dimensions and layout
var CONFIG = {
    FONT_FAMILY: 'Arial',
    TEXT_COLOR: '#333333',
    
    RESET_PROGRESS: false,         // Set to true to clear saved progress on load
    
    // Vehicle Physics Config
    VEHICLE: {
        CHASSIS_WIDTH: 120,
        CHASSIS_HEIGHT: 60,
        WHEEL_RADIUS: 15,
        REAR_WHEEL_OFFSET_X: -38,  // Horizontal offset for rear wheel from chassis center
        REAR_WHEEL_OFFSET_Y: 25,   // Vertical offset for rear wheel from chassis center (positive = down)
        
        FRONT_WHEEL_OFFSET_X: 38,  // Horizontal offset for front wheel from chassis center
        FRONT_WHEEL_OFFSET_Y: 25,  // Vertical offset for front wheel from chassis center (positive = down)
        
        // Debug visualization
        DEBUG_WHEEL_OFFSET: false,  // Show yellow circles at wheel offset positions
        
        // Custom debug offset point (for checking relative positions)
        DEBUG_POINT_SHOW: false,    // Show/hide the custom debug point
        DEBUG_POINT_OFFSET_X: -38,   // X offset from chassis center
        DEBUG_POINT_OFFSET_Y: 25,   // Y offset from chassis center (positive = down)
        
        // Constraint properties (rigid axles with slight compliance)
        SPRING_STIFFNESS: 0.2,       // Constraint compliance (like car.ts example)
        SPRING_DAMPING: 0,           // No damping for rigid constraint
        SPRING_LENGTH: 0,            // Zero length = rigid constraint (not a spring)
        
        // Horizontal constraint properties (prevents pendulum swing)
        HORIZONTAL_CONSTRAINT_LENGTH: 2,      // Very small rest length for slight flex during acceleration
        HORIZONTAL_CONSTRAINT_STIFFNESS: 0.8, // High stiffness to keep chassis aligned, but allows tiny movement
        HORIZONTAL_CONSTRAINT_DAMPING: 0.5,   // High damping to prevent oscillation
        
        // Motor properties (scaled for 15px wheels vs 50px reference)
        // Wheel ratio: 50/15 = 3.33, so speeds are scaled up
        MAX_SPEED: 5,               // 0.75 * 3.33 for smaller wheels
        MAX_SPEED_BACKWARDS: 3,   // 75% of forward speed
        ACCELERATION: 0.06,          // (2.5 / 130) gradual ramp
        ACCELERATION_BACKWARDS: 0.04, // 75% of forward acceleration
        FRICTION: 0.9,
        WHEEL_FRICTION: 0.9,          // High friction for grip
        WHEEL_GRIP: 0.02,
        
        // Weight and physics (matching car.ts example with density)
        CHASSIS_DENSITY: 0.002,     // Chassis density (car.ts example)
        WHEEL_DENSITY: 0.001,       // Wheel density (car.ts example)
        
        // Starting position
        START_X: 200,
        SPAWN_HEIGHT: 100,     // Height at which vehicle spawns and falls
    },
    
    // Terrain Configuration
    TERRAIN: {
        // Flat ground section
        FLAT_GROUND_Y: 870,        // Top of flat ground
        FLAT_GROUND_WIDTH: 1200,   // Width of flat ground
        FLAT_GROUND_X_START: 0,    // Starting X position
        
        // Slope section
        SLOPE_START_X: 1200,       // Where slope begins
        SLOPE_END_X: 1600,         // Where slope ends
        SLOPE_TOP_Y: 720,          // Top of slope (right side)
        SLOPE_BOTTOM_Y: 870,       // Bottom of slope (left side)
        SLOPE_WIDTH: 450,          // Width of slope collider
        SLOPE_ANGLE: -0.35,        // Angle of slope in radians
        
        // Top platform section
        PLATFORM_X: 1600,          // Starting X of platform
        PLATFORM_Y: 720,           // Top of platform
        PLATFORM_WIDTH: 600,       // Width of platform
        
        // World bounds
        WORLD_HEIGHT: 1280,        // Bottom boundary
    },
    
    // Physics world settings
    PHYSICS: {
        GRAVITY_Y: 1,
        DEBUG: true,  // Show physics debug rendering
        
        // Physics engine timing (to prevent tunneling)
        FPS: 60,              // Physics steps per second
        DELTA: 1000/60,       // Time step in milliseconds (1000/FPS)
        ITERATIONS: 10,       // Constraint solver iterations (higher = more accurate but slower)
        
        // Individual collider visibility (only works when DEBUG is true)
        DEBUG_CHASSIS_COLLIDER: false,   // Show/hide chassis collider outline
        DEBUG_WHEEL_COLLIDER: false,      // Show/hide wheel collider outlines
        DEBUG_GROUND_COLLIDER: false,    // Show/hide ground collider outlines
    }
};
