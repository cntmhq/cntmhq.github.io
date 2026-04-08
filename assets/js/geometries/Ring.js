import * as THREE from 'three';
/**
    THIS IS A TEMPLATE THAT SHOULD BE USED EVERY TIME AND MODIFIED.
    WHAT TO KEEP:
    ✓ Overall structure
    ✓ Default config options (x, y, z, radius, height, etc)

    WHAT TO CREATIVELY EDIT:
    ✗ The parameters of the generate for loops (define what YOUR art needs)
    ✗ Algorithms for vertices and faces and their parameters (match YOUR parameters)

    Let your philosophy guide the implementation.
    The world is your oyster - be creative!
**/
/**
 * Ring/Arc Geometry Generator
 * Creates a partial or full ring (torus segment) geometry
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.x=0] - X center position
 * @param {number} [options.y=0] - Y center position
 * @param {number} [options.z=0] - Z center position
 * @param {number} [options.startRadian=0] - Start angle in radians
 * @param {number} [options.endRadian=1.5*PI] - End angle in radians
 * @param {number} [options.innerRadius=40] - Inner radius of the ring
 * @param {number} [options.outerRadius=200] - Outer radius of the ring
 * @param {number} [options.numBands=2] - Number of concentric bands
 * @param {number} [options.numSlices=40] - Number of radial slices
 * @param {boolean} [options.drawOutline=true] - Whether to draw outline edges
 * @returns {THREE.BufferGeometry} The ring geometry
 */
export function createRingGeometry(options = {}) {
    const config = {
        x: options.x || 0,
        y: options.y || 0,
        z: options.z || 0,
        startRadian: options.startRadian || 0,
        endRadian: options.endRadian !== undefined ? options.endRadian : 1.5 * Math.PI,
        innerRadius: options.innerRadius !== undefined ? options.innerRadius : 0.4,
        outerRadius: options.outerRadius || 2,
        numBands: options.numBands || 2,
        numSlices: options.numSlices || 40,
        drawOutline: options.drawOutline !== undefined ? options.drawOutline : true
    };

    const positions = [];
    const indices = [];
    const uvs = [];

    const arcLength = config.endRadian - config.startRadian;
    const numSlices = Math.floor(Math.abs(arcLength) / (2 * Math.PI) * config.numSlices);
    const sliceAngle = arcLength / numSlices;
    const numBands = config.numBands === 1 ? 1 : config.numBands - 1;
    const bandWidth = (config.outerRadius - config.innerRadius) / numBands;

    // Generate vertices and UVs
    for (let slice = 0; slice <= numSlices; slice++) {
        const angle = slice * sliceAngle + config.startRadian;

        for (let band = 0; band < config.numBands; band++) {
            const radius = config.innerRadius + bandWidth * band;
            const x = Math.cos(angle) * radius + config.x;
            const y = config.y;
            const z = Math.sin(angle) * radius + config.z;

            positions.push(x, y, z);
            uvs.push(slice / numSlices, band / (config.numBands - 1 || 1));
        }
    }

    // Generate faces (triangles)
    for (let slice = 0; slice < numSlices; slice++) {
        const currentSliceStart = slice * config.numBands;
        const nextSliceStart = (slice + 1) * config.numBands;

        for (let band = 0; band < config.numBands - 1; band++) {
            const a = currentSliceStart + band;
            const b = currentSliceStart + band + 1;
            const c = nextSliceStart + band;
            const d = nextSliceStart + band + 1;

            // Two triangles per quad
            indices.push(c, b, a);
            indices.push(c, d, b);
        }
    }

    // Create BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Create a Ring mesh with default material
 * @param {Object} options - Ring geometry options
 * @param {THREE.Material} [material] - Optional material
 * @returns {THREE.Mesh} Ring mesh
 */
export function createRingMesh(options = {}, material) {
    const geometry = createRingGeometry(options);
    const defaultMaterial = new THREE.MeshBasicMaterial({
        color: 0x1cb495,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    return new THREE.Mesh(geometry, material || defaultMaterial);
}
