<script setup lang="ts">
const images = [
  new URL("../assets/catalog-reel/frame01.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame02.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame03.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame04.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame05.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame06.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame07.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame08.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame09.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame10.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame11.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame12.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame13.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame14.png", import.meta.url).href,
  new URL("../assets/catalog-reel/frame15.png", import.meta.url).href,
];

const durations = [
  8.2, 11.4, 7.6,
  10.1, 13.2, 8.9,
  12.3, 7.9, 10.8,
  9.4, 12.7, 8.5,
  11.8, 9.1, 13.6,
];

const delays = [
  -1.2, -6.8, -3.1,
  -8.4, -2.6, -7.3,
  -4.7, -9.1, -1.8,
  -5.5, -10.2, -3.9,
  -7.7, -2.2, -8.9,
];
</script>

<template>
  <aside
    class="catalog-reel"
    aria-hidden="true"
  >
    <div class="reel-grid">
      <div
        v-for="(image, index) in images"
        :key="image"
        class="reel-frame"
        :style="{
          '--duration': `${durations[index]}s`,
          '--delay': `${delays[index]}s`,
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
.catalog-reel {
  position: fixed;

  top: 7rem;
  right: 10rem;

  width: min(30vw, 380px);

  pointer-events: none;
  z-index: 0;
}

.reel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  column-gap: 1.5rem;
  row-gap: 3.5rem;
}

.reel-frame {
  overflow: hidden;
  opacity: 0.2;

  animation:
    reel-fade var(--duration)
    ease-in-out
    var(--delay)
    infinite;
}

.reel-frame img {
  display: block;

  width: 80%;
  aspect-ratio: 1 / 1;

  object-fit: cover;
}

@keyframes reel-fade {
  0% {
    opacity: 0.15;
  }

  22% {
    opacity: 0.9;
  }

  47% {
    opacity: 0.35;
  }

  68% {
    opacity: 1;
  }

  100% {
    opacity: 0.15;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reel-frame {
    animation: none;
    opacity: 0.7;
  }
}

@media (max-width: 900px) {
  .catalog-reel {
    display: none;
  }
}
</style>