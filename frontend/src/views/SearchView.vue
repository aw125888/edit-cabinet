<script setup lang="ts">
defineEmits<{
  back: [];
}>();
</script>

<template>
  <main>
    <button @click="$emit('back')">
      ← Back
    </button>

    <h1>Search</h1>

    <p>Search goes here.</p>
  </main>
</template>