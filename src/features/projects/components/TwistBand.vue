<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as THREE from "three";
import { useRouter } from "../../../composables/useRouter";

export interface TwistBandItem {
  title: string;
  thumbnail: string;
  description?: string;
  slug?: string;
}

interface Props {
  projects: TwistBandItem[];
  cardCount?: number;
  radius?: number;
  tilt?: number;
  twist?: number;
  autoSpeed?: number;
  enableRouting?: boolean;
  hideLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  radius: 4.2,
  tilt: 20,
  twist: 34,
  autoSpeed: 6,
  enableRouting: false,
  hideLabels: false,
});

const emit = defineEmits<{
  (e: "select", item: TwistBandItem): void;
}>();

const router = useRouter();

const mountRef = ref<HTMLDivElement | null>(null);
const pillRef = ref<HTMLDivElement | null>(null);
const activeTitle = ref("");

const TEX_W = 640;
const TEX_H = 760;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  return c;
}

function drawCardCanvas(img: HTMLImageElement | null, project: TwistBandItem) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;

  // Card Rounded Clipping Mask
  roundRect(ctx, 0, 0, TEX_W, TEX_H, 56);
  ctx.save();
  ctx.clip();

  // Clean light card background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (props.hideLabels) {
    // Clean full-bleed artwork card for Logos & Posters (no titles/labels/buttons)
    if (img && img.naturalWidth) {
      const s = Math.max(TEX_W / img.naturalWidth, TEX_H / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      try {
        ctx.drawImage(img, (TEX_W - w) / 2, (TEX_H - h) / 2, w, h);
      } catch {
        // ignore
      }
    } else {
      // Fallback clean gradient
      const grad = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
      grad.addColorStop(0, "#E9DED0");
      grad.addColorStop(1, "#DFD1BC");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, TEX_W, TEX_H);
    }
  } else {
    // Standard Mode (Websites): image on top (62% height) + white title & description block below
    if (img && img.naturalWidth) {
      const imgHeight = TEX_H * 0.62;
      const aspect = img.naturalWidth / img.naturalHeight;
      // For square or near-square images: contain mode with clean padding
      if (aspect >= 0.82 && aspect <= 1.2) {
        const pad = 44;
        const targetW = TEX_W - pad * 2;
        const targetH = imgHeight - pad * 2;
        const s = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        ctx.drawImage(img, (TEX_W - w) / 2, (imgHeight - h) / 2 + 8, w, h);
      } else {
        // Cover mode for websites & posters
        const s = Math.max(TEX_W / img.naturalWidth, imgHeight / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        try {
          ctx.drawImage(img, (TEX_W - w) / 2, 0, w, h);
        } catch {
          // ignore
        }
      }
    } else {
      // Fallback geometric banner
      const grad = ctx.createLinearGradient(0, 0, TEX_W, TEX_H * 0.62);
      grad.addColorStop(0, "#E9DED0");
      grad.addColorStop(1, "#DFD1BC");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, TEX_W, TEX_H * 0.62);

      ctx.fillStyle = "rgba(45, 42, 36, 0.08)";
      ctx.beginPath();
      ctx.arc(TEX_W / 2, TEX_H * 0.31, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom card content area
    const contentY = TEX_H * 0.64;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, contentY - 8, TEX_W, TEX_H - contentY + 8);

    // Subtle separator line
    ctx.fillStyle = "rgba(45, 42, 36, 0.08)";
    ctx.fillRect(40, contentY, TEX_W - 80, 2);

    // Title typography
    ctx.fillStyle = "#2D2A24";
    ctx.font = "800 38px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(project.title, 44, contentY + 54);

    // Description / Subtitle
    ctx.fillStyle = "#5F5646";
    ctx.font = "500 22px 'Plus Jakarta Sans', sans-serif";
    const desc = project.description || "View Project Details";
    ctx.fillText(desc.length > 34 ? desc.slice(0, 32) + "..." : desc, 44, contentY + 98);

    // Circular Accent Button Badge
    const btnX = TEX_W - 74;
    const btnY = TEX_H - 74;
    const btnR = 34;

    ctx.fillStyle = "#FF8400";
    ctx.beginPath();
    ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2);
    ctx.fill();

    // Arrow ↗ inside badge
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(btnX - 10, btnY + 10);
    ctx.lineTo(btnX + 10, btnY - 10);
    ctx.moveTo(btnX + 1, btnY - 10);
    ctx.lineTo(btnX + 10, btnY - 10);
    ctx.lineTo(btnX + 10, btnY - 1);
    ctx.stroke();
  }

  ctx.restore();

  // Card Outer Border
  const b = 4;
  roundRect(ctx, b / 2, b / 2, TEX_W - b, TEX_H - b, 56 - b / 2);
  ctx.lineWidth = b;
  ctx.strokeStyle = "rgba(45, 42, 36, 0.12)";
  ctx.stroke();

  return c;
}

const imageCache = new Map<string, HTMLImageElement>();
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    if (imageCache.has(src)) return resolve(imageCache.get(src)!);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

let disposed = false;
let rafId = 0;
let renderer: THREE.WebGLRenderer | null = null;
let resizeObserver: ResizeObserver | null = null;

function initThree() {
  const mount = mountRef.value;
  if (!mount || typeof window === "undefined") return;

  disposed = false;
  const projectList = props.projects && props.projects.length ? props.projects : [];
  if (!projectList.length) return;

  const N = Math.max(8, projectList.length < 8 ? projectList.length * 2 : projectList.length);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0.2, 17);

  const ring = new THREE.Group();
  scene.add(ring);

  const SEG = 24;
  const step = (Math.PI * 2) / N;
  const span = step * 0.965;
  let cardH = ((2 * Math.PI * props.radius) / N) * 0.9;

  const textures: THREE.Texture[] = [];
  const geoms: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const cards: {
    mesh: THREE.Mesh;
    base: number;
    uv0: Float32Array;
    project: TwistBandItem;
  }[] = [];

  for (let i = 0; i < N; i++) {
    const proj = projectList[i % projectList.length]!;
    const g = new THREE.PlaneGeometry(1, 1, SEG, 1);
    geoms.push(g);

    const canvas = drawCardCanvas(null, proj);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    textures.push(tex);

    if (proj.thumbnail) {
      loadImage(proj.thumbnail).then((img) => {
        if (disposed || !img) return;
        tex.image = drawCardCanvas(img, proj);
        tex.needsUpdate = true;
      });
    }

    const m = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.FrontSide,
      transparent: true,
      alphaTest: 0.5,
    });
    materials.push(m);
    const mesh = new THREE.Mesh(g, m);
    mesh.userData.card = i;
    ring.add(mesh);

    const gb = new THREE.BufferGeometry();
    if (g.attributes.position) {
      gb.setAttribute("position", g.attributes.position);
    }
    if (g.attributes.uv) {
      const uv = (g.attributes.uv as THREE.BufferAttribute).clone();
      for (let j = 0; j < uv.count; j++) uv.setX(j, 1 - uv.getX(j));
      gb.setAttribute("uv", uv);
    }
    gb.setIndex(g.index);
    geoms.push(gb);

    const mb = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      transparent: true,
      alphaTest: 0.5,
    });
    materials.push(mb);
    const back = new THREE.Mesh(gb, mb);
    back.userData.card = i;
    ring.add(back);

    const p0 = g.attributes.position as THREE.BufferAttribute;
    const uv0 = new Float32Array(p0.count * 2);
    for (let j = 0; j < p0.count; j++) {
      uv0[j * 2] = p0.getX(j) + 0.5;
      uv0[j * 2 + 1] = p0.getY(j);
    }
    cards.push({ mesh, base: i * step, uv0, project: proj });
  }

  function layout(rot: number) {
    const tw = (props.twist * Math.PI) / 180;
    cardH = ((2 * Math.PI * props.radius) / N) * 0.9;
    for (const { mesh, base, uv0 } of cards) {
      const pos = (mesh.geometry as THREE.BufferGeometry).attributes
        .position as THREE.BufferAttribute;
      for (let j = 0; j < pos.count; j++) {
        const u = uv0[j * 2] ?? 0;
        const v = uv0[j * 2 + 1] ?? 0;
        const phi = base + rot + (u - 0.5) * span;
        const sx = Math.sin(phi);
        const cz = Math.cos(phi);
        const alpha = tw * sx * sx;
        const wave = props.radius * 0.09 * Math.sin(2 * phi + 0.6);
        const h = v * cardH;
        pos.setXYZ(
          j,
          props.radius * sx + h * Math.sin(alpha) * sx,
          wave + h * Math.cos(alpha),
          props.radius * cz + h * Math.sin(alpha) * cz,
        );
      }
      pos.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
    }
  }

  function handleResize() {
    const mountEl = mountRef.value;
    if (!mountEl || !renderer) return;
    const w = mountEl.clientWidth || 1;
    const h = mountEl.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const dist = props.radius * 3;
    const halfW = props.radius / 0.6;
    const halfH = Math.max(halfW / camera.aspect, props.radius * 1.05);
    camera.fov = (2 * Math.atan(halfH / dist) * 180) / Math.PI;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(mount);
  handleResize();

  const tmp = new THREE.Vector3();
  let fitW = 0,
    fitH = 0;
  function recenter(snap: boolean) {
    ring.updateMatrixWorld(true);
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const { mesh } of cards) {
      const pos = (mesh.geometry as THREE.BufferGeometry).attributes
        .position as THREE.BufferAttribute;
      for (let j = 0; j < pos.count; j++) {
        tmp
          .fromBufferAttribute(pos, j)
          .applyMatrix4(mesh.matrixWorld)
          .project(camera);
        if (tmp.x < minX) minX = tmp.x;
        if (tmp.x > maxX) maxX = tmp.x;
        if (tmp.y < minY) minY = tmp.y;
        if (tmp.y > maxY) maxY = tmp.y;
      }
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const k = snap ? 1 : 0.08;
    ring.position.x -= cx * halfHeight * camera.aspect * k;
    ring.position.y -= cy * halfHeight * k;

    const w = (maxX - minX) / 2;
    const h = (maxY - minY) / 2;
    if (w > 0 && h > 0) {
      fitW = Math.max(w, fitW * 0.995);
      fitH = Math.max(h, fitH * 0.995);
      const mountEl = mountRef.value;
      const px = mountEl?.clientWidth || 1;
      const targetW = Math.min(0.82, 1 - (2 * 40) / px);
      const scale = Math.min(targetW / fitW, 0.86 / fitH);
      const s2 = 1 + (scale - 1) * (snap ? 1 : 0.08);
      const tanHalf = Math.tan((camera.fov * Math.PI) / 360) / s2;
      camera.fov = Math.min(100, Math.max(5, (2 * Math.atan(tanHalf) * 180) / Math.PI));
      camera.updateProjectionMatrix();
    }
  }

  let rot = 0;
  let vel = -(props.autoSpeed / 100) * 0.06;
  let idle = -(props.autoSpeed / 100) * 0.06;
  let dragDx = 0;
  let dragging = false;
  let lastX = 0,
    lastY = 0;
  let moved = 0;
  let tiltOffset = 0,
    tiltVel = 0;
  let hoverIdx = -1;
  let pointerIn = false;
  let px = 0,
    py = 0;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pickCard() {
    if (!renderer) return -1;
    const r = renderer.domElement.getBoundingClientRect();
    if (!r.width || !r.height) return -1;
    ndc.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(ring.children, false)[0];
    if (!hit) return -1;
    const i = hit.object.userData.card as number;
    const front = cards
      .map((c, k) => ({ k, z: Math.cos(c.base + rot) }))
      .sort((p, q) => q.z - p.z)
      .slice(0, 3)
      .map((p) => p.k);
    return front.includes(i) ? i : -1;
  }

  function showPill(i: number) {
    if (props.hideLabels) return;
    const pill = pillRef.value;
    const mountEl = mountRef.value;
    if (!pill || !mountEl) return;
    if (i < 0 || !cards[i]) {
      pill.style.opacity = "0";
      pill.style.transform =
        pill.style.transform.replace(/scale\([^)]*\)/, "") + " scale(0.92)";
      return;
    }
    const card = cards[i]!;
    activeTitle.value = card.project.title;

    const r = mountEl.getBoundingClientRect();
    const pw = pill.offsetWidth || 150;
    const ph = pill.offsetHeight || 44;
    const mx = px - r.left;
    const my = py - r.top;
    const pad = 16;

    let x = mx + 24;
    if (x + pw > r.width - pad) x = mx - pw - 24;
    let y = my + 24;
    if (y + ph > r.height - pad) y = my - ph - 24;

    x = Math.min(Math.max(pad, x), r.width - pw - pad);
    y = Math.min(Math.max(pad, y), r.height - ph - pad);

    pill.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
    pill.style.opacity = "1";
  }

  function updateHover() {
    const i = pointerIn && !dragging ? pickCard() : -1;
    hoverIdx = i;
    showPill(hoverIdx);
    if (renderer) {
      renderer.domElement.style.cursor = dragging
        ? "grabbing"
        : hoverIdx >= 0
          ? "pointer"
          : "grab";
    }
  }

  const el = renderer.domElement;
  el.style.cursor = "grab";
  el.style.touchAction = "pan-y";

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    dragDx = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    moved = 0;
    showPill(-1);
    el.style.cursor = "grabbing";
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    pointerIn = true;
    if (!dragging) return;
    moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    vel = dx * 0.006;
    rot += vel;
    dragDx += dx;
    tiltVel = dy * 0.0015;
    tiltOffset = Math.max(-0.25, Math.min(0.25, tiltOffset + tiltVel));
  };

  const onPointerUp = (e: PointerEvent) => {
    if (dragging && Math.abs(dragDx) > 8) {
      idle = Math.sign(dragDx) * Math.abs(idle);
    }
    const wasDrag = moved > 6;
    dragging = false;
    el.style.cursor = "grab";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (!wasDrag && e.type === "pointerup") {
      const i = pickCard();
      if (i >= 0 && cards[i]) {
        const item = cards[i]!.project;
        emit("select", item);
        if (props.enableRouting && item.slug) {
          router.push(`/project/${item.slug}`);
        }
      }
    }
  };

  const onPointerLeave = () => {
    pointerIn = false;
    if (!dragging) updateHover();
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);
  el.addEventListener("pointerleave", onPointerLeave);

  function animate(t: number) {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);

    if (!dragging) updateHover();
    if (!dragging) {
      vel += ((hoverIdx >= 0 ? 0 : idle) - vel) * (hoverIdx >= 0 ? 0.12 : 0.03);
      rot += vel;
      tiltOffset *= 0.96;
    }

    const baseTilt = (props.tilt * Math.PI) / 180;
    ring.rotation.x = baseTilt + tiltOffset + Math.sin(t * 0.0004) * 0.03;
    ring.rotation.z = Math.sin(t * 0.0003) * 0.03;

    layout(rot);
    recenter(false);
    renderer?.render(scene, camera);
  }

  for (let i = 0; i < 6; i++) {
    layout(0);
    recenter(true);
  }
  rafId = requestAnimationFrame(animate);

  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    resizeObserver?.disconnect();
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    el.removeEventListener("pointerleave", onPointerLeave);
    geoms.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    renderer?.dispose();
    if (el.parentNode === mount) {
      mount.removeChild(el);
    }
  };
}

let cleanupFn: (() => void) | null = null;

onMounted(() => {
  cleanupFn = initThree() || null;
});

onUnmounted(() => {
  cleanupFn?.();
  cleanupFn = null;
});

watch(
  () => [props.projects, props.hideLabels],
  () => {
    cleanupFn?.();
    cleanupFn = initThree() || null;
  },
  { deep: true },
);
</script>

<template>
  <div class="twist-band-wrapper">
    <div class="twist-band-dots" aria-hidden="true"></div>
    <div class="twist-band-shadow" aria-hidden="true"></div>
    <div ref="mountRef" class="twist-band-mount"></div>
    <div v-if="!props.hideLabels" ref="pillRef" class="twist-band-pill">
      <span>{{ activeTitle }}</span>
      <span class="pill-arrow">↗</span>
    </div>
    <div class="twist-band-hint">
      <span class="hint-dot"></span>
      Drag to spin showcase
      <span class="hint-dot"></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.twist-band-wrapper {
  position: relative;
  width: 100%;
  height: 640px;
  min-height: 540px;
  max-height: 800px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  background: #ffffff;
  border-radius: var(--radius-xxl);

  @include mixins.mq("md") {
    height: 720px;
  }

  @include mixins.mq("lg") {
    height: 780px;
  }
}

.twist-band-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: radial-gradient(circle, var(--color-text-400) 1.2px, transparent 1.6px);
  background-size: 26px 26px;
  background-position: center center;
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 35%, transparent 100%);
  z-index: 1;
}

.twist-band-shadow {
  position: absolute;
  left: 10%;
  right: 10%;
  top: 58%;
  height: 22%;
  background: radial-gradient(50% 50% at 50% 50%, rgba(45, 42, 36, 0.14) 0%, rgba(45, 42, 36, 0.04) 50%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.twist-band-mount {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;

  :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
  }
}

.twist-band-pill {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 20;
  opacity: 0;
  transform: translate3d(0, 0, 0) scale(0.92);
  transition:
    opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  background: var(--color-white-400);
  color: var(--color-text-400);
  border-radius: 100px;
  padding: 10px 22px;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow:
    0 14px 40px rgba(45, 42, 36, 0.14),
    0 2px 8px rgba(45, 42, 36, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(45, 42, 36, 0.08);

  .pill-arrow {
    color: var(--color-orange-400);
    font-size: 14px;
    font-weight: 800;
  }
}

.twist-band-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-300);
  pointer-events: none;
  z-index: 10;

  .hint-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: var(--color-orange-400);
    box-shadow: 0 0 8px rgba(255, 132, 0, 0.5);
  }
}
</style>
