import * as THREE from 'three';

/* The "How we fill your calendar" funnel: five glass tiers, one per step, with
   lead particles spiralling down through them. At every tier boundary some leads
   are filtered out and drift away; the ones that make it out of the bottom turn
   green and drop onto the "calendar" ring. setFocus() lights up the tier for the
   step being read. Loaded only in the browser (see Funnel.tsx). */

export type TierAnchor = { x: number; y: number };
type Options = { reduceMotion: boolean; compact: boolean; onLayout: (anchors: TierAnchor[]) => void };

const TIERS = 5;
const TOP = 2.3, TIER_H = 0.86, GAP = 0.09;               // world units
const RADII = [2.25, 1.8, 1.4, 1.05, 0.76, 0.52];          // at each tier boundary, top to bottom
const PASS = [0.62, 0.62, 0.55, 0.55];                     // share of leads that survive each boundary
const GROUND_Y = -3.05;
const C = {
  tier: new THREE.Color('#3E54FF'), active: new THREE.Color('#5BD25F'),
  lead: new THREE.Color('#7E90FF'), bright: new THREE.Color('#D4DAFF'),
  dropped: new THREE.Color('#5A6290'), meeting: new THREE.Color('#5BD25F'),
};
const tierTop = (i: number) => TOP - i * TIER_H;
const BOTTOM = tierTop(TIERS);

/** funnel radius at height y (linear inside each tier) */
function radiusAt(y: number) {
  const f = Math.min(TIERS - 1e-6, Math.max(0, (TOP - y) / TIER_H));
  const i = Math.floor(f), k = f - i;
  return RADII[i] + (RADII[i + 1] - RADII[i]) * k;
}

const surfaceShader = {
  vertexShader: /* glsl */ `
    varying vec3 vN; varying vec3 vV;
    void main() {
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor; uniform vec3 uActiveColor; uniform float uActive;
    varying vec3 vN; varying vec3 vV;
    void main() {
      float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);   // glass: brighter at the edges
      vec3 col = mix(uColor, uActiveColor, uActive);
      gl_FragColor = vec4(col, 0.035 + rim * (0.30 + uActive * 0.35) + uActive * 0.07);
      #include <colorspace_fragment>
    }`,
};

const pointShader = {
  vertexShader: /* glsl */ `
    attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
    uniform float uScale; varying float vAlpha; varying vec3 vColor;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale / -mv.z;
      gl_Position = projectionMatrix * mv;
      vAlpha = aAlpha; vColor = aColor;
    }`,
  fragmentShader: /* glsl */ `
    varying float vAlpha; varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * a * vAlpha);
      #include <colorspace_fragment>
    }`,
};

export class FunnelScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private group = new THREE.Group();
  private surfaces: THREE.ShaderMaterial[] = [];
  private rims: THREE.MeshBasicMaterial[] = [];
  private ribs: THREE.LineBasicMaterial[] = [];
  private ground: THREE.Mesh;
  private groundMat: THREE.MeshBasicMaterial;
  private pulse = 0;
  private weights = new Float32Array(TIERS);
  private focus = 0;
  private shownFocus = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private raf = 0;
  private running = false;
  private last = 0;
  private disposed = false;
  private ro: ResizeObserver;

  // particles
  private n: number;
  private geo = new THREE.BufferGeometry();
  private pos: Float32Array; private col: Float32Array; private alpha: Float32Array; private size: Float32Array;
  private t: Float32Array; private ang: Float32Array; private angV: Float32Array; private rf: Float32Array;
  private spd: Float32Array; private exitAt: Uint8Array; private state: Uint8Array; private life: Float32Array;
  private vel: Float32Array;
  private pointsMat: THREE.ShaderMaterial;

  constructor(private host: HTMLElement, private opts: Options) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.scene.add(this.group);
    this.buildTiers();

    this.groundMat = new THREE.MeshBasicMaterial({ color: C.meeting, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    this.ground = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.016, 8, 96), this.groundMat);
    this.ground.rotation.x = Math.PI / 2;
    this.ground.position.y = GROUND_Y;
    this.group.add(this.ground);

    this.n = opts.compact ? 700 : 1500;
    this.pos = new Float32Array(this.n * 3); this.col = new Float32Array(this.n * 3);
    this.alpha = new Float32Array(this.n); this.size = new Float32Array(this.n);
    this.t = new Float32Array(this.n); this.ang = new Float32Array(this.n); this.angV = new Float32Array(this.n);
    this.rf = new Float32Array(this.n); this.spd = new Float32Array(this.n); this.exitAt = new Uint8Array(this.n);
    this.state = new Uint8Array(this.n); this.life = new Float32Array(this.n); this.vel = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) this.spawn(i, Math.random());
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.4, 0), 6);
    this.pointsMat = new THREE.ShaderMaterial({
      ...pointShader, uniforms: { uScale: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.group.add(new THREE.Points(this.geo, this.pointsMat));

    // pre-roll so the funnel is already full of leads (and holds still for reduced motion)
    for (let k = 0; k < 240; k++) this.step(1 / 30);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    if (!opts.compact) host.addEventListener('pointermove', this.onPointer);
    host.addEventListener('pointerleave', this.onLeave);
  }

  private buildTiers() {
    for (let i = 0; i < TIERS; i++) {
      const yTop = tierTop(i) - GAP / 2, yBot = tierTop(i + 1) + GAP / 2;
      const rTop = radiusAt(yTop), rBot = radiusAt(yBot), h = yTop - yBot, yMid = (yTop + yBot) / 2;

      const mat = new THREE.ShaderMaterial({
        ...surfaceShader,
        uniforms: { uColor: { value: C.tier.clone() }, uActiveColor: { value: C.active.clone() }, uActive: { value: 0 } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      const surf = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 96, 1, true), mat);
      surf.position.y = yMid;
      this.group.add(surf);
      this.surfaces.push(mat);

      const rimMat = new THREE.MeshBasicMaterial({ color: C.tier.clone(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
      const rim = new THREE.Mesh(new THREE.TorusGeometry(rTop, 0.011, 6, 160), rimMat);
      rim.rotation.x = Math.PI / 2; rim.position.y = yTop;
      this.group.add(rim);
      this.rims.push(rimMat);

      const verts: number[] = [];
      const RIBS = 18;
      for (let r = 0; r < RIBS; r++) {
        const a = (r / RIBS) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        verts.push(c * rTop, yTop, s * rTop, c * rBot, yBot, s * rBot);
      }
      const ribGeo = new THREE.BufferGeometry();
      ribGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      const ribMat = new THREE.LineBasicMaterial({ color: C.tier.clone(), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
      this.group.add(new THREE.LineSegments(ribGeo, ribMat));
      this.ribs.push(ribMat);
    }
    // bottom rim of the last tier
    const yEnd = BOTTOM + GAP / 2;
    const endMat = new THREE.MeshBasicMaterial({ color: C.active, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const end = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(yEnd), 0.011, 6, 120), endMat);
    end.rotation.x = Math.PI / 2; end.position.y = yEnd;
    this.group.add(end);
  }

  /** a new lead enters at the top; its fate (where it drops out, if at all) is decided now */
  private spawn(i: number, t0 = 0) {
    this.t[i] = t0;
    this.ang[i] = Math.random() * Math.PI * 2;
    this.angV[i] = (0.16 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1);
    this.rf[i] = 0.18 + Math.random() * 0.72;
    this.spd[i] = 0.075 + Math.random() * 0.05;
    let k = 0;
    while (k < PASS.length && Math.random() < PASS[k]) k++;
    this.exitAt[i] = k;              // 0..3 = filtered out at that boundary, 4 = becomes a meeting
    this.state[i] = 0;
    this.life[i] = 0;
    // a lead spawned mid-funnel (pre-roll) must not already be past its exit
    if (t0 > 0 && k < 4 && t0 >= (k + 1) / TIERS) this.t[i] = Math.random() * ((k + 1) / TIERS);
  }

  private step(dt: number) {
    const p = this.pos, c = this.col, al = this.alpha, sz = this.size, v = this.vel;
    const focusT = (Math.min(this.shownFocus, TIERS - 0.001) + 0.5) / TIERS;   // where the highlighted band sits
    for (let i = 0; i < this.n; i++) {
      const j = i * 3;
      if (this.state[i] === 0) {                                     // flowing down the funnel
        this.t[i] += this.spd[i] * dt;
        const y = TOP - this.t[i] * (TOP - BOTTOM);
        const r = radiusAt(y) * this.rf[i];
        this.ang[i] += (this.angV[i] / Math.max(0.35, r)) * dt;
        p[j] = Math.cos(this.ang[i]) * r; p[j + 1] = y; p[j + 2] = Math.sin(this.ang[i]) * r;
        const boundary = (this.exitAt[i] + 1) / TIERS;
        if (this.exitAt[i] < 4 && this.t[i] >= boundary) {           // filtered out: drift away and fade
          this.state[i] = 1; this.life[i] = 1;
          const out = 0.55 + Math.random() * 0.6;
          v[j] = Math.cos(this.ang[i]) * out; v[j + 1] = 0.05 + Math.random() * 0.15; v[j + 2] = Math.sin(this.ang[i]) * out;
        } else if (this.t[i] >= 1) {                                 // qualified: falls to the calendar
          this.state[i] = 2;
          v[j] = -p[j] * 0.9; v[j + 1] = -0.8; v[j + 2] = -p[j + 2] * 0.9;
        }
        const near = 1 - Math.min(1, Math.abs(this.t[i] - focusT) * TIERS * 1.15);
        const k = Math.min(1, this.t[i] * 0.7 + near * 0.8);
        c[j] = C.lead.r + (C.bright.r - C.lead.r) * k; c[j + 1] = C.lead.g + (C.bright.g - C.lead.g) * k; c[j + 2] = C.lead.b + (C.bright.b - C.lead.b) * k;
        al[i] = Math.min(1, this.t[i] * 25) * (0.55 + near * 0.4);
        sz[i] = 0.05 + near * 0.025;
      } else if (this.state[i] === 1) {                              // dropping out
        this.life[i] -= dt / 1.5;
        p[j] += v[j] * dt; p[j + 1] += v[j + 1] * dt; p[j + 2] += v[j + 2] * dt;
        c[j] = C.dropped.r; c[j + 1] = C.dropped.g; c[j + 2] = C.dropped.b;
        al[i] = Math.max(0, this.life[i]) * 0.55;
        sz[i] = 0.045;
        if (this.life[i] <= 0) this.spawn(i);
      } else {                                                       // meeting: falls and lands
        p[j] += v[j] * dt; p[j + 1] += v[j + 1] * dt; p[j + 2] += v[j + 2] * dt;
        v[j] *= 0.97; v[j + 2] *= 0.97;
        c[j] = C.meeting.r; c[j + 1] = C.meeting.g; c[j + 2] = C.meeting.b;
        al[i] = 1; sz[i] = 0.085;
        if (p[j + 1] <= GROUND_Y) { this.pulse = 1; this.spawn(i); }
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
  }

  private updateTiers(dt: number) {
    const ease = this.opts.reduceMotion ? 1 : 1 - Math.exp(-dt * 6);
    this.shownFocus += (this.focus - this.shownFocus) * ease;
    for (let i = 0; i < TIERS; i++) {
      // full glow while reading the middle of a step, fading towards its edges
      const target = Math.max(0, Math.min(1, 1 - Math.max(0, Math.abs(this.shownFocus - (i + 0.5)) - 0.32) * 2.6));
      this.weights[i] += (target - this.weights[i]) * ease;
      const w = this.weights[i];
      this.surfaces[i].uniforms.uActive.value = w;
      this.rims[i].color.copy(C.tier).lerp(C.active, w);
      this.rims[i].opacity = 0.55 + w * 0.45;
      this.ribs[i].color.copy(C.tier).lerp(C.active, w);
      this.ribs[i].opacity = 0.12 + w * 0.22;
    }
    this.pulse = Math.max(0, this.pulse - dt * 2.2);
    const s = 1 + this.pulse * 0.12;
    this.ground.scale.set(s, s, s);
    this.groundMat.opacity = 0.4 + this.pulse * 0.6;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    if (!this.opts.reduceMotion) {
      this.step(dt);
      this.pointer.x += (this.pointer.tx - this.pointer.x) * Math.min(1, dt * 3);
      this.pointer.y += (this.pointer.ty - this.pointer.y) * Math.min(1, dt * 3);
      this.group.rotation.y += dt * 0.12;
      this.group.rotation.x = this.pointer.y * 0.12;
      this.group.rotation.z = -this.pointer.x * 0.06;
    }
    this.updateTiers(dt);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  private onPointer = (e: PointerEvent) => {
    const r = this.host.getBoundingClientRect();
    this.pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    this.pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  private onLeave = () => { this.pointer.tx = 0; this.pointer.ty = 0; };

  /** continuous step position: 0 = start of step 1 ... 5 = end of step 5 */
  setFocus(f: number) {
    this.focus = Math.max(0, Math.min(TIERS, f));
    if (!this.running) { this.updateTiers(1); this.renderer.render(this.scene, this.camera); }
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true; this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // fit the funnel (plus room on the right for the tier labels) into the frame
    const labelRoom = this.opts.compact ? 2.9 : 2.3;
    const fitW = RADII[0] + labelRoom / 2 + 0.3, fitH = (TOP - GROUND_Y + 0.5) / 2;   // 0.3: side margin
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const dist = Math.max(fitH / tan, fitW / (tan * aspect)) * 1.06;
    const cy = (TOP + GROUND_Y) / 2;
    this.camera.position.set(0, cy + dist * 0.2, dist);
    this.camera.lookAt(0, cy, 0);
    this.group.position.x = -labelRoom / 2;
    this.camera.updateProjectionMatrix();
    this.pointsMat.uniforms.uScale.value = this.renderer.domElement.height / (2 * tan);
    this.updateTiers(1);
    this.renderer.render(this.scene, this.camera);

    // where each tier label goes: just right of the tier's widest point, at its middle
    const anchors: TierAnchor[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < TIERS; i++) {
      const yMid = (tierTop(i) + tierTop(i + 1)) / 2;
      v.set(this.group.position.x + radiusAt(tierTop(i)) + 0.18, yMid, 0).project(this.camera);
      anchors.push({ x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h });
    }
    this.opts.onLayout(anchors);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.ro.disconnect();
    this.host.removeEventListener('pointermove', this.onPointer);
    this.host.removeEventListener('pointerleave', this.onLeave);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => x.dispose());
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/** WebGL is available (and not a software fallback we'd rather not run) */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
