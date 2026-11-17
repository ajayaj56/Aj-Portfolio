import { playSound } from "../utils/sounds";
import { sprites } from "../definitions/sprites";
import { sceneWeights } from "../../../animations/scenes";
import { clamp } from "../../../utils/math";
import { projectVisible } from "../../../composables/useRouteObserver";
import { howlerUnlocked, soundsEnabled } from "../composables/useHowler";
import gsap from "gsap";

const SNORE_INTERVAL = 2.0833332538604736 * 2;

let snoreTimeout: gsap.core.Tween | null = null;
let currentId: number | undefined;

const scheduleNextSnore = () => {
  if (snoreTimeout) {
    snoreTimeout.kill();
  }

  snoreTimeout = gsap.delayedCall(SNORE_INTERVAL, () => {
    currentId = playSound("snore");
    scheduleNextSnore();
  });
};

export const tick = () => {
  const inContact = sceneWeights.contact > 0.001 && !projectVisible.value;
  const volume = inContact ? clamp(sceneWeights.contact * 0.5, 0, 1) : 0;
  sprites.contact.howl.volume(volume);

  if (inContact && !snoreTimeout && howlerUnlocked.value && soundsEnabled.value) {
    currentId = playSound("snore");
    scheduleNextSnore();
  } else if (!inContact && snoreTimeout) {
    stopSnoreRepetition();
  }
};

export const stopSnoreRepetition = () => {
  if (snoreTimeout) {
    snoreTimeout.kill();
    snoreTimeout = null;
  }
  if (currentId) {
    sprites.contact.howl.stop(currentId);
    currentId = undefined;
  }
};
