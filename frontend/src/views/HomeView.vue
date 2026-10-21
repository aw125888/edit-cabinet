<script setup lang="ts">
import FilmStream from "../components/FilmStream.vue";
import RightFilmStream from "../components/RightFilmStream.vue";

defineEmits<{
  catalog: [];
  search: [];
}>();
</script>

<template>
  <FilmStream />
  <RightFilmStream/>

  <main class="home-page">
    <section class="home-panel">
      <h1 class="home-logo">
        Edit Cabinet
      </h1>

      <div class="home-actions">
        <button
          type="button"
          @click="$emit('catalog')"
        >
          Catalog
        </button>

        <button
          type="button"
          @click="$emit('search')"
        >
          Search
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  position: relative;
  z-index: 1;

  width: 100%;
  min-height: 100vh;

  display: grid;
  place-items: center;
}

.home-panel {
  text-align: center;
}

.home-logo {
  margin: 0 0 1.25rem;

  font-family: "Montella", serif;
  font-size: 3.75rem;
  font-weight: 400;
  line-height: 1;

  transition: color 0.2s ease;
}

.home-logo:hover {
  color: pink;
}

.home-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 700px) {
  .home-logo {
    font-size: 2rem;
  }
}
</style>