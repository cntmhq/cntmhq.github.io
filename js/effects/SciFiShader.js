import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
/**
 * Scanline + CRT shader for lo-fi sci-fi effect
 */
const ScanlineShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        scanlineIntensity: { value: 0.15 },
        scanlineCount: { value: 800 },
        noiseIntensity: { value: 0.05 },
        flickerIntensity: { value: 0.02 },
        rgbShift: { value: 0.002 },
        vignetteIntensity: { value: 0.3 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float scanlineIntensity;
        uniform float scanlineCount;
        uniform float noiseIntensity;
        uniform float flickerIntensity;
        uniform float rgbShift;
        uniform float vignetteIntensity;

        varying vec2 vUv;

        // Pseudo-random noise
        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;

            // RGB chromatic aberration shift
            vec2 dir = uv - 0.5;
            float dist = length(dir);
            float r = texture2D(tDiffuse, uv - dir * rgbShift * dist).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv + dir * rgbShift * dist).b;
            vec3 color = vec3(r, g, b);

            // Scanlines
            float scanline = sin(uv.y * scanlineCount + time * 2.0) * 0.5 + 0.5;
            scanline = pow(scanline, 1.5) * scanlineIntensity;
            color -= scanline;

            // Noise grain
            float noise = random(uv + time) * noiseIntensity;
            color += noise - noiseIntensity * 0.5;

            // Flicker
            float flicker = 1.0 - flickerIntensity * random(vec2(time * 0.1, 0.0));
            color *= flicker;

            // Vignette
            float vignette = 1.0 - dist * vignetteIntensity * 1.5;
            vignette = clamp(vignette, 0.0, 1.0);
            color *= vignette;

            // Subtle color tint (cyan/teal shift)
            color.g *= 1.02;
            color.b *= 1.05;

            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Glow pulse shader for additional sci-fi effect
 */
const GlowPulseShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        pulseSpeed: { value: 1.0 },
        pulseIntensity: { value: 0.1 },
        glowColor: { value: new THREE.Color(0x1cb495) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float pulseSpeed;
        uniform float pulseIntensity;
        uniform vec3 glowColor;

        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);

            // Pulse effect
            float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
            float glow = pulse * pulseIntensity;

            // Add glow based on brightness
            float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb += glowColor * glow * brightness;

            gl_FragColor = color;
        }
    `
};

/**
 * Glitch shader for digital distortion effects
 * Creates horizontal displacement, color separation, and block artifacts
 */
const GlitchShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        glitchIntensity: { value: 0.0 },
        glitchSpeed: { value: 1.0 },
        blockSize: { value: 0.03 },
        colorSeparation: { value: 0.01 },
        enableWave: { value: true },
        enableBlock: { value: true },
        enableColorShift: { value: true }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float glitchIntensity;
        uniform float glitchSpeed;
        uniform float blockSize;
        uniform float colorSeparation;
        uniform bool enableWave;
        uniform bool enableBlock;
        uniform bool enableColorShift;

        varying vec2 vUv;

        // Pseudo-random functions
        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float random2(float n) {
            return fract(sin(n) * 43758.5453123);
        }

        // Noise function for smooth glitch
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
            vec2 uv = vUv;
            float t = time * glitchSpeed;

            // Skip if no glitch intensity
            if (glitchIntensity <= 0.001) {
                gl_FragColor = texture2D(tDiffuse, uv);
                return;
            }

            // Glitch trigger - random bursts
            float glitchTrigger = step(0.95 - glitchIntensity * 0.3, random(vec2(floor(t * 3.0), 0.0)));
            float glitchAmount = glitchIntensity * glitchTrigger;

            // Wave distortion
            if (enableWave) {
                float waveOffset = sin(uv.y * 50.0 + t * 10.0) * 0.01 * glitchAmount;
                waveOffset += sin(uv.y * 100.0 - t * 5.0) * 0.005 * glitchAmount;
                uv.x += waveOffset;
            }

            // Block displacement
            if (enableBlock) {
                float blockY = floor(uv.y / blockSize) * blockSize;
                float blockRand = random(vec2(blockY, floor(t * 10.0)));

                if (blockRand > 0.9 - glitchAmount * 0.5) {
                    float blockOffset = (random(vec2(blockY, floor(t * 20.0))) - 0.5) * 0.1 * glitchAmount;
                    uv.x += blockOffset;
                }

                // Vertical block shift
                float blockX = floor(uv.x / blockSize) * blockSize;
                float vBlockRand = random(vec2(blockX, floor(t * 8.0)));
                if (vBlockRand > 0.95 - glitchAmount * 0.3) {
                    uv.y += (random(vec2(blockX, floor(t * 15.0))) - 0.5) * 0.05 * glitchAmount;
                }
            }

            // Color channel separation
            vec3 color;
            if (enableColorShift && glitchAmount > 0.0) {
                float separation = colorSeparation * glitchAmount * (1.0 + random(vec2(floor(t * 5.0), uv.y)) * 2.0);

                // Horizontal color separation
                color.r = texture2D(tDiffuse, vec2(uv.x + separation, uv.y)).r;
                color.g = texture2D(tDiffuse, uv).g;
                color.b = texture2D(tDiffuse, vec2(uv.x - separation, uv.y)).b;

                // Add some vertical separation occasionally
                if (random(vec2(floor(t * 7.0), 0.0)) > 0.7) {
                    color.r = texture2D(tDiffuse, vec2(uv.x + separation, uv.y - separation * 0.5)).r;
                    color.b = texture2D(tDiffuse, vec2(uv.x - separation, uv.y + separation * 0.5)).b;
                }
            } else {
                color = texture2D(tDiffuse, uv).rgb;
            }

            // Random color inversion on glitch
            if (glitchAmount > 0.5 && random(vec2(floor(t * 12.0), floor(uv.y * 20.0))) > 0.98) {
                color = 1.0 - color;
            }

            // Static noise overlay during glitch
            if (glitchAmount > 0.0) {
                float staticNoise = random(uv + t) * 0.1 * glitchAmount;
                color += staticNoise - 0.05 * glitchAmount;
            }

            // Occasional scanline artifact
            float scanlineGlitch = step(0.98, random(vec2(floor(uv.y * 500.0), floor(t * 20.0)))) * glitchAmount;
            color = mix(color, vec3(1.0), scanlineGlitch * 0.5);

            gl_FragColor = vec4(color, 1.0);
        }
    `
};

/**
 * Sci-Fi Post-Processing Effect Manager
 * Manages bloom, scanlines, and lo-fi effects
 */
export class SciFiEffects {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.enabled = false;
        this.clock = new THREE.Clock();

        // Effect parameters
        this.params = {
            bloomStrength: 0.8,
            bloomRadius: 0.4,
            bloomThreshold: 0.6,
            scanlineIntensity: 0.15,
            noiseIntensity: 0.05,
            rgbShift: 0.002,
            vignetteIntensity: 0.3,
            glowPulse: 0.1,
            // Glitch parameters
            glitchEnabled: false,
            glitchIntensity: 0.3,
            glitchSpeed: 1.0,
            glitchBlockSize: 0.03,
            glitchColorSeparation: 0.01
        };

        this._initComposer();
    }

    /**
     * Initialize the effect composer and passes
     */
    _initComposer() {
        const size = this.renderer.getSize(new THREE.Vector2());

        this.composer = new EffectComposer(this.renderer);

        // Render pass
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        // Bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(size.x, size.y),
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold
        );
        this.composer.addPass(this.bloomPass);

        // Glow pulse pass
        this.glowPass = new ShaderPass(GlowPulseShader);
        this.composer.addPass(this.glowPass);

        // Glitch pass
        this.glitchPass = new ShaderPass(GlitchShader);
        this.glitchPass.uniforms.glitchIntensity.value = 0; // Disabled by default
        this.composer.addPass(this.glitchPass);

        // Scanline/CRT pass
        this.scanlinePass = new ShaderPass(ScanlineShader);
        this.composer.addPass(this.scanlinePass);
    }

    /**
     * Update effects each frame
     */
    update() {
        if (!this.enabled) return;

        const elapsed = this.clock.getElapsedTime();

        // Update time uniforms
        this.scanlinePass.uniforms.time.value = elapsed;
        this.glowPass.uniforms.time.value = elapsed;
        this.glitchPass.uniforms.time.value = elapsed;
    }

    /**
     * Render with effects
     */
    render() {
        if (this.enabled) {
            this.update();
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize
     */
    resize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
    }

    /**
     * Enable/disable effects
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.clock.start();
        }
    }

    /**
     * Set bloom strength
     */
    setBloomStrength(value) {
        this.params.bloomStrength = value;
        this.bloomPass.strength = value;
    }

    /**
     * Set bloom threshold
     */
    setBloomThreshold(value) {
        this.params.bloomThreshold = value;
        this.bloomPass.threshold = value;
    }

    /**
     * Set scanline intensity
     */
    setScanlineIntensity(value) {
        this.params.scanlineIntensity = value;
        this.scanlinePass.uniforms.scanlineIntensity.value = value;
    }

    /**
     * Set noise/grain intensity
     */
    setNoiseIntensity(value) {
        this.params.noiseIntensity = value;
        this.scanlinePass.uniforms.noiseIntensity.value = value;
    }

    /**
     * Set RGB chromatic aberration shift
     */
    setRgbShift(value) {
        this.params.rgbShift = value;
        this.scanlinePass.uniforms.rgbShift.value = value;
    }

    /**
     * Set vignette intensity
     */
    setVignetteIntensity(value) {
        this.params.vignetteIntensity = value;
        this.scanlinePass.uniforms.vignetteIntensity.value = value;
    }

    /**
     * Set glow pulse intensity
     */
    setGlowPulse(value) {
        this.params.glowPulse = value;
        this.glowPass.uniforms.pulseIntensity.value = value;
    }

    /**
     * Set glow color
     */
    setGlowColor(color) {
        this.glowPass.uniforms.glowColor.value = new THREE.Color(color);
    }

    // ==================== Glitch Effect Controls ====================

    /**
     * Enable/disable glitch effect
     */
    setGlitchEnabled(enabled) {
        this.params.glitchEnabled = enabled;
        this.glitchPass.uniforms.glitchIntensity.value = enabled ? this.params.glitchIntensity : 0;
    }

    /**
     * Set glitch intensity (0-1)
     */
    setGlitchIntensity(value) {
        this.params.glitchIntensity = value;
        if (this.params.glitchEnabled) {
            this.glitchPass.uniforms.glitchIntensity.value = value;
        }
    }

    /**
     * Set glitch speed multiplier
     */
    setGlitchSpeed(value) {
        this.params.glitchSpeed = value;
        this.glitchPass.uniforms.glitchSpeed.value = value;
    }

    /**
     * Set glitch block size
     */
    setGlitchBlockSize(value) {
        this.params.glitchBlockSize = value;
        this.glitchPass.uniforms.blockSize.value = value;
    }

    /**
     * Set glitch color separation amount
     */
    setGlitchColorSeparation(value) {
        this.params.glitchColorSeparation = value;
        this.glitchPass.uniforms.colorSeparation.value = value;
    }

    /**
     * Get current parameters
     */
    getParams() {
        return { ...this.params };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.composer.dispose();
    }
}
