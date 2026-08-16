/**
 * LiquidChrome — vanilla JS port (no React) using ogl.
 * Works on static HTML/CSS/JS sites like Qadam (GitHub Pages).
 *
 * Usage:
 *   <div id="liquid-bg" style="width:100%;height:600px;position:relative;"></div>
 *   <script type="module">
 *     import { LiquidChrome } from './liquid-chrome.js';
 *     const lc = new LiquidChrome(document.getElementById('liquid-bg'), {
 *       baseColor: [0.1, 0.1, 0.1],
 *       speed: 1,
 *       amplitude: 0.6,
 *       interactive: true
 *     });
 *     // lc.destroy() to clean up if you ever remove the element
 *   </script>
 *
 * Requires: ogl (loaded via CDN import below, no npm/build step needed)
 */
import { Renderer, Program, Mesh, Triangle } from 'https://esm.sh/ogl@1.0.6';

export class LiquidChrome {
  constructor(container, options = {}) {
    const {
      baseColor = [0.1, 0.1, 0.1],
      speed = 0.2,
      amplitude = 0.3,
      frequencyX = 3,
      frequencyY = 3,
      interactive = true
    } = options;

    this.container = container;
    this.interactive = interactive;
    this.speed = speed;

    const renderer = new Renderer({ antialias: true });
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);
    this.renderer = renderer;
    this.gl = gl;

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uBaseColor;
      uniform float uAmplitude;
      uniform float uFrequencyX;
      uniform float uFrequencyY;
      uniform vec2 uMouse;
      varying vec2 vUv;

      vec4 renderImage(vec2 uvCoord) {
          vec2 fragCoord = uvCoord * uResolution.xy;
          vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

          for (float i = 1.0; i < 10.0; i++){
              uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
              uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
          }

          vec2 diff = (uvCoord - uMouse);
          float dist = length(diff);
          float falloff = exp(-dist * 20.0);
          float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
          uv += (diff / (dist + 0.0001)) * ripple * falloff;

          vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
          return vec4(color, 1.0);
      }

      void main() {
          vec4 col = vec4(0.0);
          int samples = 0;
          for (int i = -1; i <= 1; i++){
              for (int j = -1; j <= 1; j++){
                  vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
                  col += renderImage(vUv + offset);
                  samples++;
              }
          }
          gl_FragColor = col / float(samples);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height])
        },
        uBaseColor: { value: new Float32Array(baseColor) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: new Float32Array([0, 0]) }
      }
    });
    this.program = program;
    this.mesh = new Mesh(gl, { geometry, program });

    this._resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      const res = program.uniforms.uResolution.value;
      res[0] = gl.canvas.width;
      res[1] = gl.canvas.height;
      res[2] = gl.canvas.width / gl.canvas.height;
    };
    window.addEventListener('resize', this._resize);
    this._resize();

    this._handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const m = program.uniforms.uMouse.value;
      m[0] = x;
      m[1] = y;
    };

    this._handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = container.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / rect.width;
        const y = 1 - (touch.clientY - rect.top) / rect.height;
        const m = program.uniforms.uMouse.value;
        m[0] = x;
        m[1] = y;
      }
    };

    if (interactive) {
      container.addEventListener('mousemove', this._handleMouseMove);
      container.addEventListener('touchmove', this._handleTouchMove);
    }

    this._update = (t) => {
      this._animationId = requestAnimationFrame(this._update);
      program.uniforms.uTime.value = t * 0.001 * this.speed;
      renderer.render({ scene: this.mesh });
    };
    this._animationId = requestAnimationFrame(this._update);

    container.appendChild(gl.canvas);
  }

  destroy() {
    cancelAnimationFrame(this._animationId);
    window.removeEventListener('resize', this._resize);
    if (this.interactive) {
      this.container.removeEventListener('mousemove', this._handleMouseMove);
      this.container.removeEventListener('touchmove', this._handleTouchMove);
    }
    if (this.gl.canvas.parentElement) {
      this.gl.canvas.parentElement.removeChild(this.gl.canvas);
    }
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export default LiquidChrome;
