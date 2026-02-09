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
        
        // Spring/Suspension properties
        SPRING_STIFFNESS: 0.1,       // Much higher stiffness prevents compression/sinking
        SPRING_DAMPING: 0.1,         // Damping to reduce bounce
        SPRING_LENGTH: 5,           // Matches wheel offset Y exactly (no compression at rest)
        
        // Motor properties
        MAX_POWER: 0.3,       // Maximum torque/power (increased from 0.15)
        ACCELERATION: 0.05,   // How fast the motor speeds up (like Hill Climb Racing)
        DECELERATION: 0.08,   // How fast the motor slows down
        FRICTION: 0.01,
        WHEEL_FRICTION: 0.1,
        WHEEL_GRIP: 0.02,     // Increased from 0.003 for better responsiveness
        
        // Weight and physics (using direct mass, independent of sprite size)
        CHASSIS_MASS: 5,     // Direct mass value for chassis
        WHEEL_MASS: 2,        // Direct mass value for each wheel
        
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
