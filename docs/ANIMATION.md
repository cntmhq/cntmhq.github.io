# Animation & Stage System Documentation

This document explains how to use and extend the stage-based animation system in the Reactome visualization.

## Overview

The animation system provides smooth transitions between predefined configuration states called "stages". Each stage defines a set of parameter values, and the system interpolates between them using configurable easing functions.

## Architecture

```
StageManager (js/utils/StageManager.js)
    ├── Easing functions (linear, quad, cubic, sine, expo)
    ├── lerp() utility
    └── Stage definitions & transition logic

App.js
    ├── StageManager instance
    └── Public API methods

main.js
    └── UI button handlers
```

## Current Stages

| Stage | Name    | Description |
|-------|---------|-------------|
| 0     | Initial | Default state on load - logo high, reactor faint |
| 1     | Reveal  | Materials refine, reactor becomes visible |
| 2     | Focus   | Logo descends, camera zooms in |

## Adding New Stages

### Step 1: Define Stage Values

Edit `js/utils/StageManager.js` and add a new stage object to the `this.stages` array in the constructor:

```javascript
// In StageManager constructor
this.stages = [
    // Stage 0: Initial
    { name: 'Initial', values: { ... } },

    // Stage 1: Reveal
    { name: 'Reveal', values: { ... } },

    // Stage 2: Focus
    { name: 'Focus', values: { ... } },

    // Stage 3: YOUR NEW STAGE
    {
        name: 'MyStage',
        values: {
            cameraDistance: 3.0,
            opacity: 0.2,
            connectomePosX: 0.0,
            connectomePosY: 0.5,
            connectomePosZ: 0.0,
            connectomeRoughness: 0.2,
            connectomeMetalness: 0.5
        }
    }
];
```

### Step 2: Add UI Button (Optional)

In `index.html`, add a button in the stage-buttons container:

```html
<div class="stage-buttons">
    <button id="stage-1-btn" class="stage-btn active">Initial</button>
    <button id="stage-2-btn" class="stage-btn">Reveal</button>
    <button id="stage-3-btn" class="stage-btn">Focus</button>
    <button id="stage-4-btn" class="stage-btn">MyStage</button>
</div>
```

### Step 3: Add Button Handler

In `js/main.js`, add the handler in `setupStageButtons()`:

```javascript
const stage4Btn = document.getElementById('stage-4-btn');

if (stage4Btn) {
    stage4Btn.addEventListener('click', () => {
        if (!app.isTransitioning()) {
            app.transitionToStage(3, {
                duration: 1500,
                onComplete: updateStageButtonStates
            });
            updateStageButtonStates();
        }
    });
}

// Update the button state array
[stage1Btn, stage2Btn, stage3Btn, stage4Btn].forEach((btn, index) => {
    // ...
});
```

## Adding New Animatable Parameters

### Step 1: Add to Stage Values

Include the parameter in each stage's `values` object:

```javascript
// In StageManager.js stages
{
    name: 'Reveal',
    values: {
        // Existing values...
        connectomeRotY: 0.5,        // New rotation parameter
        bloomStrength: 1.2,          // New shader parameter
        cSignetPosY: 2.0             // New signet parameter
    }
}
```

### Step 2: Add Apply Logic

In `StageManager._applyValues()`, add the setter call:

```javascript
_applyValues(values) {
    if (!this.app) return;

    // Existing applies...

    // New parameter applies
    if (values.connectomeRotY !== undefined) {
        this.app.setConnectomeRotY(values.connectomeRotY);
    }
    if (values.bloomStrength !== undefined) {
        this.app.setBloomStrength(values.bloomStrength);
    }
    if (values.cSignetPosY !== undefined) {
        this.app.setCSignetPosY(values.cSignetPosY);
    }
}
```

## Available Parameters

### Camera
| Parameter | Method | Range |
|-----------|--------|-------|
| `cameraDistance` | `setCameraDistance(v)` | 0.5 - 15 |

### Reactor (Main Objects)
| Parameter | Method | Range |
|-----------|--------|-------|
| `opacity` | `setOpacity(v)` | 0 - 1 |
| `rotationSpeed` | `setRotationSpeed(v)` | 0 - 5 |

### Connectome Logo
| Parameter | Method | Range |
|-----------|--------|-------|
| `connectomePosX` | `setConnectomePosX(v)` | -2 to 2 |
| `connectomePosY` | `setConnectomePosY(v)` | -1 to 5 |
| `connectomePosZ` | `setConnectomePosZ(v)` | -2 to 2 |
| `connectomeRotX` | `setConnectomeRotX(v)` | -π to π |
| `connectomeRotY` | `setConnectomeRotY(v)` | -π to π |
| `connectomeRotZ` | `setConnectomeRotZ(v)` | -π to π |
| `connectomeScale` | `setConnectomeScale(v)` | 0.001 - 0.03 |
| `connectomeRoughness` | `setConnectomeRoughness(v)` | 0 - 1 |
| `connectomeMetalness` | `setConnectomeMetalness(v)` | 0 - 1 |

### C Signet
| Parameter | Method | Range |
|-----------|--------|-------|
| `cSignetPosX` | `setCSignetPosX(v)` | -2 to 2 |
| `cSignetPosY` | `setCSignetPosY(v)` | -1 to 5 |
| `cSignetPosZ` | `setCSignetPosZ(v)` | -2 to 2 |
| `cSignetRotX` | `setCSignetRotX(v)` | -π to π |
| `cSignetRotY` | `setCSignetRotY(v)` | -π to π |
| `cSignetRotZ` | `setCSignetRotZ(v)` | -π to π |
| `cSignetScale` | `setCSignetScale(v)` | 0.005 - 0.05 |

### Shader Effects
| Parameter | Method | Range |
|-----------|--------|-------|
| `bloomStrength` | `setBloomStrength(v)` | 0 - 3 |
| `scanlineIntensity` | `setScanlineIntensity(v)` | 0 - 0.5 |
| `noiseIntensity` | `setNoiseIntensity(v)` | 0 - 0.2 |
| `rgbShift` | `setRgbShift(v)` | 0 - 0.02 |
| `glitchIntensity` | `setGlitchIntensity(v)` | 0 - 1 |
| `glitchSpeed` | `setGlitchSpeed(v)` | 0.1 - 5 |

### Lighting
| Parameter | Method | Range |
|-----------|--------|-------|
| `lightAmbient` | `setConnectomeLightAmbient(v)` | 0 - 2 |
| `lightMain` | `setConnectomeLightMain(v)` | 0 - 3 |
| `lightBack` | `setConnectomeLightBack(v)` | 0 - 2 |
| `lightFill` | `setConnectomeLightFill(v)` | 0 - 2 |

## Easing Functions

Available easing functions in `Easing` object:

```javascript
import { Easing } from './utils/StageManager.js';

// Linear (no easing)
Easing.linear

// Quadratic
Easing.easeInQuad
Easing.easeOutQuad
Easing.easeInOutQuad

// Cubic (default)
Easing.easeInCubic
Easing.easeOutCubic
Easing.easeInOutCubic

// Sine (smooth)
Easing.easeInSine
Easing.easeOutSine
Easing.easeInOutSine

// Exponential (dramatic)
Easing.easeInExpo
Easing.easeOutExpo
Easing.easeInOutExpo
```

## API Reference

### App.js Methods

```javascript
// Transition to specific stage (0-indexed)
app.transitionToStage(stageIndex, {
    duration: 1500,           // ms (default: 1500)
    easing: Easing.easeInOutCubic,  // easing function
    onComplete: () => {}      // callback when done
});

// Navigate stages
app.nextStage(options);
app.previousStage(options);

// Query state
app.getCurrentStage();        // Returns current stage index
app.isTransitioning();        // Returns true if animating

// Configuration
app.setTransitionDuration(2000);  // Set default duration
app.resetStage();                 // Jump to stage 0 instantly

// Advanced: Get StageManager instance
const sm = app.getStageManager();
sm.setDefaultEasing(Easing.easeOutExpo);
sm.updateStageValues(1, { opacity: 0.3 });
```

### StageManager Direct Access

```javascript
const sm = app.getStageManager();

// Update stage values dynamically
sm.updateStageValues(2, {
    cameraDistance: 2.5,
    connectomePosY: 0.0
});

// Set default easing for all transitions
sm.setDefaultEasing(Easing.easeOutExpo);

// Get stage configuration
const stage = sm.getStage(1);
console.log(stage.name, stage.values);
```

## Example: Creating a "Dramatic Zoom" Stage

```javascript
// 1. Add to StageManager.js stages array
{
    name: 'DramaticZoom',
    values: {
        cameraDistance: 1.5,
        opacity: 0.25,
        connectomePosX: 0.0,
        connectomePosY: 0.3,
        connectomePosZ: 0.0,
        connectomeRoughness: 0.1,
        connectomeMetalness: 0.8,
        // Add more params as needed
    }
}

// 2. Trigger programmatically
app.transitionToStage(3, {
    duration: 2500,
    easing: Easing.easeInOutExpo,
    onComplete: () => console.log('Dramatic zoom complete!')
});
```

## Example: Chaining Transitions

```javascript
// Play through all stages sequentially
async function playAllStages() {
    await app.transitionToStage(0, { duration: 1000 });
    await app.transitionToStage(1, { duration: 1500 });
    await app.transitionToStage(2, { duration: 2000 });
}

playAllStages();
```

## Example: Custom Animation Loop

```javascript
// Oscillate between stages
let direction = 1;
setInterval(() => {
    if (!app.isTransitioning()) {
        const current = app.getCurrentStage();
        const next = current + direction;

        if (next >= 2) direction = -1;
        if (next <= 0) direction = 1;

        app.transitionToStage(current + direction, { duration: 3000 });
    }
}, 4000);
```

## Tips

1. **Smooth values**: Use small incremental changes between stages for smoother animations
2. **Easing choice**: Use `easeInOut` variants for most natural feel
3. **Duration**: 1000-2000ms works well for most transitions
4. **Combine params**: Animate multiple parameters together for richer effects
5. **Test incrementally**: Add one parameter at a time when debugging

---

## Camera Controls Configuration

The camera is controlled by Three.js `OrbitControls`. Configuration is in `App.js` method `_createControls()`.

### Current Default Settings

```javascript
// In App.js _createControls()
this.controls.enableDamping = true;      // Smooth camera movement
this.controls.dampingFactor = 0.08;      // Damping intensity
this.controls.minDistance = 0.5;         // Minimum zoom (closest)
this.controls.maxDistance = 15;          // Maximum zoom (farthest)
this.controls.enablePan = false;         // Disable panning
this.controls.rotateSpeed = 0.5;         // Rotation sensitivity
this.controls.zoomSpeed = 0.8;           // Zoom sensitivity

// Vertical rotation limits (polar angle)
this.controls.minPolarAngle = 0;         // Top view (looking down)
this.controls.maxPolarAngle = Math.PI;   // Bottom view (looking up)

// Horizontal rotation limits (azimuth angle)
this.controls.minAzimuthAngle = 0;       // Locked horizontal
this.controls.maxAzimuthAngle = 0;       // Locked horizontal
```

### Zoom Limits

Control how close/far the user can zoom:

```javascript
// Allow closer zoom (more detail)
this.controls.minDistance = 0.3;

// Restrict zoom out (keep scene framed)
this.controls.maxDistance = 8;

// Disable zoom entirely
this.controls.enableZoom = false;
```

### Vertical Rotation (Polar Angle)

The polar angle controls vertical camera rotation (up/down tilt):

| Value | Camera Position |
|-------|-----------------|
| `0` | Looking straight down (top view) |
| `Math.PI / 2` | Looking horizontally (side view) |
| `Math.PI` | Looking straight up (bottom view) |

```javascript
// Lock to top-down view only
this.controls.minPolarAngle = 0;
this.controls.maxPolarAngle = 0;

// Allow slight tilt (top to 45°)
this.controls.minPolarAngle = 0;
this.controls.maxPolarAngle = Math.PI / 4;

// Full vertical freedom
this.controls.minPolarAngle = 0;
this.controls.maxPolarAngle = Math.PI;

// Lock to side view only
this.controls.minPolarAngle = Math.PI / 2;
this.controls.maxPolarAngle = Math.PI / 2;
```

### Horizontal Rotation (Azimuth Angle)

The azimuth angle controls horizontal camera rotation (orbit around Y axis):

```javascript
// Lock horizontal rotation (current default)
this.controls.minAzimuthAngle = 0;
this.controls.maxAzimuthAngle = 0;

// Allow full 360° horizontal rotation
this.controls.minAzimuthAngle = -Infinity;
this.controls.maxAzimuthAngle = Infinity;

// Allow limited horizontal rotation (±45°)
this.controls.minAzimuthAngle = -Math.PI / 4;
this.controls.maxAzimuthAngle = Math.PI / 4;

// Allow half rotation (front 180°)
this.controls.minAzimuthAngle = -Math.PI / 2;
this.controls.maxAzimuthAngle = Math.PI / 2;
```

### Enable/Disable Controls

```javascript
// Disable all rotation
this.controls.enableRotate = false;

// Disable zoom
this.controls.enableZoom = false;

// Disable panning (already disabled by default)
this.controls.enablePan = false;

// Disable all controls
this.controls.enabled = false;
```

### Adding Camera Controls to Stages

To animate camera constraints between stages, add methods to App.js:

#### Step 1: Add Methods to App.js

```javascript
// Add these methods to the ReactomeApp class

/**
 * Set minimum zoom distance
 * @param {number} distance - Minimum distance
 */
setMinZoom(distance) {
    if (this.controls) {
        this.controls.minDistance = distance;
    }
}

/**
 * Set maximum zoom distance
 * @param {number} distance - Maximum distance
 */
setMaxZoom(distance) {
    if (this.controls) {
        this.controls.maxDistance = distance;
    }
}

/**
 * Set polar angle limits (vertical rotation)
 * @param {number} min - Minimum angle in radians
 * @param {number} max - Maximum angle in radians
 */
setPolarLimits(min, max) {
    if (this.controls) {
        this.controls.minPolarAngle = min;
        this.controls.maxPolarAngle = max;
    }
}

/**
 * Set azimuth angle limits (horizontal rotation)
 * @param {number} min - Minimum angle in radians
 * @param {number} max - Maximum angle in radians
 */
setAzimuthLimits(min, max) {
    if (this.controls) {
        this.controls.minAzimuthAngle = min;
        this.controls.maxAzimuthAngle = max;
    }
}

/**
 * Enable/disable camera rotation
 * @param {boolean} enabled - Whether rotation is enabled
 */
setRotationEnabled(enabled) {
    if (this.controls) {
        this.controls.enableRotate = enabled;
    }
}

/**
 * Enable/disable camera zoom
 * @param {boolean} enabled - Whether zoom is enabled
 */
setZoomEnabled(enabled) {
    if (this.controls) {
        this.controls.enableZoom = enabled;
    }
}
```

#### Step 2: Add to StageManager

```javascript
// In StageManager._applyValues()
if (values.minZoom !== undefined) {
    this.app.setMinZoom(values.minZoom);
}
if (values.maxZoom !== undefined) {
    this.app.setMaxZoom(values.maxZoom);
}
```

#### Step 3: Use in Stages

```javascript
// Example stage with camera constraints
{
    name: 'Cinematic',
    values: {
        cameraDistance: 3.0,
        minZoom: 2.0,           // Prevent getting too close
        maxZoom: 5.0,           // Prevent zooming out too far
        // ... other values
    }
}
```

### Preset Camera Configurations

#### Top-Down Locked (Default)
```javascript
this.controls.minPolarAngle = 0;
this.controls.maxPolarAngle = Math.PI;
this.controls.minAzimuthAngle = 0;
this.controls.maxAzimuthAngle = 0;
```

#### Free Orbit
```javascript
this.controls.minPolarAngle = 0.1;              // Prevent exact top
this.controls.maxPolarAngle = Math.PI - 0.1;    // Prevent exact bottom
this.controls.minAzimuthAngle = -Infinity;
this.controls.maxAzimuthAngle = Infinity;
```

#### Presentation Mode (Limited)
```javascript
this.controls.minPolarAngle = Math.PI / 6;      // 30° from top
this.controls.maxPolarAngle = Math.PI / 3;      // 60° from top
this.controls.minAzimuthAngle = -Math.PI / 6;   // ±30° horizontal
this.controls.maxAzimuthAngle = Math.PI / 6;
this.controls.minDistance = 3;
this.controls.maxDistance = 6;
```

#### Locked View (No User Control)
```javascript
this.controls.enableRotate = false;
this.controls.enableZoom = false;
this.controls.enablePan = false;
// Or simply:
this.controls.enabled = false;
```

### Runtime Camera Control Examples

```javascript
// Get app reference
const app = window.reactomeApp;

// Unlock full rotation for exploration
app.controls.minAzimuthAngle = -Infinity;
app.controls.maxAzimuthAngle = Infinity;
app.controls.minPolarAngle = 0.1;
app.controls.maxPolarAngle = Math.PI - 0.1;

// Lock back to top-down
app.controls.minAzimuthAngle = 0;
app.controls.maxAzimuthAngle = 0;
app.controls.minPolarAngle = 0;
app.controls.maxPolarAngle = 0;

// Restrict zoom range
app.controls.minDistance = 2;
app.controls.maxDistance = 8;

// Disable user interaction during animation
app.controls.enabled = false;
// ... run animation ...
app.controls.enabled = true;
```
