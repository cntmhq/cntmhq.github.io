# Logo Rotation X Lock - Documentation

## Overview

The **Connectome logo's X-axis rotation (connectomeRotX) is now locked** to prevent wobbling or unintended rotation changes during stage transitions.

---

## Why Lock Rotation X?

### Problem Solved
- ❌ **Before**: Logo could wobble on X-axis during transitions if rotation values varied
- ❌ **Before**: User accidentally rotates logo, transition would interpolate from that position
- ✅ **After**: X-axis rotation is fixed and stable throughout all transitions

### Visual Result
- **Locked**: Logo maintains consistent X-axis angle (no forward/backward tilt)
- **Free**: Logo can still rotate on Y and Z axes (smooth orbiting/spinning motion)
- **Stable**: No unintended movement during state changes

---

## How It Works

### Implementation

**Locked Value**: `0.0001` radians (essentially no rotation)

**Behavior During Transitions**:
1. **Y and Z rotations**: Animate smoothly if defined in stages
2. **X rotation**: Always fixed to locked value (never interpolated)

**Code Location**:
- Lock mechanism: `js/utils/StageManager.js` (line 79: `lockedRotationX`)
- Enforcement: `js/utils/StageManager.js` (_applyValues method)
- Capture exclusion: `js/App.js` (getCapturedState method)

---

## Rotation Behavior by Axis

### X-Axis (Rotation.x) - LOCKED ❌
```
Value: Always 0.0001 radians
Changes: Never (fixed)
Purpose: Prevent logo tilt wobble
Visual: Logo stays level, no forward/backward rotation
```

### Y-Axis (Rotation.y) - FREE ✅
```
Value: Can vary per stage
Changes: Smoothly interpolated during transitions
Purpose: Allow logo orbiting/horizontal rotation
Visual: Logo spins left/right
```

### Z-Axis (Rotation.z) - FREE ✅
```
Value: Can vary per stage
Changes: Smoothly interpolated during transitions
Purpose: Allow logo rolling/tilting on axis
Visual: Logo tilts/rolls
```

---

## Console Helpers

### Check Current Lock
```javascript
// Get locked rotation X value
window.reactomeApp.stageManager.getLockedRotationX();
// Returns: 0.0001
```

### Change Lock Value (Advanced)
```javascript
// Lock to different value (if needed)
window.reactomeApp.stageManager.setLockedRotationX(0.005);
// Output: 🔒 Logo Rotation X locked to: 0.005
```

### Verify Lock is Active
```javascript
// Enable debug mode to see locked value in logs
window.reactomeApp.stageManager.setDebugMode(true);

// You'll see in console:
// • connectomeRotY, Z - rotation interpolation
// • connectomeRotX - LOCKED (prevented from wobbling)
```

---

## Visual Examples

### Stage Transition with Rotation Lock

**From Stage SEC → DEV**:

```
BEFORE Stage Transition:
  connectomeRotX: 0.0001  ← Will stay locked
  connectomeRotY: 0.5     ← Can animate
  connectomeRotZ: 0.0     ← Can animate

DURING Transition (smooth interpolation):
  connectomeRotX: 0.0001  ✓ LOCKED (no change)
  connectomeRotY: 0.5 → 0.4 (interpolating)
  connectomeRotZ: 0.0 → 0.1 (interpolating)

AFTER Stage Transition:
  connectomeRotX: 0.0001  ← Still locked
  connectomeRotY: 0.4     ← At new value
  connectomeRotZ: 0.1     ← At new value

Result: Logo rotates Y and Z smoothly, X stays stable ✓
```

---

## Technical Details

### Lock Mechanism

1. **Capture Phase**
   - `getCapturedState()` does NOT capture connectomeRotX
   - Y and Z rotations are captured normally
   - Result: RotX not included in interpolation

2. **Interpolation Phase**
   - RotY and RotZ interpolate using lerp + easing
   - RotX is skipped (not in startValues/targetValues)
   - Result: Only Y and Z animate

3. **Apply Phase**
   - `_applyValues()` enforces locked RotX value
   - Always sets: `app.setConnectomeRotX(this.lockedRotationX)`
   - Ignores any value in the values object
   - Result: RotX always stays at 0.0001

### Code Flow

```
Stage Transition:
      ↓
1. Capture State
   - Get Y and Z rotations
   - Skip X rotation ← LOCK STARTS HERE
      ↓
2. Interpolate Values
   - Lerp Y and Z
   - Skip X (not in values)
      ↓
3. Apply to App (every frame)
   - app.setConnectomeRotY(interpolatedY)
   - app.setConnectomeRotZ(interpolatedZ)
   - app.setConnectomeRotX(0.0001) ← LOCK ENFORCED
      ↓
4. Result: Y/Z animate, X stays locked ✓
```

---

## Configuration

### Default Lock Value
```javascript
// In StageManager constructor:
this.lockedRotationX = 0.0001; // Fixed value
```

### Why 0.0001?
- Small enough to look like "no rotation"
- Large enough to avoid gimbal lock (0.0 exactly)
- Standard value used throughout App.js defaults
- Maintains consistency with other small offset values

### If You Need to Change It

```javascript
// Get current value
const current = window.reactomeApp.stageManager.getLockedRotationX();
console.log('Current lock:', current);  // 0.0001

// Change to new value
window.reactomeApp.stageManager.setLockedRotationX(0.05);
console.log('New lock:', window.reactomeApp.stageManager.getLockedRotationX());  // 0.05
```

---

## Testing Rotation Lock

### Test 1: Verify Lock is Active

```javascript
// 1. Check current lock value
console.log('Lock value:', window.reactomeApp.stageManager.getLockedRotationX());
// Output: 0.0001

// 2. Get actual logo rotation
const logo = window.reactomeApp.connectomeLogo;
console.log('Actual RotX:', logo.rotation.x);
// Output: Should be very close to 0.0001

// 3. Transition and check again
window.reactomeApp.transitionToStage(2, { captureActualState: true });
// Wait for transition to complete...
console.log('After transition RotX:', logo.rotation.x);
// Output: Still ~0.0001 ✓
```

### Test 2: Verify Y and Z Still Animate

```javascript
// Enable debug mode
window.reactomeApp.stageManager.setDebugMode(true);

// Transition
window.reactomeApp.transitionToStage(3, { captureActualState: true });

// Watch console for:
// [5%] Animation: {"rotY": 0.xx, "rotZ": 0.xx, ...}
// [10%] Animation: {"rotY": 0.xx, "rotZ": 0.xx, ...}
// ✓ Animation complete!

// Y and Z values should change, X should not appear (locked)
```

### Test 3: Visual Inspection

1. Click through stages
2. Observe logo rotation:
   - ✅ Logo orbits (Y-axis rotation)
   - ✅ Logo tilts/rolls (Z-axis rotation)
   - ❌ Logo does NOT tilt forward/backward (X-axis locked)

---

## Debug Console Output

When debug mode is enabled with rotation lock:

```javascript
window.reactomeApp.stageManager.setDebugMode(true);

// Output:
🔍 Material Animation Debug Mode: ENABLED
Watching properties:
  • connectomeMetalness - smoothly transitions (0-1)
  • connectomeRoughness - smoothly transitions (0-1)
  • connectomeOpacity - smoothly transitions (0-1)
  • connectomePosX, Y, Z - position interpolation
  • connectomeRotY, Z - rotation interpolation
  • connectomeRotX - LOCKED (prevented from wobbling)  ← Shows lock status
  • headerOpacity, headerScale - smooth opacity/scale
  • csignetMetalness - visibility fade

You will see logs every frame during transitions showing values being interpolated
```

---

## Troubleshooting

### "Logo is tilting forward/backward"

**Issue**: X-axis rotation is changing when it shouldn't be

**Debug**:
```javascript
// Check lock value
console.log('Lock:', window.reactomeApp.stageManager.getLockedRotationX());

// Check actual logo rotation
console.log('Actual RotX:', window.reactomeApp.connectomeLogo.rotation.x);

// They should be very close (within 0.001)
```

**Solution**:
- Lock value may have been changed accidentally
- Reset to default: `setLockedRotationX(0.0001)`
- Check if another script is modifying rotX

### "I want to allow Y/Z but not X"

**This is the default behavior!**

- ✅ Y and Z rotations animate (can be different per stage)
- ❌ X rotation locked (always stays at 0.0001)

This is exactly what you want - unrestricted Y/Z motion, locked X.

### "Can I unlock X-axis?"

**Not recommended**, but if needed:

```javascript
// Current lock prevents X-axis wobble
// To allow X-axis animation:
// 1. Remove lock enforcement from _applyValues
// 2. Add connectomeRotX to stage definitions
// 3. Include connectomeRotX in capture

// This would require code modification - consult documentation
```

---

## Implementation Details

### Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `js/utils/StageManager.js` | Added lockedRotationX property | Store lock value |
| `js/utils/StageManager.js` | Modified _applyValues | Enforce lock every frame |
| `js/utils/StageManager.js` | Added getter/setter methods | Control lock value |
| `js/App.js` | Modified getCapturedState | Exclude RotX from capture |

### Code References

**Lock storage** (StageManager.js:79):
```javascript
this.lockedRotationX = 0.0001;
```

**Lock enforcement** (_applyValues method):
```javascript
// Always set to locked value, ignore interpolated value
if (this.app && this.app.setConnectomeRotX) {
    this.app.setConnectomeRotX(this.lockedRotationX);
}
```

**Capture exclusion** (App.js:getCapturedState):
```javascript
// NOTE: connectomeRotX is LOCKED (not captured)
state.connectomeRotY = this.connectomeLogo.rotation.y;
state.connectomeRotZ = this.connectomeLogo.rotation.z;
```

---

## Summary

✅ **Logo X-axis rotation is locked** - stays at 0.0001 radians always
✅ **Logo Y-axis rotation is free** - can vary per stage, interpolates smoothly
✅ **Logo Z-axis rotation is free** - can vary per stage, interpolates smoothly
✅ **No wobble** - X-axis never changes during transitions
✅ **Stable appearance** - logo maintains consistent level angle
✅ **Configurable** - lock value can be changed if needed

---

## Console Quick Reference

```javascript
// Check lock status
window.reactomeApp.stageManager.getLockedRotationX()

// Change lock value (if needed)
window.reactomeApp.stageManager.setLockedRotationX(0.0001)

// Enable debug to see rotation details
window.reactomeApp.stageManager.setDebugMode(true)

// Transition with all rotations visible
window.reactomeApp.transitionToStage(2, { captureActualState: true })
```

---

**Implementation Status**: ✅ COMPLETE - Logo rotation X is locked and stable
