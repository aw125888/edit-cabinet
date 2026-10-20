<script setup lang="ts">
import { ref } from "vue";

import HomeView from "./views/HomeView.vue";
import CatalogView from "./views/CatalogView.vue";
import SearchView from "./views/SearchView.vue";
import CabinetView from "./views/CabinetView.vue";

type View = "home" | "catalog" | "search" | "cabinet";

const currentView = ref<View>("home");
</script>

<template>
  <HomeView
    v-if="currentView === 'home'"
    @catalog="currentView = 'catalog'"
    @search="currentView = 'search'"
    @cabinet="currentView = 'cabinet'"
  />

  <CatalogView
    v-else-if="currentView === 'catalog'"
    @back="currentView = 'home'"
  />

  <SearchView
    v-else-if="currentView === 'search'"
    @back="currentView = 'home'"
  />

  <CabinetView
    v-else
    @back="currentView = 'home'"
  />
</template>