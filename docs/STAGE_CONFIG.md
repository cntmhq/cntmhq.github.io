# Stage Navigation Configuration Guide

## Quick Overview

Your app has **9 navigation stages** that transition smoothly between different camera distances, opacity levels, and visual styles. The nav buttons automatically track which stage is active, even after page reloads.

## Stage List

| Stage | Name | Purpose |
|-------|------|---------|
| 0 | **Initial** | Starting state - zoomed out, minimal visibility |
| 1 | **Reveal** | First transition - opacity increases, materials refresh |
| 2 | **Focus** | Mid-zoom - camera gets closer, logo descends |
| 3 | **Test** | Deep focus - extreme zoom into reactor core |
| 4 | **Void** | Extreme zoom - minimal distance, minimal opacity |
| 5 | **SRE** | Site Reliability Engineering view - custom params |
| 6 | **SEC** | Security view - custom params |
| 7 | **DEV** | Development view - custom params |
| 8 | **OPS** | Operations view - zoomed back out |

## How to Customize Stage Parameters

### Location
File: `js/utils/StageManager.js` (constructor method, lines ~80-215)

### Example: Adjusting Camera Distance for a Stage

```javascript
// Stage 5: SRE - Site Reliability Engineering view
{
    name: 'SRE',
    values: {
        cameraDistance: 0.6,  // ← Change this to zoom in/out
        opacity: 0.14,        // ← Change visibility
        connectomePosY: 0.50, // ← Change logo height
        // ... other params
    }
}
```

### Common Parameters to Adjust

| Parameter | Range | Effect |
|-----------|-------|--------|
| `cameraDistance` | 0.3 - 6.0 | Zoom level (lower = closer) |
| `opacity` | 0.02 - 1.0 | Object visibility |
| `connectomePosX` | -1 to 1 | Logo horizontal position |
| `connectomePosY` | -3 to 3 | Logo vertical position |
| `connectomeRoughness` | 0 - 1 | Material finish (1.0 = rough) |
| `connectomeMetalness` | 0 - 1 | Material shine (1.0 = shiny) |
| `headerOpacity` | 0 - 1 | Header text visibility |
| `headerPosY` | Any | Header vertical position |

## How Changes Work

✅ **Changes apply automatically:**
- Edit any parameter in the `values` object
- Save the file
- Refresh your browser (or just click the stage button)
- The transition uses the new values immediately

## Button State Persistence

✅ **Active button tracking:**
- The `active` class is assigned to the current stage button
- State is saved to `localStorage` when you click a button
- On page reload, the last viewed stage is restored
- If no saved state exists, stage 0 (Initial) is active by default

## Files Involved

- **js/utils/StageManager.js** - Stage definitions and transitions
- **js/main.js** - Button event handlers and state management
- **index.html** - Button elements with IDs `stage-1-btn` through `stage-9-btn`

## Testing Your Changes

1. Edit a `cameraDistance` value in StageManager.js
2. Save the file
3. Refresh browser or click the stage button
4. Watch the camera smoothly transition to new distance

---

**No restarts needed!** Changes take effect immediately when buttons are clicked.
