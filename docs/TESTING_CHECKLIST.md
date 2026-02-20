# State Synchronization Testing Checklist

## Quick Start
```bash
cd /home/qlb/projects/skills/reactome
python3 -m http.server 8000
# Open http://localhost:8000 in browser
```

## Browser Console Debug Helpers
```javascript
// Check current state
window.reactomeApp.getCapturedState();

// Monitor transitions
window.reactomeApp.isTransitioning();

// Get stage manager
window.reactomeApp.stageManager.currentValues;

// Manually capture state
const state = window.reactomeApp.getCapturedState();
console.log('Camera distance:', state.cameraDistance);
console.log('Camera Z offset:', state.cameraZ);
```

## Test Scenarios

### Test 1: Manual Zoom Before Transition ✓
**Purpose**: Verify camera distance is captured from actual position, not stale value

**Steps**:
1. Load app
2. Use mouse wheel to zoom IN (camera distance decreases)
3. Verify camera moved closer to center
4. Click "Focus" stage button
5. **Expected**: Camera animates smoothly from current position to Focus target
6. **Watch for**: NO JUMP or CLIP at animation start

**Pass Criteria**:
- ✅ Camera moves smoothly without jumping
- ✅ Animation is continuous (no freeze/glitch)
- ✅ No clipping or out-of-bounds movement

---

### Test 2: Multiple Interactions Before Transition ✓
**Purpose**: Verify state capture works after multiple user interactions

**Steps**:
1. Load app
2. Zoom IN with mouse wheel
3. Zoom OUT with mouse wheel
4. Zoom IN again (end at 2.0 distance)
5. Click "Test" button
6. **Expected**: Smooth animation from 2.0 to Test target (0.62)

**Pass Criteria**:
- ✅ Camera distance is ~2.0 before transition
- ✅ Animates smoothly to 0.62
- ✅ No jumps or discontinuities

---

### Test 3: Automatic Z-Motion Preservation ✓
**Purpose**: Verify camera Z-axis offset is preserved during transition

**Steps**:
1. Load app
2. Watch camera for ~2 seconds (observe Z-oscillation from waves)
3. While camera is oscillating, click any stage button
4. **Expected**: Z-motion continues smoothly through transition

**Pass Criteria**:
- ✅ Camera Z continues oscillating
- ✅ Oscillation frequency unchanged
- ✅ Distance animates while Z-motion continues

---

### Test 4: Rapid Stage Transitions ✓
**Purpose**: Verify system prevents overlapping transitions

**Steps**:
1. Click "Focus" button
2. Immediately click "Test" button (before Focus animation ends)
3. **Expected**: Second click ignored, Focus completes first

**Pass Criteria**:
- ✅ Only one transition happens
- ✅ No glitches or double animations
- ✅ Second click queued or ignored gracefully

---

### Test 5: Stage Navigation Links ✓
**Purpose**: Verify navigation link state capture

**Steps**:
1. Zoom camera manually
2. Click navigation link (e.g., "SRE")
3. **Expected**: Smooth transition from actual position to SRE stage

**Pass Criteria**:
- ✅ Smooth animation without jumps
- ✅ Article appears after transition
- ✅ Camera distance updates correctly

---

### Test 6: Reset Button ✓
**Purpose**: Verify reset button captures state before returning to Initial

**Steps**:
1. Navigate to multiple stages (zoom at each one)
2. Click "Reset" button
3. **Expected**: Returns to Initial stage smoothly from current position

**Pass Criteria**:
- ✅ Smooth transition back to Initial
- ✅ No jump or clip
- ✅ All properties reset to Initial values

---

### Test 7: Logo Opacity Transitions ✓
**Purpose**: Verify connectome logo opacity animates smoothly

**Steps**:
1. Load app (Connectome logo visible)
2. Transition to "Void" stage (logo becomes more metallic)
3. Transition to "SRE" stage (logo opacity/appearance changes)
4. **Expected**: Smooth material transitions

**Pass Criteria**:
- ✅ Logo metalness animates smoothly
- ✅ Logo opacity transitions gradually
- ✅ No popping or instant changes

---

### Test 8: First Load State Restore ✓
**Purpose**: Verify saved stage restores without animation

**Steps**:
1. Navigate to "SRE" stage (duration 1000ms animation)
2. Wait for animation to complete
3. Refresh page
4. **Expected**: Page instantly restores to SRE stage (no 1000ms animation)

**Pass Criteria**:
- ✅ Saved stage loads immediately
- ✅ No animation delay on first load
- ✅ Camera at correct position

---

### Test 9: Opacity Capture and Sync ✓
**Purpose**: Verify reactor object opacity is captured

**Steps**:
1. Adjust "Opacity" slider to 0.3
2. Click stage button
3. **Expected**: Opacity animates from 0.3 to stage target

**Pass Criteria**:
- ✅ Captured opacity matches slider position
- ✅ Animates smoothly to new stage value
- ✅ No instant jumps in visibility

---

### Test 10: Header Animation ✓
**Purpose**: Verify header opacity and position animate smoothly

**Steps**:
1. Observe header opacity (should vary with stages)
2. Transition between stages
3. **Expected**: Header opacity/position animate smoothly

**Pass Criteria**:
- ✅ Header opacity transitions gradually
- ✅ Header position/rotation animate smoothly
- ✅ Text remains readable during transitions

---

## Performance Validation

### Frame Rate During Transitions
- Open DevTools → Performance tab
- Trigger stage transition
- **Expected**: 60 FPS maintained during animation

**Pass Criteria**:
- ✅ No frame drops below 55 FPS
- ✅ Smooth animation throughout

### Memory During Transitions
- Open DevTools → Memory tab
- Trigger 5+ stage transitions
- **Expected**: No garbage collection spikes

**Pass Criteria**:
- ✅ Memory stable, no major jumps
- ✅ No memory leaks over time

---

## Regression Testing

### Existing Features Still Work
- ✅ Manual camera zoom still responds to mouse wheel
- ✅ Orbit controls still rotate/pan camera
- ✅ Slider controls update values in real-time
- ✅ Color picker changes reactor/logo color
- ✅ Wireframe toggle works
- ✅ Glitch effect toggles work
- ✅ Shader effect toggles work

### Browser Compatibility
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari (iPad)

---

## Visual Inspection Checklist

| Feature | Before Transition | During Transition | After Transition | Status |
|---------|------------------|-------------------|------------------|--------|
| Camera distance | Actual position | Smooth interpolation | Target value | ✅ |
| Camera Z offset | Varies naturally | Preserved oscillation | Continuous | ✅ |
| Logo opacity | Current value | Smooth fade | Stage target | ✅ |
| Logo metalness | Current value | Smooth change | Stage target | ✅ |
| Header opacity | Current value | Smooth transition | Stage target | ✅ |
| Reactor opacity | Current value | Smooth transition | Stage target | ✅ |
| Articles | None or visible | Smooth close | None or new open | ✅ |

---

## Common Issues & Solutions

### Issue: Camera jumps at start of transition
**Diagnosis**: `captureActualState` not enabled
**Solution**: Verify all `transitionToStage()` calls include `captureActualState: true`

### Issue: Transition feels jittery
**Diagnosis**: Frame rate drops
**Solution**: Check DevTools Performance tab, reduce effect complexity

### Issue: Z-motion stops during transition
**Diagnosis**: Z-motion being overridden by animation
**Solution**: Verify `cameraZ` is captured and preserved

### Issue: State doesn't capture correctly
**Diagnosis**: `getCapturedState()` returning undefined
**Solution**: Check app instance is initialized before capture

---

## Sign-Off

- [ ] Test 1 passed
- [ ] Test 2 passed
- [ ] Test 3 passed
- [ ] Test 4 passed
- [ ] Test 5 passed
- [ ] Test 6 passed
- [ ] Test 7 passed
- [ ] Test 8 passed
- [ ] Test 9 passed
- [ ] Test 10 passed
- [ ] Performance validation passed
- [ ] Regression testing passed
- [ ] Browser compatibility verified

**Tester**: _________________
**Date**: _________________
**Notes**: _________________
