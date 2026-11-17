<script setup lang="ts">
import Logo from "./Logo.vue";
import { computed, ref, watchEffect } from "vue";
import { t } from "../i18n/utils/translate";
import { useHeaderTheme } from "../composables/useHeaderTheme";
import { lenis } from "../composables/useScroll";
import { projectId } from "../composables/useRouteObserver";
import ButtonRound from "./ButtonRound.vue";
import ArrowRight from "./icons/ArrowRight.vue";
import SoundsToggle from "./SoundsToggle.vue";
import { isFeatureEnabled } from "../utils/features";
import { useRouter } from "../composables/useRouter";
import { useFirstRoute } from "../composables/useFirstRoute";

const router = useRouter();
const { isFirstRoute } = useFirstRoute();

const scrolledPastHeroVisible = ref(false);
const { isDarkTheme } = useHeaderTheme();

watchEffect((onInvalidate: (cleanupFn: () => void) => void) => {
  const checkScroll = (scrollPos: number) => {
    scrolledPastHeroVisible.value = scrollPos > 80;
  };

  const handleNativeScroll = () => {
    checkScroll(window.scrollY);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", handleNativeScroll, { passive: true });
    checkScroll(window.scrollY);
  }

  if (lenis.value) {
    const handleLenisScroll = ({ scroll }: { scroll: number }) => {
      checkScroll(scroll);
    };
    lenis.value.on("scroll", handleLenisScroll);

    onInvalidate(() => {
      lenis.value?.off("scroll", handleLenisScroll);
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleNativeScroll);
      }
    });
  } else {
    onInvalidate(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleNativeScroll);
      }
    });
  }
});

const handleBackClick = () => {
  // If it's the first route the user visited, navigate to home
  // Otherwise, go back in browser history
  if (isFirstRoute.value) {
    router.push("/");
  } else {
    router.back();
  }
};

const handleLogoClick = () => {
  if (!lenis.value) return;
  lenis.value.scrollTo(0);
};

const classNames = computed(() => {
  return {
    header: true,
    "header-dark": isDarkTheme.value,
    "header-scrolled": scrolledPastHeroVisible.value,
    [`project-${projectId.value}`]: projectId.value !== null,
  };
});
</script>

<template>
  <header :class="classNames">
    <div class="header-left">
      <ButtonRound
        v-if="projectId !== null"
        variant="accent"
        @click="handleBackClick"
        :aria-label="t('back-to-home')"
        :class="{ 'header-back': true, 'header-back-isProjectPage': projectId !== null }"
        data-cursor="circle-white"
        data-sound="click"
        data-hoversound="hover"
      >
        <ArrowRight class="header-back-icon" />
      </ButtonRound>

      <div
        v-else
        :class="{
          'header-logo': true,
          'header-logo-visible': scrolledPastHeroVisible,
          'children-unclickable': true,
        }"
        @click="handleLogoClick"
        data-sound="click"
        data-hoversound="hover"
        data-cursor="circle-white"
      >
        <Logo class="header-logo-image" />
      </div>
    </div>
    <div class="header-right">
      <SoundsToggle class="header-sounds-toggle" :isDarkTheme="isDarkTheme" v-if="isFeatureEnabled('sounds')" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: fixed;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  left: 50%;
  transform: translateX(-50%);
  width: var(--breakpoint-xxxl);
  padding: 0 var(--space-outer);
  max-width: 100%;
  z-index: var(--z-index-header);
  height: var(--height-header);
  pointer-events: none;

  --scrolled: 0;

  &-scrolled {
    --scrolled: 1;
  }

  &-back {
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    transition-delay: 0.1s;
    pointer-events: auto;

    &-icon {
      width: 100%;
      transform: rotate(180deg);
    }

    &-isProjectPage {
      pointer-events: auto;
      opacity: 1;
    }
  }

  &-left {
    position: absolute;
    left: var(--space-outer);
    top: 50%;
    transform: translateY(-50%);
  }

  &-right {
    position: absolute;
    right: var(--space-outer);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  &-music-toggle {
    display: flex;
  }

  &-dark {
    color: var(--color-white-400);
    --icon-color: var(--color-white-400);
  }

  &-logo {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition:
      opacity 0.3s ease-in-out,
      transform 0.3s ease-in-out;

    &-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    @include mixins.mq("md") {
      gap: var(--space-sm);
    }

    &-image {
      height: 36px;
      width: auto;

      @include mixins.mq("md") {
        height: 42px;
      }
    }
  }
}
</style>
