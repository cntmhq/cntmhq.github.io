import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

/**
 * Connectome Logo Geometry Generator
 * Creates extruded 3D geometry from the Connectome logo
 * Supports both full "Connectome" text and standalone "C" signet
 *
 * THIN PROFILE settings from connectome-gallery.html:
 * - depth: 2
 * - color: 0x2ed4b0 (bright teal)
 * - MeshStandardMaterial: roughness 0.4, metalness 0.1
 * - bevelEnabled: true, bevelThickness: 1, bevelSize: 0.5, bevelSegments: 3
 *
 * LIGHTING (from connectome-gallery.html):
 * - AmbientLight: 0xffffff, intensity 0.5
 * - DirectionalLight (main): 0xffffff, intensity 1, position (50, 50, 50)
 * - DirectionalLight (back): 0x1cb495, intensity 0.4, position (-50, -50, -50)
 * - DirectionalLight (fill): 0xffffff, intensity 0.3, position (-50, 50, -50)
 */

// Full "Connectome" SVG data
const FULL_LOGO_SVG = `
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

// Standalone "C" signet SVG data
const C_SIGNET_SVG = `
<svg viewBox="0 0 20 25">
    <path d="M51.7,55.5c-1.8,0.4-3.8,0.6-6,0.6c-8.1,0-12.2-3.9-12.2-11.6c0-7.2,4.1-10.8,12.2-10.8c2.1,0,4.1,0.2,6,0.6v1.9
            c-1.8-0.4-3.7-0.6-5.6-0.6c-6.8,0-10.1,3-10.1,8.9c0,6.5,3.4,9.7,10.1,9.7c1.9,0,3.7-0.2,5.6-0.6V55.5z"/>
</svg>`;

/**
 * THIN PROFILE configuration for the full Connectome logo
 * Exactly matching connectome-gallery.html "Thin Profile" variation
 */
export const CONNECTOME_LOGO_CONFIG = {
    // Extrusion settings (Thin Profile)
    depth: 2,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 0.5,
    bevelSegments: 3,

    // Material settings (MeshStandardMaterial)
    color: 0x2ed4b0,  // Bright teal from Thin Profile
    roughness: 1.0,
    metalness: 1.0,

    // Transform settings
    scale: 0.008,
    xOffset: 0,
    yOffset: 0.1,  // Position above reactor
    zOffset: 0,

    // Transparency
    opacity: 0.2,
    transparent: false,
    wireframe: true
};

/**
 * THIN PROFILE light settings from connectome-gallery.html
 */
export const CONNECTOME_LIGHT_CONFIG = {
    ambient: {
        color: 0xffffff,
        intensity: 0.75
    },
    main: {
        color: 0xffffff,
        intensity: 0.2,
        position: { x: 50, y: 50, z: 50 }
    },
    back: {
        color: 0x1cb495,  // Teal accent
        intensity: 0.4,
        position: { x: -50, y: -50, z: -50 }
    },
    fill: {
        color: 0xffffff,
        intensity: 0.3,
        position: { x: -50, y: 50, z: -50 }
    }
};

/**
 * Default configuration for the "C" signet
 */
export const C_SIGNET_CONFIG = {
    // Extrusion settings
    depth: 3,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.3,
    bevelSegments: 3,

    // Material settings
    color: 0x1cb495,
    roughness: 0.3,
    metalness: 0.2,

    // Transform settings
    scale: 0.006,
    yOffset: 1.2,
    xOffset: -0.4,
    zOffset: -0.45,

    // Transparency
    opacity: 0.15,
    transparent: true,
    wireframe: true
};

/**
 * Variation types for different visual styles
 */
export const LOGO_VARIATIONS = {
    SOLID: 'solid',        // Thin Profile default
    WIREFRAME: 'wireframe',
    GLASS: 'glass',
    HOLOGRAM: 'hologram',
    NEON: 'neon'
};

/**
 * Create material based on variation type
 * SOLID uses the exact Thin Profile settings from connectome-gallery.html
 * @param {string} type - Variation type
 * @param {Object} config - Configuration options
 * @returns {THREE.Material|THREE.Material[]} Material instance(s)
 */
function createMaterial(type, config) {
    const color = new THREE.Color(config.color);

    switch (type) {
        case LOGO_VARIATIONS.WIREFRAME:
            return new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: config.transparent,
                opacity: config.opacity
            });

        case LOGO_VARIATIONS.GLASS:
            return new THREE.MeshPhysicalMaterial({
                color: color,
                transparent: true,
                opacity: 0.5,
                roughness: 0.1,
                metalness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                side: THREE.DoubleSide
            });

        case LOGO_VARIATIONS.HOLOGRAM:
            // Returns array for solid + wireframe overlay
            return [
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: config.opacity * 0.5,  // Use config opacity, slightly reduced
                    side: THREE.DoubleSide
                }),
                new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: config.opacity
                })
            ];

        case LOGO_VARIATIONS.NEON:
            return new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                roughness: 0.2,
                metalness: 0.8,
                transparent: config.transparent,
                opacity: config.opacity
            });

        case LOGO_VARIATIONS.SOLID:
        default:
            // EXACT Thin Profile material from connectome-gallery.html
            return new THREE.MeshStandardMaterial({
                color: color,
                roughness: config.roughness,   // 0.4 for Thin Profile
                metalness: config.metalness,   // 0.1 for Thin Profile
                transparent: config.transparent,
                opacity: config.opacity,
                wireframe: config.wireframe,
                side: THREE.DoubleSide
            });
    }
}

/**
 * Generic function to create extruded SVG geometry
 * @param {string} svgData - SVG string data
 * @param {Object} options - Configuration options
 * @param {string} variation - Visual style variation
 * @returns {Promise<THREE.Group>} Group containing the meshes
 */
function createExtrudedSVG(svgData, options, variation = LOGO_VARIATIONS.SOLID) {
    const loader = new SVGLoader();
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

    return new Promise((resolve, reject) => {
        loader.load(svgDataUrl, (data) => {
            const group = new THREE.Group();
            const paths = data.paths;

            // Thin Profile extrusion settings
            const extrudeSettings = {
                depth: options.depth,
                bevelEnabled: options.bevelEnabled,
                bevelThickness: options.bevelThickness,
                bevelSize: options.bevelSize,
                bevelSegments: options.bevelSegments
            };

            paths.forEach((path) => {
                const shapes = SVGLoader.createShapes(path);

                shapes.forEach((shape) => {
                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    const material = createMaterial(variation, options);

                    if (Array.isArray(material)) {
                        // Hologram: multiple materials
                        material.forEach(mat => {
                            const mesh = new THREE.Mesh(geometry.clone(), mat);
                            group.add(mesh);
                        });
                    } else {
                        const mesh = new THREE.Mesh(geometry, material);
                        group.add(mesh);
                    }
                });
            });

            // Calculate bounding box and center
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Store metadata
            group.userData = {
                originalCenter: center.clone(),
                boundingBox: box.clone(),
                size: size.clone(),
                config: { ...options }
            };

            // Center geometry at origin (so "C"'s center is at 0,0,0)
            group.children.forEach(child => {
                child.position.sub(center);
            });

            // Apply scale (flip Y for SVG coordinate system)
            const scale = options.scale;
            group.scale.set(scale, -scale, scale);

            // Rotate to face upward (SVG XY plane -> XZ plane facing up/top of scene)
            group.rotation.x = -Math.PI / 2;

            // Position with XYZ offsets - "C"'s median center inscribed in rings
            group.position.x = options.xOffset || 0;
            group.position.y = options.yOffset || 0;
            group.position.z = options.zOffset || 0;

            resolve(group);
        }, undefined, reject);
    });
}

/**
 * Create the full "Connectome" logo geometry with Thin Profile settings
 * @param {Object} options - Configuration options (merged with CONNECTOME_LOGO_CONFIG)
 * @param {string} variation - Visual style (solid, wireframe, glass, hologram, neon)
 * @returns {Promise<THREE.Group>} Group containing the logo meshes
 */
export function createConnectomeLogoGeometry(options = {}, variation = LOGO_VARIATIONS.SOLID) {
    const config = { ...CONNECTOME_LOGO_CONFIG, ...options };
    return createExtrudedSVG(FULL_LOGO_SVG, config, variation).then(group => {
        group.name = 'connectome-full-logo';
        return group;
    });
}

/**
 * Create the "C" signet geometry
 * @param {Object} options - Configuration options (merged with C_SIGNET_CONFIG)
 * @param {string} variation - Visual style (solid, wireframe, glass, hologram, neon)
 * @returns {Promise<THREE.Group>} Group containing the signet meshes
 */
export function createCSignetGeometry(options = {}, variation = LOGO_VARIATIONS.SOLID) {
    const config = { ...C_SIGNET_CONFIG, ...options };
    return createExtrudedSVG(C_SIGNET_SVG, config, variation).then(group => {
        group.name = 'connectome-c-signet';
        return group;
    });
}

/**
 * Create dedicated lights for the Connectome logo (Thin Profile lighting)
 * @param {Object} options - Light configuration options (merged with CONNECTOME_LIGHT_CONFIG)
 * @returns {THREE.Group} Group containing the lights
 */
export function createConnectomeLights(options = {}) {
    const config = {
        ambient: { ...CONNECTOME_LIGHT_CONFIG.ambient, ...(options.ambient || {}) },
        main: { ...CONNECTOME_LIGHT_CONFIG.main, ...(options.main || {}) },
        back: { ...CONNECTOME_LIGHT_CONFIG.back, ...(options.back || {}) },
        fill: { ...CONNECTOME_LIGHT_CONFIG.fill, ...(options.fill || {}) }
    };

    const lightGroup = new THREE.Group();
    lightGroup.name = 'connectome-lights';

    // Ambient light
    const ambientLight = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity);
    ambientLight.name = 'connectome-ambient';
    lightGroup.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(config.main.color, config.main.intensity);
    mainLight.position.set(config.main.position.x, config.main.position.y, config.main.position.z);
    mainLight.name = 'connectome-main';
    lightGroup.add(mainLight);

    // Back light (teal accent)
    const backLight = new THREE.DirectionalLight(config.back.color, config.back.intensity);
    backLight.position.set(config.back.position.x, config.back.position.y, config.back.position.z);
    backLight.name = 'connectome-back';
    lightGroup.add(backLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(config.fill.color, config.fill.intensity);
    fillLight.position.set(config.fill.position.x, config.fill.position.y, config.fill.position.z);
    fillLight.name = 'connectome-fill';
    lightGroup.add(fillLight);

    // Store config for updates
    lightGroup.userData.config = config;

    return lightGroup;
}

/**
 * Update material properties on an existing logo group
 * @param {THREE.Group} group - The logo group
 * @param {Object} props - Properties to update (color, opacity, wireframe, etc.)
 */
export function updateLogoMaterial(group, props) {
    if (!group) return;

    group.traverse((child) => {
        if (child.isMesh && child.material) {
            let needsShaderUpdate = false;

            if (props.color !== undefined) {
                child.material.color.set(props.color);
                if (child.material.emissive) {
                    child.material.emissive.set(props.color);
                }
            }
            if (props.opacity !== undefined) {
                child.material.opacity = props.opacity;
                child.material.transparent = props.opacity < 1;
                needsShaderUpdate = true;
            }
            if (props.wireframe !== undefined) {
                child.material.wireframe = props.wireframe;
            }
            if (props.roughness !== undefined && child.material.roughness !== undefined) {
                child.material.roughness = props.roughness;
                needsShaderUpdate = true;
            }
            if (props.metalness !== undefined && child.material.metalness !== undefined) {
                child.material.metalness = props.metalness;
                needsShaderUpdate = true;
            }

            // CRITICAL: Flag material for shader recompilation when PBR properties change
            // Without this, metalness/roughness/transparent changes won't visually update
            // See: https://threejs.org/docs/#api/en/materials/Material.needsUpdate
            if (needsShaderUpdate) {
                child.material.needsUpdate = true;
            }
        }
    });
}

/**
 * Update logo position (Y axis only - legacy)
 * @param {THREE.Group} group - The logo group
 * @param {number} yOffset - Y position offset
 */
export function updateLogoPosition(group, yOffset) {
    if (!group) return;
    group.position.y = yOffset;
}

/**
 * Update logo position in all dimensions
 * @param {THREE.Group} group - The logo group
 * @param {Object} position - Position object with x, y, z properties
 */
export function updateLogoPositionXYZ(group, position) {
    if (!group) return;
    if (position.x !== undefined) group.position.x = position.x;
    if (position.y !== undefined) group.position.y = position.y;
    if (position.z !== undefined) group.position.z = position.z;
}

/**
 * Update logo rotation in all dimensions
 * @param {THREE.Group} group - The logo group
 * @param {Object} rotation - Rotation object with x, y, z properties (in radians)
 */
export function updateLogoRotation(group, rotation) {
    if (!group) return;
    // Note: base rotation.x is -Math.PI/2 to face upward
    if (rotation.x !== undefined) group.rotation.x = -Math.PI / 2 + rotation.x;
    if (rotation.y !== undefined) group.rotation.y = rotation.y;
    if (rotation.z !== undefined) group.rotation.z = rotation.z;
}

/**
 * Update logo scale uniformly
 * @param {THREE.Group} group - The logo group
 * @param {number} scale - Scale factor
 */
export function updateLogoScale(group, scale) {
    if (!group) return;
    // Preserve the Y flip for SVG coordinate system
    group.scale.set(scale, -scale, scale);
}

/**
 * Update light intensities
 * @param {THREE.Group} lightGroup - The light group
 * @param {Object} intensities - Object with light names and intensity values
 */
export function updateLightIntensities(lightGroup, intensities) {
    if (!lightGroup) return;

    lightGroup.traverse((child) => {
        if (child.isLight) {
            if (child.name === 'connectome-ambient' && intensities.ambient !== undefined) {
                child.intensity = intensities.ambient;
            }
            if (child.name === 'connectome-main' && intensities.main !== undefined) {
                child.intensity = intensities.main;
            }
            if (child.name === 'connectome-back' && intensities.back !== undefined) {
                child.intensity = intensities.back;
            }
            if (child.name === 'connectome-fill' && intensities.fill !== undefined) {
                child.intensity = intensities.fill;
            }
        }
    });
}

/**
 * Dispose of logo geometry and materials
 * @param {THREE.Group} group - The logo group to dispose
 */
export function disposeLogo(group) {
    if (!group) return;

    group.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
}
