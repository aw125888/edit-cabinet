<script setup lang="ts">
defineEmits<{
  catalog: [];
  search: [];
}>();
</script>

<template>
  <main>
    <h1>EDIT CABINET</h1>

    <p>Catalog and find video edits.</p>

    <button @click="$emit('catalog')">
      Catalog
    </button>

    <button @click="$emit('search')">
      Search
    </button>
  </main>
</template>