<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted, watch } from "vue";

export interface ConcaveGlobeItem {
  title: string;
  thumbnail: string;
  description: string;
  category?: string;
}

interface Props {
  items: ConcaveGlobeItem[];
  tileSize?: number;
  ratio?: number;
  gap?: number;
  cornerRadius?: number;
  radius?: number;
  perspective?: number;
  scrollSpeed?: number;
  inertia?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tileSize: 260,
  ratio: 0.75, // 3:4 portrait
  gap: 14,
  cornerRadius: 16,
  radius: 560,
  perspective: 0.35,
  scrollSpeed: 1,
  inertia: true,
});

const emit = defineEmits<{
  (e: "select", item: ConcaveGlobeItem): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const perspectiveRef = ref<HTMLDivElement | null>(null);
const worldRef = ref<HTMLDivElement | null>(null);
const hintRef = ref<HTMLDivElement | null>(null);

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hashInt(n: number): number {
  let h = n | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function makeImagePicker(count: number, seed = 0) {
  const perm = Array.from({ length: count }, (_, i) => i);
  let s = ((Math.max(0, Math.round(seed)) + 1) * 2654435761) >>> 0;
  for (let i = count - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = Math.floor((s / 4294967296) * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  const cache = new Map<number, number>([[0, 0]]);
  let lo = 0;
  let hi = 0;
  const step = (t: number) => (count <= 1 ? 0 : 1 + (hashInt(t * 7919 + seed * 104729 + 13) % (count - 1)));
  const rowOffset = (j: number): number => {
    while (hi < j) {
      hi++;
      cache.set(hi, (cache.get(hi - 1)! + step(hi)) % count);
    }
    while (lo > j) {
      cache.set(lo - 1, (((cache.get(lo)! - step(lo)) % count) + count) % count);
      lo--;
    }
    return cache.get(j)!;
  };
  return (i: number, j: number): number => {
    if (count <= 1) return 0;
    return perm[(((i + rowOffset(j)) % count) + count) % count] || 0;
  };
}

let cleanupFn: (() => void) | null = null;

onMounted(() => {
  const container = containerRef.value;
  const perspectiveEl = perspectiveRef.value;
  const world = worldRef.value;
  if (!container || !perspectiveEl || !world) return;

  const validItems = props.items && props.items.length > 0 ? props.items : [];
  if (validItems.length === 0) return;

  const pickImage = makeImagePicker(validItems.length, 0);

  const tileH = Math.max(20, props.tileSize);
  const tileW = tileH * props.ratio;
  const pX = tileW + Math.max(0, props.gap);
  const pY = tileH + Math.max(0, props.gap);
  const R = Math.max(150, props.radius);
  const k = clamp(props.perspective, 0.05, 3);
  const P = (1 + k) * R;

  let size = { w: container.clientWidth || 1000, h: container.clientHeight || 700 };
  let offX = 0;
  let offY = 0;
  let tgtX = 0;
  let tgtY = 0;
  let velX = 0;
  let velY = 0;
  let winW = 6;
  let winH = 5;
  let currentWin = { i0: 0, j0: 0 };

  const tileEls = new Map<string, { i: number; j: number; el: HTMLElement }>();
  const tileData = new Map<string, ConcaveGlobeItem>();

  let isScrolling = false;
  let scrollTimeout: any = null;
  let didDrag = false;
  let disposed = false;
  let rafId = 0;

  const drag = {
    pressed: false,
    active: false,
    id: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
  };

  const updateDimensions = () => {
    size = {
      w: Math.max(1, container.clientWidth),
      h: Math.max(1, container.clientHeight),
    };

    perspectiveEl.style.perspective = `${P}px`;
    world.style.transform = `translateZ(${R}px)`;

    const need = (half: number) => {
      let a = 0;
      const maxA = Math.min(2.2, Math.acos(-Math.min(0.99, k)) - 0.05);
      while (a < maxA) {
        const sx = (P * Math.sin(a)) / (k + Math.cos(a));
        if (sx > half + Math.max(tileW, tileH) * 2) break;
        a += 0.01;
      }
      return a * R;
    };

    const reachX = need(size.w / 2);
    const reachY = need(size.h / 2);

    winW = clamp(Math.ceil(reachX / pX) + 1, 2, 8);
    winH = clamp(Math.ceil(reachY / pY) + 1, 2, 6);
  };

  updateDimensions();

  const createTileEl = (i: number, j: number) => {
    const key = `${i}:${j}`;
    const el = document.createElement("div");
    el.className = "globe-tile";
    el.dataset.key = key;
    el.style.left = `${-tileW / 2}px`;
    el.style.top = `${-tileH / 2}px`;
    el.style.width = `${tileW}px`;
    el.style.height = `${tileH}px`;
    el.style.borderRadius = `${props.cornerRadius}px`;

    const item = validItems[pickImage(i, j)] || validItems[0];
    tileData.set(key, item);

    const img = document.createElement("img");
    img.src = item.thumbnail;
    img.alt = item.title || "";
    img.draggable = false;
    el.appendChild(img);

    world.appendChild(el);
    return el;
  };

  const placeTile = (el: HTMLElement, i: number, j: number) => {
    const u = i * pX - offX;
    const v = j * pY - offY;
    const phi = v / R;
    let hidden = true;

    if (Math.abs(phi) < 1.5) {
      const cp = Math.cos(phi);
      const theta = -(u / R) / cp;
      const dotVal = cp * Math.cos(theta);
      const D = R * (k + dotVal);

      if (D > 0.12 * R) {
        const s = P / D;
        const sx = -R * cp * Math.sin(theta) * s;
        const sy = R * Math.sin(phi) * s;
        const m = Math.max(tileW, tileH) * s;
        hidden = Math.abs(sx) > size.w / 2 + m || Math.abs(sy) > size.h / 2 + m;
        if (!hidden) {
          el.style.transform = `rotateY(${(theta * 180) / Math.PI}deg) rotateX(${(phi * 180) / Math.PI}deg) translateZ(${-R}px)`;
        }
      }
    }

    const targetVis = hidden ? "hidden" : "visible";
    if (el.style.visibility !== targetVis) {
      el.style.visibility = targetVis;
    }
  };

  const updateTiles = () => {
    const i0 = Math.round(offX / pX);
    const j0 = Math.round(offY / pY);

    const neededKeys = new Set<string>();

    for (let j = j0 - winH; j <= j0 + winH; j++) {
      for (let i = i0 - winW; i <= i0 + winW; i++) {
        const key = `${i}:${j}`;
        neededKeys.add(key);

        let tileRec = tileEls.get(key);
        if (!tileRec) {
          const el = createTileEl(i, j);
          tileRec = { i, j, el };
          tileEls.set(key, tileRec);
        }
        placeTile(tileRec.el, i, j);
      }
    }

    // Buffer cleanup: only remove tiles well outside window to prevent flashing
    for (const [key, rec] of tileEls.entries()) {
      if (Math.abs(rec.i - i0) > winW + 2 || Math.abs(rec.j - j0) > winH + 2) {
        rec.el.remove();
        tileEls.delete(key);
        tileData.delete(key);
      }
    }

    currentWin = { i0, j0 };
  };

  updateTiles();

  // Centralized Click & Drag Detection
  let downTime = 0;
  let downX = 0;
  let downY = 0;
  let downTile: HTMLElement | null = null;

  const onPointerDown = (e: PointerEvent) => {
    if (isScrolling) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    downTime = performance.now();
    downX = e.clientX;
    downY = e.clientY;
    downTile = (e.target as HTMLElement).closest(".globe-tile");

    didDrag = false;
    velX = 0;
    velY = 0;
    drag.pressed = true;
    drag.active = false;
    drag.id = e.pointerId;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;

    container.classList.add("grabbing");
    if (hintRef.value) hintRef.value.style.opacity = "0";
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.pressed || drag.id !== e.pointerId) return;

    const adx = Math.abs(e.clientX - drag.startX);
    const ady = Math.abs(e.clientY - drag.startY);

    if (!drag.active) {
      if (adx > 4 || ady > 4) {
        drag.active = true;
        didDrag = true;
        downTile = null;
      } else {
        return;
      }
    }

    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    const fr = dt / 16.667;

    tgtX -= dx;
    tgtY -= dy;
    velX = velX * 0.5 + (-dx / fr) * 0.5;
    velY = velY * 0.5 + (-dy / fr) * 0.5;

    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (drag.id !== e.pointerId) return;

    const now = performance.now();
    const elapsed = now - downTime;
    const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);

    if (!drag.active && !didDrag && !isScrolling && elapsed < 280 && moveDist < 4 && downTile) {
      const upTile = (e.target as HTMLElement).closest(".globe-tile");
      if (upTile && upTile === downTile) {
        if (Math.hypot(velX, velY) < 0.1 && Math.hypot(tgtX - offX, tgtY - offY) < 5) {
          const key = upTile.dataset.key;
          const item = tileData.get(key || "");
          if (item) {
            emit("select", item);
          }
        }
      }
    }

    if (drag.active) {
      if (e.timeStamp - drag.lastT > 80 || !props.inertia) {
        velX = 0;
        velY = 0;
      }
    }

    drag.pressed = false;
    drag.active = false;
    drag.id = -1;
    downTile = null;
    container.classList.remove("grabbing");
  };

  const onPointerCancel = () => {
    drag.pressed = false;
    drag.active = false;
    drag.id = -1;
    downTile = null;
    container.classList.remove("grabbing");
  };

  const onWheel = (e: WheelEvent) => {
    // Disable tile pointer events while scrolling
    isScrolling = true;
    world.style.pointerEvents = "none";
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      world.style.pointerEvents = "auto";
    }, 400);

    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const dx = clamp(e.deltaX * unit, -120, 120);
    const dy = clamp(e.deltaY * unit, -120, 120);

    if (Math.abs(dx) > Math.abs(dy)) {
      tgtX += dx * 0.75 * props.scrollSpeed;
    } else {
      tgtY += dy * 0.75 * props.scrollSpeed;
    }
  };

  container.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  container.addEventListener("wheel", onWheel, { passive: true });

  const ro = new ResizeObserver(() => {
    updateDimensions();
    updateTiles();
  });
  ro.observe(container);

  let lastNow = performance.now();

  const animate = (now: number) => {
    if (disposed) return;
    const dt = Math.min(64, now - lastNow);
    lastNow = now;
    const f = dt / 16.667;

    if (!drag.active) {
      if (Math.abs(velX) > 0.01 || Math.abs(velY) > 0.01) {
        tgtX += velX * f;
        tgtY += velY * f;
        const decay = Math.pow(0.92, f);
        velX *= decay;
        velY *= decay;
      } else {
        velX = 0;
        velY = 0;
      }
    }

    const smooth = drag.active ? 0.6 : 0.16;
    const a = 1 - Math.pow(1 - smooth, f);
    const dx = tgtX - offX;
    const dy = tgtY - offY;

    if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
      offX += dx * a;
      offY += dy * a;

      for (const [, rec] of tileEls) {
        placeTile(rec.el, rec.i, rec.j);
      }

      const i0 = Math.round(offX / pX);
      const j0 = Math.round(offY / pY);
      if (i0 !== currentWin.i0 || j0 !== currentWin.j0) {
        updateTiles();
      }
    }

    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);

  cleanupFn = () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    ro.disconnect();
    clearTimeout(scrollTimeout);
    container.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    container.removeEventListener("wheel", onWheel);
  };
});

onUnmounted(() => {
  cleanupFn?.();
});
</script>

<template>
  <div class="globe-showcase-container" ref="containerRef" role="region" aria-label="3D Concave Globe Showcase">
    <div class="globe-perspective" ref="perspectiveRef">
      <div class="globe-world" ref="worldRef"></div>
    </div>
    <div class="globe-vignette"></div>
    <div class="globe-hint" ref="hintRef">
      <span>Drag in any direction • Scroll to glide • Click item to inspect</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.globe-showcase-container {
  position: relative;
  width: 100%;
  height: clamp(520px, 75vh, 850px);
  overflow: hidden;
  background-color: #0b0c0e;
  border-radius: 24px;
  touch-action: pan-y;
  overscroll-behavior: contain;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);

  &.grabbing {
    cursor: grabbing;
  }
}

.globe-perspective {
  position: absolute;
  inset: 0;
  perspective-origin: 50% 50%;
}

.globe-world {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

:deep(.globe-tile) {
  position: absolute;
  visibility: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
  will-change: transform;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }
}

.globe-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(11, 12, 14, 0.95) 100%);
  border-radius: 24px;
}

.globe-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.4s ease;
  white-space: nowrap;
}
</style>
