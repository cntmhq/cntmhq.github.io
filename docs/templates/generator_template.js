/**
 * ═══════════════════════════════════════════════════════════════════════════
 *                  THREEJS GENERATIVE ART - BEST PRACTICES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file shows STRUCTURE and PRINCIPLES for THREEJS generative art.
 * It does NOT prescribe what art you should create.
 *
 * Your algorithmic philosophy should guide what you build.
 * These are just best practices for how to structure your code.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ============================================================================
// 1. PARAMETER ORGANIZATION
// ============================================================================
// Keep all tunable parameters in one object
// This makes it easy to:
// - Connect to UI controls
// - Reset to defaults
// - Serialize/save configurations

let params = {
    // Define parameters that match YOUR algorithm
    // Examples (customize for your art):
    // - Counts: how many elements (particles, circles, branches, etc.)
    // - Scales: size, speed, spacing
    // - Probabilities: likelihood of events
    // - Angles: rotation, direction
    // - Colors: palette arrays

    seed: 12345,
    // define colorPalette as an array -- choose whatever colors you'd like ['#d97757', '#6a9bcc', '#788c5d', '#b0aea5']
    // Add YOUR parameters here based on your algorithm
};

// ============================================================================
// 2. SEEDED RANDOMNESS (Critical for reproducibility)
// ============================================================================
// ALWAYS use seeded random for Art Blocks-style reproducible output

function initializeSeed(seed) {
    randomSeed(seed);
    noiseSeed(seed);
    // Now all random() and noise() calls will be deterministic
}

// ============================================================================
// 3. LOCAL CLAUDE THREEJS-FUNDAMENTALS SKILL (~/.claude/skills/threejs-fundamentals)
// ============================================================================
// Scene setup, cameras, renderer, Object3D hierarchy, coordinate systems

// ============================================================================
// 4. LOCAL CLAUDE THREEJS-GEOMETRIES SKILL (~/.claude/skills/threejs-geometry)
// ============================================================================
// Built-in shapes, BufferGeometry, custom geometry, instancing

// ============================================================================
// 5. LOCAL CLAUDE THREEJS-MATERIALS SKILL (~/.claude/skills/threejs-materials)
// ============================================================================
// PBR materials, basic/phong/standard materials, shader materials

// ============================================================================
// 6. LOCAL CLAUDE THREEJS-LIGHTING SKILL (~/.claude/skills/threejs-lighting)
// ============================================================================
// Light types, shadows, environment lighting, light helpers

// ============================================================================
// 7. LOCAL CLAUDE THREEJS-TEXTURES SKILL (~/.claude/skills/threejs-textures)
// ============================================================================
// Texture types, UV mapping, environment maps, render targets

// ============================================================================
// 8. LOCAL CLAUDE THREEJS-ANIMATIONS SKILL (~/.claude/skills/threejs-animation)
// ============================================================================
// Keyframe animation, skeletal animation, morph targets, animation mixing

// ============================================================================
// 9. LOCAL CLAUDE THREEJS-LOADERS SKILL (~/.claude/skills/threejs-loaders)
// ============================================================================
// GLTF/GLB loading, texture loading, async patterns, caching

// ============================================================================
// 10. LOCAL CLAUDE THREEJS-SHADERS SKILL (~/.claude/skills/threejs-shaders)
// ============================================================================
// GLSL basics, ShaderMaterial, uniforms, custom effects

// ============================================================================
// 11. LOCAL CLAUDE THREEJS-POSTPROCESSING SKILL (~/.claude/skills/threejs-postprocessing)
// ============================================================================
// EffectComposer, bloom, DOF, screen effects, custom passes

// ============================================================================
// 12. LOCAL CLAUDE THREEJS-INTERACTION SKILL (~/.claude/skills/threejs-interaction)
// ============================================================================
// Raycasting, camera controls, mouse/touch input, object selection

// ============================================================================
// 13. PERFORMANCE CONSIDERATIONS
// ============================================================================

// For large numbers of elements:
// - Pre-calculate what you can
// - Use simple collision detection (spatial hashing if needed)
// - Limit expensive operations (sqrt, trig) when possible
// - Consider using threejs vectors efficiently

// For smooth animation:
// - Aim for 60fps
// - Profile if things are slow
// - Consider reducing particle counts or simplifying calculations

// ============================================================================
// 14. UTILITY FUNCTIONS
// ============================================================================

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorFromPalette(index) {
    return params.colorPalette[index % params.colorPalette.length];
}

// Mapping and easing
function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Constrain to bounds
function wrapAround(value, max) {
    if (value < 0) return max;
    if (value > max) return 0;
    return value;
}

// ============================================================================
// 15. PARAMETER UPDATES (Connect to UI)
// ============================================================================

function updateParameter(paramName, value) {
    params[paramName] = value;
    // Decide if you need to regenerate or just update
    // Some params can update in real-time, others need full regeneration
}

function regenerate() {
    // Reinitialize your generative system
    // Useful when parameters change significantly
    initializeSeed(params.seed);
    // Then regenerate your system
}

// ═══════════════════════════════════════════════════════════════════════
// 16. SEED CONTROL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function updateSeedDisplay() {
    document.getElementById('seed-input').value = params.seed;
}

function updateSeed() {
    let input = document.getElementById('seed-input');
    let newSeed = parseInt(input.value);
    if (newSeed && newSeed > 0) {
        params.seed = newSeed;
        initializeSystem();
    } else {
        // Reset to current seed if invalid
        updateSeedDisplay();
    }
}

function previousSeed() {
    params.seed = Math.max(1, params.seed - 1);
    updateSeedDisplay();
    initializeSystem();
}

function nextSeed() {
    params.seed = params.seed + 1;
    updateSeedDisplay();
    initializeSystem();
}

function randomSeedAndUpdate() {
    params.seed = Math.floor(Math.random() * 999999) + 1;
    updateSeedDisplay();
    initializeSystem();
}

// ============================================================================
// 17. COMMON THREEJS PATTERNS
// ============================================================================

// Drawing with transparency for trails/fading
function fadeBackground(opacity) {
    fill(250, 249, 245, opacity); // Anthropic light with alpha
    noStroke();
    rect(0, 0, width, height);
}

// Using noise for organic variation
function getNoiseValue(x, y, scale = 0.01) {
    return noise(x * scale, y * scale);
}

// Creating vectors from angles
function vectorFromAngle(angle, magnitude = 1) {
    return createVector(cos(angle), sin(angle)).mult(magnitude);
}

// ============================================================================
// REMEMBER
// ============================================================================
//
// These are assisting SKILLS, TOOLS and PRINCIPLES, not a recipe.
// Your algorithmic philosophy should guide WHAT you create.
// This structure helps you create it WELL.
//
// Focus on:
// - Clean, readable code
// - Parameterized for exploration
// - Seeded for reproducibility
// - Performant execution
//
// The art itself is entirely up to you!
//
// ============================================================================