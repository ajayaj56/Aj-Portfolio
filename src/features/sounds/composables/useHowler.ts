import { onMounted, onUnmounted, ref, watch } from "vue";
import gsap from "gsap";
import { lerp } from "../../../utils/math";
import { Howler } from "howler";
import { isFeatureEnabled } from "../../../utils/features";
import { tick as contactTick } from "../core/contact";
import { useAgent } from "../../../composables/useAgent";
import { stopSnoreRepetition } from "../core/contact";
import { tick as roomTick } from "../core/room";
import { sounds } from "../definitions/sounds";
import { getSoundsHowl } from "../utils/sounds";
import { musicTracks } from "../definitions/music";

import type { SoundKey } from "../types";

export const howlerUnlocked = ref(false);
export const soundsEnabled = ref(false);

Howler.volume(0);

export const startAudio = () => {
  soundsEnabled.value = true;
  localStorage.setItem("portfolio-soundsEnabled", "true");

  const start = () => {
    howlerUnlocked.value = true;
    for (const sound of Object.keys(sounds) as SoundKey[]) {
      const howl = getSoundsHowl(sound);
      if (howl) howl.load();
    }
    if (!musicTracks.bgm.playing()) {
      musicTracks.bgm.load();
      musicTracks.bgm.play();
    }
  };

  if (Howler.ctx && Howler.ctx.state === "suspended") {
    Howler.ctx.resume().then(start).catch(start);
  } else {
    start();
  }
};

export const useHowler = () => {
  const { isTouch } = useAgent();
  const enabledVolume = ref<number>(0);

  const loadAllSounds = () => {
    for (const sound of Object.keys(sounds) as SoundKey[]) {
      const howl = getSoundsHowl(sound);
      if (howl) {
        howl.load();
      }
    }
  };

  const handleUnlocked = () => {
    if (howlerUnlocked.value) return;
    howlerUnlocked.value = true;

    const storeItem = localStorage.getItem("portfolio-soundsEnabled");
    if (storeItem) {
      soundsEnabled.value = storeItem === "true";
    } else {
      soundsEnabled.value = true;
      localStorage.setItem("portfolio-soundsEnabled", "true");
    }

    loadAllSounds();

    if (soundsEnabled.value && !musicTracks.bgm.playing()) {
      musicTracks.bgm.load();
      musicTracks.bgm.play();
    }
  };

  const unlockAudioContext = () => {
    if (howlerUnlocked.value) return;

    if (Howler.ctx && Howler.ctx.state === "suspended") {
      Howler.ctx
        .resume()
        .then(() => {
          handleUnlocked();
        })
        .catch(() => {});
    } else if (Howler.ctx && Howler.ctx.state === "running") {
      handleUnlocked();
    }
  };

  const gestureEvents = ["click", "pointerdown", "keydown", "touchstart", "touchend", "pointermove", "mousemove"];
  const onUserGesture = () => {
    unlockAudioContext();
    if (soundsEnabled.value && !musicTracks.bgm.playing()) {
      musicTracks.bgm.load();
      musicTracks.bgm.play();
    }
    gestureEvents.forEach((event) => window.removeEventListener(event, onUserGesture));
  };

  const tick = () => {
    if (!howlerUnlocked.value) {
      if (Howler.ctx && Howler.ctx.state === "running") {
        handleUnlocked();
      }
      return;
    } else {
      // Process spatial sounds on desktop
      if (!isTouch.value) {
        contactTick();
        roomTick();
      }

      // Ensure music is playing if sounds are active
      if (soundsEnabled.value && !musicTracks.bgm.playing()) {
        if (!Howler.ctx || Howler.ctx.state === "running") {
          musicTracks.bgm.play();
        }
      }

      const currentVolume = Howler.volume();
      if (currentVolume > 0.99 && enabledVolume.value === 1) {
        return;
      }
      const speed = enabledVolume.value === 1 ? 0.04 : 0.05;
      Howler.volume(lerp(currentVolume, enabledVolume.value, speed));
    }
  };

  const handleVisibilityChange = () => {
    Howler.mute(document.visibilityState === "hidden");
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === "KeyM" && !isTouch.value) {
      soundsEnabled.value = !soundsEnabled.value;
    }
  };

  watch(soundsEnabled, (newVal) => {
    if (!isFeatureEnabled("sounds")) return;
    enabledVolume.value = newVal ? 1 : 0;
    localStorage.setItem("portfolio-soundsEnabled", newVal.toString());
  });

  onMounted(() => {
    if (!isFeatureEnabled("sounds")) return;
    Howler.volume(0);

    if (howlerUnlocked.value) {
      soundsEnabled.value = localStorage.getItem("portfolio-soundsEnabled") === "true";
      if (!isTouch.value) {
        loadAllSounds();
      }
    } else {
      // Listen for genuine user gesture to unlock AudioContext compliant with autoplay policy
      gestureEvents.forEach((event) => {
        window.addEventListener(event, onUserGesture, { passive: true });
      });
    }

    gsap.ticker.add(tick);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyPress);
  });

  onUnmounted(() => {
    if (!isFeatureEnabled("sounds")) return;
    gsap.ticker.remove(tick);
    gestureEvents.forEach((event) => {
      window.removeEventListener(event, onUserGesture);
    });
    window.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("keydown", handleKeyPress);
    stopSnoreRepetition();
  });
};
