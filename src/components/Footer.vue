<script setup lang="ts">
import Social from "./Social.vue";
import Clickable from "./Clickable.vue";
import NotchSection from "./NotchSection.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";
import { lenis } from "../composables/useScroll";
import ArrowRightLong from "./icons/ArrowRightLong.vue";

interface Props {
  withSocial?: boolean;
}

const handleBackToTop = () => {
  if (lenis.value) {
    lenis.value.scrollTo(0);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const { withSocial = true } = defineProps<Props>();
const showAttribution = import.meta.env.VITE_SHOW_ATTRIBUTION !== "false";
</script>

<template>
  <footer class="footer">
    <NotchSection class="footer-notch" />
    <div class="footer-content">
      <div
        class="footer-back-to-top"
        tabindex="0"
        @click="handleBackToTop"
        @keydown.enter="handleBackToTop"
        data-cursor="circle-white"
        data-sound="click"
      >
        <ButtonRound renderAs="div" variant="border" class="children-unclickable" data-hoversound="hover">
          <ArrowRightLong class="footer-back-to-top-icon" />
        </ButtonRound>
      </div>
      <div class="footer-top">
        <Social v-if="withSocial" />
      </div>
      <div class="footer-credits">
        <div v-if="showAttribution" class="footer-credits-built">
          <p>
            {{ t("original-concept-by") }}
          </p>
          <Clickable renderAs="div">
            <button
              type="button"
              class="footer-link children-unclickable"
              @click="handleBackToTop"
              data-cursor="circle-white"
              data-sound="click"
              data-hoversound="hover"
            >
              Ajay Guvva
            </button>
          </Clickable>
        </div>
        <div class="footer-credits-company">
          <p>Creative mind at</p>
          <a
            href="https://www.abhivorn.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="gradient-link"
            data-cursor="circle-white"
            data-hoversound="hover"
          >Abhivorn Technologies Pvt. Ltd.</a>
        </div>
        <p>© {{ new Date().getFullYear() }} <button type="button" class="footer-link-subtle" @click="handleBackToTop" data-cursor="circle-white" data-sound="click" data-hoversound="hover">Ajay Guvva</button></p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background: var(--color-background-300, var(--color-beige-400));
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xl);
    width: 100%;
    max-width: calc(var(--breakpoint-xxxl));
    padding: calc(var(--space-outer) + var(--space-sm)) var(--space-outer);
    position: relative;
  }

  &-back-to-top {
    cursor: pointer;

    @include mixins.mq("md") {
      position: absolute;
      top: calc(var(--space-outer) + var(--space-sm));
      left: 50%;
      transform: translateX(-50%);
    }

    &-icon {
      transform: rotate(-90deg);
    }
  }

  &-top {
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    gap: var(--space-xl);

    @include mixins.mq("md") {
      gap: var(--space-md);
      flex-direction: row;
    }
  }

  &-link {
    font-weight: 700;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  &-link-subtle {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    font-weight: 700;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  &-credits {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    font-size: var(--font-size-sm);
    text-align: center;

    &-built,
    &-company {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--space-xxs);
    }

    .gradient-link {
      font-weight: 700;
      background: linear-gradient(90deg, #2DC0EB, #03366E, #2DC0EB);
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: gradient-flow 3s linear infinite;
      text-decoration: none;
      cursor: pointer;
      transition: filter 0.3s ease, text-shadow 0.3s ease;

      @include mixins.hover {
        filter: brightness(1.2);
        text-shadow: 0 0 20px rgba(45, 192, 235, 0.3), 0 0 40px rgba(45, 192, 235, 0.15);
      }
    }

    @keyframes gradient-flow {
      0% {
        background-position: 0% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gradient-link {
        animation: none;
      }
    }
  }

  &-notch {
    position: absolute;
    top: 0;
    left: 0;
    transform: translateY(-100%);
    color: var(--color-background-300, var(--color-beige-400));
    --icon-color: var(--color-background-300, var(--color-beige-400));
  }
}
</style>
