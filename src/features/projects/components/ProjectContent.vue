<script setup lang="ts">
import Layout from "../../../components/Layout.vue";
import ProjectHero from "./ProjectHero.vue";
import ProjectComponent from "./ProjectComponent.vue";
import Link from "../../../components/Link.vue";
import NextProject from "./NextProject.vue";
import TwistBand, { type TwistBandItem } from "./TwistBand.vue";
import BendCarousel, { type BendCarouselItem } from "./BendCarousel.vue";
import ConcaveGlobe, { type ConcaveGlobeItem } from "./ConcaveGlobe.vue";
import Banner from "../../../components/Banner.vue";
import { locale } from "../../../i18n/store";
import { lenis } from "../../../composables/useScroll";
import { previews } from "../../../content/projects/previews";
import { projectShowcases } from "../../../content/projects/showcases";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

import type { ProjectContent, ProjectPreview } from "../../../content/types";

const { content, projectId } = defineProps<{
  content: ProjectContent;
  projectId: string;
}>();

const loadedPreviews = ref<ProjectPreview[] | null>(null);
const activePreviewItem = ref<TwistBandItem | BendCarouselItem | ConcaveGlobeItem | null>(null);
const isFullView = ref(false);

const openFullView = () => {
  isFullView.value = true;
  document.body.style.overflow = "hidden";
  if (lenis.value) lenis.value.stop();
};

const closeFullView = () => {
  isFullView.value = false;
  document.body.style.overflow = "";
  if (lenis.value) lenis.value.start();
};

const showcase = computed(() => {
  return projectShowcases[projectId] || null;
});

const loadPreviews = async () => {
  const module = await previews[locale.value as keyof typeof previews]();
  loadedPreviews.value = module.default;
};

const nextProject = computed(() => {
  const previews = loadedPreviews.value;
  if (!previews) return null;

  const currentIndex = previews.findIndex((p) => p.slug === projectId);
  if (currentIndex === -1) return null;

  const nextIndex = (currentIndex + 1) % previews.length;

  return previews[nextIndex];
});

const handleShowcaseSelect = (item: TwistBandItem | BendCarouselItem | ConcaveGlobeItem) => {
  activePreviewItem.value = item;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (activePreviewItem.value) {
      activePreviewItem.value = null;
    } else if (isFullView.value) {
      closeFullView();
    }
  }
};

watch(locale, loadPreviews);

onMounted(() => {
  loadPreviews();
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  closeFullView();
});
</script>

<template>
  <Layout class="project-content">
    <ProjectHero :content="content" :projectId="projectId" />

    <!-- Project Media / Cover Image Component -->
    <div class="project-content-components">
      <div
        v-for="(component, index) in content.components"
        :key="`${component.type}-${index}`"
        class="grid project-content-grid"
      >
        <ProjectComponent :type="component.type" :props="component.props" :index="index" />
      </div>
    </div>

    <!-- 3D Ribbon Showcase for Website, Logo, and Posters Pages -->
    <div v-if="showcase" class="project-showcase-section">
      <div class="project-showcase-header">
        <Banner class="project-showcase-banner" :copy="showcase.banner" size="sm" animated />
        <h2 class="project-showcase-title">{{ showcase.title }}</h2>
        <p class="project-showcase-subtitle">{{ showcase.subtitle }}</p>

        <!-- Explore Full View Button in Header -->
        <button
          type="button"
          class="project-showcase-explore-btn"
          @click="openFullView"
          data-cursor="circle-white"
          data-sound="click"
          data-hoversound="hover"
        >
          <span class="explore-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </span>
          <span>Explore Full View</span>
        </button>
      </div>

      <div class="project-showcase-wrapper" :class="{ 'is-fullview': isFullView }">
        <!-- Full Desktop View Top Navigation Bar -->
        <div v-if="isFullView" class="showcase-fullview-bar">
          <button
            type="button"
            class="showcase-fullview-back-btn"
            @click="closeFullView"
            data-cursor="circle-white"
            data-sound="click"
            data-hoversound="hover"
          >
            <span class="back-arrow">←</span>
            <span>Back</span>
          </button>

          <div class="showcase-fullview-info">
            <span class="showcase-fullview-badge">{{ showcase.banner || '3D Experience' }}</span>
            <span class="showcase-fullview-title">{{ showcase.title }}</span>
          </div>

          <div class="showcase-fullview-hint">
            <span class="hint-dot"></span>
            <span>Scroll or drag to explore • ESC to exit</span>
          </div>
        </div>

        <!-- Floating Full View Pill (when in normal view) -->
        <button
          v-else
          type="button"
          class="showcase-wrapper-expand-pill"
          @click="openFullView"
          data-cursor="circle-white"
          data-sound="click"
          data-hoversound="hover"
          title="Explore Full View"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span>Full View</span>
        </button>

        <!-- 3D Concave Globe Sphere specifically for UI/UX Design Page -->
        <ConcaveGlobe
          v-if="projectId === 'ui-ux-design'"
          :items="showcase.items"
          @select="handleShowcaseSelect"
        />

        <!-- 3D Curved Bend Carousel specifically for Posters Page with exactly 10 assets -->
        <BendCarousel
          v-else-if="projectId === 'poster-graphic-design'"
          :items="showcase.items"
          @select="handleShowcaseSelect"
        />

        <!-- 3D Twist Band for Website and Logo Showcase Pages -->
        <TwistBand
          v-else
          :projects="showcase.items"
          :hideLabels="showcase.hideLabels"
          :enableRouting="false"
          @select="handleShowcaseSelect"
        />
      </div>
    </div>

    <!-- Next Project Link -->
    <div class="grid project-content-next-project-grid">
      <Link
        v-if="nextProject"
        :to="`/project/${nextProject.slug}`"
        replace
        class="project-content-next-project"
        data-cursor="arrow"
        data-sound="click"
      >
        <NextProject :project="nextProject" />
      </Link>
    </div>

    <!-- Interactive Lightbox Preview Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="activePreviewItem"
          class="showcase-modal-backdrop"
          @click="activePreviewItem = null"
        >
          <div class="showcase-modal-dialog" @click.stop>
            <button
              type="button"
              class="showcase-modal-close"
              @click="activePreviewItem = null"
              aria-label="Close"
            >
              ✕
            </button>
            <div class="showcase-modal-image-wrap">
              <img
                :src="activePreviewItem.thumbnail"
                :alt="activePreviewItem.title"
                class="showcase-modal-image"
              />
            </div>
            <div class="showcase-modal-info">
              <h3 class="showcase-modal-title">{{ activePreviewItem.title }}</h3>
              <p class="showcase-modal-desc">{{ activePreviewItem.description }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </Layout>
</template>

<style scoped lang="scss">
.project-content {
  color: var(--color-text-400);

  &-grid {
    row-gap: var(--space-sm);

    @include mixins.mq("md") {
      row-gap: var(--space-xxl);
    }
  }

  &-next-project {
    grid-column: 1 / 13;

    @include mixins.mq("md") {
      grid-column: 3 / 11;
    }

    @include mixins.mq("lg") {
      grid-column: 4 / 10;
    }

    @include mixins.mq("xl") {
      grid-column: 5 / 9;
    }

    &-grid {
      padding: 0 var(--space-outer);
      padding-top: var(--space-xl);
      padding-bottom: var(--space-xxxl);
    }
  }

  &-components {
    padding: 20px var(--space-outer);
    background-color: var(--color-background-400);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xxl);
    gap: var(--space-xxl);

    @include mixins.mq("md") {
      padding: 64px var(--space-outer);
    }
  }
}

.project-showcase {
  &-section {
    width: 100%;
    margin-top: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 5;

    @include mixins.mq("md") {
      margin-top: 72px;
    }
  }

  &-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 var(--space-outer);
    margin-bottom: var(--space-md);
  }

  &-banner {
    margin-bottom: 12px;
  }

  &-title {
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--color-text-400);
    margin-bottom: 8px;
  }

  &-subtitle {
    font-size: clamp(14px, 1.6vw, 17px);
    color: var(--color-text-300);
    max-width: 620px;
  }

  &-explore-btn {
    margin-top: 18px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--color-text-400);
    color: #ffffff;
    border: none;
    border-radius: 999px;
    padding: 12px 26px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 8px 24px rgba(45, 42, 36, 0.14);

    .explore-btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s ease;
    }

    &:hover {
      background: var(--color-orange-400);
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 12px 30px rgba(255, 132, 0, 0.32);

      .explore-btn-icon {
        transform: scale(1.15);
      }
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }
  }

  &-wrapper {
    width: 100%;
    position: relative;
    background-color: #ffffff;
    border-radius: var(--radius-xxl);
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);

    &.is-fullview {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999998;
      border-radius: 0 !important;
      margin: 0 !important;
      background-color: #ffffff;
      box-shadow: none !important;

      :deep(.twist-band-wrapper) {
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: none !important;
        border-radius: 0 !important;
      }

      :deep(.bend-carousel-container) {
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      :deep(.globe-showcase-container) {
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    }
  }
}

.showcase-wrapper-expand-pill {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 25;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--color-text-400);
  border: 1px solid rgba(45, 42, 36, 0.12);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  &:hover {
    background: #ffffff;
    border-color: var(--color-orange-400);
    color: var(--color-orange-400);
    transform: scale(1.04);
    box-shadow: 0 6px 20px rgba(255, 132, 0, 0.2);
  }
}

.showcase-fullview-bar {
  position: absolute;
  top: 24px;
  left: 28px;
  right: 28px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;

  @include mixins.mq("md", "max") {
    top: 16px;
    left: 16px;
    right: 16px;
  }
}

.showcase-fullview-back-btn {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  color: var(--color-text-400);
  border: 1px solid rgba(45, 42, 36, 0.14);
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.12);

  .back-arrow {
    font-size: 16px;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: var(--color-orange-400);
    color: #ffffff;
    border-color: var(--color-orange-400);
    transform: translateX(-3px);
    box-shadow: 0 12px 32px rgba(255, 132, 0, 0.35);

    .back-arrow {
      transform: translateX(-3px);
    }
  }
}

.showcase-fullview-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(45, 42, 36, 0.08);
  padding: 8px 18px;
  border-radius: 999px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @include mixins.mq("md", "max") {
    display: none;
  }

  .showcase-fullview-badge {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-orange-400);
  }

  .showcase-fullview-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-400);
  }
}

.showcase-fullview-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(45, 42, 36, 0.08);
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-300);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @include mixins.mq("md", "max") {
    display: none;
  }

  .hint-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-orange-400);
    box-shadow: 0 0 8px var(--color-orange-400);
  }
}

/* Modal Lightbox */
.showcase-modal {
  &-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(8, 12, 22, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    cursor: zoom-out;
  }

  &-dialog {
    background: #18191c;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    max-width: 900px;
    max-height: 90vh;
    width: 100%;
    overflow: hidden;
    position: relative;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    cursor: default;
  }

  &-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #ffffff;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    z-index: 10;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &-image-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f1012;
    padding: 16px;
    overflow: hidden;
    min-height: 280px;
    max-height: 82vh;
  }

  &-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 10px;
  }

  &-info {
    padding: 18px 24px;
    background: #18191c;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  }

  &-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.65);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
