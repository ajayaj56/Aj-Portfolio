<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { transitions } from "../../../animations";
import { t } from "../../../i18n/utils/translate";
import ButtonRound from "../../../components/ButtonRound.vue";
import Link from "../../../components/Link.vue";
import Github from "../../../components/icons/Github.vue";
import Mail from "../../../components/icons/Mail.vue";
import Instagram from "../../../components/icons/Instagram.vue";
import Linkedin from "../../../components/icons/Linkedin.vue";
import { social } from "../../../content/social";
import { useGradientSpotlight } from "../../../composables/useGradientSpotlight";

const contactElement = ref<HTMLElement | null>(null);
const contactTitleLeftRef = ref<HTMLElement | null>(null);
const contactTitleRightRef = ref<HTMLElement | null>(null);

useGradientSpotlight(contactTitleLeftRef);
useGradientSpotlight(contactTitleRightRef);

const githubItem = social.find((s) => s.name === "github");
const mailItem = social.find((s) => s.name === "mail");
const instagramItem = social.find((s) => s.name === "instagram");
const linkedinItem = social.find((s) => s.name === "linkedin");

onMounted(() => {
  if (contactElement.value) {
    transitions.contact.setup(contactElement.value);
  }
});

onUnmounted(() => {
  transitions.contact.destroy();
});
</script>

<template>
  <div class="contact" ref="contactElement">
    <div class="contact-inner">
      <!-- Left side: "Let's work" + GitHub & Mail icons -->
      <div class="contact-side contact-side-left">
        <h2 class="contact-title contact-title-left" ref="contactTitleLeftRef">{{ t("lets-work") }}</h2>
        <div class="contact-social-col contact-social-col-left">
          <component
            :is="githubItem?.url ? Link : 'div'"
            v-if="githubItem"
            :href="githubItem.url || undefined"
            external
            :aria-label="`${t('go-to')} GitHub`"
            class="social-link social-link-github"
            data-cursor="circle-white"
          >
            <ButtonRound renderAs="div" variant="background" class="children-unclickable" data-hoversound="hover">
              <Github />
            </ButtonRound>
          </component>
          <component
            :is="mailItem?.url ? Link : 'div'"
            v-if="mailItem"
            :href="mailItem.url || undefined"
            external
            :aria-label="`${t('go-to')} Mail`"
            class="social-link social-link-mail"
            data-cursor="circle-white"
          >
            <ButtonRound renderAs="div" variant="background" class="children-unclickable" data-hoversound="hover">
              <Mail />
            </ButtonRound>
          </component>
        </div>
      </div>

      <!-- Center gap to clear space for the central 3D character -->
      <div class="contact-center-spacer"></div>

      <!-- Right side: "together!" + Instagram & LinkedIn icons -->
      <div class="contact-side contact-side-right">
        <h2 class="contact-title contact-title-right" ref="contactTitleRightRef">{{ t("together") }}</h2>
        <div class="contact-social-col contact-social-col-right">
          <component
            :is="instagramItem?.url ? Link : 'div'"
            v-if="instagramItem"
            :href="instagramItem.url || undefined"
            external
            :aria-label="`${t('go-to')} Instagram`"
            class="social-link social-link-instagram"
            data-cursor="circle-white"
          >
            <ButtonRound renderAs="div" variant="background" class="children-unclickable" data-hoversound="hover">
              <Instagram />
            </ButtonRound>
          </component>
          <component
            :is="linkedinItem?.url ? Link : 'div'"
            v-if="linkedinItem"
            :href="linkedinItem.url || undefined"
            external
            :aria-label="`${t('go-to')} LinkedIn`"
            class="social-link social-link-linkedin"
            data-cursor="circle-white"
          >
            <ButtonRound renderAs="div" variant="background" class="children-unclickable" data-hoversound="hover">
              <Linkedin />
            </ButtonRound>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.contact {
  width: 100%;
  max-width: calc(var(--svw) * 100);
  overflow-x: clip;
  min-height: calc(var(--lvh) * 100);
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: max(16vh, 120px);
  padding-left: clamp(10px, 3vw, var(--space-outer));
  padding-right: clamp(10px, 3vw, var(--space-outer));
  pointer-events: none; /* Let Three.js canvas receive mouse movements underneath */

  @include mixins.mq("md") {
    padding-top: max(18vh, 140px);
    padding-left: var(--space-outer);
    padding-right: var(--space-outer);
  }

  @include mixins.landscape {
    padding-top: clamp(100px, 19vh, 160px);
  }

  &-inner {
    width: 100%;
    max-width: 1240px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    z-index: 10;
  }

  &-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    pointer-events: auto;

    &-left {
      align-items: flex-end;
      text-align: right;
    }

    &-right {
      align-items: flex-start;
      text-align: left;
    }
  }

  &-center-spacer {
    /* Responsive spacer cleared for the 3D character in center */
    width: clamp(60px, 18vw, 110px);
    flex-shrink: 0;

    @include mixins.mq("md") {
      width: clamp(160px, 20vw, 260px);
    }

    @include mixins.landscape {
      width: clamp(180px, 22vw, 280px);
    }
  }

  &-title {
    font-weight: 900;
    letter-spacing: 0.02em;
    line-height: 1.05;
    font-size: clamp(20px, 5.2vw, 32px);
    color: var(--color-text-400);
    white-space: nowrap;
    margin-bottom: clamp(18px, 3vh, 36px);

    @include mixins.mq("sm") {
      font-size: clamp(28px, 5.4vw, 54px);
    }

    @include mixins.mq("md") {
      font-size: clamp(40px, 5.8vw, 76px);
      margin-bottom: clamp(24px, 4vh, 48px);
    }

    @include mixins.mq("xl") {
      font-size: var(--font-size-title-xl);
    }
  }

  &-social-col {
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 2vh, 18px);

    &-left {
      align-items: flex-end;
      padding-right: 8px;
    }

    &-right {
      align-items: flex-start;
      padding-left: 8px;
    }
  }
}

.social-link {
  display: inline-flex;
  transition:
    transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 14px rgba(45, 42, 36, 0.08);
  border-radius: 50%;

  :deep(.button-round) {
    border: 1.5px solid rgba(45, 42, 36, 0.15);
    transition:
      background 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      border-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
      color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &:hover {
    transform: translateY(-3px) scale(1.08);
  }

  /* GitHub Hover - Official Dark */
  &-github:hover {
    box-shadow: 0 8px 24px rgba(24, 23, 23, 0.45);

    :deep(.button-round) {
      background: #181717 !important;
      border-color: #181717 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
    }
  }

  /* Mail Hover - Official Gmail Red */
  &-mail:hover {
    box-shadow: 0 8px 24px rgba(234, 67, 53, 0.45);

    :deep(.button-round) {
      background: #ea4335 !important;
      border-color: #ea4335 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
    }
  }

  /* Instagram Hover - Official Multi-Color Gradient */
  &-instagram:hover {
    box-shadow: 0 8px 24px rgba(220, 39, 67, 0.45);

    :deep(.button-round) {
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) !important;
      border-color: #dc2743 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
    }
  }

  /* LinkedIn Hover - Official LinkedIn Blue */
  &-linkedin:hover {
    box-shadow: 0 8px 24px rgba(10, 102, 194, 0.45);

    :deep(.button-round) {
      background: #0a66c2 !important;
      border-color: #0a66c2 !important;
      color: #ffffff !important;
      --icon-color: #ffffff !important;
    }
  }
}
</style>
