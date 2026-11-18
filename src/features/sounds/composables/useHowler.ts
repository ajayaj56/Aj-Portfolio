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
import { musicTracks, BASE_VOLUMES } from "../definitions/music";

import type { SoundKey } from "../types";

const savedSounds = typeof localStorage !== "undefined" ? localStorage.getItem("portfolio-soundsEnabled") : null;
export const howlerUnlocked = ref(false);
export const soundsEnabled = ref(savedSounds !== "false");

Howler.volume(1);

export const startAudio = () => {
  soundsEnabled.value = true;
  localStorage.setItem("portfolio-soundsEnabled", "true");
  Howler.volume(1);
  musicTracks.bgm.volume(BASE_VOLUMES.bgm);

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
  const enabledVolume = ref<number>(soundsEnabled.value ? 1 : 0);

  const loadAllSounds = () => {
    for (const sound of Object.keys(sounds) as SoundKey[]) {
      const howl = getSoundsHowl(sound);
      if (howl) {
        howl.load();
      }
    }
  };

  const handleUnlocked = () => {
    howlerUnlocked.value = true;

    const storeItem = localStorage.getItem("portfolio-soundsEnabled");
    if (storeItem) {
      soundsEnabled.value = storeItem === "true";
    } else {
      soundsEnabled.value = true;
      localStorage.setItem("portfolio-soundsEnabled", "true");
    }

    loadAllSounds();

    if (soundsEnabled.value) {
      Howler.volume(1);
      musicTracks.bgm.volume(BASE_VOLUMES.bgm);
      if (!musicTracks.bgm.playing()) {
        musicTracks.bgm.load();
        musicTracks.bgm.play();
      }
    }
  };

  const gestureEvents = [
    "click",
    "pointerdown",
    "mousedown",
    "touchstart",
    "touchend",
    "keydown",
    "wheel",
  ];

  const onUserGesture = () => {
    const unlock = () => {
      howlerUnlocked.value = true;
      if (soundsEnabled.value) {
        Howler.volume(1);
        musicTracks.bgm.volume(BASE_VOLUMES.bgm);
        if (!musicTracks.bgm.playing()) {
          musicTracks.bgm.load();
          musicTracks.bgm.play();
        }
      }
      if (Howler.ctx && Howler.ctx.state === "running" && musicTracks.bgm.playing()) {
        gestureEvents.forEach((event) => window.removeEventListener(event, onUserGesture));
      }
    };

    if (Howler.ctx && Howler.ctx.state === "suspended") {
      Howler.ctx.resume().then(unlock).catch(unlock);
    } else {
      unlock();
    }
  };

  const tick = () => {
    if (!howlerUnlocked.value) {
      if (Howler.ctx && Howler.ctx.state === "running") {
        handleUnlocked();
      }
    }

    if (howlerUnlocked.value && !isTouch.value) {
      contactTick();
      roomTick();
    }

    if (soundsEnabled.value) {
      if (!musicTracks.bgm.playing() && (!Howler.ctx || Howler.ctx.state === "running")) {
        musicTracks.bgm.play();
      }
      const currentVolume = Howler.volume();
      if (currentVolume < 0.99) {
        Howler.volume(lerp(currentVolume, 1, 0.05));
      }
    } else {
      const currentVolume = Howler.volume();
      if (currentVolume > 0.01) {
        Howler.volume(lerp(currentVolume, 0, 0.05));
      } else {
        Howler.volume(0);
      }
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

  watch(
    soundsEnabled,
    (newVal) => {
      if (!isFeatureEnabled("sounds")) return;
      enabledVolume.value = newVal ? 1 : 0;
      if (newVal) {
        Howler.volume(1);
        musicTracks.bgm.volume(BASE_VOLUMES.bgm);
        if (!musicTracks.bgm.playing()) {
          musicTracks.bgm.load();
          musicTracks.bgm.play();
        }
      } else {
        Howler.volume(0);
      }
      localStorage.setItem("portfolio-soundsEnabled", newVal.toString());
    },
    { immediate: true }
  );

  onMounted(() => {
    if (!isFeatureEnabled("sounds")) return;

    if (soundsEnabled.value) {
      enabledVolume.value = 1;
    }

    gestureEvents.forEach((event) => {
      window.addEventListener(event, onUserGesture, { passive: true });
    });

    if (howlerUnlocked.value && !isTouch.value) {
      loadAllSounds();
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
