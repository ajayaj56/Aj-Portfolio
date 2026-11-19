import gsap from "gsap";
import { Ray, Vector2, Vector3 } from "three";
import { camera } from "../core/camera";
import { threeSizes } from "./sizes";
import { playSound } from "../../features/sounds/utils/sounds";

import type { ClickableBox3 } from "../types";

let hoveringBox: ClickableBox3 | null = null;
let previousHoveringBox: ClickableBox3 | null = null;
const boxesToCheck: ClickableBox3[] = [];
const pointer = new Vector2();
const ndcPointer = new Vector3();
const ray = new Ray();
const target = new Vector3();
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const updatePointer = (clientX: number, clientY: number) => {
  // Convert to normalized device coordinates (-1 to 1)
  pointer.x = (clientX / threeSizes.width) * 2 - 1;
  pointer.y = -(clientY / threeSizes.height) * 2 + 1;
};

const performRaycast = () => {
  if (!boxesToCheck.length) return;

  // Ensure camera's world matrix is current
  camera.instance.updateWorldMatrix(true, false);

  // Get camera world position
  camera.instance.getWorldPosition(ray.origin);

  // Get world-space ray direction from NDC
  ndcPointer.set(pointer.x, pointer.y, 0.5).unproject(camera.instance);
  ray.direction.copy(ndcPointer).sub(ray.origin).normalize();

  hoveringBox = null;

  let closestBox: ClickableBox3 | null = null;
  let closestDistance = Infinity;

  for (const box of boxesToCheck) {
    if (!ray.intersectBox(box, target)) continue;

    const distance = ray.origin.distanceTo(target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBox = box;
    }
  }

  if (closestBox) {
    hoveringBox = closestBox;
  }
};

let lastTouchEndTime = 0;
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;

const handleTouchEnd = (e: TouchEvent) => {
  if (!e.changedTouches || !e.changedTouches.length) return;
  const touch = e.changedTouches[0];
  if (!touch) return;
  const now = Date.now();
  const dt = now - lastTapTime;
  const dx = Math.abs(touch.clientX - lastTapX);
  const dy = Math.abs(touch.clientY - lastTapY);

  const isDoubleTap = dt > 50 && dt < 480 && dx < 35 && dy < 35;
  lastTapTime = now;
  lastTapX = touch.clientX;
  lastTapY = touch.clientY;
  lastTouchEndTime = now;

  updatePointer(touch.clientX, touch.clientY);
  performRaycast();
  if (!hoveringBox || !hoveringBox.onClick) return;
  hoveringBox.onClick({ isDoubleTap, isTouch: true, event: e });
};

const handleClick = (e: MouseEvent) => {
  if (Date.now() - lastTouchEndTime < 500) return;

  updatePointer(e.clientX, e.clientY);
  performRaycast();
  if (!hoveringBox || !hoveringBox.onClick) return;
  hoveringBox.onClick({ isDoubleTap: false, isTouch: false, event: e });
};

const handleMouseMove = (event: MouseEvent) => {
  updatePointer(event.clientX, event.clientY);
};

const tick = () => {
  // Only perform continuous raycast for non-touch devices
  if (!isTouchDevice) {
    performRaycast();

    // Check for hover state changes and play sounds
    if (hoveringBox !== previousHoveringBox) {
      // If we stopped hovering over a box, call onHoverLeave
      if (previousHoveringBox && previousHoveringBox.onHoverLeave) {
        previousHoveringBox.onHoverLeave();
      }
      // If we started hovering over a new box with a hover sound
      if (hoveringBox && hoveringBox.hoverSound && !previousHoveringBox) {
        playSound(hoveringBox.hoverSound as any);
      }
      // If we started hovering over a new box, call onHover
      if (hoveringBox && hoveringBox.onHover) {
        hoveringBox.onHover();
      }
      previousHoveringBox = hoveringBox;
    }
  }
};

const init = () => {
  if (!isTouchDevice) {
    gsap.ticker.add(tick);
  }
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("click", handleClick);
  window.addEventListener("touchend", handleTouchEnd, { passive: true });
};

const destroy = () => {
  if (!isTouchDevice) {
    gsap.ticker.remove(tick);
  }
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("click", handleClick);
  window.removeEventListener("touchend", handleTouchEnd);
};

export const raycast = {
  init,
  destroy,
  boxesToCheck,
  getHoveringBox: () => hoveringBox,
};
