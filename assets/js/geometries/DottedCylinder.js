import * as THREE from 'three';
/**
    THIS IS A TEMPLATE THAT SHOULD BE USED EVERY TIME AND MODIFIED.
    WHAT TO KEEP:
    ✓ Overall structure
    ✓ Default config options (x, y, z, radius, height, etc)

    WHAT TO CREATIVELY EDIT:
    ✗ The parameters of the object loop (define what YOUR art needs)
    ✗ Algorithms for vertex and vertices positons and their parameters (match YOUR parameters)

    Let your philosophy guide the implementation.
    The world is your oyster - be creative!
**/
/**
 * Dotted Cylinder Geometry Generator
 * Creates a cylinder made of separated segments/pieces around its circumference
 *
 * @param {Object} options - Configuration options
 * @param {number} [options.x=0] - X center position
 * @param {number} [options.y=0] - Y center position
 * @param {number} [options.z=0] - Z center position
 * @param {number} [options.radius=200] - Radius of the cylinder
 * @param {number} [options.height=10] - Height of the cylinder
 * @param {number} [options.pieceSize=0.15*PI] - Angular size of each piece in radians
 * @param {number} [options.startRadian=0] - Starting angle in radians
 * @param {number} [options.numPieces=8] - Number of pieces around the cylinder
 * @param {number} [options.quadsPerPiece=5] - Number of quads per piece
 * @param {boolean} [options.drawOutline=true] - Whether to draw outline edges
 * @returns {THREE.BufferGeometry} The dotted cylinder geometry
 */
export function createDottedCylinderGeometry(options = {}) {
    const config = {
        x: options.x || 0,
        y: options.y || 0,
        z: options.z || 0,
        radius: options.radius || 2,
        height: options.height || 0.1,
        pieceSize: options.pieceSize || 0.15 * Math.PI,
        startRadian: options.startRadian || 0,
        numPieces: options.numPieces || 8,
        quadsPerPiece: options.quadsPerPiece || 5,
        drawOutline: options.drawOutline !== undefined ? options.drawOutline : true
    };

    const positions = [];
    const indices = [];

    const halfHeight = config.height * 0.5;
    const gapSize = (2 * Math.PI - config.numPieces * config.pieceSize) / config.numPieces;
    const quadAngle = config.pieceSize / config.quadsPerPiece;

    let vertexIndex = 0;
    let currentAngle = 0;
    // Object loop
    for (let piece = 0; piece < config.numPieces; piece++) {
        for (let quad = 0; quad < config.quadsPerPiece; quad++) {
            const angle1 = currentAngle + quadAngle * quad + config.startRadian;
            const angle2 = currentAngle + quadAngle * (quad + 1) + config.startRadian;

            // Calculate vertex positions
            const x1 = Math.cos(angle1) * config.radius + config.x;
            const z1 = Math.sin(angle1) * config.radius + config.z;
            const x2 = Math.cos(angle2) * config.radius + config.x;
            const z2 = Math.sin(angle2) * config.radius + config.z;

            // Four vertices per quad (bottom-left, top-left, top-right, bottom-right)
            positions.push(
                x1, config.y - halfHeight, z1,  // 0: bottom-left
                x1, config.y + halfHeight, z1,  // 1: top-left
                x2, config.y + halfHeight, z2,  // 2: top-right
                x2, config.y - halfHeight, z2   // 3: bottom-right
            );

            // Two triangles per quad
            indices.push(
                vertexIndex, vertexIndex + 1, vertexIndex + 2,
                vertexIndex + 3, vertexIndex, vertexIndex + 2
            );

            vertexIndex += 4;
        }

        currentAngle += gapSize + config.pieceSize;
    }

    // Create BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Create a Dotted Cylinder mesh with default material
 * @param {Object} options - Dotted cylinder geometry options
 * @param {THREE.Material} [material] - Optional material
 * @returns {THREE.Mesh} Dotted cylinder mesh
 */
export function createDottedCylinderMesh(options = {}, material) {
    const geometry = createDottedCylinderGeometry(options);
    const defaultMaterial = new THREE.MeshBasicMaterial({
        color: 0x1cb495,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        wireframe: true
    });
    return new THREE.Mesh(geometry, material || defaultMaterial);
}
