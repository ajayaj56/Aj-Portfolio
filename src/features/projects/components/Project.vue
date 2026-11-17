<script setup lang="ts">
import { projectId, projectVisible, recentProjectId } from "../../../composables/useRouteObserver";
import { isTransitioning } from "../../../composables/useProjectTransition";
import { ref, watch } from "vue";
import { projectModules } from "../../../content/projects";
import ProjectContent from "./ProjectContent.vue";
import Footer from "../../../components/Footer.vue";
import Button from "../../../components/Button.vue";
import Link from "../../../components/Link.vue";
import { locale } from "../../../i18n/store";
import { lenis } from "../../../composables/useScroll";

import type { Locale } from "../../../i18n/types";
import type { ProjectContent as ProjectContentType } from "../../../content/types";

const loading = ref(true);
const content = ref<ProjectContentType | null>(null);
const error = ref<Error | null>(null);

const fetchProject = async (project: string | undefined) => {
  loading.value = true;
  error.value = null;

  if (!project) {
    content.value = null;
    loading.value = false;
    return;
  }

  try {
    const loc = (locale.value as Locale) in projectModules ? (locale.value as Locale) : "en";
    const locModules = projectModules[loc] || projectModules.en;

    if (locModules && locModules[project]) {
      const module = await locModules[project].default;
      content.value = module;
      error.value = null;
    } else {
      // Graceful fallback for unknown project ID
      error.value = new Error(`Project "${project}" not found`);
      content.value = null;
    }
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(`Failed to fetch project ${project}`);
    content.value = null;
  } finally {
    loading.value = false;
  }
};

watch(
  [recentProjectId, locale],
  () => {
    if (recentProjectId.value) {
      fetchProject(recentProjectId.value);
    }
  },
  { immediate: true },
);

watch(
  [projectId, isTransitioning, locale],
  () => {
    if (!projectId.value || isTransitioning.value) return;
    lenis.value?.scrollTo(0, { immediate: true });
  },
  { immediate: true },
);
</script>

<template>
  <div
    ref="projectRef"
    :class="[
      'project',
      recentProjectId !== null && `project-${recentProjectId}`,
      isTransitioning && `project-transitioning`,
      projectVisible && `project-visible`,
    ]"
  >
    <div :class="['project-content-wrapper', projectVisible && `project-content-wrapper-visible`]">
      <ProjectContent
        v-if="content && recentProjectId && projectVisible"
        :content="content"
        :projectId="recentProjectId"
      />
      <!-- Fallback when an unknown project ID is entered or requested -->
      <div v-else-if="projectVisible && !loading && !content" class="project-fallback">
        <div class="project-fallback-card">
          <h1 class="project-fallback-title">Project Not Found</h1>
          <p class="project-fallback-description">
            The project you are looking for does not exist or has been moved.
          </p>
          <Link to="/" class="project-fallback-button" data-cursor="arrow">
            <Button variant="accent">Back to Projects</Button>
          </Link>
        </div>
      </div>
      <Footer :class="['project-footer', `project-${recentProjectId}`]"></Footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project {
  min-height: calc(var(--lvh) * 100);
  background-color: var(--color-background-300);
  max-width: calc(var(--lvw) * 100);
  overflow: hidden;

  &-content-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 100%;
    opacity: 0;
    transition: opacity 0.4s ease-out;

    &-visible {
      opacity: 1;
    }
  }

  &-fallback {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--height-header) + 48px) var(--space-outer) 96px;

    &-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-md);
      max-width: 520px;
    }

    &-title {
      font-size: var(--font-size-title-lg);
      color: var(--color-text-400);
      font-weight: 800;
    }

    &-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-400);
      opacity: 0.85;
      line-height: var(--line-height-copy);
    }

    &-button {
      margin-top: var(--space-sm);
    }
  }

  &-footer {
    position: relative;
    margin-top: auto;
    color: var(--color-text-400);
  }

  ::selection {
    background: var(--color-accent-400);
    color: var(--color-accent-text-400);
    text-shadow: none;
  }

  ::-moz-selection {
    background: var(--color-accent-400);
    color: var(--color-accent-text-400);
    text-shadow: none;
  }
}
</style>
