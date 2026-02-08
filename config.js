// Shared config for dimensions and layout
var CONFIG = {
    FONT_FAMILY: 'Arial',
    TEXT_COLOR: '#333333',
    
    RESET_PROGRESS: false,         // Set to true to clear saved progress on load
    
    // Vehicle Physics Config
    VEHICLE: {
        CHASSIS_WIDTH: 120,
        CHASSIS_HEIGHT: 60,
        WHEEL_RADIUS: 20,
        REAR_WHEEL_OFFSET_X: -38,  // Horizontal offset for rear wheel from chassis center
        REAR_WHEEL_OFFSET_Y: 25,   // Vertical offset for rear wheel from chassis center (positive = down)
        FRONT_WHEEL_OFFSET_X: 38,  // Horizontal offset for front wheel from chassis center
        FRONT_WHEEL_OFFSET_Y: 25,  // Vertical offset for front wheel from chassis center (positive = down)
        
        // Debug visualization
        DEBUG_WHEEL_OFFSET: false,  // Show yellow circles at wheel offset positions
        
        // Custom debug offset point (for checking relative positions)
        DEBUG_POINT_SHOW: true,    // Show/hide the custom debug point
        DEBUG_POINT_OFFSET_X: -38,   // X offset from chassis center
        DEBUG_POINT_OFFSET_Y: 25,   // Y offset from chassis center (positive = down)
        
        // Spring/Suspension properties
        SPRING_STIFFNESS: 0.5,//0.08
        SPRING_DAMPING: 0.03,
        SPRING_LENGTH: 5,
        
        // Motor properties
        MAX_POWER: 0.15,      // Maximum torque/power
        FRICTION: 0.01,
        WHEEL_FRICTION: 1.5,
        WHEEL_GRIP: 0.003,
        
        // Weight and physics
        WEIGHT_MULTIPLIER: 0.5,  // Multiplier for chassis and wheel density
        
        // Starting position
        START_X: 200,
        SPAWN_HEIGHT: 700,     // Height at which vehicle spawns and falls
    },
    
    // Physics world settings
    PHYSICS: {
        GRAVITY_Y: 1.2,
        DEBUG: true,  // Show physics debug rendering
        
        // Individual collider visibility (only works when DEBUG is true)
        DEBUG_CHASSIS_COLLIDER: true,   // Show/hide chassis collider outline
        DEBUG_WHEEL_COLLIDER: true,      // Show/hide wheel collider outlines
        DEBUG_GROUND_COLLIDER: true,    // Show/hide ground collider outlines
    },
    
    // Color palette (kept for potential future use)
    SASHA_PALETTE: [
        { name: 'Red', hex: '#e6194b', tint: '#fad1da' },
        { name: 'Green', hex: '#3cb44b', tint: '#d8f0db' },
        { name: 'Blue', hex: '#4363d8', tint: '#d9e0f7' },
        { name: 'Orange', hex: '#f58231', tint: '#fde6d6' },
        { name: 'Purple', hex: '#911eb4', tint: '#e9d2f0' },
        { name: 'Teal', hex: '#469990', tint: '#daebe9' },
        { name: 'Olive', hex: '#808000', tint: '#e6e6cc' },
        { name: 'Magenta', hex: '#f032e6', tint: '#fcd6f6' },
        { name: 'Pink', hex: '#fabed4', tint: '#fef2f6' },
        { name: 'Lavender', hex: '#dcbeff', tint: '#f8f2ff' },
        { name: 'Beige', hex: '#fffac8', tint: '#fffef4' },
        { name: 'Maroon', hex: '#800000', tint: '#e6cccc' },
        { name: 'Mint', hex: '#aaffc3', tint: '#eefff3' },
        { name: 'Apricot', hex: '#ffd8b1', tint: '#fff7ef' },
        { name: 'Navy', hex: '#000075', tint: '#ccccdf' },
        { name: 'Grey', hex: '#a9a9a9', tint: '#eeeeee' },
        { name: 'Brown', hex: '#9a6324', tint: '#ebe0d3' },
        { name: 'Yellow', hex: '#ffe119', tint: '#fff9d1' },
        { name: 'Cyan', hex: '#42d4f4', tint: '#d9f6fd' },
        { name: 'Lime', hex: '#bfef45', tint: '#f2fccd' }
    ]
};
