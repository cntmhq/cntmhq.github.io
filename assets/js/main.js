import { ReactomeApp, CSignetApp, DEFAULT_CONFIG } from './App.js';
import { StatusMonitor } from './utils/StatusMonitor.js';
/**
    THIS IS A TEMPLATE THAT SHOULD BE USED EVERY TIME AND MODIFIED.
    WHAT TO KEEP:
    ✓ Overall structure
    ✓ Default app options (container, colors, camera, object)

    WHAT TO CREATIVELY EDIT:
    ✗ The parameters (define what YOUR art needs)
    ✗ The UI controls (match YOUR parameters)

    Let your philosophy guide the implementation.
    The world is your oyster - be creative!
**/
/**
 * Main entry point
 * Initializes the Reactome visualization and connects UI controls
 * Syncs UI elements with default configuration values on load
 */

let app = null;
let cSignetApp = null;
let statusMonitor = null;

// C Signet click counter for revealing hidden UI elements
let cSignetClickCount = 0;
const cSignetClickThreshold = 3;
let cSignetClickResetTimer = null;

// URL routing mapping
const urlRouteMap = {
    'env': 1,
    'sre': 5,
    'sec': 6,
    'dev': 7,
    'ops': 8,
    'about': 'about'  // Special route for About Us article
};

const stageToUrlMap = {
    0: '',        // Initial (no hash)
    1: 'env',
    2: '',        // Internal
    3: '',        // Internal
    4: '',        // Internal
    5: 'sre',
    6: 'sec',
    7: 'dev',
    8: 'ops',
    9: '',        // Internal
    'about': 'about'  // About Us article route
};

// Stage button references for global access
let stageButtons = {
    stage1: null,
    stage2: null,
    stage3: null,
    stage4: null,
    stage5: null,
    stage6: null,
    stage7: null,
    stage8: null,
    stage9: null
};

/**
 * Update URL hash to reflect current stage
 */
function updateUrlFromStage(stageIndex) {
    const urlRoute = stageToUrlMap[stageIndex] || '';
    const newHash = urlRoute ? `#${urlRoute}` : '';

    // Only update if different to avoid triggering hashchange listener
    if (window.location.hash !== newHash) {
        window.location.hash = newHash;
    }
}

/**
 * Navigate to stage based on URL hash
 */
function navigateFromUrl() {
    const hash = window.location.hash.replace('#', '').toLowerCase();

    if (!hash) {
        // No hash = initial stage
        if (app && app.getCurrentStage() !== 0) {
            transitionToStageWithUrl(0, { duration: 1000 });
        }
        return;
    }

    // Check if it's the about route
    if (hash === 'about') {
        showArticle('about-article');
        return;
    }

    const stageIndex = urlRouteMap[hash];
    if (stageIndex !== undefined && app) {
        transitionToStageWithUrl(stageIndex, { duration: 1000 });
    }
}

/**
 * Setup URL routing listeners
 */
function setupUrlRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', navigateFromUrl);

    // Handle initial URL on page load
    setTimeout(() => {
        navigateFromUrl();
    }, 100);
}

/**
 * Transition to stage and update URL
 */
function transitionToStageWithUrl(stageIndex, options = {}) {
    if (!app) return Promise.resolve();

    // Wrap the onComplete callback to update URL
    const originalOnComplete = options.onComplete;
    options.onComplete = () => {
        if (originalOnComplete) {
            originalOnComplete();
        }
        updateUrlFromStage(stageIndex);
    };

    // Call the actual app transition
    return app.transitionToStage(stageIndex, options);
}

/**
 * Initialize GCP status monitor
 * Fetches incident data and updates glitch effect parameters
 */
function initializeStatusMonitor() {
    statusMonitor = new StatusMonitor((glitchParams, incidents) => {
        if (!app) return;

        // Update glitch effect parameters based on incident count
        app.setGlitchIntensity(glitchParams.intensity);
        app.setGlitchSpeed(glitchParams.speed);
        app.setGlitchBlockSize(glitchParams.blockSize);
        app.setGlitchColorSeparation(glitchParams.colorSeparation);

        // Update UI indicator
        updateStatusIndicator(glitchParams.incidentCount, incidents);

        console.log(
            `[GCP Status] ${glitchParams.incidentCount} incident(s) detected. Glitch intensity: ${glitchParams.intensity.toFixed(2)}`
        );
    });

    // Start monitoring
    statusMonitor.start();
}

/**
 * Update status indicator UI
 */
function updateStatusIndicator(incidentCount, incidents) {
    const indicator = document.getElementById('gcp-status-indicator');
    if (!indicator) return;

    indicator.textContent = `GCP: ${incidentCount === 0 ? '✓ All Clear' : `⚠ ${incidentCount} incident${incidentCount > 1 ? 's' : ''}`}`;
    indicator.className = 'gcp-status-indicator ' + (incidentCount === 0 ? 'status-clear' : 'status-active');

    // Show tooltip with incident details
    if (incidentCount > 0 && incidents.length > 0) {
        const details = incidents
            .slice(0, 3) // Show first 3 incidents
            .map(i => i.title || 'Unknown')
            .join(', ');
        indicator.title = `Active: ${details}${incidents.length > 3 ? '...' : ''}`;
    } else {
        indicator.title = 'Google Cloud Platform status is normal';
    }
}

/**
 * Restore previously saved stage after app initialization
 */
function restoreSavedStage() {
    if (!app || !app.stageManager) return;

    const savedStage = app.stageManager.loadState();

    // Map stages to their articles
    const stageArticles = {
        // 1: 'cntm-article',
        5: 'sre-article',
        6: 'sec-article',
        7: 'dev-article',
        8: 'ops-article'
    };

    if (savedStage !== null && savedStage !== 0) {
        // Transition to saved stage without animation on first load
        // Note: captureActualState not needed on page load since states are fresh
        transitionToStageWithUrl(savedStage, {
            duration: 0,
            onComplete: () => {
                console.log(`Restored to stage: ${app.stageManager.getStage(savedStage).name}`);
                updateStageButtonStates();
                updateNavigationLinkStates();

                // Show article for this stage if it exists
                if (stageArticles[savedStage]) {
                    showArticle(stageArticles[savedStage]);
                }
            }
        });
    } else {
        // No saved stage, ensure default (stage 0) is active
        transitionToStageWithUrl(1, {
            captureActualState: true,
            duration: 10000,
            onComplete: () => {
                updateStageButtonStates();
                updateNavigationLinkStates();
                app.stageManager.saveState();
            }
        });
    }
}

/**
 * Initialize hidden UI elements and C Signet click detection
 * Hides certain UI elements until user clicks C Signet 3 times in a row
 */
function initializeHiddenUIElements() {
    // C Signet click detection is handled by CSignetApp hitbox callbacks.
    // Keep this initializer for future hidden-UI setup.
}

/**
 * Handle C Signet clicks to reveal hidden UI elements
 */
function handleCSignetClick() {
    cSignetClickCount++;

    // Reset counter after 2 seconds of no clicks
    clearTimeout(cSignetClickResetTimer);
    cSignetClickResetTimer = setTimeout(() => {
        cSignetClickCount = 0;
    }, 2000);

    // If user has clicked 3 times, reveal hidden elements
    if (cSignetClickCount >= cSignetClickThreshold) {
        revealHiddenUIElements();
        cSignetClickCount = 0; // Reset counter after reveal
    }
}

/**
 * Reveal all hidden UI elements with animation
 */
function revealHiddenUIElements() {
    const hiddenElements = [
        'panel-toggle-btn',
        'gcp-status-indicator',
        'auto-cycle-floating-btn',
        'clear-history-floating-btn'
    ];

    hiddenElements.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
            // Stagger the reveal animation
            setTimeout(() => {
                // Remove inline styles to show element
                el.style.display = '';
                el.style.opacity = '';
                el.style.pointerEvents = '';

                // Add reveal animation class
                el.classList.add('reveal');

                // Remove reveal class after animation completes
                setTimeout(() => {
                    el.classList.remove('reveal');
                }, 400);
            }, index * 100); // Stagger each element by 100ms
        }
    });

    console.log('✓ Hidden UI elements revealed!');
}

/**
 * Initialize application
 */
function init() {
    // Create the main Reactome visualization app
    app = new ReactomeApp({
        container: document.body,
        backgroundColor: DEFAULT_CONFIG.backgroundColor,
        backgroundAlpha: DEFAULT_CONFIG.backgroundAlpha,
        primaryColor: DEFAULT_CONFIG.primaryColor,
        cameraDistance: DEFAULT_CONFIG.cameraDistance,
        objectCount: DEFAULT_CONFIG.objectCount
    });

    // Create the standalone C Signet app (320x320px)
    const cSignetContainer = document.getElementById('csignet-viewer');
    cSignetApp = new CSignetApp({
        container: cSignetContainer,
        size: 320,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        onSignetClick: () => {
            handleCSignetClick();

            if (!app || app.isTransitioning()) return;
            if (app.getCurrentStage() === 1) return;

            // Keep C Signet click behavior aligned with nav clicks:
            // close any open article overlay before moving to Reveal.
            closeAllArticles();

            transitionToStageWithUrl(1, {
                captureActualState: true,
                duration: 1000,
                onComplete: () => {
                    updateStageButtonStates();
                    updateNavigationLinkStates();
                    app.stageManager.saveState();
                }
            });
        }
    });

    // Link CSignetApp to ReactomeApp for stage transitions
    app.setCSignetApp(cSignetApp);

    // Load C Signet and start if enabled
    if (DEFAULT_CONFIG.cSignetEnabled) {
        cSignetApp.loadCSignet({
            scale: DEFAULT_CONFIG.cSignetScale,
            xOffset: DEFAULT_CONFIG.cSignetPosX,
            yOffset: DEFAULT_CONFIG.cSignetPosY,
            zOffset: DEFAULT_CONFIG.cSignetPosZ
        }).then(() => {
            cSignetApp.start();
        });
    }

    // Start main animation
    app.start();

    // Initialize GCP status monitor (updates glitch based on incidents)
    initializeStatusMonitor();

    // Sync UI with defaults BEFORE setting up listeners
    syncUIWithDefaults();

    // Connect UI controls
    setupUIControls();

    // Load and restore previous stage if available
    restoreSavedStage();

    // Initialize hidden UI elements and C Signet click detection
    initializeHiddenUIElements();

    // Setup URL routing (hash-based navigation)
    setupUrlRouting();

    // Expose apps to window for debugging
    window.reactomeApp = app;
    window.cSignetApp = cSignetApp;
    window.statusMonitor = statusMonitor;

    // Debug helpers for stage management
    window.stageDebug = {
        clearSavedStage: () => {
            localStorage.removeItem('reactome-current-stage');
            console.log('✓ Saved stage cleared. Refresh to see Initial stage.');
        },
        getCurrentStage: () => {
            const current = app.getCurrentStage();
            const stageName = app.stageManager.getStage(current).name;
            console.log(`Current stage: ${current} (${stageName})`);
            return current;
        },
        getSavedStage: () => {
            const saved = localStorage.getItem('reactome-current-stage');
            console.log(`Saved to localStorage: ${saved}`);
            return saved;
        },
        resetToInitial: () => {
            localStorage.removeItem('reactome-current-stage');
            transitionToStageWithUrl(0, { duration: 0 });
            updateStageButtonStates();
            console.log('✓ Reset to Initial stage');
        }
    };
    console.log('Stage debug helpers available: window.stageDebug.clearSavedStage(), .getCurrentStage(), .getSavedStage(), .resetToInitial()');

    // Render JARVIS cards in article sections
    renderCards();

    // Oscillate between stages
    // let direction = 1;
    // setInterval(() => {
    //     if (!app.isTransitioning()) {
    //         const current = app.getCurrentStage();
    //         const next = current + direction;

    //         if (next >= 3) direction = -1;
    //         if (next <= 0) direction = 1;

    //         transitionToStageWithUrl(current + direction, { duration: 3000 });
    //     }
    // }, 4000);
}

/**
 * Sync all UI elements with default configuration values
 * This ensures UI reflects actual app state on load
 */
function syncUIWithDefaults() {
    // Camera distance
    syncSlider('camera-distance', 'distance-value', DEFAULT_CONFIG.cameraDistance, v => v.toFixed(1));

    // Opacity
    syncSlider('opacity', 'opacity-value', DEFAULT_CONFIG.opacity, v => v.toFixed(2));

    // Object count
    syncSlider('object-count', 'count-value', DEFAULT_CONFIG.objectCount, v => v.toString());

    // Rotation speed
    syncSlider('rotation-speed', 'speed-value', DEFAULT_CONFIG.rotationSpeed, v => v.toFixed(1) + 'x');

    // === Camera Z Motion Controls ===
    const cameraZMotionToggle = document.getElementById('camera-z-motion-enabled');
    if (cameraZMotionToggle) {
        cameraZMotionToggle.checked = DEFAULT_CONFIG.cameraZMotionEnabled;
        toggleCameraZMotionControls(DEFAULT_CONFIG.cameraZMotionEnabled);
    }

    syncSlider('camera-z-speed', 'camera-z-speed-value', DEFAULT_CONFIG.cameraZSpeed, v => v.toFixed(1) + 'x');
    syncSlider('camera-z-amplitude', 'camera-z-amplitude-value', DEFAULT_CONFIG.cameraZAmplitude, v => v.toFixed(1));
    syncSlider('camera-z-primary-freq', 'camera-z-primary-freq-value', DEFAULT_CONFIG.cameraZPrimaryFreq, v => v.toFixed(1));
    syncSlider('camera-z-secondary-freq', 'camera-z-secondary-freq-value', DEFAULT_CONFIG.cameraZSecondaryFreq, v => v.toFixed(1));
    syncSlider('camera-z-tertiary-freq', 'camera-z-tertiary-freq-value', DEFAULT_CONFIG.cameraZTertiaryFreq, v => v.toFixed(1));

    // Color
    const colorPicker = document.getElementById('color');
    if (colorPicker) {
        colorPicker.value = DEFAULT_CONFIG.primaryColor;
    }

    // Wireframe
    const wireframeToggle = document.getElementById('wireframe');
    if (wireframeToggle) {
        wireframeToggle.checked = DEFAULT_CONFIG.wireframe;
    }

    // Shader enabled
    const shaderToggle = document.getElementById('shader-enabled');
    if (shaderToggle) {
        shaderToggle.checked = DEFAULT_CONFIG.shaderEnabled;
        toggleShaderControls(DEFAULT_CONFIG.shaderEnabled);
    }

    // Shader controls
    syncSlider('bloom-strength', 'bloom-value', DEFAULT_CONFIG.bloomStrength, v => v.toFixed(1));
    syncSlider('scanline-intensity', 'scanline-value', DEFAULT_CONFIG.scanlineIntensity, v => v.toFixed(2));
    syncSlider('noise-intensity', 'noise-value', DEFAULT_CONFIG.noiseIntensity, v => v.toFixed(2));
    syncSlider('rgb-shift', 'rgb-value', DEFAULT_CONFIG.rgbShift, v => v.toFixed(3));

    // === Connectome Logo Controls ===
    const connectomeToggle = document.getElementById('connectome-enabled');
    if (connectomeToggle) {
        connectomeToggle.checked = DEFAULT_CONFIG.connectomeEnabled;
        toggleConnectomeControls(DEFAULT_CONFIG.connectomeEnabled);
    }

    // Connectome scale (convert to display value)
    syncSlider('connectome-scale', 'connectome-scale-value', DEFAULT_CONFIG.connectomeScale * 1000, v => v.toFixed(1));

    // Connectome XYZ position
    syncSlider('connectome-pos-x', 'connectome-pos-x-value', DEFAULT_CONFIG.connectomePosX, v => v.toFixed(2));
    syncSlider('connectome-pos-y', 'connectome-pos-y-value', DEFAULT_CONFIG.connectomePosY, v => v.toFixed(2));
    syncSlider('connectome-pos-z', 'connectome-pos-z-value', DEFAULT_CONFIG.connectomePosZ, v => v.toFixed(2));

    // Connectome XYZ rotation
    syncSlider('connectome-rot-x', 'connectome-rot-x-value', DEFAULT_CONFIG.connectomeRotX, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('connectome-rot-y', 'connectome-rot-y-value', DEFAULT_CONFIG.connectomeRotY, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('connectome-rot-z', 'connectome-rot-z-value', DEFAULT_CONFIG.connectomeRotZ, v => (v * 180 / Math.PI).toFixed(0) + '°');

    // Connectome color
    const connectomeColorPicker = document.getElementById('connectome-color');
    if (connectomeColorPicker) {
        connectomeColorPicker.value = '#' + DEFAULT_CONFIG.connectomeColor.toString(16).padStart(6, '0');
    }

    // Connectome material
    syncSlider('connectome-roughness', 'connectome-roughness-value', DEFAULT_CONFIG.connectomeRoughness, v => v.toFixed(2));
    syncSlider('connectome-metalness', 'connectome-metalness-value', DEFAULT_CONFIG.connectomeMetalness, v => v.toFixed(2));

    // Connectome wireframe toggle
    const connectomeWireframeToggle = document.getElementById('connectome-wireframe');
    if (connectomeWireframeToggle) {
        connectomeWireframeToggle.checked = DEFAULT_CONFIG.connectomeWireframe;
    }

    // Connectome lights
    syncSlider('connectome-light-ambient', 'connectome-light-ambient-value', DEFAULT_CONFIG.connectomeLightAmbient, v => v.toFixed(2));
    syncSlider('connectome-light-main', 'connectome-light-main-value', DEFAULT_CONFIG.connectomeLightMain, v => v.toFixed(2));
    syncSlider('connectome-light-back', 'connectome-light-back-value', DEFAULT_CONFIG.connectomeLightBack, v => v.toFixed(2));
    syncSlider('connectome-light-fill', 'connectome-light-fill-value', DEFAULT_CONFIG.connectomeLightFill, v => v.toFixed(2));

    // === C Signet Controls ===
    const cSignetToggle = document.getElementById('csignet-enabled');
    if (cSignetToggle) {
        cSignetToggle.checked = DEFAULT_CONFIG.cSignetEnabled;
        toggleCSignetControls(DEFAULT_CONFIG.cSignetEnabled);
    }

    syncSlider('csignet-scale', 'csignet-scale-value', DEFAULT_CONFIG.cSignetScale * 1000, v => v.toFixed(1));

    // C Signet XYZ position
    syncSlider('csignet-pos-x', 'csignet-pos-x-value', DEFAULT_CONFIG.cSignetPosX, v => v.toFixed(2));
    syncSlider('csignet-pos-y', 'csignet-pos-y-value', DEFAULT_CONFIG.cSignetPosY, v => v.toFixed(2));
    syncSlider('csignet-pos-z', 'csignet-pos-z-value', DEFAULT_CONFIG.cSignetPosZ, v => v.toFixed(2));

    // C Signet XYZ rotation
    syncSlider('csignet-rot-x', 'csignet-rot-x-value', DEFAULT_CONFIG.cSignetRotX, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('csignet-rot-y', 'csignet-rot-y-value', DEFAULT_CONFIG.cSignetRotY, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('csignet-rot-z', 'csignet-rot-z-value', DEFAULT_CONFIG.cSignetRotZ, v => (v * 180 / Math.PI).toFixed(0) + '°');

    // === Glitch Effect Controls ===
    const glitchToggle = document.getElementById('glitch-enabled');
    if (glitchToggle) {
        glitchToggle.checked = DEFAULT_CONFIG.glitchEnabled;
        toggleGlitchControls(DEFAULT_CONFIG.glitchEnabled);
    }

    syncSlider('glitch-intensity', 'glitch-intensity-value', DEFAULT_CONFIG.glitchIntensity, v => v.toFixed(2));
    syncSlider('glitch-speed', 'glitch-speed-value', DEFAULT_CONFIG.glitchSpeed, v => v.toFixed(1) + 'x');
    syncSlider('glitch-block-size', 'glitch-block-size-value', DEFAULT_CONFIG.glitchBlockSize, v => v.toFixed(3));
    syncSlider('glitch-color-separation', 'glitch-color-separation-value', DEFAULT_CONFIG.glitchColorSeparation, v => v.toFixed(3));

    // === Header CSS3D Controls ===
    const headerToggle = document.getElementById('header-enabled');
    if (headerToggle) {
        headerToggle.checked = DEFAULT_CONFIG.headerEnabled;
        toggleHeaderControls(DEFAULT_CONFIG.headerEnabled);
    }

    syncSlider('header-scale', 'header-scale-value', DEFAULT_CONFIG.headerScale, v => v.toFixed(2));
    syncSlider('header-opacity', 'header-opacity-value', DEFAULT_CONFIG.headerOpacity, v => v.toFixed(2));
    syncSlider('header-pos-x', 'header-pos-x-value', DEFAULT_CONFIG.headerPosX, v => v.toFixed(2));
    syncSlider('header-pos-y', 'header-pos-y-value', DEFAULT_CONFIG.headerPosY, v => v.toFixed(2));
    syncSlider('header-pos-z', 'header-pos-z-value', DEFAULT_CONFIG.headerPosZ, v => v.toFixed(2));
    syncSlider('header-rot-x', 'header-rot-x-value', DEFAULT_CONFIG.headerRotX, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('header-rot-y', 'header-rot-y-value', DEFAULT_CONFIG.headerRotY, v => (v * 180 / Math.PI).toFixed(0) + '°');
    syncSlider('header-rot-z', 'header-rot-z-value', DEFAULT_CONFIG.headerRotZ, v => (v * 180 / Math.PI).toFixed(0) + '°');
}

/**
 * Helper to sync a slider and its value display
 */
function syncSlider(sliderId, valueId, defaultValue, formatter) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    if (slider) {
        slider.value = defaultValue;
        if (valueDisplay) {
            valueDisplay.textContent = formatter(defaultValue);
        }
    }
}

/**
 * Toggle visibility of camera Z motion controls
 */
function toggleCameraZMotionControls(enabled) {
    const motionControls = document.getElementById('camera-z-motion-controls');
    if (motionControls) {
        motionControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Toggle visibility of shader controls
 */
function toggleShaderControls(enabled) {
    const shaderControls = document.getElementById('shader-controls');
    if (shaderControls) {
        shaderControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Toggle visibility of Connectome logo controls
 */
function toggleConnectomeControls(enabled) {
    const connectomeControls = document.getElementById('connectome-controls');
    if (connectomeControls) {
        connectomeControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Toggle visibility of C Signet controls
 */
function toggleCSignetControls(enabled) {
    const cSignetControls = document.getElementById('csignet-controls');
    if (cSignetControls) {
        cSignetControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Toggle visibility of Glitch effect controls
 */
function toggleGlitchControls(enabled) {
    const glitchControls = document.getElementById('glitch-controls');
    if (glitchControls) {
        glitchControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Toggle visibility of Header CSS3D controls
 */
function toggleHeaderControls(enabled) {
    const headerControls = document.getElementById('header-controls');
    if (headerControls) {
        headerControls.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * Advance to next stage
 * Transitions to the next stage in sequence
 */
function advanceToNextStage() {
    if (!app.isTransitioning()) {
        const currentStage = app.getCurrentStage();
        const totalStages = 9; // We have 9 stages (0-8: Initial, Reveal, Focus, Test, Void, SRE, SEC, DEV, OPS)
        const nextStage = (currentStage + 1) % totalStages;

        // Close all articles before transitioning
        closeAllArticles();

        transitionToStageWithUrl(nextStage, {
            captureActualState: true,
            duration: 1000,
            onComplete: () => {
                updateStageButtonStates();
                updateNavigationLinkStates();
                app.stageManager.saveState();

                // Show article for certain stages
                const stageArticles = {
                    // 1: 'cntm-article',
                    5: 'sre-article',
                    6: 'sec-article',
                    7: 'dev-article',
                    8: 'ops-article'
                };
                if (stageArticles[nextStage]) {
                    showArticle(stageArticles[nextStage]);
                }
            }
        });
        updateStageButtonStates();
    }
}

/**
 * Setup UI control event listeners
 */
function setupUIControls() {
    // Camera distance slider
    setupRangeControl('camera-distance', 'distance-value',
        (value) => app.setCameraDistance(value),
        (v) => v.toFixed(1)
    );

    // Opacity slider
    setupRangeControl('opacity', 'opacity-value',
        (value) => app.setOpacity(value),
        (v) => v.toFixed(2)
    );

    // Rotation speed slider
    setupRangeControl('rotation-speed', 'speed-value',
        (value) => app.setRotationSpeed(value),
        (v) => v.toFixed(1) + 'x'
    );

    // Object count slider
    const countSlider = document.getElementById('object-count');
    const countValue = document.getElementById('count-value');
    if (countSlider) {
        countSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (countValue) countValue.textContent = value;
        });
        countSlider.addEventListener('change', (e) => {
            const value = parseInt(e.target.value, 10);
            app.regenerate(value);
        });
    }

    // === Camera Z Motion Controls ===

    // Camera Z motion enable toggle
    const cameraZMotionToggle = document.getElementById('camera-z-motion-enabled');
    if (cameraZMotionToggle) {
        cameraZMotionToggle.addEventListener('change', (e) => {
            app.setCameraZMotionEnabled(e.target.checked);
            toggleCameraZMotionControls(e.target.checked);
        });
    }

    // Camera Z motion speed
    setupRangeControl('camera-z-speed', 'camera-z-speed-value',
        (value) => app.setCameraZSpeed(value),
        (v) => v.toFixed(1) + 'x'
    );

    // Camera Z motion amplitude
    setupRangeControl('camera-z-amplitude', 'camera-z-amplitude-value',
        (value) => app.setCameraZAmplitude(value),
        (v) => v.toFixed(1)
    );

    // Camera Z primary wave frequency
    setupRangeControl('camera-z-primary-freq', 'camera-z-primary-freq-value',
        (value) => app.setCameraZPrimaryFreq(value),
        (v) => v.toFixed(1)
    );

    // Camera Z secondary wave frequency
    setupRangeControl('camera-z-secondary-freq', 'camera-z-secondary-freq-value',
        (value) => app.setCameraZSecondaryFreq(value),
        (v) => v.toFixed(1)
    );

    // Camera Z tertiary wave frequency
    setupRangeControl('camera-z-tertiary-freq', 'camera-z-tertiary-freq-value',
        (value) => app.setCameraZTertiaryFreq(value),
        (v) => v.toFixed(1)
    );

    // Color picker
    const colorPicker = document.getElementById('color');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            app.setColor(e.target.value);
        });
    }

    // Wireframe toggle
    const wireframeToggle = document.getElementById('wireframe');
    if (wireframeToggle) {
        wireframeToggle.addEventListener('change', (e) => {
            app.setWireframe(e.target.checked);
        });
    }

    // Regenerate button
    const regenerateBtn = document.getElementById('regenerate');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            app.regenerate();
        });
    }

    // === Shader Controls ===

    // Shader enable toggle
    const shaderToggle = document.getElementById('shader-enabled');
    if (shaderToggle) {
        shaderToggle.addEventListener('change', (e) => {
            app.setShaderEnabled(e.target.checked);
            toggleShaderControls(e.target.checked);
        });
    }

    // Bloom strength
    setupRangeControl('bloom-strength', 'bloom-value',
        (value) => app.setBloomStrength(value),
        (v) => v.toFixed(1)
    );

    // Scanline intensity
    setupRangeControl('scanline-intensity', 'scanline-value',
        (value) => app.setScanlineIntensity(value),
        (v) => v.toFixed(2)
    );

    // Noise intensity
    setupRangeControl('noise-intensity', 'noise-value',
        (value) => app.setNoiseIntensity(value),
        (v) => v.toFixed(2)
    );

    // RGB shift
    setupRangeControl('rgb-shift', 'rgb-value',
        (value) => app.setRgbShift(value),
        (v) => v.toFixed(3)
    );

    // === Connectome Logo Controls ===

    // Connectome enable toggle
    const connectomeToggle = document.getElementById('connectome-enabled');
    if (connectomeToggle) {
        connectomeToggle.addEventListener('change', (e) => {
            app.setConnectomeVisible(e.target.checked);
            toggleConnectomeControls(e.target.checked);
        });
    }

    // Connectome scale (multiply by 0.001 for actual scale)
    setupRangeControl('connectome-scale', 'connectome-scale-value',
        (value) => app.setConnectomeScale(value * 0.001),
        (v) => v.toFixed(1)
    );

    // Connectome XYZ position
    setupRangeControl('connectome-pos-x', 'connectome-pos-x-value',
        (value) => app.setConnectomePosX(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('connectome-pos-y', 'connectome-pos-y-value',
        (value) => app.setConnectomePosY(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('connectome-pos-z', 'connectome-pos-z-value',
        (value) => app.setConnectomePosZ(value),
        (v) => v.toFixed(2)
    );

    // Connectome XYZ rotation
    setupRangeControl('connectome-rot-x', 'connectome-rot-x-value',
        (value) => app.setConnectomeRotX(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('connectome-rot-y', 'connectome-rot-y-value',
        (value) => app.setConnectomeRotY(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('connectome-rot-z', 'connectome-rot-z-value',
        (value) => app.setConnectomeRotZ(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );

    // Connectome color
    const connectomeColorPicker = document.getElementById('connectome-color');
    if (connectomeColorPicker) {
        connectomeColorPicker.addEventListener('input', (e) => {
            app.setConnectomeColor(e.target.value);
        });
    }

    // Connectome roughness
    setupRangeControl('connectome-roughness', 'connectome-roughness-value',
        (value) => app.setConnectomeRoughness(value),
        (v) => v.toFixed(2)
    );

    // Connectome metalness
    setupRangeControl('connectome-metalness', 'connectome-metalness-value',
        (value) => app.setConnectomeMetalness(value),
        (v) => v.toFixed(2)
    );

    // Connectome wireframe toggle
    const connectomeWireframeToggle = document.getElementById('connectome-wireframe');
    if (connectomeWireframeToggle) {
        connectomeWireframeToggle.addEventListener('change', (e) => {
            app.setConnectomeWireframe(e.target.checked);
        });
    }

    // Connectome light controls
    setupRangeControl('connectome-light-ambient', 'connectome-light-ambient-value',
        (value) => app.setConnectomeLightAmbient(value),
        (v) => v.toFixed(2)
    );

    setupRangeControl('connectome-light-main', 'connectome-light-main-value',
        (value) => app.setConnectomeLightMain(value),
        (v) => v.toFixed(2)
    );

    setupRangeControl('connectome-light-back', 'connectome-light-back-value',
        (value) => app.setConnectomeLightBack(value),
        (v) => v.toFixed(2)
    );

    setupRangeControl('connectome-light-fill', 'connectome-light-fill-value',
        (value) => app.setConnectomeLightFill(value),
        (v) => v.toFixed(2)
    );

    // === C Signet Controls ===

    // C Signet enable toggle
    const cSignetToggle = document.getElementById('csignet-enabled');
    if (cSignetToggle) {
        cSignetToggle.addEventListener('change', (e) => {
            if (e.target.checked && !cSignetApp.cSignet) {
                // Load C Signet if not already loaded
                cSignetApp.loadCSignet({
                    scale: DEFAULT_CONFIG.cSignetScale,
                    xOffset: DEFAULT_CONFIG.cSignetPosX,
                    yOffset: DEFAULT_CONFIG.cSignetPosY,
                    zOffset: DEFAULT_CONFIG.cSignetPosZ
                }).then(() => {
                    if (!cSignetApp.isRunning) {
                        cSignetApp.start();
                    }
                    cSignetApp.setCSignetVisible(true);
                });
            } else if (cSignetApp.cSignet) {
                cSignetApp.setCSignetVisible(e.target.checked);
            }
            toggleCSignetControls(e.target.checked);
        });
    }

    // C Signet scale
    setupRangeControl('csignet-scale', 'csignet-scale-value',
        (value) => cSignetApp && cSignetApp.setCSignetScale(value * 0.001),
        (v) => v.toFixed(1)
    );

    // C Signet XYZ position
    setupRangeControl('csignet-pos-x', 'csignet-pos-x-value',
        (value) => cSignetApp && cSignetApp.setCSignetPosX(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('csignet-pos-y', 'csignet-pos-y-value',
        (value) => cSignetApp && cSignetApp.setCSignetPosY(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('csignet-pos-z', 'csignet-pos-z-value',
        (value) => cSignetApp && cSignetApp.setCSignetPosZ(value),
        (v) => v.toFixed(2)
    );

    // C Signet XYZ rotation
    setupRangeControl('csignet-rot-x', 'csignet-rot-x-value',
        (value) => cSignetApp && cSignetApp.setCSignetRotX(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('csignet-rot-y', 'csignet-rot-y-value',
        (value) => cSignetApp && cSignetApp.setCSignetRotY(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('csignet-rot-z', 'csignet-rot-z-value',
        (value) => cSignetApp && cSignetApp.setCSignetRotZ(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );

    // C Signet color
    const cSignetColorPicker = document.getElementById('csignet-color');
    if (cSignetColorPicker) {
        cSignetColorPicker.addEventListener('input', (e) => {
            cSignetApp && cSignetApp.setCSignetColor(e.target.value);
        });
    }

    // === Glitch Effect Controls ===

    // Glitch enable toggle
    const glitchToggle = document.getElementById('glitch-enabled');
    if (glitchToggle) {
        glitchToggle.addEventListener('change', (e) => {
            app.setGlitchEnabled(e.target.checked);
            toggleGlitchControls(e.target.checked);
        });
    }

    // Glitch intensity
    setupRangeControl('glitch-intensity', 'glitch-intensity-value',
        (value) => app.setGlitchIntensity(value),
        (v) => v.toFixed(2)
    );

    // Glitch speed
    setupRangeControl('glitch-speed', 'glitch-speed-value',
        (value) => app.setGlitchSpeed(value),
        (v) => v.toFixed(1) + 'x'
    );

    // Glitch block size
    setupRangeControl('glitch-block-size', 'glitch-block-size-value',
        (value) => app.setGlitchBlockSize(value),
        (v) => v.toFixed(3)
    );

    // Glitch color separation
    setupRangeControl('glitch-color-separation', 'glitch-color-separation-value',
        (value) => app.setGlitchColorSeparation(value),
        (v) => v.toFixed(3)
    );

    // === Header CSS3D Controls ===

    // Header enable toggle
    const headerToggle = document.getElementById('header-enabled');
    if (headerToggle) {
        headerToggle.addEventListener('change', (e) => {
            app.setHeaderEnabled(e.target.checked);
            toggleHeaderControls(e.target.checked);
        });
    }

    // Header scale
    setupRangeControl('header-scale', 'header-scale-value',
        (value) => app.setHeaderScale(value),
        (v) => v.toFixed(2)
    );

    // Header opacity
    setupRangeControl('header-opacity', 'header-opacity-value',
        (value) => app.setHeaderOpacity(value),
        (v) => v.toFixed(2)
    );

    // Header XYZ position
    setupRangeControl('header-pos-x', 'header-pos-x-value',
        (value) => app.setHeaderPosX(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('header-pos-y', 'header-pos-y-value',
        (value) => app.setHeaderPosY(value),
        (v) => v.toFixed(2)
    );
    setupRangeControl('header-pos-z', 'header-pos-z-value',
        (value) => app.setHeaderPosZ(value),
        (v) => v.toFixed(2)
    );

    // Header XYZ rotation
    setupRangeControl('header-rot-x', 'header-rot-x-value',
        (value) => app.setHeaderRotX(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('header-rot-y', 'header-rot-y-value',
        (value) => app.setHeaderRotY(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );
    setupRangeControl('header-rot-z', 'header-rot-z-value',
        (value) => app.setHeaderRotZ(value),
        (v) => (v * 180 / Math.PI).toFixed(0) + '°'
    );

    // === Pause/Play Button with Standby Icon "(|)" ===
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            const isPaused = app.togglePause();
            // Update button class to reflect paused state
            if (isPaused) {
                pauseBtn.classList.add('paused');
            } else {
                pauseBtn.classList.remove('paused');
            }
        });
    }

    // === Panel Toggle ===
    const panelToggleBtn = document.getElementById('panel-toggle-btn');
    const controlPanel = document.getElementById('control-panel');
    if (panelToggleBtn && controlPanel) {
        // Panel starts collapsed by default
        panelToggleBtn.addEventListener('click', () => {
            controlPanel.classList.toggle('collapsed');
            panelToggleBtn.classList.toggle('panel-open');
        });
    }

    // === Article Close Buttons ===
    const closeArticleButtons = document.querySelectorAll('.close-article-btn');
    closeArticleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const article = e.target.closest('.content-article');
            if (article) {
                closeArticle(article.id);
            }
        });
    });

    // === Close articles when clicking outside ===
    document.addEventListener('click', (e) => {
        const articles = document.querySelectorAll('.content-article');
        articles.forEach(article => {
            if (article.classList.contains('active') && e.target === article) {
                closeArticle(article.id);
            }
        });
    });

    // === Close articles with ESC key ===
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllArticles();
        }
    });

    // === Stage Transition Buttons ===
    setupStageButtons();

    // Apply initial defaults
    app.setOpacity(DEFAULT_CONFIG.opacity);
    app.setCameraDistance(DEFAULT_CONFIG.cameraDistance);
    app.setShaderEnabled(DEFAULT_CONFIG.shaderEnabled);
    app.setCameraZMotionEnabled(DEFAULT_CONFIG.cameraZMotionEnabled);
    app.setCameraZSpeed(DEFAULT_CONFIG.cameraZSpeed);
    app.setCameraZAmplitude(DEFAULT_CONFIG.cameraZAmplitude);
    app.setCameraZPrimaryFreq(DEFAULT_CONFIG.cameraZPrimaryFreq);
    app.setCameraZSecondaryFreq(DEFAULT_CONFIG.cameraZSecondaryFreq);
    app.setCameraZTertiaryFreq(DEFAULT_CONFIG.cameraZTertiaryFreq);

    // Apply glitch effect defaults
    app.setGlitchEnabled(DEFAULT_CONFIG.glitchEnabled);
    app.setGlitchIntensity(DEFAULT_CONFIG.glitchIntensity);
    app.setGlitchSpeed(DEFAULT_CONFIG.glitchSpeed);
    app.setGlitchBlockSize(DEFAULT_CONFIG.glitchBlockSize);
    app.setGlitchColorSeparation(DEFAULT_CONFIG.glitchColorSeparation);
}

/**
 * Show article overlay with baffle text effects
 */
function showArticle(articleId) {
    const article = document.getElementById(articleId);
    if (article) {
        article.style.display = 'flex';
        // Trigger animation on next frame
        setTimeout(() => {
            article.classList.add('active');

            // Trigger baffle effects on all text elements in the article
            if (typeof baffle !== 'undefined' && window.articleBaffleInstances) {
                const textElements = article.querySelectorAll('p, h2, .article-subtitle');
                let delayOffset = 0;

                textElements.forEach(el => {
                    const key = `${articleId}-${el.textContent.substring(0, 20)}`;
                    if (window.articleBaffleInstances[key]) {
                        const instance = window.articleBaffleInstances[key];
                        setTimeout(() => {
                            instance.start();
                            setTimeout(() => {
                                instance.reveal(300);
                            }, 100);
                        }, delayOffset);
                        delayOffset += 50; // Stagger effect for each element
                    }
                });
            }
        }, 10);
    }
}

/**
 * Close specific article overlay
 */
function closeArticle(articleId) {
    const article = document.getElementById(articleId);
    if (article) {
        article.classList.add('fade-out');
        setTimeout(() => {
            article.classList.remove('active', 'fade-out');
            article.style.display = 'none';
        }, 200);

        // Special handling for about article - return to home (stage 1)
        if (articleId === 'about-article') {
            // Reset hash to home
            window.location.hash = '#env';
            if (!app.isTransitioning()) {
                transitionToStageWithUrl(1, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateNavigationLinkStates();
                        updateStageButtonStates();
                        app.stageManager.saveState();
                    }
                });
                updateNavigationLinkStates();
                updateStageButtonStates();
            }
        } else {
            // Regular article closing - return to stage 1
            if (!app.isTransitioning()) {
                transitionToStageWithUrl(1, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateNavigationLinkStates();
                        updateStageButtonStates();
                        app.stageManager.saveState();
                    }
                });
                updateNavigationLinkStates();
                updateStageButtonStates();
            }
        }
    }
}

/**
 * Close all article overlays
 */
function closeAllArticles() {
    const articles = document.querySelectorAll('.content-article');
    articles.forEach(article => {
        article.classList.add('fade-out');
        setTimeout(() => {
            article.classList.remove('active', 'fade-out');
            article.style.display = 'none';
        }, 200);
    });
}

/**
 * Global function to update stage button states
 * Called when stage changes or on page load
 */
function updateStageButtonStates() {
    if (!app) return;
    const currentStage = app.getCurrentStage();
    const allButtons = [
        stageButtons.stage1,
        stageButtons.stage2,
        stageButtons.stage3,
        stageButtons.stage4,
        stageButtons.stage5,
        stageButtons.stage6,
        stageButtons.stage7,
        stageButtons.stage8,
        stageButtons.stage9
    ];

    allButtons.forEach((btn, index) => {
        if (btn) {
            btn.classList.toggle('active', index === currentStage);
            btn.disabled = app.isTransitioning();
        }
    });
}

/**
 * Setup navigation link handlers
 * Each nav link transitions to a specific stage
 */
function setupNavigationLinks() {
    const navLinks = {
        'nav-reveal': { stageIndex: 1, name: 'Reveal', article: '' },
        'nav-sre': { stageIndex: 5, name: 'SRE', article: 'sre-article' },
        'nav-sec': { stageIndex: 6, name: 'SEC', article: 'sec-article' },
        'nav-dev': { stageIndex: 7, name: 'DEV', article: 'dev-article' },
        'nav-ops': { stageIndex: 8, name: 'OPS', article: 'ops-article' }
    };

    for (const [linkId, config] of Object.entries(navLinks)) {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (!app.isTransitioning()) {
                    // Close all articles before transitioning
                    closeAllArticles();

                    transitionToStageWithUrl(config.stageIndex, {
                        captureActualState: true,
                        duration: 1000,
                        onComplete: () => {
                            updateStageButtonStates();
                            updateNavigationLinkStates();
                            app.stageManager.saveState();

                            // Show article if available for this stage
                            if (config.article) {
                                showArticle(config.article);
                            }
                        }
                    });
                }
            });
        }
    }

    // Update nav link active states based on current stage
    updateNavigationLinkStates();
}

/**
 * Update active state on navigation links
 */
function updateNavigationLinkStates() {
    if (!app) return;
    const currentStage = app.getCurrentStage();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Map stage indices to nav link IDs
    const stageToNavId = {
        1: 'nav-reveal',
        5: 'nav-sre',
        6: 'nav-sec',
        7: 'nav-dev',
        8: 'nav-ops'
    };

    const navId = stageToNavId[currentStage];
    if (navId) {
        const activeLink = document.getElementById(navId);
        if (activeLink) {
            activeLink.classList.add('active');

            // Trigger baffle effect on the newly active link
            if (typeof baffle !== 'undefined' && window.baffleInstances && window.baffleInstances[activeLink.textContent]) {
                const instance = window.baffleInstances[activeLink.textContent];
                instance.start();
                setTimeout(function() {
                    instance.reveal(400);
                }, 200);
            }
        }
    }
}

/**
 * Setup footer copyright click handler to show About Us article
 */
function setupFooterCopyrightClick() {
    const footer = document.getElementById('footer');
    if (!footer) return;

    const copyrightElement = footer.querySelector('.copyright');
    if (copyrightElement) {
        // Make it clickable by converting to a button-like element
        copyrightElement.style.cursor = 'pointer';
        copyrightElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Update URL hash to about route
            window.location.hash = '#about';
            showArticle('about-article');
        });
    }
}

/**
 * Setup stage transition button handlers
 */
function setupStageButtons() {
    stageButtons.stage1 = document.getElementById('stage-1-btn');
    stageButtons.stage2 = document.getElementById('stage-2-btn');
    stageButtons.stage3 = document.getElementById('stage-3-btn');
    stageButtons.stage4 = document.getElementById('stage-4-btn');
    stageButtons.stage5 = document.getElementById('stage-5-btn');
    stageButtons.stage6 = document.getElementById('stage-6-btn');
    stageButtons.stage7 = document.getElementById('stage-7-btn');
    stageButtons.stage8 = document.getElementById('stage-8-btn');
    stageButtons.stage9 = document.getElementById('stage-9-btn');

    // Reference for easier access in event handlers
    const stage1Btn = stageButtons.stage1;
    const stage2Btn = stageButtons.stage2;
    const stage3Btn = stageButtons.stage3;
    const stage4Btn = stageButtons.stage4;
    const stage5Btn = stageButtons.stage5;
    const stage6Btn = stageButtons.stage6;
    const stage7Btn = stageButtons.stage7;
    const stage8Btn = stageButtons.stage8;
    const stage9Btn = stageButtons.stage9;

    // Stage 1: Initial
    if (stage1Btn) {
        stage1Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(0, {
                    captureActualState: true,
                    duration: 800,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 2: Reveal
    if (stage2Btn) {
        stage2Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(1, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                        // showArticle('cntm-article');
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 3: Focus
    if (stage3Btn) {
        stage3Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(2, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 4: Test
    if (stage4Btn) {
        stage4Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(3, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 5: Void
    if (stage5Btn) {
        stage5Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(4, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 6: SRE
    if (stage6Btn) {
        stage6Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(5, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                        showArticle('sre-article');
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 7: SEC
    if (stage7Btn) {
        stage7Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(6, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                        showArticle('sec-article');
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 8: DEV
    if (stage8Btn) {
        stage8Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(7, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                        showArticle('dev-article');
                    }
                });
                updateStageButtonStates();
            }
        });
    }

    // Stage 9: OPS
    if (stage9Btn) {
        stage9Btn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                transitionToStageWithUrl(8, {
                    captureActualState: true,
                    duration: 1000,
                    onComplete: () => {
                        updateStageButtonStates();
                        updateNavigationLinkStates();
                        app.stageManager.saveState();
                        showArticle('ops-article');
                    }
                });
                updateStageButtonStates();
            }
        });
    }


    // Set initial button state
    updateStageButtonStates();

    // === Clear History Button ===
    const resetStageBtn = document.getElementById('reset-stage-btn');
    if (resetStageBtn) {
        resetStageBtn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                app.stageManager.clearState();
                transitionToStageWithUrl(0, {
                    captureActualState: true,
                    duration: 600
                });
                updateStageButtonStates();
                updateNavigationLinkStates();
                console.log('Stage history cleared, reset to Initial');
            }
        });
    }

    // === Next Stage Button (Control Panel) ===
    const nextStageBtn = document.getElementById('auto-cycle-btn');
    if (nextStageBtn) {
        nextStageBtn.addEventListener('click', advanceToNextStage);
    }

    // === Next Stage Button (Floating) ===
    const nextStageFloatingBtn = document.getElementById('auto-cycle-floating-btn');
    if (nextStageFloatingBtn) {
        nextStageFloatingBtn.addEventListener('click', advanceToNextStage);
    }

    // === Clear History Button (Floating) ===
    const clearHistoryFloatingBtn = document.getElementById('clear-history-floating-btn');
    if (clearHistoryFloatingBtn) {
        clearHistoryFloatingBtn.addEventListener('click', () => {
            if (!app.isTransitioning()) {
                closeAllArticles();
                app.stageManager.clearState();
                transitionToStageWithUrl(0, {
                    captureActualState: true,
                    duration: 600
                });
                updateStageButtonStates();
                updateNavigationLinkStates();
                console.log('Stage history cleared, reset to Initial');
            }
        });
    }

    // === Setup Navigation Links ===
    setupNavigationLinks();

    // === Setup Footer Copyright Click Handler ===
    setupFooterCopyrightClick();

}

/**
 * Helper to setup a range control with value display
 */
function setupRangeControl(sliderId, valueId, onChange, formatter) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            onChange(value);
            if (valueDisplay) {
                valueDisplay.textContent = formatter(value);
            }
        });
    }
}

/**
 * Generate a random ID (matching standalone.html pattern)
 */
function randomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Render JARVIS cards exactly as they appear in standalone.html
 * Using the exact HTML structure from standalone.html
 */
function renderCards() {
    const roles = [
        {
            id: "sre",
            containerId: "sre-cards",
            title: "SITE RELIABILITY ENGINEERING",
            svcStatus: "ACTIVELY RECRUITING PROJECTS",
            metrics: ["CLOUD MIGRATIONS", "SLOs, SLAs, SLIs", "LGTM Stack"],
            email: "sre+anything@connectome.name",
        },
        {
            id: "secops",
            containerId: "sec-cards",
            title: "SECURITY",
            svcStatus: "ACTIVELY RECRUITING PROJECTS",
            metrics: ["POLICIES & RBAC", "CLOUD COMPLIANCE", "CLOUD TRAILS"],
            email: "secops+anything@connectome.name",
        },
        {
            id: "devops",
            containerId: "dev-cards",
            title: "DEVOPS & PLATFORM DEVELOPMENT",
            svcStatus: "ACTIVELY RECRUITING PROJECTS",
            metrics: ["CLOUD AUTOMATION", "PLATFORM DEVELOPMENT", "IaaC & GITOPS"],
            email: "devops+anything@connectome.name",
        },
        {
            id: "operations",
            containerId: "ops-cards",
            title: "STRATEGY & OPERATIONS",
            svcStatus: "ACTIVELY RECRUITING PROJECTS",
            metrics: ["DESIGN & PLANNING", "CLOUD ORCHESTRATION", "CLOUD MAINTANANCE"],
            email: "ops+anything@connectome.name",
        },
    ];

    // Render cards for each role into their respective containers
    roles.forEach(role => {
        const container = document.getElementById(role.containerId);

        if (!container) return;

        const rid = randomId();
        const metricsHtml = role.metrics
            .map(m => `<div class="metric"><span class="metric-chevron">&gt;</span> ${escapeHtml(m)}</div>`)
            .join("");

        const mailto = `mailto:${role.email}?subject=${encodeURIComponent(`${role.title} Inquiry`)}`;

        const cardHtml = `<article class="card" data-role="${escapeHtml(role.id)}">
            <span class="corner corner--tl" aria-hidden="true"></span>
            <span class="corner corner--tr" aria-hidden="true"></span>
            <span class="corner corner--bl" aria-hidden="true"></span>
            <span class="corner corner--br" aria-hidden="true"></span>
            <div class="scanline" aria-hidden="true"></div>
            <div class="hud" aria-hidden="true">
                <div class="hud-ring hud-ring--1"></div>
                <div class="hud-ring hud-ring--2"></div>
                <div class="hud-line-h"></div>
                <div class="hud-line-v"></div>
            </div>
            <div class="card-inner">
                <div class="card-top">
                    <div>
                        <div class="protocol-label">CONNECTOME</div>
                        <h2 class="card-title">${escapeHtml(role.title)}</h2>
                    </div>
                    <div class="card-id-block">
                        <div>FORM ID: ${escapeHtml(rid)}</div>
                        <div class="card-version">v2.4.1</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="svc-row">
                        <span class="svc-dot" aria-hidden="true"></span>
                        SERVICE STATUS: ${escapeHtml(role.svcStatus)}
                    </div>
                    <div class="metrics">
                        ${metricsHtml}
                    </div>
                </div>
                <a class="cta" href="${mailto}" title="Transmit Inquiry">
                    <span class="cta-shimmer" aria-hidden="true"></span>
                    <span class="cta-inner">
                        <span class="cta-line" aria-hidden="true"></span>
                        <span class="cta-icon-wrap">
                            <svg class="cta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <svg class="cta-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </span>
                        <span class="cta-line" aria-hidden="true"></span>
                    </span>
                </a>
            </div>
        </article>`;

        container.innerHTML = cardHtml;
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
