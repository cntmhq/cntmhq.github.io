# Camera Distance & State Synchronization Guide

## Overview

This document describes the state synchronization system that ensures smooth camera transitions even when the camera has been manipulated by the user or automatic motion effects.

## Problem Solved

**Before**: When transitioning between stages, the animation could jump or clip if:
- User manually zoomed with mouse wheel
- User panned/rotated with orbit controls
- Automatic Z-axis camera motion was active
- Other visual properties were modified after stage definition

**After**: All transitions now capture the actual current state and animate smoothly from that point.

## How It Works

### 1. State Capture (`getCapturedState()`)

Located in: `js/App.js:707-757`

```javascript
getCapturedState() {
  return {
    // Camera state - ACTUAL values from Three.js
    cameraDistance: this.getCameraDistance(),
    cameraZ: this.camera.position.z,

    // Visual properties - from mesh materials
    opacity: this.objects[0].material?.opacity,
    connectomeMetalness: this.connectomeLogo?.material?.metalness,

    // Transform properties - from Three.js objects
    connectomePosX: this.connectomeLogo.position.x,
    connectomePosY: this.connectomeLogo.position.y,
    connectomePosZ: this.connectomeLogo.position.z,

    // ... plus header, C Signet, and other state
  };
}
```

**Key Points**:
- Captures ACTUAL values from Three.js objects, not stored config
- Preserves camera Z-axis offset from automatic motion
- Reads material properties from rendered meshes
- Returns fresh snapshot on each call

### 2. State Synchronization (`syncActualState()`)

Located in: `js/utils/StageManager.js:465-476`

```javascript
syncActualState(capturedState) {
  this.currentValues = {
    ...this.currentValues,
    ...capturedState
  };
}
```

**Key Points**:
- Merges captured state into `currentValues`
- Only updates keys that exist in captured state
- Preserves any values not captured (stage-specific settings)
- Called immediately before transition begins

### 3. Transition with Capture

Located in: `js/utils/StageManager.js:289-321`

```javascript
transitionTo(targetStage, options = {}) {
  // NEW: Capture actual state if requested
  if (options.captureActualState && this.app?.getCapturedState) {
    const actualState = this.app.getCapturedState();
    this.syncActualState(actualState);
  }

  // Existing: Animate from currentValues to targetValues
  const startValues = { ...this.currentValues };
  const targetValues = this.stages[targetStage].values;

  // Interpolate using easing function
  const animate = (currentTime) => {
    const progress = easing(rawProgress);
    for (const key in targetValues) {
      this.currentValues[key] = lerp(startValues[key], targetValues[key], progress);
    }
    this._applyValues(this.currentValues);
  };
}
```

**Animation Pattern**:
- Uses `lerp()` (linear interpolation) for smooth value transitions
- Applies easing function (cubic ease-in-out by default) for natural motion
- Updates values 60+ times per second via `requestAnimationFrame`
- This follows Three.js procedural animation best practices

### 4. UI Integration

Updated in: `js/main.js` (13 call sites)

```javascript
// Before:
app.transitionToStage(nextStage, { duration: 1000 });

// After:
app.transitionToStage(nextStage, {
  captureActualState: true,  // NEW: Enable state capture
  duration: 1000
});
```

**Call Sites Updated**:
1. Stage button 1-9 handlers (9 updates)
2. Navigation link handlers (4 updates)
3. Reset/Clear history buttons (2 updates)
4. Advanced navigation (1 update)

## Properties Captured

### Camera
- **cameraDistance**: Distance from origin (affected by mouse wheel)
- **cameraZ**: Z-axis offset (from automatic oscillating motion)

### Reactor Objects
- **opacity**: Mesh material transparency

### Connectome Logo
- **connectomeMetalness**: Material shine (used for fade effects)
- **connectomeRoughness**: Surface finish
- **connectomeOpacity**: Overall transparency
- **connectomePosX/Y/Z**: 3D position
- **connectomeRotX/Y/Z**: 3D rotation (Euler angles)

### C Signet
- **csignetMetalness**: Metalness value (affects visibility)

### Header
- **headerOpacity**: Text overlay transparency
- **headerScale**: 3D world scale
- **headerPosX/Y/Z**: 3D position
- **headerRotX/Y/Z**: 3D rotation

## Smooth Animation Details

The synchronization system leverages Three.js animation patterns:

### Linear Interpolation (Lerp)
```javascript
// From StageManager.js
export function lerp(start, end, t) {
    return start + (end - start) * t;
}
```

This provides smooth, predictable transitions between values.

### Easing Functions
```javascript
// Default: Cubic ease-in-out for natural motion
easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
```

The easing function ensures transitions start slowly, accelerate, then decelerate smoothly at the end.

### Animation Loop
- Uses `requestAnimationFrame()` for 60+ FPS updates
- Delta-time independent via `performance.now()`
- Respects transition duration setting
- Clamps progress to [0, 1] range to prevent overshoot

## Use Cases

### Smooth Recovery from User Interaction
```javascript
// User manually zooms camera to 3.5
app.setCameraDistance(3.5);

// User clicks "Focus" button
// System captures: cameraDistance = 3.5
// Animates smoothly: 3.5 → 4.0 (target) over 1 second
// Result: NO JUMP, smooth zoom transition
```

### Preserving Automatic Motion
```javascript
// Camera Z oscillates due to automatic motion
// Actual state: cameraZ = 0.15 (from sine wave)

// User transitions to new stage
// System captures: cameraZ = 0.15
// Animates cameraDistance while preserving Z offset
// Result: Z motion continues smoothly through transition
```

### Multi-Property Transitions
```javascript
// Multiple properties animate in parallel:
// - cameraDistance: 2.5 → 0.6
// - opacity: 0.14 → 0.1
// - connectomeMetalness: 0.2 → 0.5
// - header opacity: 0.8 → 0.0

// All interpolated independently using same easing curve
// All complete at same time for choreographed effect
```

## Testing Recommendations

### Manual Testing
1. **Test camera interaction**: Use mouse wheel to zoom before clicking stage button
2. **Test automatic motion**: Let camera oscillate, then transition
3. **Test multiple interactions**: Zoom several times, navigate between stages
4. **Test rapid clicking**: Ensure transitions don't stack/glitch

### Browser Console
```javascript
// Debug captured state
window.reactomeApp.getCapturedState();

// Monitor transition progress
window.reactomeApp.stageManager.getIsTransitioning();

// Check current values
window.reactomeApp.stageManager.currentValues;
```

## Edge Cases Handled

✅ **User zooms beyond stage limits**: Captured and animated to new target
✅ **Rapid stage transitions**: `isTransitioning` flag prevents queuing
✅ **Missing properties**: Safe fallback to stage defaults
✅ **First load state restore**: Uses duration=0 for instant transition
✅ **Camera Z offset**: Preserved during distance animation
✅ **Material not loaded**: Graceful fallback to defaults

## Performance Considerations

- **No GC impact**: All captures use existing objects
- **CPU efficient**: Single snapshot per transition (not per-frame)
- **GPU efficient**: Standard Three.js interpolation, no new shaders
- **Memory**: Temporary state objects (minimal, ~20 properties)

## Future Extensions

Possible enhancements (not yet implemented):

1. **Article State**: Remember which articles are open
2. **UI State**: Preserve control panel collapsed/expanded state
3. **Effect Parameters**: Capture shader effect settings
4. **Spring Physics**: Use dampening for bouncy transitions
5. **Per-stage tweens**: Custom easing curves per transition

## Code References

| File | Lines | Purpose |
|------|-------|---------|
| `js/App.js` | 707-757 | `getCapturedState()` implementation |
| `js/utils/StageManager.js` | 289-321 | `transitionTo()` with capture flag |
| `js/utils/StageManager.js` | 465-476 | `syncActualState()` implementation |
| `js/main.js` | Multiple | Updated transition handlers (13 call sites) |

## Related Documentation

- **Stage Definitions**: `js/utils/StageManager.js:101-256` (stages 0-8)
- **App API**: `js/App.js:600-1300` (all setter/getter methods)
- **Three.js Animation**: Built-in lerp, easing, requestAnimationFrame patterns
