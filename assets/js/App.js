import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { createRingGeometry } from './geometries/Ring.js';
import { createDottedCylinderGeometry } from './geometries/DottedCylinder.js';
import {
    createConnectomeLogoGeometry,
    createCSignetGeometry,
    createConnectomeLights,
    updateLogoMaterial,
    updateLogoPosition,
    updateLogoPositionXYZ,
    updateLogoRotation,
    updateLogoScale,
    updateLightIntensities,
    disposeLogo,
    CONNECTOME_LOGO_CONFIG,
    C_SIGNET_CONFIG,
    CONNECTOME_LIGHT_CONFIG,
    LOGO_VARIATIONS
} from './geometries/ConnectomeLogo.js';
import { randomFloat, randomInt, randomPick } from './utils/random.js';
import { SciFiEffects } from './effects/SciFiShader.js';
import { StageManager, Easing } from './utils/StageManager.js';


/**
    THIS IS A TEMPLATE THAT SHOULD BE USED EVERY TIME AND MODIFIED.
    WHAT TO KEEP:
    ✓ Overall structure
    ✓ Default config options (colors, camera, object, shaders, etc)

    WHAT TO CREATIVELY EDIT:
    ✗ The parameters (define what YOUR art needs)
    ✗ The UI/UX controls (match YOUR parameters)
    ✗ The Animations and shaders (match YOUR parameters)

    Let your philosophy guide the implementation.
    The world is your oyster - be creative!
**/
/**
 * Get responsive configuration based on viewport width
 * @returns {Object} Configuration with media query adjustments
 */
function getResponsiveConfig() {
    const isMobile = window.innerWidth < 720;

    return {
        // Mobile: move logo left and center header
        // Note: Scale is NOT adjusted - only positions change for mobile
        connectomePosX: isMobile ? -0.10 : 0.8,
        headerPosX: isMobile ? 0.00 : 0.90
    };
}

/**
 * Default configuration values
 * Centralized for easy access by UI synchronization
 */
export const DEFAULT_CONFIG = {
    backgroundColor: 0x000000,
    backgroundAlpha: 0,
    primaryColor: '#1cb495',
    cameraDistance: 6.0,
    objectCount: 140,
    rotationSpeed: 0.12,
    opacity: 0.02,
    wireframe: true,
    // Camera Z-axis motion defaults
    cameraZMotionEnabled: true,
    cameraZSpeed: 0.000000001,
    cameraZAmplitude: 0.09,
    cameraZPrimaryFreq: 1.7,
    cameraZSecondaryFreq: 3.2,
    cameraZTertiaryFreq: 2.1,
    // Shader defaults
    shaderEnabled: true,
    bloomStrength: 0.8,
    bloomThreshold: 0.6,
    scanlineIntensity: 0.15,
    noiseIntensity: 0.05,
    rgbShift: 0.002,
    // Connectome Logo defaults (Thin Profile)
    connectomeEnabled: true,
    // Position (responsive X-axis only)
    ...getResponsiveConfig(),
    connectomeScale: CONNECTOME_LOGO_CONFIG.scale,
    connectomePosY: 3.0,
    connectomePosZ: 0.0001,
    connectomeRotX: 0.0001,
    connectomeRotY: 0.0001,
    connectomeRotZ: 0.0001,
    // Material properties
    connectomeColor: CONNECTOME_LOGO_CONFIG.color,
    connectomeOpacity: CONNECTOME_LOGO_CONFIG.opacity,
    connectomeRoughness: CONNECTOME_LOGO_CONFIG.roughness,
    connectomeMetalness: CONNECTOME_LOGO_CONFIG.metalness,
    connectomeTransparent: CONNECTOME_LOGO_CONFIG.transparent,
    connectomeWireframe: CONNECTOME_LOGO_CONFIG.wireframe,
    // Extrusion properties
    connectomeDepth: CONNECTOME_LOGO_CONFIG.depth,
    connectomeBevelEnabled: CONNECTOME_LOGO_CONFIG.bevelEnabled,
    connectomeBevelThickness: CONNECTOME_LOGO_CONFIG.bevelThickness,
    connectomeBevelSize: CONNECTOME_LOGO_CONFIG.bevelSize,
    connectomeBevelSegments: CONNECTOME_LOGO_CONFIG.bevelSegments,
    // Connectome Light defaults (Thin Profile lighting)
    connectomeLightAmbient: CONNECTOME_LIGHT_CONFIG.ambient.intensity,
    connectomeLightMain: CONNECTOME_LIGHT_CONFIG.main.intensity,
    connectomeLightBack: CONNECTOME_LIGHT_CONFIG.back.intensity,
    connectomeLightFill: CONNECTOME_LIGHT_CONFIG.fill.intensity,
    // C Signet defaults (disabled by default)
    cSignetEnabled: true,
    cSignetScale: C_SIGNET_CONFIG.scale,
    cSignetPosX: C_SIGNET_CONFIG.xOffset,
    cSignetPosY: C_SIGNET_CONFIG.yOffset,
    cSignetPosZ: C_SIGNET_CONFIG.zOffset,
    cSignetRotX: 0.0001,
    cSignetRotY: 0.0001,
    cSignetRotZ: 0.0001,
    // Glitch effect defaults
    glitchEnabled: true,
    glitchIntensity: 0.09,
    glitchSpeed: 0.8,
    glitchBlockSize: 0.025,
    glitchColorSeparation: 0.012,
    // Header CSS3D defaults
    headerEnabled: true,
    headerScale: 0.25,
    headerOpacity: 0.0,
    headerPosY: 3.1,
    headerPosZ: 0.35,
    headerRotX: -1.57,
    headerRotY: 0.0,
    headerRotZ: 0.0
};

export const variations = [
    { name: 'Wireframe', type: 'wireframe', depth: 8, color: 0x1cb495 },
    { name: 'Glass', type: 'glass', depth: 5, color: 0x1cb495 },
    { name: 'Points Cloud', type: 'points', depth: 8, color: 0x1cb495 }
];

export const svgData = `
<svg viewBox="0 0 255.1 89.8">
    <g>
            <path d="M51.7,55.5c-1.8,0.4-3.8,0.6-6,0.6c-8.1,0-12.2-3.9-12.2-11.6c0-7.2,4.1-10.8,12.2-10.8c2.1,0,4.1,0.2,6,0.6v1.9
                    c-1.8-0.4-3.7-0.6-5.6-0.6c-6.8,0-10.1,3-10.1,8.9c0,6.5,3.4,9.7,10.1,9.7c1.9,0,3.7-0.2,5.6-0.6V55.5z"/>
            <path d="M53.3,44.9c0-7.5,3.6-11.2,10.7-11.2c7.1,0,10.7,3.7,10.7,11.2c0,7.5-3.6,11.2-10.7,11.2C56.9,56.1,53.3,52.3,53.3,44.9z
                    M64,54.2c5.6,0,8.4-3.1,8.4-9.4c0-6.1-2.8-9.2-8.4-9.2c-5.6,0-8.4,3.1-8.4,9.2C55.5,51,58.3,54.2,64,54.2z"/>
            <path d="M77.8,56.1V33.7h1.6l0.3,2.9c3.7-1.9,6.9-2.9,9.7-2.9c4.9,0,7.3,2.4,7.3,7.1v15.4h-2.2V40.7c0-3.3-1.9-5-5.6-5
                    c-2.7,0-5.6,0.9-8.8,2.8v17.6H77.8z"/>
            <path d="M100.9,56.1V33.7h1.6l0.3,2.9c3.7-1.9,6.9-2.9,9.7-2.9c4.9,0,7.3,2.4,7.3,7.1v15.4h-2.2V40.7c0-3.3-1.9-5-5.6-5
                    c-2.7,0-5.6,0.9-8.8,2.8v17.6H100.9z"/>
            <path d="M142,45.4h-16.8c0,5.9,3.5,8.8,10.4,8.8c2,0,4-0.2,5.9-0.6v1.9c-2,0.4-4.4,0.6-7.2,0.6c-7.6,0-11.3-3.8-11.3-11.5
                    c0-7.3,3.6-11,10.7-11C140.3,33.7,143.1,37.6,142,45.4z M125.2,43.4h14.7c0.3-5.2-1.9-7.8-6.8-7.8
                    C128.1,35.5,125.5,38.2,125.2,43.4z"/>
            <path d="M163,55.5c-1.8,0.4-3.8,0.6-6,0.6c-8.1,0-12.2-3.9-12.2-11.6c0-7.2,4.1-10.8,12.2-10.8c2.1,0,4.1,0.2,6,0.6v1.9
                    c-1.8-0.4-3.7-0.6-5.6-0.6c-6.8,0-10.1,3-10.1,8.9c0,6.5,3.4,9.7,10.1,9.7c1.9,0,3.7-0.2,5.6-0.6V55.5z"/>
            <path d="M167.6,30h1.4l0.4,3.6h5.6v1.9h-5.2v14.2c0,2.9,1.1,4.4,3.4,4.4h1.9v1.9h-1.8c-3.8,0-5.6-2-5.6-6V30z"/>
            <path d="M176.1,44.9c0-7.5,3.6-11.2,10.7-11.2c7.1,0,10.7,3.7,10.7,11.2c0,7.5-3.6,11.2-10.7,11.2
                    C179.6,56.1,176.1,52.3,176.1,44.9z M186.7,54.2c5.6,0,8.4-3.1,8.4-9.4c0-6.1-2.8-9.2-8.4-9.2c-5.6,0-8.4,3.1-8.4,9.2
                    C178.3,51,181.1,54.2,186.7,54.2z"/>
            <path d="M200.6,56.1V33.7h1.6l0.2,2.8c3-1.9,5.9-2.8,8.7-2.8c2.7,0,4.5,1,5.6,3.1c2.7-2.1,5.5-3.1,8.3-3.1c4.7,0,7.1,2.5,7.1,7.5
                    v15h-2.2v-15c0-3.6-1.8-5.4-5.3-5.4c-2.7,0-5,1-7,2.9v17.5h-2.2V40.8c0-3.4-1.6-5.1-4.8-5.1c-2.8,0-5.3,1-7.7,2.9v17.5H200.6z"/>
            <path d="M254.9,45.4h-16.8c0,5.9,3.5,8.8,10.4,8.8c2,0,4-0.2,5.9-0.6v1.9c-2,0.4-4.4,0.6-7.2,0.6c-7.6,0-11.3-3.8-11.3-11.5
                    c0-7.3,3.6-11,10.7-11C253.2,33.7,255.9,37.6,254.9,45.4z M238.1,43.4h14.7c0.3-5.2-1.9-7.8-6.8-7.8
                    C241,35.5,238.4,38.2,238.1,43.4z"/>
    </g>
</svg>`;



/**
 * Main Reactome Visualization Application
 * Domain: 3D Visualization / Scene Management
 */
export class ReactomeApp {
    constructor(options = {}) {
        this.options = {
            container: options.container || document.body,
            backgroundColor: options.backgroundColor ?? DEFAULT_CONFIG.backgroundColor,
            backgroundAlpha: options.backgroundAlpha ?? DEFAULT_CONFIG.backgroundAlpha,
            primaryColor: options.primaryColor || DEFAULT_CONFIG.primaryColor,
            cameraDistance: options.cameraDistance ?? DEFAULT_CONFIG.cameraDistance,
            objectCount: options.objectCount ?? DEFAULT_CONFIG.objectCount,
            enableControls: options.enableControls !== false,
            ...options
        };

        // Runtime state
        this.objects = [];
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.rotationSpeed = DEFAULT_CONFIG.rotationSpeed;
        this.effects = null;

        // Connectome logo state (C Signet now in separate CSignetApp)
        this.connectomeLogo = null;
        this.connectomeLights = null;
        this.cSignetApp = null; // Reference to CSignetApp instance for stage transitions

        // Camera Z-axis automatic movement state
        this.cameraZElapsedTime = 0;
        this.cameraZMin = -0.250;
        this.cameraZMax = 0.250;
        this.cameraZMotionEnabled = options.cameraZMotionEnabled ?? DEFAULT_CONFIG.cameraZMotionEnabled;
        this.cameraZSpeed = options.cameraZSpeed ?? DEFAULT_CONFIG.cameraZSpeed;
        this.cameraZAmplitude = options.cameraZAmplitude ?? DEFAULT_CONFIG.cameraZAmplitude;
        this.cameraZPrimaryFreq = options.cameraZPrimaryFreq ?? DEFAULT_CONFIG.cameraZPrimaryFreq;
        this.cameraZSecondaryFreq = options.cameraZSecondaryFreq ?? DEFAULT_CONFIG.cameraZSecondaryFreq;
        this.cameraZTertiaryFreq = options.cameraZTertiaryFreq ?? DEFAULT_CONFIG.cameraZTertiaryFreq;

        // Stage manager for animated transitions
        this.stageManager = null;

        this._init();
    }

    /**
     * Initialize the application
     */
    _init() {
        this._createRenderer();
        this._createScene();
        this._createCamera();
        this._createMaterials();
        this._createControls();
        this._createObjects();
        this._createConnectome();
        this._createHeaderMesh();
        this._createEffects();
        this._setupEventListeners();
        this._createStageManager();

        // Apply responsive layout on initial load
        // Use a small delay to ensure all objects are fully created
        setTimeout(() => {
            this._updateResponsiveLayout();
        }, 100);
    }

    /**
     * Create the stage manager for animated transitions
     */
    _createStageManager() {
        this.stageManager = new StageManager(this);
    }

    /**
     * Create WebGL renderer
     */
    _createRenderer() {
        const canvas = document.createElement('canvas');
        this.options.container.appendChild(canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(this.options.backgroundColor, this.options.backgroundAlpha);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this._updateSize();
    }

    /**
     * Create the scene
     */
    _createScene() {
        this.scene = new THREE.Scene();
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);
    
        const backLight = new THREE.DirectionalLight(0x1cb495, 0.4);
        backLight.position.set(-50, -50, -50);
        this.scene.add(backLight);
    
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
    }

    /**
     * Create perspective camera - TOP VIEW (looking down Y axis)
     */
    _createCamera() {
        const aspect = this._getAspectRatio();
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.01, 100);

        // Position camera above scene looking down (top view)
        const distance = this.options.cameraDistance;
        this.camera.position.set(0, distance, 0.001); // Slight Z offset to avoid gimbal lock
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, -1); // Adjust up vector for top-down view
    }

    /**
     * Create materials for objects
     */
    _createMaterials() {
        const color = new THREE.Color(this.options.primaryColor);

        this.materials = [
            new THREE.MeshBasicMaterial({
                wireframe: true,
                transparent: true,
                color: color,
                opacity: DEFAULT_CONFIG.opacity,
                side: THREE.DoubleSide,
                depthWrite: false
            }),
            new THREE.MeshBasicMaterial({
                transparent: true,
                color: color,
                opacity: DEFAULT_CONFIG.opacity,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        ];
    }

    /**
     * Create orbit controls
     */
    _createControls() {
        if (!this.options.enableControls) return;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 0.05;
        this.controls.maxDistance = 15;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.8;

        // Polar angle limits (vertical rotation: top to bottom)
        // 0 = looking straight down (top view)
        // Math.PI = looking straight up (bottom view)
        this.controls.minPolarAngle = 0;           // Top view
        this.controls.maxPolarAngle = Math.PI;     // Bottom view

        // Lock horizontal rotation (azimuth) to prevent orbiting sideways
        // Set both to same value to completely lock, or small range for slight movement
        this.controls.minAzimuthAngle = 0;
        this.controls.maxAzimuthAngle = 0;

        // Set target to origin
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        // Store initial camera position to restore after controls update
        this._cameraInitialPos = this.camera.position.clone();
    }

    /**
     * Create post-processing effects
     */
    _createEffects() {
        this.effects = new SciFiEffects(this.renderer, this.scene, this.camera);
    }

    /**
     * Create visualization objects
     */
    _createObjects() {
        for (let i = 0; i < this.options.objectCount; i++) {
            this._createRandomObject();
        }
    }

    /**
     * Create a random ring or dotted cylinder object
     */
    _createRandomObject() {
        if (Math.random() > 0.5) {
            this._createRandomDottedCylinder();
        } else {
            this._createRandomRing();
        }
    }

    /**
     * Create a random dotted cylinder
     */
    _createRandomDottedCylinder() {
        const geometry = createDottedCylinderGeometry({
            y: randomFloat(-3.5, 3),
            height: randomFloat(0.01, 1),
            radius: randomFloat(0.1, 1.5),
            numPieces: randomInt(5, 20),
            quadsPerPiece: 1,
            pieceSize: 2 * Math.PI / randomFloat(20, 40)
        });

        this._addMeshFromGeometry(geometry);
    }

    /**
     * Create a random ring
     */
    _createRandomRing() {
        const innerRadius = randomFloat(0, 2);

        const geometry = createRingGeometry({
            y: randomFloat(-3.5, 3),
            startRadian: randomFloat(-Math.PI, Math.PI),
            endRadian: randomFloat(-Math.PI, Math.PI),
            innerRadius: innerRadius,
            outerRadius: innerRadius + randomFloat(0.05, 0.15),
            numBands: 4,
            numSlices: 90
        });

        this._addMeshFromGeometry(geometry);
    }

    /**
     * Add a mesh to the scene from geometry
     */
    _addMeshFromGeometry(geometry) {
        const material = randomPick(this.materials).clone();
        material.opacity = randomFloat(0.1, 0.3);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.rotationFactor = randomFloat(-1, 1);
        mesh.userData.baseRotationFactor = mesh.userData.rotationFactor;

        this.objects.push(mesh);
        this.scene.add(mesh);
    }

    /**
     * Create Connectome logo and dedicated lights
     * Uses Thin Profile settings from connectome-gallery.html
     * Positions logo above reactor with "C"'s center inscribed in rings
     * NOTE: C Signet is now handled by separate CSignetApp
     */
    _createConnectome() {
        // Create dedicated Thin Profile lights for the logo
        this.connectomeLights = createConnectomeLights();
        this.scene.add(this.connectomeLights);

        // Create the full Connectome logo with Thin Profile settings
        if (DEFAULT_CONFIG.connectomeEnabled) {
            // Merge all CONNECTOME_LOGO_CONFIG properties with provided options
            const connectomeConfig = {
                // Position & Scale
                scale: DEFAULT_CONFIG.connectomeScale,
                xOffset: DEFAULT_CONFIG.connectomePosX,
                yOffset: DEFAULT_CONFIG.connectomePosY,
                zOffset: DEFAULT_CONFIG.connectomePosZ,
                // Material properties
                color: DEFAULT_CONFIG.connectomeColor,
                opacity: DEFAULT_CONFIG.connectomeOpacity,
                roughness: DEFAULT_CONFIG.connectomeRoughness,
                metalness: DEFAULT_CONFIG.connectomeMetalness,
                transparent: DEFAULT_CONFIG.connectomeTransparent,
                wireframe: DEFAULT_CONFIG.connectomeWireframe,
                // Extrusion properties
                depth: DEFAULT_CONFIG.connectomeDepth,
                bevelEnabled: DEFAULT_CONFIG.connectomeBevelEnabled,
                bevelThickness: DEFAULT_CONFIG.connectomeBevelThickness,
                bevelSize: DEFAULT_CONFIG.connectomeBevelSize,
                bevelSegments: DEFAULT_CONFIG.connectomeBevelSegments
            };

            createConnectomeLogoGeometry(connectomeConfig, LOGO_VARIATIONS.SOLID).then(logo => {
                this.connectomeLogo = logo;
                this.scene.add(logo);
                // Force matrix update after async load for proper initial render
                logo.updateMatrixWorld(true);
                this.scene.updateMatrixWorld(true);
            });
        }
    }

    /**
     * Create header mesh with canvas texture (replaces CSS3DObject)
     */
    _createHeaderMesh() {
        const CW = 512, CH = 128;
        const canvas = document.createElement('canvas');
        canvas.width = CW;
        canvas.height = CH;

        const texture = new THREE.CanvasTexture(canvas);

        // Plane sized to match text aspect ratio (512:128 = 4:1)
        // Default scale 1.0 → world width ~2.0
        const planeW = 2.0, planeH = 0.5;
        const geometry = new THREE.PlaneGeometry(planeW, planeH);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: DEFAULT_CONFIG.headerOpacity ?? 0.0,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        // Draw text once font is loaded (fire-and-forget, falls back to system sans-serif)
        const drawText = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, CW, CH);
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(200,200,200,0.85)';
            ctx.font = 'bold 36px "Open Sans", sans-serif';
            ctx.fillText('Agent Friendly Automation', CW - 8, 50);
            ctx.fillStyle = 'rgba(28,180,149,0.85)';
            ctx.font = '400 36px "Open Sans", sans-serif';
            ctx.fillText('FOSS Cloud Native Workflows', CW - 8, 96);
            texture.needsUpdate = true;
        };
        document.fonts.load('400 36px "Open Sans"').then(drawText).catch(drawText);

        this.headerMesh = new THREE.Mesh(geometry, material);

        // Apply default transform (matching former CSS3D defaults)
        this.headerMesh.position.set(
            DEFAULT_CONFIG.headerPosX ?? 1.15,
            DEFAULT_CONFIG.headerPosY ?? 3.1,
            DEFAULT_CONFIG.headerPosZ ?? 0.35
        );
        this.headerMesh.rotation.set(
            DEFAULT_CONFIG.headerRotX ?? -1.57,
            DEFAULT_CONFIG.headerRotY ?? 0.0,
            DEFAULT_CONFIG.headerRotZ ?? 0.0
        );

        this.headerMesh.visible = DEFAULT_CONFIG.headerEnabled ?? true;
        this.scene.add(this.headerMesh);
    }


    /**
     * Setup window resize listener
     */
    _setupEventListeners() {
        this._boundOnResize = () => this._onResize();
        window.addEventListener('resize', this._boundOnResize);

        // Prevent touch scroll on mobile
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * Handle window resize
     */
    _onResize() {
        const width = this._getWidth();
        const height = this._getHeight();

        this._updateSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // Update effects composer
        if (this.effects) {
            this.effects.resize(width, height);
        }

        // Update responsive layout for mobile/tablet
        this._updateResponsiveLayout();
    }

    /**
     * Update responsive layout based on viewport width
     * Applies media query adjustments for mobile screens (< 720px)
     * Only applies X-axis position changes (Y-axis is handled by StageManager)
     */
    _updateResponsiveLayout() {
        const responsiveConfig = getResponsiveConfig();

        // Update Connectome logo position X only
        // Note: Y position is handled by StageManager during transitions
        if (this.connectomeLogo) {
            this.connectomeLogo.position.x = responsiveConfig.connectomePosX;
        }

        // Update header position X only
        // Note: Y position is handled by StageManager during transitions
        if (this.headerMesh) {
            this.headerMesh.position.x = responsiveConfig.headerPosX;
        }
    }

    /**
     * Update renderer size
     */
    _updateSize() {
        this.renderer.setSize(this._getWidth(), this._getHeight());
    }

    /**
     * Get container width
     */
    _getWidth() {
        return this.options.container === document.body
            ? window.innerWidth
            : this.options.container.clientWidth;
    }

    /**
     * Get container height
     */
    _getHeight() {
        return this.options.container === document.body
            ? window.innerHeight
            : this.options.container.clientHeight;
    }

    /**
     * Get current aspect ratio
     */
    _getAspectRatio() {
        return this._getWidth() / this._getHeight();
    }

    /**
     * Calculate irregular camera Z offset using composite sine waves
     * Creates natural, unpredictable oscillation between min and max bounds
     * @param {number} time - Elapsed time in seconds
     * @returns {number} Z offset value
     */
    _calculateCameraZOffset(time) {
        // Apply speed multiplier to time
        const adjustedTime = time * this.cameraZSpeed;

        // Composite multiple sine waves at different frequencies for irregularity
        // Primary wave: slow oscillation (period controlled by cameraZPrimaryFreq)
        const wave1 = Math.sin(adjustedTime * 2 * Math.PI / this.cameraZPrimaryFreq) * 0.5;

        // Secondary wave: faster, smaller amplitude (period controlled by cameraZSecondaryFreq)
        const wave2 = Math.sin(adjustedTime * 2 * Math.PI / this.cameraZSecondaryFreq + 0.5) * 0.3;

        // Tertiary wave: faster still (period controlled by cameraZTertiaryFreq) for micro-jitter
        const wave3 = Math.sin(adjustedTime * 2 * Math.PI / this.cameraZTertiaryFreq + 1.2) * 0.2;

        // Combine waves and normalize to [-1, 1] range
        const combined = (wave1 + wave2 + wave3) / 1.0;
        const normalized = Math.max(-1, Math.min(1, combined));

        // Map to camera Z bounds with amplitude control
        const range = (this.cameraZMax - this.cameraZMin) * this.cameraZAmplitude;
        const center = (this.cameraZMin + this.cameraZMax) / 2;
        const offset = center + (normalized * range / 2);

        return offset;
    }

    /**
     * Animation loop tick
     */
    _tick() {
        if (!this.isRunning) return;

        const delta = this.clock.getDelta();
        this.cameraZElapsedTime += delta;

        // Update controls with damping
        if (this.controls) {
            this.controls.update();
        }

        // Apply automatic irregular Z-axis camera movement (locked from user input)
        if (this.cameraZMotionEnabled) {
            const targetZOffset = this._calculateCameraZOffset(this.cameraZElapsedTime);
            this.camera.position.z = targetZOffset;
        }

        // Update cSignet visibility based on camera distance (if cSignetApp is available)
        if (typeof window.cSignetApp !== 'undefined' && window.cSignetApp) {
            const cameraDistance = this.getCameraDistance();
            const isMobile = window.innerWidth < 720;
            if (!isMobile) {
                window.cSignetApp.setVisibilityByDistance(cameraDistance < 1);
            } else {
                window.cSignetApp.setVisibilityByDistance(cameraDistance < 10);
            }
        }

        // Animate objects with speed multiplier
        const speedFactor = this.rotationSpeed * 0.5;
        this.objects.forEach(obj => {
            obj.rotation.y += delta * speedFactor * obj.userData.rotationFactor;
        });

        // Render with or without effects
        if (this.effects) {
            this.effects.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        requestAnimationFrame(() => this._tick());
    }

    // ==================== Public API ====================

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return this;
        this.isRunning = true;
        this.clock.start();
        this._tick();
        return this;
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        return this;
    }

    /**
     * Set camera distance from target
     * Camera Z position is locked to automatic irregular movement
     * @param {number} distance - Distance value
     */
    setCameraDistance(distance) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        dir.negate().normalize();

        // Set camera position while preserving automatic Z offset
        const savedZ = this.camera.position.z;
        this.camera.position.copy(dir.multiplyScalar(distance));
        this.camera.position.z = savedZ;

        if (this.controls) {
            this.controls.update();
        }
    }

    /**
     * Get current camera distance
     */
    getCameraDistance() {
        return this.camera.position.length();
    }

    /**
     * Capture actual app state for smooth stage transitions
     * This prevents glitches when transitioning between stages after user interaction
     * or automatic motion has modified the scene state.
     *
     * @returns {Object} Current actual state from the app
     */
    getCapturedState() {
        // Helper function to get material from a group or mesh
        const getMaterialFromObject = (obj) => {
            if (!obj) return null;
            // If it's a mesh with material, return it
            if (obj.isMesh && obj.material) {
                return obj.material;
            }
            // If it's a group, find the first child mesh with material
            if (obj.isGroup || obj.children) {
                for (let child of obj.children) {
                    if (child.isMesh && child.material) {
                        return child.material;
                    }
                }
            }
            return null;
        };

        const state = {
            // Camera state - ACTUAL values from Three.js objects
            cameraDistance: this.getCameraDistance(),
            cameraZ: this.camera.position.z,

            // Reactor objects opacity - capture from first object (all should be similar)
            opacity: this.objects.length > 0 ? (this.objects[0].material?.opacity ?? DEFAULT_CONFIG.opacity) : DEFAULT_CONFIG.opacity,

            // Connectome logo state - read from actual Three.js object transforms
            // Important: connectomeLogo is a Group, not a Mesh, so we need to traverse children
            connectomeOpacity: getMaterialFromObject(this.connectomeLogo)?.opacity ?? DEFAULT_CONFIG.connectomeOpacity,
            connectomeMetalness: getMaterialFromObject(this.connectomeLogo)?.metalness ?? DEFAULT_CONFIG.connectomeMetalness,
            connectomeRoughness: getMaterialFromObject(this.connectomeLogo)?.roughness ?? DEFAULT_CONFIG.connectomeRoughness,
        };

        // Capture connectome position if logo exists
        if (this.connectomeLogo) {
            state.connectomePosX = this.connectomeLogo.position.x;
            state.connectomePosY = this.connectomeLogo.position.y;
            state.connectomePosZ = this.connectomeLogo.position.z;
            // NOTE: connectomeRotX is LOCKED (not captured) to prevent wobble during transitions
            // connectomeRotY and connectomeRotZ can animate smoothly
            state.connectomeRotY = this.connectomeLogo.rotation.y;
            state.connectomeRotZ = this.connectomeLogo.rotation.z;
        }

        // Capture C Signet state if available
        if (this.cSignetApp?.cSignet) {
            state.csignetMetalness = this.cSignetApp.cSignet.children?.[0]?.material?.metalness ?? DEFAULT_CONFIG.csignetMetalness;
        }

        // Capture header state
        if (this.headerMesh) {
            state.headerOpacity = this.headerMesh.material?.opacity ?? DEFAULT_CONFIG.headerOpacity;
            state.headerPosX = this.headerMesh.position.x;
            state.headerPosY = this.headerMesh.position.y;
            state.headerPosZ = this.headerMesh.position.z;
            state.headerRotX = this.headerMesh.rotation.x;
            state.headerRotY = this.headerMesh.rotation.y;
            state.headerRotZ = this.headerMesh.rotation.z;
            state.headerScale = this.headerMesh.scale.x;
        }

        return state;
    }

    /**
     * Set rotation speed multiplier
     * @param {number} speed - Speed multiplier (0-5, 1 = normal)
     */
    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    /**
     * Get rotation speed
     */
    getRotationSpeed() {
        return this.rotationSpeed;
    }

    /**
     * Set object opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setOpacity(opacity) {
        this.objects.forEach(obj => {
            if (obj.material) {
                obj.material.opacity = opacity;
                // Flag for shader recompilation when opacity changes transparency behavior
                obj.material.needsUpdate = true;
            }
        });
    }

    /**
     * Set primary color
     * @param {string|number} color - CSS color string or hex number
     */
    setColor(color) {
        const threeColor = new THREE.Color(color);
        this.objects.forEach(obj => {
            if (obj.material) {
                obj.material.color.copy(threeColor);
            }
        });

        // Update glow color in effects
        if (this.effects) {
            this.effects.setGlowColor(color);
        }
    }

    /**
     * Toggle wireframe mode
     * @param {boolean} enabled - Whether wireframe is enabled
     */
    setWireframe(enabled) {
        this.objects.forEach(obj => {
            if (obj.material) {
                obj.material.wireframe = enabled;
            }
        });
    }

    /**
     * Clear all objects and regenerate
     * @param {number} [count] - Number of objects to create
     */
    regenerate(count) {
        // Remove existing objects
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        this.objects = [];

        // Create new objects
        this.options.objectCount = count ?? this.options.objectCount;
        this._createObjects();
    }

    // ==================== Shader Effects API ====================

    /**
     * Enable/disable shader effects
     */
    setShaderEnabled(enabled) {
        if (this.effects) {
            this.effects.setEnabled(enabled);
        }
    }

    /**
     * Set bloom strength
     */
    setBloomStrength(value) {
        if (this.effects) {
            this.effects.setBloomStrength(value);
        }
    }

    /**
     * Set bloom threshold
     */
    setBloomThreshold(value) {
        if (this.effects) {
            this.effects.setBloomThreshold(value);
        }
    }

    /**
     * Set scanline intensity
     */
    setScanlineIntensity(value) {
        if (this.effects) {
            this.effects.setScanlineIntensity(value);
        }
    }

    /**
     * Set noise/grain intensity
     */
    setNoiseIntensity(value) {
        if (this.effects) {
            this.effects.setNoiseIntensity(value);
        }
    }

    /**
     * Set RGB shift amount
     */
    setRgbShift(value) {
        if (this.effects) {
            this.effects.setRgbShift(value);
        }
    }

    /**
     * Get shader parameters
     */
    getShaderParams() {
        return this.effects ? this.effects.getParams() : null;
    }

    // ==================== Connectome Logo API ====================

    /**
     * Set Connectome logo visibility
     * @param {boolean} visible - Whether the logo is visible
     */
    setConnectomeVisible(visible) {
        if (this.connectomeLogo) {
            this.connectomeLogo.visible = visible;
        }
    }

    /**
     * Set Connectome logo scale
     * @param {number} scale - Scale factor
     */
    setConnectomeScale(scale) {
        updateLogoScale(this.connectomeLogo, scale);
    }

    /**
     * Set Connectome logo Y position (height above reactor)
     * @param {number} yOffset - Y position offset
     */
    setConnectomeYOffset(yOffset) {
        updateLogoPosition(this.connectomeLogo, yOffset);
    }

    /**
     * Set Connectome logo X position
     * @param {number} x - X position
     */
    setConnectomePosX(x) {
        updateLogoPositionXYZ(this.connectomeLogo, { x });
    }

    /**
     * Set Connectome logo Y position
     * @param {number} y - Y position
     */
    setConnectomePosY(y) {
        updateLogoPositionXYZ(this.connectomeLogo, { y });
    }

    /**
     * Set Connectome logo Z position
     * @param {number} z - Z position
     */
    setConnectomePosZ(z) {
        updateLogoPositionXYZ(this.connectomeLogo, { z });
    }

    /**
     * Set Connectome logo rotation X
     * @param {number} rx - X rotation in radians
     */
    setConnectomeRotX(rx) {
        updateLogoRotation(this.connectomeLogo, { x: rx });
    }

    /**
     * Set Connectome logo rotation Y
     * @param {number} ry - Y rotation in radians
     */
    setConnectomeRotY(ry) {
        updateLogoRotation(this.connectomeLogo, { y: ry });
    }

    /**
     * Set Connectome logo rotation Z
     * @param {number} rz - Z rotation in radians
     */
    setConnectomeRotZ(rz) {
        updateLogoRotation(this.connectomeLogo, { z: rz });
    }

    /**
     * Set Connectome logo color
     * @param {string|number} color - CSS color string or hex number
     */
    setConnectomeColor(color) {
        updateLogoMaterial(this.connectomeLogo, { color: new THREE.Color(color).getHex() });
    }

    /**
     * Set Connectome logo opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setConnectomeOpacity(opacity) {
        updateLogoMaterial(this.connectomeLogo, { opacity });
    }

    /**
     * Set Connectome logo roughness
     * @param {number} roughness - Roughness value (0-1)
     */
    setConnectomeRoughness(roughness) {
        updateLogoMaterial(this.connectomeLogo, { roughness });
    }

    /**
     * Set Connectome logo metalness
     * @param {number} metalness - Metalness value (0-1)
     */
    setConnectomeMetalness(metalness) {
        updateLogoMaterial(this.connectomeLogo, { metalness });
    }

    /**
     * Set Connectome logo wireframe mode
     * @param {boolean} wireframe - Whether wireframe is enabled
     */
    setConnectomeWireframe(wireframe) {
        updateLogoMaterial(this.connectomeLogo, { wireframe });
    }

    /**
     * Set Connectome dedicated light intensities
     * @param {Object} intensities - Object with light intensity values
     */
    setConnectomeLightIntensities(intensities) {
        updateLightIntensities(this.connectomeLights, intensities);
    }

    /**
     * Set ambient light intensity for Connectome
     * @param {number} intensity - Intensity value
     */
    setConnectomeLightAmbient(intensity) {
        updateLightIntensities(this.connectomeLights, { ambient: intensity });
    }

    /**
     * Set main directional light intensity for Connectome
     * @param {number} intensity - Intensity value
     */
    setConnectomeLightMain(intensity) {
        updateLightIntensities(this.connectomeLights, { main: intensity });
    }

    /**
     * Set back light intensity for Connectome (teal accent)
     * @param {number} intensity - Intensity value
     */
    setConnectomeLightBack(intensity) {
        updateLightIntensities(this.connectomeLights, { back: intensity });
    }

    /**
     * Set fill light intensity for Connectome
     * @param {number} intensity - Intensity value
     */
    setConnectomeLightFill(intensity) {
        updateLightIntensities(this.connectomeLights, { fill: intensity });
    }

    /**
     * Set reference to CSignetApp for stage transitions
     * @param {CSignetApp} cSignetApp - The CSignetApp instance
     */
    setCSignetApp(cSignetApp) {
        this.cSignetApp = cSignetApp;
    }

    /**
     * Set C Signet metalness (delegates to CSignetApp)
     * @param {number} metalness - Metalness value (0-1)
     */
    setCSignetMetalness(metalness) {
        if (this.cSignetApp && this.cSignetApp.setCSignetMetalness) {
            this.cSignetApp.setCSignetMetalness(metalness);
        }
    }

    // ==================== Header CSS3D API ====================

    /**
     * Set header visibility
     * @param {boolean} enabled - Whether header is visible
     */
    setHeaderEnabled(enabled) {
        if (this.headerMesh) {
            this.headerMesh.visible = enabled;
        }
    }

    /**
     * Set header scale
     * @param {number} scale - Scale factor (1.0 = default size)
     */
    setHeaderScale(scale) {
        if (this.headerMesh) {
            this.headerMesh.scale.setScalar(scale);
        }
    }

    /**
     * Set header opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setHeaderOpacity(opacity) {
        if (this.headerMesh && this.headerMesh.material) {
            this.headerMesh.material.opacity = opacity;
            // Flag for shader recompilation when opacity changes transparency behavior
            this.headerMesh.material.needsUpdate = true;
        }
    }

    /**
     * Set header X position
     * @param {number} x - X position in world units
     */
    setHeaderPosX(x) {
        if (this.headerMesh) {
            this.headerMesh.position.x = x;
        }
    }

    /**
     * Set header Y position
     * @param {number} y - Y position in world units
     */
    setHeaderPosY(y) {
        if (this.headerMesh) {
            this.headerMesh.position.y = y;
        }
    }

    /**
     * Set header Z position
     * @param {number} z - Z position in world units
     */
    setHeaderPosZ(z) {
        if (this.headerMesh) {
            this.headerMesh.position.z = z;
        }
    }

    /**
     * Set header X rotation
     * @param {number} rx - X rotation in radians
     */
    setHeaderRotX(rx) {
        if (this.headerMesh) {
            this.headerMesh.rotation.x = rx;
        }
    }

    /**
     * Set header Y rotation
     * @param {number} ry - Y rotation in radians
     */
    setHeaderRotY(ry) {
        if (this.headerMesh) {
            this.headerMesh.rotation.y = ry;
        }
    }

    /**
     * Set header Z rotation
     * @param {number} rz - Z rotation in radians
     */
    setHeaderRotZ(rz) {
        if (this.headerMesh) {
            this.headerMesh.rotation.z = rz;
        }
    }

    // ==================== Camera Z Motion API ====================

    /**
     * Enable/disable camera Z-axis irregular motion
     * @param {boolean} enabled - Whether motion is enabled
     */
    setCameraZMotionEnabled(enabled) {
        this.cameraZMotionEnabled = enabled;
        if (!enabled) {
            this.camera.position.z = 0.001;
        }
    }

    /**
     * Set camera Z motion speed multiplier
     * @param {number} speed - Speed multiplier (1.0 = normal speed)
     */
    setCameraZSpeed(speed) {
        this.cameraZSpeed = Math.max(0.1, speed);
    }

    /**
     * Set camera Z motion amplitude multiplier
     * @param {number} amplitude - Amplitude multiplier (1.0 = full amplitude)
     */
    setCameraZAmplitude(amplitude) {
        this.cameraZAmplitude = Math.max(0, amplitude);
    }

    /**
     * Set primary wave frequency (period in seconds)
     * @param {number} frequency - Period in seconds
     */
    setCameraZPrimaryFreq(frequency) {
        this.cameraZPrimaryFreq = Math.max(0.1, frequency);
    }

    /**
     * Set secondary wave frequency (period in seconds)
     * @param {number} frequency - Period in seconds
     */
    setCameraZSecondaryFreq(frequency) {
        this.cameraZSecondaryFreq = Math.max(0.1, frequency);
    }

    /**
     * Set tertiary wave frequency (period in seconds)
     * @param {number} frequency - Period in seconds
     */
    setCameraZTertiaryFreq(frequency) {
        this.cameraZTertiaryFreq = Math.max(0.1, frequency);
    }

    // ==================== Glitch Effect API ====================

    /**
     * Enable/disable glitch effect
     * @param {boolean} enabled - Whether glitch is enabled
     */
    setGlitchEnabled(enabled) {
        if (this.effects) {
            this.effects.setGlitchEnabled(enabled);
        }
    }

    /**
     * Set glitch intensity
     * @param {number} value - Intensity value (0-1)
     */
    setGlitchIntensity(value) {
        if (this.effects) {
            this.effects.setGlitchIntensity(value);
        }
    }

    /**
     * Set glitch speed
     * @param {number} value - Speed multiplier
     */
    setGlitchSpeed(value) {
        if (this.effects) {
            this.effects.setGlitchSpeed(value);
        }
    }

    /**
     * Set glitch block size
     * @param {number} value - Block size value
     */
    setGlitchBlockSize(value) {
        if (this.effects) {
            this.effects.setGlitchBlockSize(value);
        }
    }

    /**
     * Set glitch color separation
     * @param {number} value - Color separation amount
     */
    setGlitchColorSeparation(value) {
        if (this.effects) {
            this.effects.setGlitchColorSeparation(value);
        }
    }

    // ==================== Stage Transition API ====================

    /**
     * Transition to a specific stage
     * @param {number} stageIndex - Stage index (0, 1, or 2)
     * @param {Object} options - Transition options (duration, easing, onComplete)
     * @returns {Promise} Resolves when transition completes
     */
    transitionToStage(stageIndex, options = {}) {
        if (this.stageManager) {
            return this.stageManager.transitionTo(stageIndex, options);
        }
        return Promise.resolve();
    }

    /**
     * Transition to next stage
     * @param {Object} options - Transition options
     * @returns {Promise} Resolves when transition completes
     */
    nextStage(options = {}) {
        if (this.stageManager) {
            return this.stageManager.next(options);
        }
        return Promise.resolve();
    }

    /**
     * Transition to previous stage
     * @param {Object} options - Transition options
     * @returns {Promise} Resolves when transition completes
     */
    previousStage(options = {}) {
        if (this.stageManager) {
            return this.stageManager.previous(options);
        }
        return Promise.resolve();
    }

    /**
     * Get current stage index
     * @returns {number} Current stage index
     */
    getCurrentStage() {
        return this.stageManager ? this.stageManager.getCurrentStage() : 0;
    }

    /**
     * Check if currently transitioning between stages
     * @returns {boolean} True if transitioning
     */
    isTransitioning() {
        return this.stageManager ? this.stageManager.getIsTransitioning() : false;
    }

    /**
     * Reset to initial stage (no animation)
     */
    resetStage() {
        if (this.stageManager) {
            this.stageManager.reset();
        }
    }

    /**
     * Set stage transition duration
     * @param {number} duration - Duration in ms
     */
    setTransitionDuration(duration) {
        if (this.stageManager) {
            this.stageManager.setTransitionDuration(duration);
        }
    }

    /**
     * Get the StageManager instance for advanced control
     * @returns {StageManager} Stage manager instance
     */
    getStageManager() {
        return this.stageManager;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.stop();

        // Remove event listeners
        window.removeEventListener('resize', this._boundOnResize);

        // Dispose objects
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });

        // Dispose materials
        this.materials.forEach(m => m.dispose());

        // Dispose Connectome logo
        if (this.connectomeLogo) {
            this.scene.remove(this.connectomeLogo);
            disposeLogo(this.connectomeLogo);
        }

        // Dispose Connectome lights
        if (this.connectomeLights) {
            this.scene.remove(this.connectomeLights);
        }

        // Dispose effects
        if (this.effects) {
            this.effects.dispose();
        }

        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Dispose renderer
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}

/**
 * C Signet Standalone Application
 * Separate 320x320px Three.js scene for the C Signet
 * Completely independent from the main Reactome visualization
 */
export class CSignetApp {
    constructor(options = {}) {
        this.options = {
            container: options.container || document.body,
            size: options.size || 320,
            backgroundColor: options.backgroundColor ?? 0x000000,
            backgroundAlpha: options.backgroundAlpha ?? 0,
            ...options
        };

        // Runtime state
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.cSignet = null;
        this.cSignetHitbox = null;

        // Interaction state
        this.isDragging = false;
        this.dragStartPos = new THREE.Vector2();
        this.homePosition = new THREE.Vector3(0, 0, 0);
        this.currentOffset = new THREE.Vector3(0, 0, 0);
        this.dragVelocity = new THREE.Vector3(0, 0, 0);
        this.maxDragDistance = 0.4; // Maximum drag amount (allows good freedom without hitting bounds)
        this.returnDuration = 800; // ms to return to home
        this.isReturning = false;
        this.returnStartTime = 0;
        this.returnStartOffset = new THREE.Vector3(0, 0, 0);
        this.zeroOffset = new THREE.Vector3(0, 0, 0); // Target offset (home)

        // Raycaster for interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Fade state
        this.cSignetNormalOpacity = 0.2; // Will be set during loadCSignet
        this.cSignetTargetOpacity = 0;
        this.cSignetFadeDuration = 300; // ms

        this._init();
    }

    /**
     * Initialize the application
     */
    _init() {
        this._createRenderer();
        this._createScene();
        this._createCamera();
        this._createLights();
        this._setupEventListeners();
        this._setupInteraction();
    }

    /**
     * Create WebGL renderer for 320x320px viewport
     */
    _createRenderer() {
        const canvas = document.createElement('canvas');
        this.options.container.appendChild(canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(this.options.backgroundColor, this.options.backgroundAlpha);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setSize(this.options.size, this.options.size);
    }

    /**
     * Create the scene
     */
    _createScene() {
        this.scene = new THREE.Scene();
    }

    /**
     * Create perspective camera for the signet (top-down view)
     */
    _createCamera() {
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);

        // Position camera above the signet looking down
        const distance = 2.5;
        this.camera.position.set(0, distance, 0.001);
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, -1);
    }

    /**
     * Create dedicated lights for the C Signet
     */
    _createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 0.2);
        mainLight.position.set(50, 50, 50);
        this.scene.add(mainLight);

        const backLight = new THREE.DirectionalLight(0x1cb495, 0.4);
        backLight.position.set(-50, -50, -50);
        this.scene.add(backLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
    }

    /**
     * Setup window resize listener (minimal, fixed size)
     */
    _setupEventListeners() {
        // Fixed size, no resize needed
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._onInteractionStart(e.touches[0]);
        }, { passive: false });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this._onInteractionMove(e.touches[0]);
        }, { passive: false });

        this.renderer.domElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this._onInteractionEnd(e);
        }, { passive: false });

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this._onInteractionStart(e);
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            this._onInteractionMove(e);
        });

        this.renderer.domElement.addEventListener('mouseup', (e) => {
            this._onInteractionEnd(e);
        });

        this.renderer.domElement.addEventListener('mouseleave', (e) => {
            this._onInteractionEnd(e);
        });
    }

    /**
     * Setup interaction helper
     */
    _setupInteraction() {
        // This is called after scene is ready
    }

    /**
     * Handle interaction start (mouse down / touch start)
     */
    _onInteractionStart(event) {
        if (!this.cSignet || !this.cSignetHitbox) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = event.clientX ?? event.pageX;
        const y = event.clientY ?? event.pageY;

        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Check if clicking on hitbox square
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.cSignetHitbox);

        if (intersects.length > 0) {
            this.isDragging = true;
            this.dragStartPos.copy(this.mouse);
        }
    }

    /**
     * Handle interaction move (mouse move / touch move)
     */
    _onInteractionMove(event) {
        if (!this.isDragging || !this.cSignet) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = event.clientX ?? event.pageX;
        const y = event.clientY ?? event.pageY;

        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Calculate drag delta
        const dragDelta = new THREE.Vector2();
        dragDelta.subVectors(this.mouse, this.dragStartPos);

        // Apply drag to offset (clamp to max distance)
        const dragMagnitude = dragDelta.length();
        if (dragMagnitude > 0) {
            const normalizedDrag = dragDelta.clone().normalize();
            const constrainedMagnitude = Math.min(dragMagnitude, this.maxDragDistance);
            this.currentOffset.x = normalizedDrag.x * constrainedMagnitude;
            this.currentOffset.y = normalizedDrag.y * constrainedMagnitude;
        }

        this.isReturning = false;
    }

    /**
     * Handle interaction end (mouse up / touch end)
     */
    _onInteractionEnd(event) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.isReturning = true;
        this.returnStartTime = Date.now();
        this.returnStartOffset.copy(this.currentOffset);
    }

    /**
     * Animation loop tick
     */
    _tick() {
        if (!this.isRunning) return;

        const delta = this.clock.getDelta();

        // Slow rotation of the signet
        if (this.cSignet) {
            // Apply magnetic pull effect
            if (this.isDragging) {
                // Visual feedback during drag
                this._updateDraggedPosition();
            } else if (this.isReturning) {
                // Smooth return with wobble
                this._updateReturningPosition(delta);
            } else {
                // DO NOT ENABLE! Default rotation when idle
                // this.cSignet.rotation.z += delta * 0.3;
            }

            // Smoothly fade cSignet opacity based on target
            const fadeSpeed = 1 / this.cSignetFadeDuration; // fraction per millisecond
            this.cSignet.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        const diff = this.cSignetTargetOpacity - mat.opacity;
                        if (Math.abs(diff) > 0.001) {
                            mat.opacity += diff * (delta * 1000 * fadeSpeed); // delta is in seconds
                        }
                    });
                }
            });

            // Set visibility based on opacity
            const isVisible = this.cSignet.children.some(child => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    return materials.some(mat => mat.opacity > 0.01);
                }
                return false;
            });

            this.cSignet.visible = isVisible;
            if (this.cSignetHitbox) {
                this.cSignetHitbox.visible = isVisible;
            }
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this._tick());
    }

    /**
     * Update position while being dragged
     */
    _updateDraggedPosition() {
        if (!this.cSignet) return;
        this.cSignet.position.copy(this.homePosition).add(this.currentOffset);

        // Move hitbox with cSignet
        if (this.cSignetHitbox) {
            this.cSignetHitbox.position.copy(this.cSignet.position);
            this.cSignetHitbox.position.z = this.cSignet.position.z + 0.01;
        }
    }

    /**
     * Update position while returning with gravity field effect
     * C Signet struggles against strong irregular gravity but cannot escape (max 30px from home)
     */
    _updateReturningPosition(delta) {
        if (!this.cSignet) return;

        const now = Date.now();
        const elapsed = now - this.returnStartTime;
        const progress = Math.min(elapsed / this.returnDuration, 1);

        // Easing function: ease-out cubic for smooth return
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // STRONG GRAVITY FIELD - Constrains movement to max 30px from home
        const maxDisplacement = 0.02; // 30px in world units (approximate)
        const gravityStrength = 0.5; // MUCH stronger - pulls harder as you try to move away

        // Calculate current distance from home
        const distanceFromHome = this.currentOffset.length();

        // Apply gravity force that increases with distance
        // This creates a "rubber band" effect that snaps back
        const gravityMagnitude = Math.pow(distanceFromHome / maxDisplacement, 2) * gravityStrength;

        // Gravity pulls directly back toward zero offset (home)
        const gravityDirection = this.currentOffset.clone().normalize();
        const gravityForce = gravityDirection.multiplyScalar(-gravityMagnitude * 0.05);

        // Start lerping offset back to zero
        this.currentOffset.lerpVectors(
            this.returnStartOffset,
            this.zeroOffset,
            easeProgress
        );

        // Add strong gravity pull
        this.currentOffset.add(gravityForce);

        // HARD CLAMP - Never let it move more than 30px from home
        const clampedLength = Math.min(this.currentOffset.length(), maxDisplacement);
        if (this.currentOffset.length() > 0.001) {
            this.currentOffset.normalize().multiplyScalar(clampedLength);
        }

        // Chaotic wobble - struggling against the field
        const wobbleFrequency = 18; // Hz - faster, more erratic
        const wobbleAmount = (1 - easeProgress) * 0.28; // Stronger initial struggle

        // Irregular wobble with multiple frequencies creates struggling motion
        const wobble1 = Math.sin(progress * wobbleFrequency * Math.PI * 2) * wobbleAmount;
        const wobble2 = Math.sin(progress * wobbleFrequency * 1.6 * Math.PI * 2) * wobbleAmount * 0.7;
        const wobble3 = Math.cos(progress * wobbleFrequency * 0.8 * Math.PI * 2) * wobbleAmount * 0.5;

        // Combined wobble with clamping to respect 30px limit
        let wobbleOffset = new THREE.Vector3(
            (wobble1 + wobble2 * 0.5) * 0.08,
            (wobble2 + wobble3 * 0.6) * 0.06,
            0
        );

        // Make sure wobble doesn't exceed max displacement
        if (wobbleOffset.length() > maxDisplacement * 0.8) {
            wobbleOffset.normalize().multiplyScalar(maxDisplacement * 0.8);
        }

        // Update position: home + current offset + wobble
        this.cSignet.position.copy(this.homePosition).add(this.currentOffset).add(wobbleOffset);

        // Move hitbox with cSignet
        if (this.cSignetHitbox) {
            this.cSignetHitbox.position.copy(this.cSignet.position);
            this.cSignetHitbox.position.z = this.cSignet.position.z + 0.01;
        }

        // Finish return
        if (progress >= 1) {
            this.isReturning = false;
            this.currentOffset.set(0, 0, 0);
            this.cSignet.position.copy(this.homePosition);
            if (this.cSignetHitbox) {
                this.cSignetHitbox.position.copy(this.homePosition);
                this.cSignetHitbox.position.z = this.homePosition.z + 0.01;
            }
        }
    }

    // ==================== Public API ====================

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return this;
        this.isRunning = true;
        this.clock.start();
        this._tick();
        return this;
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        return this;
    }

    /**
     * Load and display the C Signet
     */
    async loadCSignet(options = {}) {
        if (this.cSignet) {
            this.scene.remove(this.cSignet);
            disposeLogo(this.cSignet);
        }

        // Remove old hitbox if it exists
        if (this.cSignetHitbox) {
            this.scene.remove(this.cSignetHitbox);
            this.cSignetHitbox.geometry.dispose();
            this.cSignetHitbox.material.dispose();
            this.cSignetHitbox = null;
        }

        // Merge all C_SIGNET_CONFIG properties with provided options
        const config = {
            // Position & Scale
            scale: options.scale ?? DEFAULT_CONFIG.cSignetScale,
            xOffset: options.xOffset ?? DEFAULT_CONFIG.cSignetPosX ?? C_SIGNET_CONFIG.xOffset,
            yOffset: options.yOffset ?? DEFAULT_CONFIG.cSignetPosY ?? C_SIGNET_CONFIG.yOffset,
            zOffset: options.zOffset ?? DEFAULT_CONFIG.cSignetPosZ ?? C_SIGNET_CONFIG.zOffset,
            // Material properties
            color: options.color ?? C_SIGNET_CONFIG.color,
            opacity: options.opacity ?? C_SIGNET_CONFIG.opacity,
            transparent: options.transparent ?? C_SIGNET_CONFIG.transparent,
            wireframe: options.wireframe ?? C_SIGNET_CONFIG.wireframe,
            roughness: options.roughness ?? C_SIGNET_CONFIG.roughness,
            metalness: options.metalness ?? C_SIGNET_CONFIG.metalness,
            // Extrusion properties
            depth: options.depth ?? C_SIGNET_CONFIG.depth,
            bevelEnabled: options.bevelEnabled ?? C_SIGNET_CONFIG.bevelEnabled,
            bevelThickness: options.bevelThickness ?? C_SIGNET_CONFIG.bevelThickness,
            bevelSize: options.bevelSize ?? C_SIGNET_CONFIG.bevelSize,
            bevelSegments: options.bevelSegments ?? C_SIGNET_CONFIG.bevelSegments
        };

        this.cSignet = await createCSignetGeometry(config, LOGO_VARIATIONS.HOLOGRAM);
        this.scene.add(this.cSignet);
        this.cSignet.updateMatrixWorld(true);
        this.scene.updateMatrixWorld(true);

        // Start cSignet completely faded out, will fade in when distance < 1
        const targetOpacity = config.opacity;
        this.cSignet.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.opacity = 0);
                } else {
                    child.material.opacity = 0;
                }
            }
        });

        // Store normal opacity for fade in/out logic in _tick
        // targetOpacity is what it will fade to when visible
        // but starts at 0 and stays at 0 until distance check enables it
        this.cSignetNormalOpacity = targetOpacity;
        this.cSignetTargetOpacity = 0;

        // Create invisible square hitbox for easier dragging (as scene sibling, not child)
        this._createSquareHitbox();

        // Set home position for magnetic pull
        this.homePosition.copy(this.cSignet.position);
        this.currentOffset.set(0, 0, 0);

        return this;
    }

    /**
     * Create invisible square hitbox for interaction
     */
    _createSquareHitbox() {
        if (!this.cSignet) return;

        // Create square plane (1.2 x 1.2 units - larger than the signet for easier targeting)
        const hitboxGeometry = new THREE.PlaneGeometry(1.2, 1.2);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        this.cSignetHitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.cSignetHitbox.name = 'csignet-hitbox';

        // Position hitbox at same location as cSignet
        this.cSignetHitbox.position.copy(this.cSignet.position);
        this.cSignetHitbox.position.z = this.cSignet.position.z + 0.01; // Slightly in front

        // Add to scene, not as child of cSignet
        this.scene.add(this.cSignetHitbox);
    }

    /**
     * Set C Signet visibility
     */
    setCSignetVisible(visible) {
        if (this.cSignet) {
            this.cSignet.visible = visible;
        }
    }

    /**
     * Set C Signet visibility by distance (for smooth fade in/out)
     * @param {boolean} shouldBeVisible - Whether signet should be visible (camera distance < 3)
     */
    setVisibilityByDistance(shouldBeVisible) {
        if (shouldBeVisible) {
            this.cSignetTargetOpacity = this.cSignetNormalOpacity;
        } else {
            this.cSignetTargetOpacity = 0;
        }
    }

    /**
     * Set C Signet scale
     */
    setCSignetScale(scale) {
        updateLogoScale(this.cSignet, scale);
    }

    /**
     * Set C Signet position
     */
    setCSignetPosX(x) {
        updateLogoPositionXYZ(this.cSignet, { x });
    }

    setCSignetPosY(y) {
        updateLogoPositionXYZ(this.cSignet, { y });
    }

    setCSignetPosZ(z) {
        updateLogoPositionXYZ(this.cSignet, { z });
    }

    /**
     * Set C Signet rotation
     */
    setCSignetRotX(rx) {
        updateLogoRotation(this.cSignet, { x: rx });
    }

    setCSignetRotY(ry) {
        updateLogoRotation(this.cSignet, { y: ry });
    }

    setCSignetRotZ(rz) {
        updateLogoRotation(this.cSignet, { z: rz });
    }

    /**
     * Set C Signet color
     */
    setCSignetColor(color) {
        updateLogoMaterial(this.cSignet, { color: new THREE.Color(color).getHex() });
    }

    /**
     * Set C Signet metalness (for fade in/out via material shine)
     * @param {number} metalness - Metalness value (0-1)
     */
    setCSignetMetalness(metalness) {
        updateLogoMaterial(this.cSignet, { metalness });
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.stop();

        // Cancel any ongoing animation
        this.isDragging = false;
        this.isReturning = false;

        if (this.cSignet) {
            this.scene.remove(this.cSignet);
            disposeLogo(this.cSignet);
        }

        if (this.cSignetHitbox) {
            this.scene.remove(this.cSignetHitbox);
            this.cSignetHitbox.geometry.dispose();
            this.cSignetHitbox.material.dispose();
        }

        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
