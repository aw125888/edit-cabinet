<script setup lang="ts">
const images = [
  new URL("../assets/film-right/frame01.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame02.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame03.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame04.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame05.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame06.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame07.jpg", import.meta.url).href,
  new URL("../assets/film-right/frame08.jpg", import.meta.url).href,
];
</script>

<template>
  <aside
    class="film-stream"
    aria-hidden="true"
  >
    <div class="film-track">
      <div
        v-for="(image, index) in images"
        :key="`first-${index}`"
        class="film-frame"
        :style="{
          '--fade-delay': `${index * -1.9}s`,
        }"
      >
        <img
          :src="image"
          alt=""
        />
      </div>

      <div
        v-for="(image, index) in images"
        :key="`second-${index}`"
        class="film-frame"
        :style="{
          '--fade-delay': `${index * -1.9}s`,
        }"
      >
        <img
          :src="image"
          alt=""
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.film-stream {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;

  width: clamp(190px, 25vw, 340px);

  overflow: hidden;

  pointer-events: none;
  z-index: 0;
}

.film-track {
  display: flex;
  flex-direction: column;

  gap: 1.5rem;
  padding: 1.5rem 1rem;

  /*
   * Begin halfway through the duplicated stream,
   * then move downward to zero.
   */
  transform: translateY(-50%);
  animation: stream-scroll-down 40s linear infinite;
}

.film-frame {
  width: 72%;

  opacity: 0.8;

  animation: frame-fade 4s ease-in-out infinite;
  animation-delay: var(--fade-delay);
}

/*
 * Stagger the right-side stream too, but use
 * a slightly different pattern from the left.
 */
.film-frame:nth-child(4n + 1) {
  align-self: flex-end;
  transform: translateX(0);
}

.film-frame:nth-child(4n + 2) {
  align-self: flex-start;
  transform: translateX(0.75rem);
}

.film-frame:nth-child(4n + 3) {
  align-self: flex-end;
  transform: translateX(-1.25rem);
}

.film-frame:nth-child(4n + 4) {
  align-self: flex-start;
  transform: translateX(1.5rem);
}

.film-frame:nth-child(3n) {
  width: 64%;
}

.film-frame:nth-child(5n) {
  width: 78%;
}

.film-frame img {
  display: block;

  width: 100%;
  height: auto;

  object-fit: cover;
}

@keyframes stream-scroll-down {
  from {
    transform: translateY(-50%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes frame-fade {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .film-track,
  .film-frame {
    animation: none;
  }

  .film-track {
    transform: none;
  }

  .film-frame {
    opacity: 0.75;
  }
}

@media (max-width: 700px) {
  .film-stream {
    display: none;
  }
}
</style>