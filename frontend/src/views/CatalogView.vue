<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../api";

defineEmits<{
  back: [];
}>();

const categories = [
  "Aesthetic/Concept",
  "Media",
  "Characters",
  "Musical Artist",
  "Song",
  "Public Figure",
  "Things",
] as const;

type Category = (typeof categories)[number];

interface CatalogTag {
  name: string;
  category: Category;
}

const media = ref("");
const caption = ref("");

const tags = ref<CatalogTag[]>([]);

const tagInputs = ref<Record<Category, string>>({
  "Aesthetic/Concept": "",
  "Media": "",
  "Characters": "",
  "Musical Artist": "",
  "Song": "",
  "Public Figure": "",
  "Things": "",
});

const message = ref("");

function tagsFor(category: Category) {
  return tags.value.filter((tag) => tag.category === category);
}

function addTag(category: Category) {
  const name = tagInputs.value[category].trim();

  if (!name) {
    return;
  }

  if (tagsFor(category).length >= 5) {
    message.value = `You can add at most 5 tags to ${category}.`;
    return;
  }

  const duplicate = tags.value.some(
    (tag) =>
      tag.category === category &&
      tag.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    message.value = `"${name}" is already in ${category}.`;
    return;
  }

  tags.value.push({
    name,
    category,
  });

  tagInputs.value[category] = "";
  message.value = "";
}

function removeTag(tagToRemove: CatalogTag) {
  tags.value = tags.value.filter((tag) => tag !== tagToRemove);
}

const canCatalog = computed(() => {
  return media.value.trim() !== "" && tags.value.length >= 1;
});

const submitting = ref(false);
async function catalogEdit() {
  if (!canCatalog.value) {
    return;
  }

  submitting.value = true;
  message.value = "Cataloging edit...";

  try {
    // 1. Create the post
    const postResult = await api.catalog.post({
      user: "amber",
      media: media.value.trim(),
      caption: caption.value.trim(),
    });

    if ("error" in postResult) {
  message.value = `Could not create the post: ${postResult.error}`;
  return;
}

const post = postResult.post;

    // 2. Attach every selected tag
    for (const tag of tags.value) {
      const tagResult = await api.catalog.tag({
        post,
        name: tag.name,
        category: tag.category,
      });

      if ("error" in tagResult) {
  message.value =
    `Post created, but "${tag.name}" could not be attached: ${tagResult.error}`;
  return;
}
    }

    // 3. Everything worked
    message.value = "Edit cataloged!";

    media.value = "";
    caption.value = "";
    tags.value = [];
  } catch (error) {
    console.error(error);
    message.value = "Could not connect to the backend.";
  } finally {
    submitting.value = false;
  }
}





</script>

<template>
  <main>
    <button type="button" @click="$emit('back')">
      ← Back
    </button>

    <h1>Catalog an Edit</h1>

    <div>
      <label for="media">Video URL</label>
      <input
        id="media"
        v-model="media"
        type="url"
        placeholder="https://..."
      />
    </div>

    <div>
      <label for="caption">Caption</label>
      <input
        id="caption"
        v-model="caption"
        type="text"
        placeholder="Caption"
      />
    </div>

    <h2>Tags</h2>

    <section
      v-for="category in categories"
      :key="category"
    >
      <h3>{{ category }}</h3>

      <div>
        <input
          v-model="tagInputs[category]"
          type="text"
          :placeholder="`Add a ${category} tag`"
          @keyup.enter="addTag(category)"
        />

        <button
          type="button"
          :disabled="tagsFor(category).length >= 5"
          @click="addTag(category)"
        >
          Add
        </button>
      </div>

      <ul>
        <li
          v-for="tag in tagsFor(category)"
          :key="tag.name"
        >
          {{ tag.name }}

          <button
            type="button"
            @click="removeTag(tag)"
          >
            ×
          </button>
        </li>
      </ul>

      <p>{{ tagsFor(category).length }} / 5</p>
    </section>

    <p>Total tags: {{ tags.length }} / 35</p>

    <p>{{ message }}</p>

    <button
  type="button"
  :disabled="!canCatalog || submitting"
  @click="catalogEdit"
>
  {{ submitting ? "Cataloging..." : "Catalog Edit" }}
</button>
  </main>
</template>