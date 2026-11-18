import { onMounted, onUnmounted, type Ref } from "vue";
import { isTouch } from "../utils/observer";

/**
 * Composable that adds a cursor-following radial gradient spotlight effect
 * to a text element. The text appears in its original colour by default
 * and reveals a warm orange gradient only around the cursor position.
 *
 * Uses a stacked-layer technique:
 *   Layer 1 (bottom): the original dark text colour
 *   Layer 2 (top):    orange gradient text, masked by a radial-gradient
 *                     that tracks the mouse, so only the cursor area glows
 *
 * Zero Vue re-renders: pure direct DOM updates driven by requestAnimationFrame.
 */
export function useGradientSpotlight(elementRef: Ref<HTMLElement | null>) {
  let overlayEl: HTMLElement | null = null;
  let rafId: number | null = null;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let opacity = 0;
  let targetOpacity = 0;
  let isRunning = false;

  let boundHandleMouseMove: ((e: MouseEvent) => void) | null = null;
  let boundHandleMouseEnter: ((e: MouseEvent) => void) | null = null;
  let boundHandleMouseLeave: (() => void) | null = null;

  const SPOTLIGHT_RADIUS = 90; // px – visible gradient radius
  const LERP_SPEED = 0.16;
  const OPACITY_LERP = 0.12;

  function createOverlay(el: HTMLElement) {
    overlayEl = document.createElement("span");
    overlayEl.setAttribute("aria-hidden", "true");

    // Copy the text content and structure from the host element
    overlayEl.innerHTML = el.innerHTML;

    // Use CSS classes and inherit for font metrics so it stays 100% responsive
    overlayEl.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      user-select: none;
      z-index: 2;
      font: inherit;
      font-size: inherit;
      font-weight: inherit;
      font-family: inherit;
      letter-spacing: inherit;
      line-height: inherit;
      text-align: inherit;
      white-space: inherit;
      word-break: inherit;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      display: block;
      opacity: 0;
      background: linear-gradient(135deg, #FF6A00 0%, #FF8C00 45%, #FFB347 75%, #FF6A00 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 10px rgba(255, 140, 0, 0.45));
      will-change: opacity, mask-image, -webkit-mask-image;
    `;

    // Ensure parent element is positioned relative for absolute overlay placement
    const pos = window.getComputedStyle(el).position;
    if (pos === "static") {
      el.style.position = "relative";
    }

    el.appendChild(overlayEl);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!elementRef.value) return;
    const rect = elementRef.value.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    targetOpacity = 1;

    if (!isRunning) {
      startLoop();
    }
  }

  function handleMouseEnter(e: MouseEvent) {
    if (!elementRef.value) return;
    const rect = elementRef.value.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    currentX = targetX;
    currentY = targetY;
    targetOpacity = 1;

    if (!isRunning) {
      startLoop();
    }
  }

  function handleMouseLeave() {
    targetOpacity = 0;
  }

  function tick() {
    if (!overlayEl) {
      isRunning = false;
      return;
    }

    // Smooth position interpolation
    currentX += (targetX - currentX) * LERP_SPEED;
    currentY += (targetY - currentY) * LERP_SPEED;

    // Smooth opacity interpolation
    opacity += (targetOpacity - opacity) * OPACITY_LERP;

    // When fully faded out, stop updating to save CPU
    if (opacity < 0.005 && targetOpacity === 0) {
      opacity = 0;
      overlayEl.style.opacity = "0";
      isRunning = false;
      return;
    }

    overlayEl.style.opacity = opacity.toFixed(3);

    const maskValue = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${currentX.toFixed(1)}px ${currentY.toFixed(1)}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)`;
    overlayEl.style.setProperty("-webkit-mask-image", maskValue);
    overlayEl.style.setProperty("mask-image", maskValue);

    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    rafId = requestAnimationFrame(tick);
  }

  onMounted(() => {
    // Touch devices retain original text appearance without mouse interaction
    if (isTouch()) return;

    const el = elementRef.value;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    createOverlay(el);

    boundHandleMouseMove = handleMouseMove;
    boundHandleMouseEnter = handleMouseEnter;
    boundHandleMouseLeave = handleMouseLeave;

    el.addEventListener("mousemove", boundHandleMouseMove, { passive: true });
    el.addEventListener("mouseenter", boundHandleMouseEnter);
    el.addEventListener("mouseleave", boundHandleMouseLeave);
  });

  onUnmounted(() => {
    const el = elementRef.value;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    isRunning = false;

    if (el) {
      if (boundHandleMouseMove) el.removeEventListener("mousemove", boundHandleMouseMove);
      if (boundHandleMouseEnter) el.removeEventListener("mouseenter", boundHandleMouseEnter);
      if (boundHandleMouseLeave) el.removeEventListener("mouseleave", boundHandleMouseLeave);
    }

    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
      overlayEl = null;
    }
  });
}
