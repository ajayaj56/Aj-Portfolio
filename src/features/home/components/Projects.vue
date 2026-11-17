<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { previews } from "../../../content/projects/previews";
import { locale } from "../../../i18n/store";
import PreviewCard from "../../projects/components/PreviewCard.vue";
import NotchSection from "../../../components/NotchSection.vue";
import Banner from "../../../components/Banner.vue";
import { t } from "../../../i18n/utils/translate";

import type { ProjectPreview } from "../../../content/types";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Register smooth, premium easing [0.22, 1, 0.36, 1]
try {
  CustomEase.create("projectsEase", "0.22, 1, 0.36, 1");
} catch {
  // Graceful fallback if already registered
}

const loadedPreviews = ref<ProjectPreview[] | null>(null);
const cardElements = ref<HTMLElement[]>([]);
let triggers: ScrollTrigger[] = [];

const emit = defineEmits<{
  (e: "loaded", previews: ProjectPreview[]): void;
}>();

const setCardRef = (el: any, index: number) => {
  if (el) {
    cardElements.value[index] = el;
  }
};

// 1. Website Development: Slide in from the left
// 2. UI/UX Design: Slide down from the top
// 3. Logo & Brand Identity: Slide in from the right
// 4. Poster & Graphic Design: Slide diagonally from the bottom-left corner
// 5. Excel Data Quality Control: Slide diagonally from the bottom-right corner
const directions = [
  { x: -90, y: 0 },
  { x: 0, y: -90 },
  { x: 90, y: 0 },
  { x: -80, y: 80 },
  { x: 80, y: 80 },
];

const cleanupAnimations = () => {
  triggers.forEach((trigger) => trigger.kill());
  triggers = [];
};

const setupCardAnimations = () => {
  cleanupAnimations();
  if (!cardElements.value.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    cardElements.value.forEach((el) => {
      if (el) {
        gsap.set(el, { opacity: 1, scale: 1, x: 0, y: 0 });
      }
    });
    return;
  }

  const width = window.innerWidth;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 992;
  const multiplier = isMobile ? 0.65 : 1;

  cardElements.value.forEach((cardEl, index) => {
    if (!cardEl) return;
    const baseDir = directions[index] || { x: 0, y: 60 };
    const initialX = baseDir.x * multiplier;
    const initialY = baseDir.y * multiplier;

    // Viewport-aware stagger:
    // Desktop: ripple sequence (0, 0.16s, 0.32s, 0.48s, 0.64s)
    // Tablet: 2-column stagger (0, 0.16s)
    // Mobile: triggers directly when card enters view
    let staggerDelay = 0;
    if (isMobile) {
      staggerDelay = 0;
    } else if (isTablet) {
      staggerDelay = (index % 2) * 0.16;
    } else {
      staggerDelay = index * 0.16;
    }

    // Set initial off-screen state
    gsap.set(cardEl, {
      opacity: 0,
      scale: 0.94,
      x: initialX,
      y: initialY,
    });

    const animateIn = () => {
      gsap.to(cardEl, {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.95,
        delay: staggerDelay,
        ease: "projectsEase",
        overwrite: "auto",
      });
    };

    const resetOut = () => {
      gsap.to(cardEl, {
        opacity: 0,
        scale: 0.94,
        x: initialX,
        y: initialY,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: cardEl,
      start: "top 88%",
      end: "bottom 8%",
      onEnter: () => animateIn(),
      onEnterBack: () => animateIn(),
      onLeave: () => resetOut(),
      onLeaveBack: () => resetOut(),
    });

    triggers.push(trigger);

    // If card is already inside viewport on page load/refresh, trigger entrance immediately
    if (ScrollTrigger.isInViewport(cardEl, 0.1)) {
      animateIn();
    }
  });

  ScrollTrigger.refresh();
};

const loadPreviews = async () => {
  if (!locale.value) return;
  const func = previews[locale.value as keyof typeof previews];
  if (!func) return;
  const module = await func();
  loadedPreviews.value = module.default;
  emit("loaded", module.default);

  await nextTick();
  setupCardAnimations();
};

watch(locale, loadPreviews);

onMounted(loadPreviews);

onUnmounted(() => {
  cleanupAnimations();
});
</script>

<template>
  <div class="projects">
    <NotchSection class="projects-notch-start" />
    <NotchSection class="projects-notch-end" />
    <div class="grid">
      <div class="projects-title">
        <Banner class="projects-title-banner" :copy="t('selected')" size="sm" animated />
        <h2 class="projects-title-copy">{{ t("projects") }}</h2>
      </div>
    </div>
    <div class="grid">
      <div class="projects-cards">
        <div
          v-for="(preview, index) in loadedPreviews"
          :key="preview.title"
          class="projects-card-wrapper"
          :ref="(el) => setCardRef(el, index)"
        >
          <PreviewCard :preview="preview" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.projects {
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  gap: var(--space-xl);
  padding-left: var(--space-outer);
  padding-right: var(--space-outer);
  background-color: var(--color-beige-400);
  min-height: calc(var(--lvh) * 100 + var(--radius-xxl));
  padding-top: 96px;
  padding-bottom: 96px;

  @include mixins.mq("md") {
    padding-top: 144px;
    padding-bottom: 144px;
    gap: var(--space-xxl);
  }

  @include mixins.mq("lg") {
    gap: var(--space-xxxl);
  }

  &-title {
    position: relative;
    padding-top: var(--space-md);
    grid-column: 1 / 13;

    @include mixins.mq("md") {
      grid-column: 1 / 13;
      max-width: 740px;
      margin: 0 auto;
      width: 100%;
    }

    @include mixins.mq("lg") {
      grid-column: 1 / 13;
      max-width: 1040px;
      margin: 0 auto;
      width: 100%;
    }

    &-copy {
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: var(--font-size-title-md);

      @include mixins.mq("sm") {
        font-size: var(--font-size-title-lg);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-xl);
      }
    }

    &-banner {
      position: absolute;
      top: 0;
      left: -8px;
      transform: translate(0, -20%) rotate(-4deg);

      @include mixins.mq("lg") {
        left: -16px;
        transform: translate(0, -20%) rotate(-6deg);
      }
    }
  }

  &-notch {
    &-start {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      color: var(--color-beige-400);
      --icon-color: var(--color-beige-400);
    }

    &-end {
      position: absolute;
      bottom: 0;
      left: 0;
      color: var(--color-beige-600);
      --icon-color: var(--color-beige-600);
    }
  }

  &-card-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    will-change: transform, opacity;

    @media (prefers-reduced-motion: reduce) {
      transform: none !important;
      opacity: 1 !important;
    }
  }

  &-cards {
    max-width: 440px;
    margin: 0 auto;
    width: 100%;
    flex: 1;
    grid-column: 1 / span 12;
    display: grid;
    gap: var(--space-md);
    grid-template-columns: 1fr;

    @include mixins.mq("md") {
      max-width: 740px;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-lg);

      > :nth-child(5) {
        grid-column: 1 / span 2;
        max-width: 360px;
        justify-self: center;
        width: 100%;
      }
    }

    @include mixins.mq("lg") {
      max-width: 1040px;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--space-lg);

      > :nth-child(1) {
        grid-column: 1 / span 2;
      }
      > :nth-child(2) {
        grid-column: 3 / span 2;
      }
      > :nth-child(3) {
        grid-column: 5 / span 2;
      }
      > :nth-child(4) {
        grid-column: 2 / span 2;
      }
      > :nth-child(5) {
        grid-column: 4 / span 2;
        max-width: none;
        justify-self: stretch;
      }
    }

    @include mixins.mq("xl") {
      max-width: 1080px;
      gap: var(--space-xl);
    }
  }
}
</style>
