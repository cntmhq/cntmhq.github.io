/**
 * Random utility functions
 */

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float between min and max
 */
export function randomFloat(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
export function randomInt(min, max) {
    return Math.floor(randomFloat(min, max + 1));
}

/**
 * Pick a random element from an array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element from the array
 */
export function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random sign (-1 or 1)
 * @returns {number} -1 or 1
 */
export function randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
}
