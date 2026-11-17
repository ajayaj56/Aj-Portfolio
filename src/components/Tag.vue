<script setup lang="ts">
import { computed } from "vue";
import { tagLabels, type TagVariant } from "./tagVariants";

const props = defineProps<{
  variant: TagVariant;
}>();

const label = computed(() => {
  return tagLabels[props.variant] || props.variant;
});

const classes = computed(() => ["tag", `tag-variant-${props.variant}`]);
</script>

<template>
  <div :class="classes">
    <p class="tag-copy">{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
.tag {
  border-radius: var(--radius-md);
  padding: calc(var(--space-xxs) - var(--stroke-md)) calc(var(--space-sm) - var(--stroke-md));
  border: var(--stroke-md) solid transparent;
  display: inline-flex;
  align-items: center;

  &-copy {
    font-size: var(--font-size-xs);
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
  }

  &-variant {
    &-three {
      background-color: #ed9c55;
      color: #492708;
    }

    &-react {
      background-color: #61dafb;
      color: #0f2e36;
    }

    &-websockets {
      background-color: #2674a4;
      color: white;
    }

    &-redis {
      background-color: #ce4036;
      color: white;
    }

    &-html {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-css {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-javascript {
      background-color: #ffdf4f;
      color: #362d03;
    }

    &-node {
      background-color: #237d23;
      color: white;
    }

    &-next {
      background-color: white;
      color: black;
    }

    &-figma {
      background-color: #f24e1e;
      color: white;
    }

    &-wireframing {
      background-color: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
      color: var(--color-text-400);
    }

    &-prototyping {
      background-color: #7c3aed;
      color: white;
    }

    &-user-research {
      background-color: #2563eb;
      color: white;
    }

    &-logo-design {
      background-color: #ea580c;
      color: white;
    }

    &-branding {
      background-color: #9333ea;
      color: white;
    }

    &-typography {
      background-color: #0284c7;
      color: white;
    }

    &-color-theory {
      background-color: #e11d48;
      color: white;
    }

    &-canva {
      background-color: #00c4cc;
      color: white;
    }

    &-photoshop {
      background-color: #001e36;
      border-color: #31a8ff;
      color: #31a8ff;
    }

    &-graphic-design {
      background-color: #db2777;
      color: white;
    }

    &-social-media {
      background-color: #f59e0b;
      color: #1f2937;
    }

    &-excel {
      background-color: #107c41;
      color: white;
    }

    &-data-validation {
      background-color: #0d9488;
      color: white;
    }

    &-data-cleaning {
      background-color: #059669;
      color: white;
    }

    &-quality-checks {
      background-color: #1d4ed8;
      color: white;
    }

    &-gray {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-kubernetes {
      background-color: #326ce5;
      color: white;
    }

    &-postgresql {
      background-color: #2f6c92;
      color: white;
    }

    &-ogl {
      background-color: #0e5495;
      color: white;
    }

    &-glsl {
      background-color: #95630e;
      color: white;
    }
  }
}
</style>
