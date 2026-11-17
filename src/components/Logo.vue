<script setup lang="ts">
import logoUrl from "../assets/brand/logo-transparent.png";
</script>

<template>
  <img :src="logoUrl" alt="Ajay Guvva Logo" class="logo-image" />
</template>

<style scoped lang="scss">
.logo-image {
  height: 36px;
  width: auto;
  max-width: 160px;
  object-fit: contain;
  display: block;
  transition: filter 0.2s ease-in-out;

  @include mixins.mq("md") {
    height: 42px;
    max-width: 180px;
  }
}

:global(.header-dark) .logo-image {
  filter: brightness(0) invert(1);
}
</style>
