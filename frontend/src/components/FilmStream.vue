<script setup lang="ts">
const images = [
  new URL("../assets/film/frame01.jpg", import.meta.url).href,
  new URL("../assets/film/frame02.jpg", import.meta.url).href,
  new URL("../assets/film/frame03.jpg", import.meta.url).href,
  new URL("../assets/film/frame04.jpg", import.meta.url).href,
  new URL("../assets/film/frame05.jpg", import.meta.url).href,
  new URL("../assets/film/frame06.jpg", import.meta.url).href,
  new URL("../assets/film/frame07.jpg", import.meta.url).href,
  new URL("../assets/film/frame08.jpg", import.meta.url).href,
];
</script>

<template>
  <aside
    class="film-stream"
    aria-hidden="true"
  >
    <div class="film-track">
      <!-- First set -->
      <div
        v-for="(image, index) in images"
        :key="`first-${index}`"
        class="film-frame"
        :style="{
          '--fade-delay': `${index * -1.7}s`,
        }"
      >
        <img
          :src="image"
          alt=""
        />
      </div>

      <!--
        Duplicate set so the stream can loop continuously
        without suddenly becoming empty.
      -->
      <div
        v-for="(image, index) in images"
        :key="`second-${index}`"
        class="film-frame"
        :style="{
          '--fade-delay': `${index * -1.7}s`,
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
  bottom: 0;
  left: 0;

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

  animation: stream-scroll 40s linear infinite;
}

/*
 * Individual image frame.
 */
.film-frame {
  width: 72%;

  opacity: 0.8;

  animation: frame-fade 4s ease-in-out infinite;
  animation-delay: var(--fade-delay);
}

/*
 * Left image.
 */
.film-frame:nth-child(4n + 1) {
  align-self: flex-start;
  transform: translateX(0);
}

/*
 * Right/lower image.
 */
.film-frame:nth-child(4n + 2) {
  align-self: flex-end;
  transform: translateX(-0.25rem);
}

/*
 * Back toward the left, but not exactly where
 * the first image was.
 */
.film-frame:nth-child(4n + 3) {
  align-self: flex-start;
  transform: translateX(1.25rem);
}

/*
 * Another right-side variation.
 */
.film-frame:nth-child(4n + 4) {
  align-self: flex-end;
  transform: translateX(-1.5rem);
}

/*
 * Slight size variation keeps the stream from
 * looking like a rigid grid.
 */
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

/*
 * Move the entire collection upward.
 * Because the images are duplicated, it loops.
 */
@keyframes stream-scroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
}

/*
 * Each image gently becomes more/less prominent.
 * It never completely disappears.
 */
@keyframes frame-fade {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}

/*
 * Accessibility:
 * if the user asks their operating system to
 * reduce animation, leave the images stationary.
 */
@media (prefers-reduced-motion: reduce) {
  .film-track,
  .film-frame {
    animation: none;
  }

  .film-frame {
    opacity: 0.75;
  }
}

/*
 * Don't crowd the interface on small screens.
 */
@media (max-width: 700px) {
  .film-stream {
    display: none;
  }
}
</style>