import * as THREE from 'three';

/* Lead particles for the light funnel (Funnel.tsx). Leads enter across the
   funnel's mouth and fall towards its neck, converging as the funnel narrows.
   At each of the four step boundaries some leads drop out and drift off into
   the dark; the ones that make it through the neck turn green and fall into
   the pool of light below (the meetings). Drawn in screen pixels with an
   orthographic camera, behind the step content. */

export type FunnelShape = {
  cx: number;      // funnel centre, px
  mouthY: number;  // top of the funnel, px from the top of the canvas
  neckY: number;   // bottom of the funnel
  poolY: number;   // where meetings land
  topW: number;        // funnel width at the mouth, px
  shoulderW: number;   // width at the shoulder, where the bowl turns into the spout
  shoulderAt: number;  // shoulder height, 0 (mouth) .. 1 (neck)
  botW: number;        // width at the neck, px
};

/** funnel width at t (0 = mouth, 1 = neck): bowl down to the shoulder, then the spout */
function widthAt(s: FunnelShape, t: number) {
  return t < s.shoulderAt
    ? s.topW + (s.shoulderW - s.topW) * (t / s.shoulderAt)
    : s.shoulderW + (s.botW - s.shoulderW) * ((t - s.shoulderAt) / (1 - s.shoulderAt));
}

const PASS = [0.62, 0.62, 0.55, 0.55];   // share of leads that survive each boundary
const LEAD = new THREE.Color('#9AA8FF'), BRIGHT = new THREE.Color('#E4E8FF');
const DROP = new THREE.Color('#4B5388'), MEET = new THREE.Color('#5BD25F');

const vertexShader = /* glsl */ `
  attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
  uniform float uDpr; varying float vAlpha; varying vec3 vColor;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr;
    vAlpha = aAlpha; vColor = aColor;
  }`;
const fragmentShader = /* glsl */ `
  varying float vAlpha; varying vec3 vColor;
  void main() {
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor, a * a * vAlpha);
    #include <colorspace_fragment>
  }`;

export class FunnelParticles {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);
  private geo = new THREE.BufferGeometry();
  private mat: THREE.ShaderMaterial;
  private shape: FunnelShape = { cx: 0, mouthY: 0, neckY: 1, poolY: 1, topW: 1, shoulderW: 1, shoulderAt: 0.74, botW: 1 };
  private n: number;
  private pos: Float32Array; private col: Float32Array; private alpha: Float32Array; private size: Float32Array;
  private t: Float32Array; private u: Float32Array; private spd: Float32Array; private exitAt: Uint8Array;
  private state: Uint8Array; private life: Float32Array; private vx: Float32Array; private vy: Float32Array;
  private px: Float32Array; private py: Float32Array;
  private raf = 0; private running = false; private last = 0;
  private ro: ResizeObserver;

  constructor(private host: HTMLElement, private reduceMotion: boolean) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(this.renderer.domElement);

    this.n = host.clientWidth < 700 ? 260 : 520;
    const n = this.n;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.alpha = new Float32Array(n); this.size = new Float32Array(n);
    this.t = new Float32Array(n); this.u = new Float32Array(n); this.spd = new Float32Array(n);
    this.exitAt = new Uint8Array(n); this.state = new Uint8Array(n); this.life = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n); this.px = new Float32Array(n); this.py = new Float32Array(n);
    // spread through the funnel from the start (and, for reduced motion, that is the still frame)
    for (let i = 0; i < n; i++) this.spawn(i, Math.random());

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, uniforms: { uDpr: { value: this.renderer.getPixelRatio() } },
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(this.geo, this.mat);
    points.frustumCulled = false;
    this.scene.add(points);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  /** a new lead enters at the mouth; where it drops out (if at all) is decided now */
  private spawn(i: number, t0 = 0) {
    this.t[i] = t0;
    this.u[i] = (Math.random() * 2 - 1) * 0.94;
    this.spd[i] = 0.07 + Math.random() * 0.05;
    let k = 0;
    while (k < PASS.length && Math.random() < PASS[k]) k++;
    this.exitAt[i] = k;              // 0..3 drops out at that boundary, 4 becomes a meeting
    if (t0 > 0 && k < 4 && t0 >= (k + 1) / 5) this.t[i] = Math.random() * ((k + 1) / 5);
    this.state[i] = 0;
  }

  private step(dt: number) {
    const s = this.shape, p = this.pos, c = this.col;
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      let x: number, y: number;
      if (this.state[i] === 0) {
        this.t[i] += this.spd[i] * dt;
        const t = this.t[i];
        y = s.mouthY + (s.neckY - s.mouthY) * t;
        const half = widthAt(s, t) / 2;
        x = s.cx + this.u[i] * half;
        if (this.exitAt[i] < 4 && t >= (this.exitAt[i] + 1) / 5) {       // filtered out
          this.state[i] = 1; this.life[i] = 1; this.px[i] = x; this.py[i] = y;
          this.vx[i] = Math.sign(this.u[i] || 1) * (40 + Math.random() * 70); this.vy[i] = 10 + Math.random() * 25;
        } else if (t >= 1) {                                               // through the neck
          this.state[i] = 2; this.px[i] = x; this.py[i] = y;
          this.vx[i] = (s.cx - x) * 0.8; this.vy[i] = 60 + Math.random() * 40;
        }
        const k = Math.min(1, t * 0.9);
        c[j] = LEAD.r + (BRIGHT.r - LEAD.r) * k; c[j + 1] = LEAD.g + (BRIGHT.g - LEAD.g) * k; c[j + 2] = LEAD.b + (BRIGHT.b - LEAD.b) * k;
        this.alpha[i] = Math.min(1, t * 20) * 0.55;
        this.size[i] = 2.6 + t * 1.2;
      } else if (this.state[i] === 1) {
        this.life[i] -= dt / 1.4;
        this.px[i] += this.vx[i] * dt; this.py[i] += this.vy[i] * dt;
        x = this.px[i]; y = this.py[i];
        c[j] = DROP.r; c[j + 1] = DROP.g; c[j + 2] = DROP.b;
        this.alpha[i] = Math.max(0, this.life[i]) * 0.5; this.size[i] = 2.4;
        if (this.life[i] <= 0) this.spawn(i);
      } else {
        this.px[i] += this.vx[i] * dt; this.py[i] += this.vy[i] * dt; this.vx[i] *= 0.96;
        x = this.px[i]; y = this.py[i];
        c[j] = MEET.r; c[j + 1] = MEET.g; c[j + 2] = MEET.b;
        this.alpha[i] = 0.95; this.size[i] = 4.6;
        if (y >= s.poolY) this.spawn(i);
      }
      p[j] = x; p[j + 1] = -y; p[j + 2] = 0;
    }
    for (const a of ['position', 'aColor', 'aAlpha', 'aSize']) this.geo.attributes[a].needsUpdate = true;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    this.step(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** follow the funnel as it narrows (called on scroll) */
  setShape(s: FunnelShape) {
    this.shape = s;
    if (!this.running) { this.step(0); this.renderer.render(this.scene, this.camera); }   // still frame follows the shape
  }

  start() {
    if (this.running) return;
    if (this.reduceMotion) { this.renderer.render(this.scene, this.camera); return; }
    this.running = true; this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.left = 0; this.camera.right = w; this.camera.top = 0; this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.geo.dispose(); this.mat.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
