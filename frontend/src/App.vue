<script setup lang="ts">
import { ref } from "vue";

import HomeView from "./views/HomeView.vue";
import CatalogView from "./views/CatalogView.vue";
import SearchView from "./views/SearchView.vue";

type View = "home" | "catalog" | "search";

const currentView = ref<View>("home");
</script>

<template>
  <HomeView
    v-if="currentView === 'home'"
    @catalog="currentView = 'catalog'"
    @search="currentView = 'search'"
  />

  <CatalogView
    v-else-if="currentView === 'catalog'"
    @back="currentView = 'home'"
  />

  <SearchView
    v-else
    @back="currentView = 'home'"
  />
</template>