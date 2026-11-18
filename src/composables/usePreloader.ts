import { ref, onMounted, onUnmounted } from "vue";
import { resources } from "../utils/resources";
import { startAudio } from "../features/sounds/composables/useHowler";
import { animations as avatarAnimations } from "../three/objects/avatar/animations";
import gsap from "gsap";

export const preloaderVisible = ref(true);

export const usePreloader = () => {
  let masterTimeline: gsap.core.Timeline | null = null;
  let readyHandler: (() => void) | null = null;

  onMounted(() => {
    const preloader = document.querySelector(".preloader") as HTMLElement | null;
    const logoWrap = document.querySelector(".preloader-logo-wrap") as HTMLElement | null;
    const colorLogo = document.querySelector(".preloader-logo-color") as HTMLElement | null;

    if (!preloader || !logoWrap || !colorLogo) {
      document.body.classList.remove("is-loading");
      preloaderVisible.value = false;
      startAudio();
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let isResourcesReady = resources.isReady;

    const revealState = { progress: 0 };

    const updateClipPath = () => {
      if (!colorLogo) return;
      const topPercent = (1 - revealState.progress) * 100;
      const clipValue = `inset(${topPercent.toFixed(2)}% 0 0 0)`;
      colorLogo.style.clipPath = clipValue;
      colorLogo.style.setProperty("-webkit-clip-path", clipValue);
    };

    // Set initial state: color logo fully clipped (100% white visible)
    updateClipPath();

    const finishPreloader = () => {
      document.body.classList.remove("is-loading");
      preloader.classList.add("preloader-hidden");
      preloader.style.display = "none";
      preloaderVisible.value = false;
      startAudio();
      avatarAnimations.wave();
    };

    if (prefersReducedMotion) {
      masterTimeline = gsap.timeline({
        onComplete: finishPreloader,
      });

      masterTimeline
        .to(revealState, {
          progress: 1,
          duration: 1.0,
          ease: "power2.inOut",
          onUpdate: updateClipPath,
        })
        .to(preloader, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      return;
    }

    // Standard sequence:
    // 1. Initial State: pure white logo
    // 2. Bottom-to-top colour reveal
    // 3. Brief pause, then cinematic scale towards camera
    // 4. Smooth website reveal: preloader fades out seamlessly uncovering the pre-warmed 3D scene
    masterTimeline = gsap.timeline({
      paused: true,
      onComplete: finishPreloader,
    });

    // Step 2: Smooth bottom-to-top colour reveal (1.6s)
    masterTimeline.to(revealState, {
      progress: 1,
      duration: 1.6,
      ease: "power1.inOut",
      onUpdate: updateClipPath,
    });

    // Check at 85% progress: if 3D resources are still loading, pause briefly until ready
    const holdTime = 1.6 * 0.85;
    masterTimeline.call(
      () => {
        if (!isResourcesReady && masterTimeline) {
          masterTimeline.pause();
        }
      },
      [],
      holdTime
    );

    // Step 3: Brief pause after full reveal
    masterTimeline.to({}, { duration: 0.28 });

    // Step 3: Cinematic zoom towards the camera
    masterTimeline.to(logoWrap, {
      scale: 32,
      opacity: 0,
      duration: 0.85,
      ease: "power3.in",
    });

    // Preloader background fades out as the logo expands past viewport edges
    masterTimeline.to(
      preloader,
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.4"
    );

    // Trigger website reveal and music start right as the preloader fades away
    masterTimeline.add(() => {
      finishPreloader();
    }, "-=0.35");

    // Play animation
    masterTimeline.play();

    // Listen for resource completion
    readyHandler = () => {
      isResourcesReady = true;
      if (masterTimeline && masterTimeline.paused()) {
        masterTimeline.play();
      }
    };

    if (!isResourcesReady) {
      resources.on("ready", readyHandler);
    }
  });

  onUnmounted(() => {
    if (readyHandler) {
      resources.off("ready", readyHandler);
      readyHandler = null;
    }
    if (masterTimeline) {
      masterTimeline.kill();
      masterTimeline = null;
    }
  });
};
