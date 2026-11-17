<script setup lang="ts">
import Link from "../../../components/Link.vue";
import Notch from "../../../components/Notch.vue";
import ArrowRightLong from "../../../components/icons/ArrowRightLong.vue";
import ButtonRound from "../../../components/ButtonRound.vue";
import { t } from "../../../i18n/utils/translate";

import type { ProjectPreview } from "../../../content/types";

const props = defineProps<{
  preview?: ProjectPreview;
}>();
</script>

<template>
  <Link
    v-if="props.preview"
    class="preview-card children-unclickable"
    :to="`/project/${props.preview.slug}`"
    :aria-label="t('switch-to-project', { project: props.preview.title })"
    data-cursor="arrow"
    data-sound="click"
    data-hoversound="hover"
  >
    <div class="preview-card-top">
      <div class="preview-card-image-wrapper">
        <div class="preview-card-image-container">
          <img
            :src="props.preview.thumbnail"
            :alt="`${props.preview.title} - ${props.preview.description}`"
            class="preview-card-image"
            loading="lazy"
          />
        </div>
      </div>
      <div class="preview-card-overlay">
        <div class="preview-card-edge">
          <ButtonRound class="preview-card-button" variant="accent" renderAs="div">
            <ArrowRightLong class="preview-card-button-arrow" />
          </ButtonRound>
        </div>
        <Notch class="preview-card-notch preview-card-notch-left" />
        <Notch class="preview-card-notch preview-card-notch-right" />
      </div>
    </div>
    <div class="preview-card-content">
      <div class="preview-card-copys">
        <h3 class="preview-card-title">{{ props.preview.title }}</h3>
        <p class="preview-card-description">{{ props.preview.description }}</p>
      </div>
    </div>
  </Link>
</template>

<style scoped lang="scss">
.preview-card {
  --hover: 0;
  position: relative;
  border-radius: var(--radius-xl);
  z-index: var(--z-index-layout);
  display: flex;
  flex-direction: column;
  text-decoration: none;
  background-color: var(--color-white-400);
  padding: var(--space-sm);
  overflow: hidden;
  height: 100%;

  /* Default state: subtle shadow and natural position */
  transform: translateY(0) scale(1);
  box-shadow: 0 4px 20px rgba(45, 42, 36, 0.06);
  transition:
    transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, box-shadow;

  /* Premium floating hover animation */
  @include mixins.hover {
    &:hover {
      --hover: 1;
      transform: translateY(-8px) scale(1.03);
      box-shadow: 0 20px 40px rgba(45, 42, 36, 0.12), 0 8px 16px rgba(45, 42, 36, 0.06);

      .preview-card-image {
        transform: scale(1.06);
      }
    }
  }

  /* Accessibility: respect reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    transition: none !important;

    .preview-card-image {
      transform: none !important;
      transition: none !important;
    }
  }

  &-top {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  &-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1);
    transition: transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: transform;

    &-container {
      width: 100%;
      height: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }

    &-wrapper {
      border-radius: var(--radius-lg);
      overflow: hidden;
      background-color: var(--color-beige-500);
      width: 100%;
      aspect-ratio: 16/9;
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-xs) var(--space-xs);
  }

  &-copys {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
  }

  &-title {
    font-size: var(--font-size-title-xs);
    font-weight: 700;
    color: var(--color-text-400);
    line-height: var(--line-height-title);
  }

  &-description {
    font-size: var(--font-size-md);
    color: var(--color-text-300);
    font-weight: 500;
    line-height: var(--line-height-copy);
  }

  &-overlay {
    @include mixins.hover {
      display: none;
    }
  }

  &-notch {
    position: absolute;
    color: var(--color-white-400);
    --icon-color: var(--color-white-400);
    transform: scale(-1) rotate(90deg);
    height: var(--radius-lg);

    &-left {
      bottom: 0;
      right: 50px;
    }

    &-right {
      bottom: 50px;
      right: 0;
    }
  }

  &-edge {
    position: absolute;
    bottom: -1px;
    right: -1px;
    background-color: var(--color-white-400);
    padding-left: 6px;
    padding-top: 6px;
    border-radius: 32px 0 0 0;
    padding-right: 1px;
    padding-bottom: 1px;
  }

  &-button {
    &-arrow {
      transition: transform 0.2s ease-in-out;
      width: 100%;
      transform: rotate(calc(var(--hover) * -45deg));
    }
  }
}
</style>
