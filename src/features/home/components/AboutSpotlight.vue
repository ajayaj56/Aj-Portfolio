<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { sceneWeights } from "../../../animations/scenes";

const spotlightRef = ref<HTMLDivElement | null>(null);

let animationFrameId: number | null = null;
let isHovering = false;

// Mouse coordinates
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

// Opacity
let currentOpacity = 0;

// Smooth interpolation constants (lerp)
const LERP_FACTOR = 0.11;
const OPACITY_LERP = 0.08;

const onMouseMove = (e: MouseEvent) => {
  if (!spotlightRef.value) return;
  const rect = spotlightRef.value.getBoundingClientRect();

  const isInside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (isInside) {
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    isHovering = true;
  } else {
    isHovering = false;
  }
};

const onMouseLeave = () => {
  isHovering = false;
};

const onTouchMove = (e: TouchEvent) => {
  if (!spotlightRef.value || !e.touches[0]) return;
  const rect = spotlightRef.value.getBoundingClientRect();
  targetX = e.touches[0].clientX - rect.left;
  targetY = e.touches[0].clientY - rect.top;
  isHovering = true;
};

const onTouchEnd = () => {
  isHovering = false;
};

const tick = () => {
  // Only active when the user is scrolled into the About section
  const aboutWeight = sceneWeights.about;
  const targetOpacity = isHovering ? aboutWeight : aboutWeight * 0.2; // Subtle idle glow when in About

  // Smooth position trailing
  currentX += (targetX - currentX) * LERP_FACTOR;
  currentY += (targetY - currentY) * LERP_FACTOR;

  // Smooth opacity fade
  currentOpacity += (targetOpacity - currentOpacity) * OPACITY_LERP;

  if (spotlightRef.value) {
    const el = spotlightRef.value;

    // Fully hide when outside of About section to save GPU/compositing
    if (currentOpacity < 0.005) {
      el.style.opacity = "0";
      el.style.visibility = "hidden";
    } else {
      el.style.visibility = "visible";
      const width = el.clientWidth || window.innerWidth;
      const height = el.clientHeight || window.innerHeight;

      // Subtle 3D parallax offset response (-12px to +12px)
      const parallaxX = ((currentX / width) - 0.5) * 24;
      const parallaxY = ((currentY / height) - 0.5) * 24;

      el.style.setProperty("--spotlight-x", `${currentX.toFixed(1)}px`);
      el.style.setProperty("--spotlight-y", `${currentY.toFixed(1)}px`);
      el.style.setProperty("--spotlight-opacity", `${currentOpacity.toFixed(3)}`);
      el.style.setProperty("--parallax-x", `${parallaxX.toFixed(1)}px`);
      el.style.setProperty("--parallax-y", `${parallaxY.toFixed(1)}px`);
      el.style.opacity = `${currentOpacity.toFixed(3)}`;
    }
  }

  animationFrameId = requestAnimationFrame(tick);
};

onMounted(() => {
  const el = spotlightRef.value;
  if (!el) return;

  targetX = window.innerWidth * 0.5;
  targetY = window.innerHeight * 0.45;
  currentX = targetX;
  currentY = targetY;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    el.style.setProperty("--spotlight-x", `${targetX}px`);
    el.style.setProperty("--spotlight-y", `${targetY}px`);
    return;
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("mouseleave", onMouseLeave);
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });

  animationFrameId = requestAnimationFrame(tick);
});

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseleave", onMouseLeave);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
});
</script>

<template>
  <div class="about-spotlight" ref="spotlightRef" aria-hidden="true">
    <!-- Primary spotlight beam (Electric cyan to deep blue) -->
    <div class="about-spotlight-beam"></div>

    <!-- Intense center core illumination (White-blue highlight) -->
    <div class="about-spotlight-core"></div>

    <!-- Parallax-shifted ambient diffuse halo -->
    <div class="about-spotlight-diffuse"></div>

    <!-- Color-dodge highlight to brighten grid lines and particles -->
    <div class="about-spotlight-highlight"></div>
  </div>
</template>

<style scoped lang="scss">
.about-spotlight {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.25s ease;
  will-change: opacity;

  /* Primary flashlight beam with soft multi-stop diffusion */
  &-beam {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
    background: radial-gradient(
      circle 290px at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
      rgba(0, 207, 255, 0.38) 0%,
      rgba(0, 207, 255, 0.24) 25%,
      rgba(8, 123, 255, 0.15) 50%,
      rgba(8, 123, 255, 0.05) 75%,
      transparent 100%
    );
  }

  /* Bright white-blue center core */
  &-core {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
    background: radial-gradient(
      circle 95px at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
      rgba(235, 250, 255, 0.5) 0%,
      rgba(0, 207, 255, 0.35) 45%,
      transparent 100%
    );
  }

  /* Parallax-shifted outer diffusion for 3D depth perception */
  &-diffuse {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
    transform: translate(var(--parallax-x, 0px), var(--parallax-y, 0px));
    background: radial-gradient(
      circle 390px at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
      rgba(8, 123, 255, 0.12) 0%,
      rgba(0, 207, 255, 0.05) 45%,
      transparent 100%
    );
  }

  /* Color-dodge layer specifically illuminates and sparkles grid lines & particles */
  &-highlight {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: color-dodge;
    opacity: 0.65;
    background: radial-gradient(
      circle 250px at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
      rgba(0, 207, 255, 0.28) 0%,
      rgba(8, 123, 255, 0.1) 50%,
      transparent 100%
    );
  }
}

/* Reduced motion accessibility */
@media (prefers-reduced-motion: reduce) {
  .about-spotlight {
    &-diffuse {
      transform: none !important;
    }
  }
}
</style>
