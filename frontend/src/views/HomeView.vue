<script setup lang="ts">
defineEmits<{
  catalog: [];
  search: [];
  cabinet: [];
}>();
</script>

<template>
  <main>
    <h1>EDIT CABINET</h1>

    <p>Catalog and find video edits.</p>

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

    <button
      type="button"
      @click="$emit('cabinet')"
    >
      My Cabinet
    </button>
  </main>
</template>