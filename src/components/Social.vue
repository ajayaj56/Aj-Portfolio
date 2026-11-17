<script setup lang="ts">
import Github from "./icons/Github.vue";
import Linkedin from "./icons/Linkedin.vue";
import Instagram from "./icons/Instagram.vue";
import Mail from "./icons/Mail.vue";
import Link from "./Link.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";

import { social } from "../content/social";

const props = defineProps<{
  variant?: "theme" | "background";
}>();

// map icon names to components
const icons = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
} as const;

const getAriaLabel = (name: string) => `${t("go-to")} ${name.charAt(0).toUpperCase() + name.slice(1)}`;
</script>

<template>
  <div class="social">
    <component
      :is="item.url ? Link : 'div'"
      v-for="item in social"
      :key="item.name"
      external
      :href="item.url || undefined"
      :aria-label="getAriaLabel(item.name)"
      :class="['social-link', 'social-link-' + item.name]"
      data-cursor="circle-white"
    >
      <ButtonRound
        renderAs="div"
        :variant="props.variant ?? 'theme'"
        class="children-unclickable"
        data-hoversound="hover"
      >
        <component :is="icons[item.name]" :aria-label="getAriaLabel(item.name)" />
      </ButtonRound>
    </component>
  </div>
</template>

<style scoped lang="scss">
.social {
  display: flex;
  gap: var(--space-md);

  &-link {
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: translateY(-2px);
    }

    // Exact brand colors on hover
    &-mail:hover :deep(.button-wrapper) {
      background-color: #EA4335 !important;
      border-color: #EA4335 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(234, 67, 53, 0.35);
    }

    &-github:hover :deep(.button-wrapper) {
      background-color: #24292e !important;
      border-color: #24292e !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(36, 41, 46, 0.35);
    }

    &-linkedin:hover :deep(.button-wrapper) {
      background-color: #0A66C2 !important;
      border-color: #0A66C2 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(10, 102, 194, 0.35);
    }

    &-instagram:hover :deep(.button-wrapper) {
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
      border-color: transparent !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(220, 39, 67, 0.35);
    }
  }
}
</style>
