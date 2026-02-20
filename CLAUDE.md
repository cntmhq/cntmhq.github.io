---
name: connectome-frontend-design
description: Create distinctive, production-grade connectome frontend interfaces with high design quality. Use this documentation when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This documentation guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density using threejs scene and animations.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors controlling threejs canvas. Add contextual effects and animations that match the overall aesthetic. Apply creative forms like animated zoom to 3d scene, enable noise or glitch effects, change textures and materials, modify geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and static, grain and noise values.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## THREEJS IMPLEMENTATION

With the philosophy AND conceptual framework established, express it through code. 

### ⚠️ STEP 0: READ THE TEMPLATE FIRST ⚠️

**CRITICAL: BEFORE writing any HTML:**
0. **SKILLS DEPENDENCIES**: use these skills for any threejs actions `~/.claude/skills/threejs-animation`, `~/.claude/skills/threejs-fundamentals`, `~/.claude/skills/threejs-geometry`, `~/.claude/skills/threejs-interaction`, `~/.claude/skills/threejs-lighting`, `~/.claude/skills/threejs-loaders`, `~/.claude/skills/threejs-materials`, `~/.claude/skills/threejs-postprocessing`, `~/.claude/skills/threejs-shaders`, `~/.claude/skills/threejs-textures`
1. **Read** `./index.html`, `./styles.css`, `./js/App.js`,`./js/main.js`,`./js/geometries`,`./js/effects` using the Read tool
2. **Study** the exact structure and styling
3. **Use those files as the LITERAL STARTING POINT** - not just inspiration
4. **Keep all FIXED sections exactly as shown** (header, sidebar structure, colors/fonts, seed controls, action buttons)
5. **Replace only the VARIABLE sections** marked in the files comments (animations, parameters, UI controls for parameters)

**Avoid:**
- ❌ Creating HTML/JS/CSS from scratch
- ❌ Inventing custom styling or color schemes
- ❌ Using system fonts or dark themes
- ❌ Changing the sidebar structure

**Follow these practices:**
- ✅ Copy the template's exact HTML structure
- ✅ Keep design, models, mesh, effect, fonts, light colors, gradient backdrop
- ✅ Maintain the sidebar layout (Controls → Parameters → Colors? → Actions)
- ✅ Replace only the design and threejs parameter controls

The templates are the foundation. Build on them, don't rebuild them.

---

### TECHNICAL REQUIREMENTS

**Seeded Randomness (Art Blocks Pattern)**:
```javascript
// ALWAYS use a seed for reproducibility
let seed = 12345; // or hash from user input
randomSeed(seed);
noiseSeed(seed);
```

**Parameter Structure - FOLLOW THE PHILOSOPHY**:

To establish parameters that emerge naturally from the algorithmic philosophy, consider: "What qualities of this system can be adjusted?"

```javascript
let params = {
  seed: 12345,  // Always include seed for reproducibility
  // colors
  // Add parameters that control YOUR algorithm:
  // - Quantities (how many?)
  // - Scales (how big? how fast?)
  // - Probabilities (how likely?)
  // - Ratios (what proportions?)
  // - Angles (what direction?)
  // - Camera (what angle, zoom, position?)
  // - Thresholds (when does behavior change?)
};
```

**Canvas Setup**: Standard threejs App.js structure:
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRingGeometry } from './geometries/Ring.js';
import { createDottedCylinderGeometry } from './geometries/DottedCylinder.js';
import { randomFloat, randomInt, randomPick } from './utils/random.js';
import { SciFiEffects } from './effects/SciFiShader.js';

/**
 * Default configuration values
 * Centralized for easy access by UI synchronization
 */
export const DEFAULT_CONFIG = {
    backgroundColor: 0x000000,
    backgroundAlpha: 0,
    primaryColor: '#1cb495',
    cameraDistance: 2.5,
    objectCount: 70,
    rotationSpeed: 1.0,
    opacity: 0.2,
    wireframe: false,
    // Shader defaults
    shaderEnabled: false,
    bloomStrength: 0.8,
    bloomThreshold: 0.6,
    scanlineIntensity: 0.15,
    noiseIntensity: 0.05,
    rgbShift: 0.002
};

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
        this._createEffects();
        this._setupEventListeners();
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
        this.controls.minDistance = 0.5;
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
     * Animation loop tick
     */
    _tick() {
        if (!this.isRunning) return;

        const delta = this.clock.getDelta();

        // Update controls with damping
        if (this.controls) {
            this.controls.update();
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

```

### OUTPUT FORMAT

Output:
1. **React App Artifacts** - Self-contained interactive generative art built from local templates (see STEP 0 and next section)

The React App artifacts contain everything: `main.js`, `App.js`, `styles.css`, `index.html` (threejs assets from CDN), the algorithm, parameter controls, and UI - all in one file that works immediately via `python3 -m http.server 8000` command and in any browser. Start from the template files, not from scratch.

---

## INTERACTIVE ARTIFACT CREATION

**REMINDER: `index.html` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `styles.css` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `js/App.js` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `js/main.js` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `js/geometries/DottedCylinder.js` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `js/geometries/Ring.js` should have already been read (see STEP 0). Use that file as the starting point.**
**REMINDER: `js/effects/SciFiShader.js` should have already been read (see STEP 0). Use that file as the starting point.**

### CRITICAL: WHAT'S FIXED VS VARIABLE

**SKILLS DEPENDENCIES**: use these locally installed skills for code representation of threejs `~/.claude/skills/threejs-animation`, `~/.claude/skills/threejs-fundamentals`, `~/.claude/skills/threejs-geometry`, `~/.claude/skills/threejs-interaction`, `~/.claude/skills/threejs-lighting`, `~/.claude/skills/threejs-loaders`, `~/.claude/skills/threejs-materials`, `~/.claude/skills/threejs-postprocessing`, `~/.claude/skills/threejs-shaders`, `~/.claude/skills/threejs-textures`
The `./index.html`, `./styles.css`, `./js/App.js`,`./js/main.js`,`./js/geometries/DottedCylinder.js`,`./js/geometries/Ring.js`,`./js/effects/SciFiShader.js`  files are the foundation. They contain the exact structure and styling needed.

**FIXED (always include exactly as shown):**
- Layout structure (header, sidebar, main canvas area)
- Color scheme (UI colors, fonts, gradients)
- Seed section in sidebar:
  - Seed display
  - Previous/Next buttons
  - Random button
  - Jump to seed input + Go button
- Actions section in sidebar:
  - Regenerate button
  - Reset button

**VARIABLE (customize for each design):**
- The threejs stage (camera/animation/shaders/effects)
- The Parameters section in sidebar:
  - Number of parameter controls
  - Parameter names
  - Min/max/step values for sliders
  - Control types (sliders, inputs, etc.)
- Colors section (optional):
  - Some designs needs color pickers
  - Some designs might use fixed colors
  - Some designs might be monochrome (no color controls needed)
  - Some designs might use shaders
  - Some designs might use visual effects
  - Some designs might use compression
  - Decide based on the designs's needs

**Every designs should have unique parameters and memorable feel!** The fixed parts provide consistent UX - everything else expresses the unique vision.

### REQUIRED FEATURES

**1. Parameter Controls**
- Sliders for numeric parameters (particle count, noise scale, speed, etc.)
- Color pickers for palette colors
- Real-time updates when parameters change
- Reset button to restore defaults

**2. State Navigation**
- Display initial state at start while loading and when loaded move to reveal state
- On scrolldown/page down/space/arrow down/swipe up - go to focus state for reactome animation
- "Previous" and "Next" buttons cycle through scene states

**3. React App Structure**
#### Here's the rebuilt Reactome Visualization App:

##### Project Structure

```
reactome-app/
├── index.html(5)               # Main HTML with overlay UI
├── styles.css(5)               # Modern UI styling
└── js
    ├── App.js (2)(3)(4)        # Main application class, scene, orbit controls, animations, etc
    ├── effects
    │   └── SciFiShader.js      # Sci-Fi shader configurations
    ├── geometries (1)
    │   ├── ConnectomeLogo.js   # Branding geometries
    │   ├── DottedCylinder.js   # Segmented cylinder generator
    │   └── Ring.js             # Arc/ring geometry generator
    ├── main.js (5)             # Entry point, UI bindings
    └── utils
        ├── random.js           # Random utilities
        └── StageManager.js (6) # Stage Manager utilities
```

##### Design:

1. Custom Geometries - Ring arcs and dotted cylinders using BufferGeometry
2. Scene Setup - Three.js scene, camera, WebGL renderer with transparency
3. OrbitControls - Mouse/touch camera controls with damping
4. Animation Loop - Clock-based rotation animation
5. Responsive Design - Window resize handling, mobile support
6. Stage Manager - Application State Manager controling UI/UX

##### UI/Controls

- Camera distance slider
- Object opacity control
- Color picker
- Wireframe toggle
- Object count with regenerate
- Collapsible control panel
- Effects sliders
- Logo controls
- Logo signet controls
- Taglines controls

##### To Run/Test
```sh
cd /home/qlb/projects/skills/reactome
python3 -m http.server 8000
# Open http://localhost:8000
```
> The app uses ES modules with Three.js loaded from CDN via import maps - no bundler required.

**CRITICAL**: This is a React App. No external files, no imports (except threejs CDN). Everything based on local templates.

**4. Implementation Details - BUILD THE SIDEBAR**

The sidebar structure:

**1. States (FIXED)** - Always include exactly as shown:
- Present State
- Prev/Next/Random/Jump to `state_name` buttons

**2. Parameters (VARIABLE)** - Create controls for the design:
```html
<div class="control-group">
    <label>Parameter Name</label>
    <input type="range" id="param" min="..." max="..." step="..." value="..." oninput="updateParam('param', this.value)">
    <span class="value-display" id="param-value">...</span>
</div>
```
Add as many control-group divs as there are parameters.

**3. Colors (OPTIONAL/VARIABLE)** - Include if the design needs adjustable colors:
- Add color pickers if users should control palette
- Skip this section if the design uses fixed colors
- Skip if the design is monochrome

**4. Actions (FIXED)** - Always include exactly as shown:
Reactor Scene Controls:
- Camera distance slider
- Rotation speed slider
- Object count slider
Reactor Apperance Controls:
- Opacity slider
- Color picker
- Wireframe Mode toggle
Reactor Default Scene Effects Controls:
- Effects toggle
- Bloom slider
- Scanlines slider
- Noise slider
Reactor Glitch Scene Effect Controls:
- Glitch Effect toggle
- Intensity slider
- Speed slider
- Block Size slider
- Color Split slider
Reactor Glitch Scene Effect Controls:
- Glitch Effect toggle
- Intensity slider
- Speed slider
- Block Size slider
- Color Split slider
Logo Controls:
- Logo toggle
- Logo Scale slider
- Logo Position X,Y,Z sliders
- Logo Rotation RX,RY,RZ sliders
- Logo Signet toggle
- Logo Signet Scale slider
- Logo Signet Position X,Y,Z sliders
- Logo Signet Rotation RX,RY,RZ sliders
Tagline Controls:
- Tagline toggle
- Tagline Scale slider
- Tagline Opacity slider
- Tagline Position X,Y,Z sliders
- Tagline Rotation RX,RY,RZ sliders

**Requirements**:
- Slider controls must work on load and be usable via touch
- All parameters must have UI controls
- Sliders and toggles must work as displayed
- Keep UI styling and colors

### USING THE ARTIFACT

The templates artifacts works immediately:
1. **Locally**: Hosted in local python3 http.server - runs instantly
2. **Ready to be integrated**: The seeds and other controls are ready to subscribe dynamic sets of values from external sources.

---

## RESOURCES

This repository includes helpful templates and documentation:

- **index.html**: REQUIRED STARTING POINT for all HTML artifacts.
  - This is the foundation - contains the exact structure and branding
  - **Keep unchanged**: Layout structure, sidebar organization, colors/fonts, seed controls, action buttons
  - **Replace**: The UI controls in Parameters section
  - The extensive comments in the file mark exactly what to keep vs replace

- **generator_template.js**: Reference for threejs best practices and code structure principles.
  - Shows how to organize parameters, use seeded randomness, structure classes
  - NOT a pattern menu - use these principles to build unique algorithms
  - Embed algorithms inline in the `App.js`, `main.js` artifacts (don't create separate .js files)

**Critical reminder**:
- The **templates are the STARTING POINT**, not inspiration
- The **design is where to create** something unique
- Don't copy the flow field example - build what the philosophy demands
- But DO keep the exact UI structure and branding from the template

---

## BUGFIXES & NOTES

### Material Animation Smoothness on Navigation (FIXED)
**Issue**: Logo material properties (metalness/roughness/opacity) jumped from current to default value when pressing navbar buttons, then animated to target stage. Appeared jerky instead of smooth.

**Root Cause**: `getCapturedState()` in `App.js:714` tried to read material properties directly from the `connectomeLogo` Group object using `this.connectomeLogo?.material?.metalness`. Since connectomeLogo is a Group container (not a Mesh), it has no `.material` property, so all reads failed and fell back to `DEFAULT_CONFIG` values.

**Solution**: Added `getMaterialFromObject()` helper function that properly traverses the Group to find the first child mesh with materials. This ensures we always capture actual current material values, allowing smooth continuous animation from current state to target state regardless of entry point (page load vs navbar click).

**Files Modified**: `js/App.js` - `getCapturedState()` method
