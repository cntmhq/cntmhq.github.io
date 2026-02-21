/**
 * StageManager - Handles smooth transitions between configuration stages
 * Provides utility functions for lerping values and managing stage state
 *
 * ========== QUICK START ==========
 * The app has 9 navigation stages that can be customized:
 * 0. Initial   - Starting state
 * 1. Reveal    - First transition
 * 2. Focus     - Mid-zoom
 * 3. Test      - Deep focus
 * 4. Void      - Extreme zoom
 * 5. SRE       - Site Reliability Engineering view
 * 6. SEC       - Security view
 * 7. DEV       - Development view
 * 8. OPS       - Operations view (zoomed back out)
 *
 * To customize: Find the stage you want in the constructor's this.stages array
 * and modify the values object. All changes apply immediately.
 *
 * Buttons automatically show which stage is active on page load and after clicks.
 * ===================================
 */

/**
 * Easing functions for smooth animations
 */
export const Easing = {
    // Linear (no easing)
    linear: t => t,

    // Quadratic
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    // Cubic
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    // Smooth (sine-based)
    easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: t => Math.sin((t * Math.PI) / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

    // Exponential
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    }
};

/**
 * Linear interpolation between two values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * StageManager class for managing stage transitions
 */
export class StageManager {
    constructor(app) {
        this.app = app;
        this.currentStage = 0;
        this.isTransitioning = false;
        this.transitionDuration = 2500; // ms
        this.defaultEasing = Easing.easeInOutCubic;
        this.storageKey = 'reactome-current-stage';
        this.debugMode = false; // Set to true to log material animations
        this.lockedRotationX = 0.0001; // Logo rotation X locked to prevent wobble

        // Define the nine stages
        //
        // ========== PARAMETER GUIDE ==========
        // All stage parameters are customizable below. Changes take effect immediately.
        //
        // Common Parameters:
        // - cameraDistance: Zoom level (0.3 = extreme zoom, 6.0 = zoomed out)
        // - opacity: Object visibility (0.02 = barely visible, 0.14 = clearly visible)
        // - connectomeOpacity: Logo visibility (0.0 = hidden, 1.0 = fully visible)
        // - connectomeMetalness: Logo metalness/shine (0.0 = matte, 1.0 = shiny/reflective)
        // - connectomePosX: Logo horizontal position (-1 = left, 1 = right)
        // - connectomePosY: Logo vertical position (higher = above reactor)
        // - connectomeRoughness: Material finish (0.4 = smooth, 1.0 = rough)
        // - csignetMetalness: C Signet visibility via metalness (0.0 = hidden, 1.0 = visible)
        // - headerOpacity: Header text visibility (0.0 = hidden, 1.0 = fully visible)
        // - headerPosY: Header vertical position
        //
        // To adjust: Edit the values object for each stage below
        // Changes apply when buttons are clicked or page reloads
        // ====================================
        //
        this.stages = [
            // Stage 0: Initial/Default state (current defaults from App.js)
            {
                name: 'Initial',
                values: {
                    cameraDistance: 6.0,
                    opacity: 0.02,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.9,
                    connectomePosX: 0.8,
                    connectomePosY: 3.0,
                    connectomePosZ: 0.0001,
                    connectomeRoughness: 1.0,
                    csignetMetalness: 0.1,
                    headerOpacity: 0.0,
                    headerPosX: 0.90,
                    headerPosY: 3.15,
                    headerScale: 0.75
                }
            },
            // Stage 1: Reveal - material transitions, reactor becomes visible
            {
                name: 'Reveal',
                values: {
                    cameraDistance: 6.0,
                    opacity: 0.14,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.125,
                    connectomePosX: 0.80,
                    connectomePosY: 3.00,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.8,
                    csignetMetalness: 0.15,
                    headerOpacity: 0.7,
                    headerPosX: 0.90,
                    headerPosY: 3.10
                }
            },
            // Stage 2: Focus - logo descends, camera zooms in
            {
                name: 'Focus',
                values: {
                    cameraDistance: 4.0,
                    opacity: 0.14,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.2,
                    connectomePosX: 0.80,
                    connectomePosY: 1.00,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.9,
                    csignetMetalness: 0.25,
                    headerOpacity: 0.8,
                    headerPosX: 0.90,
                    headerPosY: 1.15
                }
            },
            // Stage 3: Test - logo descends further, camera zooms in
            {
                name: 'Test',
                values: {
                    cameraDistance: 0.62,
                    opacity: 0.14,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.5,
                    connectomePosX: 0.80,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.4,
                    csignetMetalness: 0.4,
                    headerOpacity: 0.8,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            },
            // Stage 4: Void - extreme zoom, minimal opacity
            {
                name: 'Void',
                values: {
                    cameraDistance: 0.5,
                    opacity: 0.14,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.8,
                    connectomePosX: 0.80,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.4,
                    csignetMetalness: 0.5,
                    headerOpacity: 0.8,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            },
            // Stage 5: SRE - Site Reliability Engineering view
            {
                name: 'SRE',
                values: {
                    cameraDistance: 0.49,
                    opacity: 0.1,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.1,
                    connectomePosX: 0.80,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.8,
                    csignetMetalness: 0.35,
                    headerOpacity: 0.8,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            },
            // Stage 6: SEC - Security view
            {
                name: 'SEC',
                values: {
                    // cameraDistance: 0.55,
                    cameraDistance: 0.1,
                    opacity: 0.075,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.5,
                    // connectomePosX: 0.155,
                    connectomePosX: 0.80,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.8,
                    csignetMetalness: 0.15,
                    headerOpacity: 0.0,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            },
            // Stage 7: DEV - Development view
            {
                name: 'DEV',
                values: {
                    cameraDistance: 0.59,
                    opacity: 0.1,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.5,
                    connectomePosX: 0.638,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.6,
                    csignetMetalness: 0.2,
                    headerOpacity: 0.0,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            },
            // Stage 8: OPS - Operations view
            {
                name: 'OPS',
                values: {
                    cameraDistance: 0.59,
                    opacity: 0.1,
                    connectomeOpacity: 1.0,
                    connectomeMetalness: 0.5,
                    connectomePosX: -0.10,
                    connectomePosY: 0.50,
                    connectomePosZ: 0.00,
                    connectomeRoughness: 0.6,
                    csignetMetalness: 0.3,
                    headerOpacity: 0.0,
                    headerPosX: 0.90,
                    headerPosY: 0.55
                }
            }

        ];

        // Store current animated values with media query adjustments
        // Apply responsive adjustments on initial load
        const initialStageValues = { ...this.stages[0].values };
        this.currentValues = this.applyMediaQueryAdjustments(initialStageValues);
    }

    /**
     * Get the current stage index
     * @returns {number} Current stage index
     */
    getCurrentStage() {
        return this.currentStage;
    }

    /**
     * Get stage configuration by index
     * @param {number} index - Stage index
     * @returns {Object} Stage configuration
     */
    getStage(index) {
        return this.stages[index] || null;
    }

    /**
     * Transition to a specific stage
     * @param {number} targetStage - Target stage index (0-8: Initial, Reveal, Focus, Test, Void, SRE, SEC, DEV, OPS)
     * @param {Object} options - Transition options
     * @param {number} options.duration - Transition duration in ms
     * @param {Function} options.easing - Easing function
     * @param {Function} options.onComplete - Callback when transition completes
     * @param {boolean} options.captureActualState - Capture actual app state before transition (prevents glitches)
     * @returns {Promise} Resolves when transition completes
     */
    transitionTo(targetStage, options = {}) {
        if (this.isTransitioning) {
            console.warn('StageManager: Already transitioning');
            return Promise.resolve();
        }

        if (targetStage < 0 || targetStage >= this.stages.length) {
            console.error('StageManager: Invalid stage index:', targetStage);
            return Promise.reject(new Error('Invalid stage index'));
        }

        // Capture actual state if requested (recommended for smooth transitions)
        if (options.captureActualState && this.app?.getCapturedState) {
            const actualState = this.app.getCapturedState();
            this.syncActualState(actualState);
        }

        const duration = options.duration || this.transitionDuration;
        const easing = options.easing || this.defaultEasing;
        const onComplete = options.onComplete || (() => {});

        const startValues = { ...this.currentValues };
        let targetValues = this.stages[targetStage].values;

        // Apply media query adjustments to target values
        targetValues = this.applyMediaQueryAdjustments(targetValues);

        return new Promise((resolve) => {
            this.isTransitioning = true;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const progress = easing(rawProgress);

                // Interpolate all values
                for (const key in targetValues) {
                    if (startValues.hasOwnProperty(key)) {
                        this.currentValues[key] = lerp(startValues[key], targetValues[key], progress);
                    }
                }

                // Debug logging for material property animations (when enabled)
                if (this.debugMode && rawProgress > 0 && rawProgress < 1) {
                    // Log every 5th frame to avoid spam (every ~83ms at 60fps)
                    if (Math.round(rawProgress * 100) % 5 === 0) {
                        const logValues = {};

                        // Material properties
                        if (this.currentValues.connectomeMetalness !== undefined) {
                            logValues.metalness = this.currentValues.connectomeMetalness.toFixed(3);
                        }
                        if (this.currentValues.connectomeRoughness !== undefined) {
                            logValues.roughness = this.currentValues.connectomeRoughness.toFixed(3);
                        }
                        if (this.currentValues.connectomeOpacity !== undefined) {
                            logValues.opacity = this.currentValues.connectomeOpacity.toFixed(3);
                        }

                        // Position
                        if (this.currentValues.connectomePosX !== undefined) {
                            logValues.posX = this.currentValues.connectomePosX.toFixed(2);
                        }

                        // Camera
                        if (this.currentValues.cameraDistance !== undefined) {
                            logValues.cameraDistance = this.currentValues.cameraDistance.toFixed(2);
                        }

                        // Only log if we have material properties to show
                        if (Object.keys(logValues).length > 0) {
                            console.log(`%c[${Math.round(rawProgress * 100)}%] Animation: ${JSON.stringify(logValues)}`, 'color: #1cb495; font-size: 11px;');
                        }
                    }
                }

                // Apply values to the app
                this._applyValues(this.currentValues);

                if (rawProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final values are exact
                    this.currentValues = { ...targetValues };
                    this._applyValues(this.currentValues);

                    this.currentStage = targetStage;
                    this.isTransitioning = false;

                    // Final debug log
                    if (this.debugMode) {
                        console.log('%c✓ Animation complete! Final values applied.', 'color: #1cb495; font-weight: bold;');
                    }

                    onComplete();
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Apply current values to the app
     * Smoothly interpolates all material properties and transforms
     * @param {Object} values - Values to apply
     */
    _applyValues(values) {
        if (!this.app) return;

        // ========== Camera Properties ==========
        if (values.cameraDistance !== undefined) {
            this.app.setCameraDistance(values.cameraDistance);
        }
        if (values.cameraZ !== undefined) {
            // cameraZ is handled by automatic motion, just ensure it's not overridden
        }

        // ========== Reactor Objects ==========
        if (values.opacity !== undefined) {
            this.app.setOpacity(values.opacity);
        }

        // ========== Connectome Logo - Material Properties (Smooth) ==========
        if (values.connectomeMetalness !== undefined) {
            this.app.setConnectomeMetalness(values.connectomeMetalness);
        }
        if (values.connectomeRoughness !== undefined) {
            this.app.setConnectomeRoughness(values.connectomeRoughness);
        }
        if (values.connectomeOpacity !== undefined) {
            this.app.setConnectomeOpacity(values.connectomeOpacity);
        }

        // ========== Connectome Logo - Position (Smooth) ==========
        if (values.connectomePosX !== undefined) {
            this.app.setConnectomePosX(values.connectomePosX);
        }
        if (values.connectomePosY !== undefined) {
            this.app.setConnectomePosY(values.connectomePosY);
        }
        if (values.connectomePosZ !== undefined) {
            this.app.setConnectomePosZ(values.connectomePosZ);
        }

        // ========== Connectome Logo - Rotation (Smooth) ==========
        // Note: connectomeRotX is LOCKED (not interpolated) to prevent logo wobble
        // Always set to fixed value to ensure stability
        if (this.app && this.app.setConnectomeRotX) {
            this.app.setConnectomeRotX(this.lockedRotationX);
        }

        if (values.connectomeRotY !== undefined) {
            this.app.setConnectomeRotY(values.connectomeRotY);
        }
        if (values.connectomeRotZ !== undefined) {
            this.app.setConnectomeRotZ(values.connectomeRotZ);
        }

        // ========== C Signet - Material Properties (Smooth) ==========
        if (values.csignetMetalness !== undefined) {
            this.app.setCSignetMetalness(values.csignetMetalness);
        }

        // ========== Header - Scale & Opacity (Smooth) ==========
        if (values.headerScale !== undefined) {
            this.app.setHeaderScale(values.headerScale);
        }
        if (values.headerOpacity !== undefined) {
            this.app.setHeaderOpacity(values.headerOpacity);
        }

        // ========== Header - Position (Smooth) ==========
        if (values.headerPosX !== undefined) {
            this.app.setHeaderPosX(values.headerPosX);
        }
        if (values.headerPosY !== undefined) {
            this.app.setHeaderPosY(values.headerPosY);
        }
        if (values.headerPosZ !== undefined) {
            this.app.setHeaderPosZ(values.headerPosZ);
        }

        // ========== Header - Rotation (Smooth) ==========
        if (values.headerRotX !== undefined) {
            this.app.setHeaderRotX(values.headerRotX);
        }
        if (values.headerRotY !== undefined) {
            this.app.setHeaderRotY(values.headerRotY);
        }
        if (values.headerRotZ !== undefined) {
            this.app.setHeaderRotZ(values.headerRotZ);
        }
    }

    /**
     * Transition to next stage
     * @param {Object} options - Transition options
     * @returns {Promise} Resolves when transition completes
     */
    next(options = {}) {
        const nextStage = Math.min(this.currentStage + 1, this.stages.length - 1);
        return this.transitionTo(nextStage, options);
    }

    /**
     * Transition to previous stage
     * @param {Object} options - Transition options
     * @returns {Promise} Resolves when transition completes
     */
    previous(options = {}) {
        const prevStage = Math.max(this.currentStage - 1, 0);
        return this.transitionTo(prevStage, options);
    }

    /**
     * Reset to initial stage immediately (no animation)
     */
    reset() {
        this.currentStage = 0;
        const stageValues = { ...this.stages[0].values };
        // Apply media query adjustments to initial stage
        this.currentValues = this.applyMediaQueryAdjustments(stageValues);
        this._applyValues(this.currentValues);
    }

    /**
     * Set transition duration
     * @param {number} duration - Duration in ms
     */
    setTransitionDuration(duration) {
        this.transitionDuration = duration;
    }

    /**
     * Set default easing function
     * @param {Function} easing - Easing function
     */
    setDefaultEasing(easing) {
        this.defaultEasing = easing;
    }

    /**
     * Check if currently transitioning
     * @returns {boolean} True if transitioning
     */
    getIsTransitioning() {
        return this.isTransitioning;
    }

    /**
     * Apply media query adjustments to stage values
     * Modifies stage position values based on viewport width
     * @param {Object} values - Stage values to adjust
     * @returns {Object} Adjusted values
     */
    applyMediaQueryAdjustments(values) {
        const isMobile = window.innerWidth < 720;
        const adjusted = { ...values };

        if (isMobile) {
            // Mobile adjustments (< 720px)
            // Move logo left and center header
            adjusted.connectomePosX = -0.10;
            adjusted.connectomePosY = 1.50;
            adjusted.headerPosX = 0.00;
            adjusted.headerPosY = 1.60;
        } else {
            // Desktop adjustments (>= 720px) - use original stage values
            // connectomePosX and headerPosX are already set in stage definition
        }

        return adjusted;
    }

    /**
     * Update a stage's values (for dynamic configuration)
     * @param {number} stageIndex - Stage index
     * @param {Object} values - New values to merge
     */
    updateStageValues(stageIndex, values) {
        if (this.stages[stageIndex]) {
            this.stages[stageIndex].values = {
                ...this.stages[stageIndex].values,
                ...values
            };
        }
    }

    /**
     * Synchronize actual captured state into currentValues
     * Called before transitions to ensure animations start from actual app state,
     * not stale target values. Prevents glitches from user interaction or automatic motion.
     *
     * @param {Object} capturedState - State captured from app via getCapturedState()
     */
    syncActualState(capturedState) {
        if (!capturedState || typeof capturedState !== 'object') {
            return;
        }

        // Merge captured state into current values
        // Only update keys that exist in the captured state
        this.currentValues = {
            ...this.currentValues,
            ...capturedState
        };
    }

    /**
     * Save current stage to localStorage
     * Called after successful stage transition
     */
    saveState() {
        try {
            localStorage.setItem(this.storageKey, this.currentStage.toString());
        } catch (error) {
            console.warn('StageManager: Failed to save state to localStorage', error);
        }
    }

    /**
     * Load saved stage from localStorage
     * Returns saved stage index or null if not found
     *
     * NOTE: When you modify stage values in this file and refresh:
     * - If a stage was previously saved to localStorage, it will be restored
     * - The NEW values you edited will apply when that stage loads
     * - To see changes to a stage: either click that stage button, or
     *   clear the saved state with: localStorage.removeItem('reactome-current-stage')
     *
     * @returns {number|null} Saved stage index or null
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved !== null) {
                const stageIndex = parseInt(saved, 10);
                // Validate stage index is within bounds
                if (stageIndex >= 0 && stageIndex < this.stages.length) {
                    return stageIndex;
                }
            }
        } catch (error) {
            console.warn('StageManager: Failed to load state from localStorage', error);
        }
        return null;
    }

    /**
     * Clear saved state from localStorage
     */
    clearState() {
        try {
            localStorage.removeItem(this.storageKey);
            this.currentStage = 0;
            this.currentValues = { ...this.stages[0].values };
            this._applyValues(this.currentValues);
        } catch (error) {
            console.warn('StageManager: Failed to clear state from localStorage', error);
        }
    }

    /**
     * Enable/disable debug logging for material property animations
     * Logs interpolated values for metalness, roughness, opacity, positions, rotations
     *
     * Usage in browser console:
     *   window.reactomeApp.stageManager.setDebugMode(true)
     *   window.reactomeApp.stageManager.setDebugMode(false)
     *
     * @param {boolean} enabled - Whether to log animations
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (enabled) {
            console.log('%c🔍 Material Animation Debug Mode: ENABLED', 'color: #1cb495; font-weight: bold; font-size: 14px;');
            console.log('%cWatching properties:', 'color: #1cb495; font-weight: bold;');
            console.log('  • connectomeMetalness - smoothly transitions (0-1)');
            console.log('  • connectomeRoughness - smoothly transitions (0-1)');
            console.log('  • connectomeOpacity - smoothly transitions (0-1)');
            console.log('  • connectomePosX, Y, Z - position interpolation');
            console.log('  • connectomeRotY, Z - rotation interpolation');
            console.log('  • connectomeRotX - LOCKED (prevented from wobbling)');
            console.log('  • headerOpacity, headerScale - smooth opacity/scale');
            console.log('  • csignetMetalness - visibility fade');
            console.log('');
            console.log('%cYou will see logs every frame during transitions showing values being interpolated', 'color: #aaa; font-style: italic;');
        } else {
            console.log('%c🔍 Material Animation Debug Mode: DISABLED', 'color: #666; font-weight: bold; font-size: 14px;');
        }
    }

    /**
     * Get current debug mode status
     * @returns {boolean} Whether debug mode is enabled
     */
    getDebugMode() {
        return this.debugMode;
    }

    /**
     * Lock the logo's X-axis rotation to prevent wobble during transitions
     * The rotation X is held at a fixed value instead of interpolating
     *
     * @param {number} lockValue - The fixed rotation X value (default: 0.0001 radians)
     */
    setLockedRotationX(lockValue) {
        this.lockedRotationX = lockValue;
        console.log(`%c🔒 Logo Rotation X locked to: ${lockValue}`, 'color: #1cb495; font-weight: bold;');
    }

    /**
     * Get the current locked rotation X value
     * @returns {number} Current locked rotation X value
     */
    getLockedRotationX() {
        return this.lockedRotationX;
    }
}
