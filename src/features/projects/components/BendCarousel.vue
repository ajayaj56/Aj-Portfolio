<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

export interface BendCarouselItem {
  title: string;
  thumbnail: string;
  description: string;
  category?: string;
}

interface Props {
  items: BendCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
  bend?: number;
  bendReach?: number;
  edgeZone?: number;
  edgeStretch?: number;
  edgeFade?: boolean;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  hoverDim?: boolean;
  dimMode?: "fade" | "darken";
  dimAmount?: number;
  cursorLabel?: string;
  showCaption?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cardWidth: 220,
  cardHeight: 310,
  gap: 14,
  bend: 1.0,
  bendReach: 1.0,
  edgeZone: 0.1,
  edgeStretch: 2.5,
  edgeFade: true,
  speed: 40,
  direction: "left",
  pauseOnHover: false,
  hoverDim: true,
  dimMode: "darken",
  dimAmount: 0.65,
  cursorLabel: "View Poster",
  showCaption: true,
});

const emit = defineEmits<{
  (e: "select", item: BendCarouselItem): void;
}>();

const rootRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const topRef = ref<HTMLCanvasElement | null>(null);
const pillRef = ref<HTMLDivElement | null>(null);
const captionRef = ref<HTMLDivElement | null>(null);
const titleRef = ref<HTMLSpanElement | null>(null);
const tagRef = ref<HTMLSpanElement | null>(null);
const indexRef = ref<HTMLSpanElement | null>(null);

const BASE_W = 1260;
const BASE_H = 720;

// WebGL2 Shaders
const VERT = `#version 300 es
in vec2 aPos;
in vec2 aUV;
in float aA;
uniform vec2 uRes;
out vec2 vUV;
out float vA;
void main() {
    vUV = aUV;
    vA = aA;
    gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform float uGray;
uniform float uBright;
uniform float uAlpha;
in vec2 vUV;
in float vA;
out vec4 outColor;
void main() {
    vec4 c = texture(uTex, vUV);
    float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 rgb = mix(c.rgb, vec3(g), uGray) * uBright;
    float a = vA * uAlpha;
    outColor = vec4(rgb * a, a);
}`;

interface GLRenderer {
  setSource: (i: number, src: HTMLCanvasElement) => void;
  hasSource: (i: number) => boolean;
  resize: (w: number, h: number) => void;
  begin: (W: number, H: number) => void;
  card: (
    i: number,
    verts: Float32Array,
    count: number,
    gray: number,
    bright: number,
    alpha: number,
  ) => void;
  dispose: () => void;
}

function createGLRenderer(canvas: HTMLCanvasElement): GLRenderer | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      antialias: true,
      premultipliedAlpha: true,
      alpha: true,
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;

  const compile = (type: number, src: string) => {
    const s = g.createShader(type);
    if (!s) return null;
    g.shaderSource(s, src);
    g.compileShader(s);
    return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null;
  };

  const vs = compile(g.VERTEX_SHADER, VERT);
  const fs = compile(g.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = g.createProgram();
  if (!prog) return null;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null;
  g.useProgram(prog);

  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  const stride = 5 * 4;
  const attr = (name: string, size: number, offset: number) => {
    const loc = g.getAttribLocation(prog, name);
    if (loc >= 0) {
      g.enableVertexAttribArray(loc);
      g.vertexAttribPointer(loc, size, g.FLOAT, false, stride, offset);
    }
  };
  attr("aPos", 2, 0);
  attr("aUV", 2, 8);
  attr("aA", 1, 16);

  const uRes = g.getUniformLocation(prog, "uRes");
  const uGray = g.getUniformLocation(prog, "uGray");
  const uBright = g.getUniformLocation(prog, "uBright");
  const uAlpha = g.getUniformLocation(prog, "uAlpha");
  g.uniform1i(g.getUniformLocation(prog, "uTex"), 0);
  g.enable(g.BLEND);
  g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  const textures = new Map<number, WebGLTexture>();

  return {
    setSource(i, src) {
      let tex = textures.get(i);
      if (!tex) tex = g.createTexture()!;
      g.bindTexture(g.TEXTURE_2D, tex);
      try {
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
      } catch {
        if (tex) g.deleteTexture(tex);
        textures.delete(i);
        return;
      }
      textures.set(i, tex);
      g.generateMipmap(g.TEXTURE_2D);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    },
    hasSource: (i) => textures.has(i),
    resize(w, h) {
      g.viewport(0, 0, w, h);
    },
    begin(W, H) {
      g.uniform2f(uRes, W, H);
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
    },
    card(i, verts, count, gray, bright, alpha) {
      const tex = textures.get(i);
      if (!tex || count < 4) return;
      g.bindTexture(g.TEXTURE_2D, tex);
      g.uniform1f(uGray, gray);
      g.uniform1f(uBright, bright);
      g.uniform1f(uAlpha, alpha);
      g.bufferData(g.ARRAY_BUFFER, verts.subarray(0, count * 5), g.DYNAMIC_DRAW);
      g.drawArrays(g.TRIANGLE_STRIP, 0, count);
    },
    dispose() {
      textures.forEach((t) => g.deleteTexture(t));
      if (buf) g.deleteBuffer(buf);
      g.deleteProgram(prog);
    },
  };
}

let cleanupFn: (() => void) | null = null;

function setupBendCarousel() {
  const root = rootRef.value;
  const canvas = canvasRef.value;
  if (!root || !canvas || typeof window === "undefined") return;
  const rootEl = root;

  // Enforce exactly 10 cards as requested
  const itemsList = props.items.slice(0, 10);
  const n = itemsList.length;
  if (!n) return;

  const glr = createGLRenderer(canvas);
  const baseCtx = glr ? null : canvas.getContext("2d");
  let ctx = baseCtx as CanvasRenderingContext2D;
  const top = topRef.value;

  const loaded: HTMLImageElement[] = itemsList.map((item) => {
    const el = new Image();
    el.decoding = "async";
    el.crossOrigin = "anonymous";
    el.src = item.thumbnail;
    return el;
  });

  let W = 0;
  let H = 0;
  let dpr = 1;
  const ar = props.cardWidth / props.cardHeight;
  const sources: (HTMLCanvasElement | null)[] = loaded.map(() => null);
  let sourceH = 0;

  const maxCardH = () => {
    const s = Math.min(H / BASE_H, W / 560);
    const hMax = (props.cardHeight + 0.94 * props.bend * Math.exp(0.0045 * props.bendReach * BASE_W)) * s;
    return Math.min(hMax, H);
  };

  const buildSource = (i: number) => {
    const im = loaded[i];
    if (!im || !sourceH) return;
    const th = Math.max(1, Math.round(sourceH));
    const tw = Math.max(1, Math.round(th * ar));

    const c = sources[i] || document.createElement("canvas");
    c.width = tw;
    c.height = th;
    const cx = c.getContext("2d");
    if (!cx) return;

    // Card background
    cx.fillStyle = "#16181d";
    cx.fillRect(0, 0, tw, th);

    if (im.complete && im.naturalWidth) {
      const iw = im.naturalWidth;
      const ih = im.naturalHeight;
      let sw = iw,
        sh = ih;
      if (iw / ih > ar) sw = ih * ar;
      else sh = iw / ar;
      try {
        cx.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, tw, th);
      } catch {
        // ignore
      }
    } else {
      // Elegant placeholder
      const grad = cx.createLinearGradient(0, 0, tw, th);
      grad.addColorStop(0, "#2a2d36");
      grad.addColorStop(1, "#12141a");
      cx.fillStyle = grad;
      cx.fillRect(0, 0, tw, th);
    }

    // High quality rounded card border on texture
    cx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    cx.lineWidth = 4;
    cx.strokeRect(2, 2, tw - 4, th - 4);

    sources[i] = c;
    glr?.setSource(i, c);
  };

  const rebuildSources = () => {
    const want = Math.ceil(maxCardH() * dpr);
    if (sourceH && Math.abs(want - sourceH) / sourceH < 0.15) return;
    sourceH = want;
    loaded.forEach((_, i) => buildSource(i));
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = root.clientWidth;
    H = root.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    glr?.resize(canvas.width, canvas.height);
    if (top) {
      top.width = canvas.width;
      top.height = canvas.height;
    }
    rebuildSources();
  };
  resize();

  const ro = new ResizeObserver(() => {
    resize();
  });
  ro.observe(root);

  loaded.forEach((im, i) => {
    im.onload = () => buildSource(i);
    if (im.complete) buildSource(i);
  });

  let pointer: { x: number; y: number } | null = null;
  let hoverK: number | null = null;
  let geom: {
    warp: (x: number) => number;
    hAt: (x: number) => number;
    offset: number;
    step: number;
    cw: number;
    cy: number;
  } | null = null;

  const hitTest = (x: number, y: number) => {
    if (!geom || x < 0 || x >= W) return null;
    const { warp, hAt, offset, step, cw, cy } = geom;
    const rel = (warp(x) + warp(x + 1)) / 2 - offset;
    const i = Math.floor(rel / step);
    return (rel - i * step) / cw < 1 && Math.abs(y - cy) < hAt(x) / 2 ? i : null;
  };

  let verts = new Float32Array(8192);

  const draw = (offset: number, dim = 0, litK: number | null = null) => {
    if (!glr && ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
    }
    if (!W || !H) return;

    const s = Math.min(H / BASE_H, W / 560);
    const cw = props.cardWidth * s;
    const step = (props.cardWidth + props.gap) * s;
    const cy = H / 2;

    const k = 0.0045 * props.bendReach;
    const hAt = (x: number) => (props.cardHeight + 0.94 * props.bend * Math.exp(k * BASE_W * (x / W))) * s;

    const Z = props.edgeZone * W;
    const Zc = Z / Math.max(props.edgeStretch, 1);
    const p = Math.max(props.edgeStretch, 1);
    const warp = (x: number) => {
      if (Z <= 0) return x;
      if (x < Z) return Z - Zc * (1 - Math.pow(x / Z, p));
      if (x > W - Z) return W - Z + Zc * (1 - Math.pow((W - x) / Z, p));
      return x;
    };

    geom = { warp, hAt, offset, step, cw, cy };
    hoverK = null;
    if (pointer && pointer.x >= 0 && pointer.x < W) {
      const rel = (warp(pointer.x) + warp(pointer.x + 1)) / 2 - offset;
      const i = Math.floor(rel / step);
      const h = hAt(pointer.x);
      if ((rel - i * step) / cw < 1 && Math.abs(pointer.y - cy) < h / 2) {
        hoverK = i;
      }
    }

    const edgeAlpha = (x: number) =>
      props.edgeFade && Z > 0
        ? Math.min(1, Math.pow(Math.max(Math.min(x, W - x), 0) / (Z * 0.45), 1.5))
        : 1;

    if (glr) {
      glr.begin(W, H);
      const lo = warp(0);
      const hi = warp(W);
      const unwarp = (v: number) => {
        if (v <= lo) return 0;
        if (v >= hi) return W;
        let a = 0,
          b = W;
        for (let it = 0; it < 22; it++) {
          const m = (a + b) / 2;
          if (warp(m) < v) a = m;
          else b = m;
        }
        return (a + b) / 2;
      };

      const first = Math.floor((lo - offset) / step);
      const last = Math.floor((hi - offset) / step);

      for (let i = first; i <= last; i++) {
        const idx = ((i % n) + n) % n;
        if (!glr.hasSource(idx)) continue;
        const start = offset + i * step;
        const xs = unwarp(start);
        const xe = unwarp(start + cw);
        if (xe - xs < 0.01) continue;

        const need = (Math.ceil((xe - xs) / 3) + 3) * 10;
        if (verts.length < need) verts = new Float32Array(need * 2);
        let c = 0;
        const push = (x: number) => {
          const u = Math.min(Math.max((warp(x) - start) / cw, 0), 1);
          const h = hAt(x);
          const a = edgeAlpha(x);
          const o = c * 5;
          verts[o] = x;
          verts[o + 1] = cy - h / 2;
          verts[o + 2] = u;
          verts[o + 3] = 0;
          verts[o + 4] = a;
          verts[o + 5] = x;
          verts[o + 6] = cy + h / 2;
          verts[o + 7] = u;
          verts[o + 8] = 1;
          verts[o + 9] = a;
          c += 2;
        };
        push(xs);
        for (let x = Math.floor(xs / 3) * 3 + 3; x < xe; x += 3) push(x);
        push(xe);

        const lit = litK !== null && i === litK;
        const g = lit ? 0 : dim;
        const fall = lit ? 1 : 1 - dim * props.dimAmount;
        glr.card(
          idx,
          verts,
          c,
          g,
          props.dimMode === "fade" ? 1 : fall,
          props.dimMode === "fade" ? fall : 1,
        );
      }
      return;
    }

    // 2D fallback
    if (ctx) {
      for (let i = Math.floor((warp(0) - offset) / step); i <= Math.floor((warp(W) - offset) / step); i++) {
        const idx = ((i % n) + n) % n;
        const src = sources[idx];
        if (!src) continue;
        for (let x = 0; x < W; x += 2) {
          const a = warp(x);
          const u = (a - offset - i * step) / cw;
          if (u >= 0 && u <= 1) {
            const h = hAt(x);
            ctx.globalAlpha = edgeAlpha(x);
            ctx.drawImage(src, u * src.width, 0, 2, src.height, x, cy - h / 2, 2, h);
          }
        }
      }
    }
  };

  const dir = props.direction === "left" ? -1 : 1;
  const tau = 0.9;
  const distance = (t: number) => props.speed * t + Math.max(1200 - props.speed, 0) * tau * (1 - Math.exp(-t / tau));

  let raf = 0;
  let start = -1;
  let target = 0;
  let current = 0;
  let lastNow = -1;
  const weight = 0.55;
  let dim = 0;
  let litK: number | null = null;

  let pillX = 0,
    pillY = 0,
    pillS = 0;
  let dragging = false;
  let lastX = 0,
    lastT = 0,
    vx = 0,
    travel = 0,
    downX = 0;

  const updateCaption = () => {
    const box = captionRef.value;
    if (!box) return;
    box.style.opacity = hoverK !== null ? "1" : "0";
    if (hoverK === null) return;
    const idx = ((hoverK % n) + n) % n;
    const item = itemsList[idx];
    if (!item) return;
    if (titleRef.value) titleRef.value.textContent = item.title;
    if (tagRef.value) tagRef.value.textContent = item.description;
    if (indexRef.value) {
      indexRef.value.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
    }
  };

  function frame(now: number) {
    if (start < 0) start = now;
    const dt = lastNow < 0 ? 0 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;

    current += (target - current) * (1 - Math.exp(-dt / weight));
    const t = (now - start) / 1000;
    const s = Math.min(H / BASE_H, W / 560);

    if (props.hoverDim) {
      if (hoverK !== null) litK = hoverK;
      const want = hoverK !== null ? 1 : 0;
      dim += (want - dim) * (1 - Math.exp(-dt / 0.18));
      if (dim < 0.001) litK = null;
    }

    draw(dir * distance(t) * s + current, dim, litK);

    const pill = pillRef.value;
    const showPill = hoverK !== null && !dragging;
    if (rootEl) {
      rootEl.style.cursor = dragging ? "grabbing" : showPill ? "none" : hoverK !== null ? "pointer" : "grab";
    }

    if (pill) {
      if (pointer) {
        pillX += (pointer.x - pillX) * (1 - Math.exp(-dt / 0.06));
        pillY += (pointer.y - pillY) * (1 - Math.exp(-dt / 0.06));
      }
      pillS += ((showPill ? 1 : 0) - pillS) * (1 - Math.exp(-dt / 0.12));
      pill.style.transform = `translate3d(${pillX + 14}px, ${pillY + 14}px, 0) scale(${pillS})`;
      pill.style.opacity = String(Math.min(1, pillS * 1.4));
    }

    if (props.showCaption) updateCaption();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging = true;
    travel = 0;
    downX = lastX = e.clientX;
    lastT = performance.now();
    vx = 0;
    root.setPointerCapture(e.pointerId);
    root.style.cursor = "grabbing";
  };

  const onPointerMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    travel = Math.max(travel, Math.abs(e.clientX - downX));
    target += dx;
    const dtm = Math.max(now - lastT, 16);
    const v = Math.max(-2500, Math.min(2500, (dx / dtm) * 1000));
    vx = vx * 0.6 + v * 0.4;
    lastX = e.clientX;
    lastT = now;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastT < 80) target += vx * 0.35 * 0.5;
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    root.style.cursor = "grab";

    if (travel <= 6 && e.type === "pointerup") {
      const r = root.getBoundingClientRect();
      const k = hitTest(e.clientX - r.left, e.clientY - r.top);
      if (k !== null) {
        const idx = ((k % n) + n) % n;
        const selected = itemsList[idx];
        if (selected) {
          emit("select", selected);
        }
      }
    }
  };

  const onPointerLeave = () => {
    pointer = null;
  };

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    target -= e.deltaX * 0.5;
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    glr?.dispose();
    if (rootEl) {
      rootEl.removeEventListener("pointerdown", onPointerDown);
      rootEl.removeEventListener("pointermove", onPointerMove);
      rootEl.removeEventListener("pointerup", onPointerUp);
      rootEl.removeEventListener("pointercancel", onPointerUp);
      rootEl.removeEventListener("pointerleave", onPointerLeave);
      rootEl.removeEventListener("wheel", onWheel);
    }
  };
}

onMounted(() => {
  cleanupFn = setupBendCarousel() || null;
});

onUnmounted(() => {
  cleanupFn?.();
  cleanupFn = null;
});

watch(
  () => props.items,
  () => {
    cleanupFn?.();
    cleanupFn = setupBendCarousel() || null;
  },
  { deep: true },
);
</script>

<template>
  <div ref="rootRef" class="bend-carousel-container">
    <!-- Ambient Backdrop Gradient & Subtle Grid -->
    <div class="bend-ambient" aria-hidden="true"></div>
    <div class="bend-dots" aria-hidden="true"></div>

    <!-- Canvases -->
    <canvas ref="canvasRef" class="bend-canvas"></canvas>
    <canvas ref="topRef" class="bend-top-canvas"></canvas>

    <!-- Floating Cursor Pill following pointer -->
    <div ref="pillRef" class="bend-cursor-pill">
      <span class="pill-dot"></span>
      <span>{{ props.cursorLabel }}</span>
    </div>

    <!-- Bottom Caption on Hover -->
    <div v-if="props.showCaption" ref="captionRef" class="bend-caption">
      <span>
        <span ref="titleRef" class="caption-title">Poster Title</span>
        <span ref="tagRef" class="caption-desc">Description</span>
      </span>
      <span ref="indexRef" class="caption-index">01 / 10</span>
    </div>

    <!-- Bottom Drag Hint -->
    <div class="bend-hint">
      <span class="hint-dot"></span>
      Drag or scroll to browse 10 posters showcase
      <span class="hint-dot"></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bend-carousel-container {
  position: relative;
  width: 100%;
  height: 580px;
  min-height: 480px;
  max-height: 750px;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  background: #ffffff;
  border-radius: var(--radius-xxl);
  box-shadow: 0 10px 40px rgba(45, 42, 36, 0.04);

  @include mixins.mq("md") {
    height: 660px;
  }

  @include mixins.mq("lg") {
    height: 720px;
  }
}

.bend-ambient {
  position: absolute;
  width: 70vw;
  height: 60vh;
  left: 15vw;
  top: 20vh;
  background: radial-gradient(circle, rgba(255, 132, 0, 0.05) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
  z-index: 1;
}

.bend-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.14;
  background-image: radial-gradient(circle, #2d2a24 1.2px, transparent 1.6px);
  background-size: 26px 26px;
  background-position: center center;
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 35%, transparent 100%);
  z-index: 1;
}

.bend-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 2;
  will-change: filter, opacity;
}

.bend-top-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
  z-index: 3;
}

.bend-cursor-pill {
  position: absolute;
  left: 0;
  top: 0;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transform-origin: 0 0;
  border-radius: 999px;
  background: #ffffff;
  color: #12141a;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: scale(0);
  will-change: transform, opacity;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 30;

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff8400;
    box-shadow: 0 0 6px #ff8400;
  }
}

.bend-caption {
  position: absolute;
  left: 36px;
  right: 36px;
  bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  color: #2d2a24;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 20;

  .caption-title {
    font-size: 18px;
    font-weight: 700;
    color: #2d2a24;
  }

  .caption-desc {
    font-size: 14px;
    color: #5f5646;
    margin-left: 10px;
  }

  .caption-index {
    font-size: 14px;
    font-weight: 600;
    color: #ff8400;
    font-variant-numeric: tabular-nums;
  }
}

.bend-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #5f5646;
  pointer-events: none;
  z-index: 10;

  .hint-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #ff8400;
  }
}
</style>
