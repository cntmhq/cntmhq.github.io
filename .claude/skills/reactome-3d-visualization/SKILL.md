---
name: reactome-3d-visualization
description: Three.js 3D visualization system with interactive reactor scene, separate C Signet viewport with magnetic interaction, and stage-based animation management.
---

## Architecture Overview

**Reactome Visualization** - Interactive 3D WebGL scene displaying procedural geometry (rings & cylinders) with orbit camera controls and post-processing effects.

**CSignetApp** - Isolated 320×320px viewport for the "C" signet with magnetic pull interaction (drag constrained to 0.03 units, smooth 800ms return with wobble).

**Configuration-Driven** - Material properties, extrusion settings, and positioning cascade through config objects (CONNECTOME_LOGO_CONFIG, C_SIGNET_CONFIG) with fallback defaults.

**Stage Manager** - Manages scene transitions with easing animations between defined states (initial, focus, reveal, etc.).

---

## Project Structure

```
js/
├── App.js
│   ├── ReactomeApp          # Main visualization (reactor, lights, controls, effects)
│   ├── CSignetApp           # Standalone C Signet with interaction & fade
│   ├── DEFAULT_CONFIG       # UI sync configuration
│   └── exports: ReactomeApp, CSignetApp, DEFAULT_CONFIG
├── main.js                   # Entry point, UI event bindings, initialization
├── effects/
│   └── SciFiShader.js       # Post-processing (bloom, scanlines, glitch)
├── geometries/
│   ├── ConnectomeLogo.js    # createConnectomeLogoGeometry(), createCSignetGeometry(), material variations
│   ├── DottedCylinder.js    # createDottedCylinderGeometry()
│   └── Ring.js              # createRingGeometry()
└── utils/
    ├── random.js            # randomFloat(), randomInt(), randomPick()
    └── StageManager.js      # Stage definitions, easing functions

index.html                    # Fixed structure: header, collapsible sidebar, canvas container
styles.css                    # Fixed styling, responsive breakpoints
```

---

## Key Classes & APIs

### ReactomeApp
```javascript
constructor(options)          // container, backgroundColor, cameraDistance, objectCount, etc.
start()                       // Begin animation loop
stop()                        // Stop animation
setCameraDistance(d)          // Orbit camera zoom (triggers cSignet fade check)
getCameraDistance()           // Returns distance from origin
setOpacity(val)              // Material opacity
setRotationSpeed(val)        // Animation speed multiplier
setShaderEnabled(bool)       // Post-processing toggle
```

### CSignetApp
```javascript
constructor(options)          // container, size (default 320)
loadCSignet(options)          // Async: Load geometry with config
loadCSignet({
  scale, xOffset, yOffset, zOffset,
  color, opacity, transparent, wireframe,
  roughness, metalness,
  depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments
})
start()                       // Begin animation & rendering
setVisibilityByDistance(bool) // Called from ReactomeApp._tick() when distance < 1
setCSignetVisible(bool)       // Toggle visibility
setCSignetScale(s)            // Transform scale
setCSignetPos{X,Y,Z}(val)    // Transform position
setCSignetRot{X,Y,Z}(rad)    // Transform rotation
```

### Configuration Flow

1. **Load**: `DEFAULT_CONFIG` provides initial values
2. **Merge**: UI bindings (sliders, toggles) update `DEFAULT_CONFIG` values
3. **Cascade**: Methods like `setCameraDistance()` read merged config
4. **Sync**: `main.js` creates event listeners that update config & call app methods

---

## Material Variations (ConnectomeLogo.js)

```javascript
LOGO_VARIATIONS {
  SOLID:      // MeshStandardMaterial with wireframe property
  WIREFRAME:  // MeshBasicMaterial with wireframe=true
  GLASS:      // MeshPhysicalMaterial (transparent, physical)
  HOLOGRAM:   // Dual materials (solid + wireframe) with config.opacity
  NEON:       // MeshStandardMaterial with emissive
}
```

**Config-to-Material Pipeline:**
```
createConnectomeLogoGeometry({opacity, color, wireframe, ...})
  → createExtrudedSVG() with merged config
    → createMaterial(variation, config)
      → Material respects all config properties
```

**Default fallback**: `CONNECTOME_LOGO_CONFIG.* ?? C_SIGNET_CONFIG.*`

---

## C Signet Fade System

**State Flow:**
1. Load → `cSignetTargetOpacity = 0` (invisible)
2. ReactomeApp `_tick()` checks `getCameraDistance()`
3. If distance < 1 → `cSignetApp.setVisibilityByDistance(true)` → `cSignetTargetOpacity = cSignetNormalOpacity`
4. CSignetApp `_tick()` interpolates opacity over `cSignetFadeDuration` (300ms)
5. If distance ≥ 1 → `setVisibilityByDistance(false)` → fades to 0

**Smooth interpolation** in CSignetApp._tick():
```javascript
const fadeSpeed = 1 / this.cSignetFadeDuration;
diff = target - current;
if (Math.abs(diff) > 0.001) {
  opacity += diff * (delta * 1000 * fadeSpeed);
}
```

---

## Magnetic Pull Interaction (CSignetApp)

**Constraints:**
- Max drag distance: `0.03` units (very restricted)
- Return time: `800ms` with ease-out cubic
- Wobble: `12Hz` oscillation, dampens to 0 during return

**Event Flow:**
- `mousedown` / `touchstart` → raycasting on hitbox → `_onInteractionStart()`
- Mouse move → `_onInteractionMove()` → position clamped to maxDragDistance
- `mouseup` / `touchend` → `_onInteractionEnd()` → enable `isReturning`
- Each frame: interpolate position toward home with wobble effect

**Wobble Math:**
```javascript
wobbleAmount = (1 - easeProgress) * 0.15; // Starts 15%, fades to 0
wobbleFactor = sin(progress * 12 * π * 2); // 12 Hz oscillations
finalOffset = easeOffset + (wobbleFactor * wobbleAmount)
```

---

## UI Sync Pattern

**Slider binding** (main.js):
```javascript
setupRangeControl(
  'slider-id',
  'display-id',
  (value) => app.setMethod(value),
  (v) => v.toFixed(2)
);
```

**Toggle binding** (main.js):
```javascript
const toggle = document.getElementById('toggle-id');
toggle.addEventListener('change', (e) => {
  app.setProperty(e.target.checked);
});
```

**Config update sequence:**
1. HTML input change → event handler
2. Handler calls `app.setXxx(value)`
3. `setXxx()` updates `this.property` and DOM rendering
4. If dependent: triggers `_tick()` update

---

## Extending the App

**Add new parameter:**
1. Add to `DEFAULT_CONFIG` in App.js
2. Create getter/setter method: `setNewParam(val)`
3. Bind in `main.js`: `setupRangeControl()` or event listener
4. Use in `_tick()` or update method

**Add new geometry:**
1. Create in `geometries/NewGeom.js`
2. Export generator function
3. Import in App.js
4. Use in `_createObjects()` or as needed
5. Apply material from existing `createMaterial()` pipeline

**Modify material:**
1. Update `createMaterial()` in ConnectomeLogo.js
2. Add config properties as needed
3. Merge config defaults in `createConnectomeLogoGeometry()` or `loadCSignet()`

---

## Running & Testing

```bash
cd /home/qlb/projects/skills/reactome
python3 -m http.server 8000
# Open http://localhost:8000
```

**No build step required** - ES modules via import maps, Three.js from CDN.

---

## Performance Notes

- **CSignetApp**: Separate renderer (320×320) prevents main scene overhead
- **Interaction**: Raycasting only on visible hitbox (scene sibling, not child)
- **Fade**: Interpolation skips when `|diff| < 0.001` (tolerance)
- **Orbit**: Damping factor 0.08, locked azimuth (no horizontal orbit)
- **Effects**: Optional post-processing (toggle per frame in `_tick()`)
