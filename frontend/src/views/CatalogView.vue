<script setup lang="ts">
import { computed, ref } from "vue";
import { api } from "../api";
import CatalogReel from "../components/CatalogReel.vue";

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
const messageIsSuccess = ref(false);
const submitting = ref(false);

let messageTimer: ReturnType<typeof setTimeout> | undefined;

function categoryLabel(category: Category) {
  switch (category) {
    case "Aesthetic/Concept":
      return "Aesthetic";
    case "Characters":
      return "Character";
    case "Things":
      return "Thing";
    default:
      return category;
  }
}

function clearMessage() {
  if (messageTimer !== undefined) {
    clearTimeout(messageTimer);
    messageTimer = undefined;
  }

  message.value = "";
  messageIsSuccess.value = false;
}

function showSuccessMessage(text: string) {
  if (messageTimer !== undefined) {
    clearTimeout(messageTimer);
  }

  message.value = text;
  messageIsSuccess.value = true;

  messageTimer = setTimeout(() => {
    message.value = "";
    messageIsSuccess.value = false;
    messageTimer = undefined;
  }, 3000);
}

function showRegularMessage(text: string) {
  if (messageTimer !== undefined) {
    clearTimeout(messageTimer);
    messageTimer = undefined;
  }

  message.value = text;
  messageIsSuccess.value = false;
}

function tagsFor(category: Category) {
  return tags.value.filter(
    (tag) => tag.category === category,
  );
}

function addTag(category: Category) {
  const name = tagInputs.value[category].trim();

  if (!name) {
    return;
  }

  if (tagsFor(category).length >= 5) {
    showRegularMessage(
      `You can add at most 5 tags to ${categoryLabel(category)}.`,
    );
    return;
  }

  const duplicate = tags.value.some(
    (tag) =>
      tag.category === category &&
      tag.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    showRegularMessage(
      `"${name}" is already in ${categoryLabel(category)}.`,
    );
    return;
  }

  tags.value.push({
    name,
    category,
  });

  tagInputs.value[category] = "";
  clearMessage();
}

function removeTag(tagToRemove: CatalogTag) {
  tags.value = tags.value.filter(
    (tag) => tag !== tagToRemove,
  );
}

const canCatalog = computed(() => {
  return media.value.trim() !== "" && tags.value.length >= 1;
});

async function catalogEdit() {
  if (!canCatalog.value) {
    return;
  }

  submitting.value = true;
  showRegularMessage("Cataloging edit...");

  try {
    const postResult = await api.catalog.post({
      media: media.value.trim(),
      caption: caption.value.trim(),
    });

    if ("error" in postResult) {
      showRegularMessage(
        `Could not create the post: ${postResult.error}`,
      );
      return;
    }

    const post = postResult.post;

    for (const tag of tags.value) {
      const tagResult = await api.catalog.tag({
        post,
        name: tag.name,
        category: tag.category,
      });

      if ("error" in tagResult) {
        showRegularMessage(
          `Post created, but "${tag.name}" could not be attached: ${tagResult.error}`,
        );
        return;
      }
    }

    media.value = "";
    caption.value = "";
    tags.value = [];

    showSuccessMessage("Edit cataloged!");
  } catch (error) {
    console.error(error);
    showRegularMessage("Could not connect to the backend.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <CatalogReel />

  <main class="catalog-page">
    <button
      class="back-button"
      type="button"
      @click="$emit('back')"
    >
      ← Home
    </button>

    <section class="catalog-panel">
      <h1 class="catalog-title">
        Catalog an Edit:
      </h1>

      <div class="basic-fields">
        <div class="basic-field">
          <label for="media">
            Video URL:
          </label>

          <input
            id="media"
            v-model="media"
            type="url"
            placeholder="https://..."
          />
        </div>

        <div class="basic-field">
          <label for="caption">
            Caption:
          </label>

          <input
            id="caption"
            v-model="caption"
            type="text"
            placeholder="Caption"
          />
        </div>
      </div>

      <h2 class="tags-title">
        Tags:
      </h2>

      <div class="tag-categories">
        <section
          v-for="category in categories"
          :key="category"
          class="tag-category"
        >
          <div class="tag-row">
            <h3 class="category-title">
              {{ categoryLabel(category) }}:
            </h3>

            <div class="tag-entry">
              <input
                v-model="tagInputs[category]"
                type="text"
                :placeholder="`Add ${categoryLabel(category)} tag`"
                @keyup.enter="addTag(category)"
              />

              <button
                class="add-tag"
                type="button"
                :disabled="tagsFor(category).length >= 5"
                @click="addTag(category)"
              >
                Add
              </button>
            </div>
          </div>

          <ul
            v-if="tagsFor(category).length > 0"
            class="selected-tags"
          >
            <li
              v-for="tag in tagsFor(category)"
              :key="tag.name"
            >
              {{ tag.name }}

              <button
                class="remove-tag"
                type="button"
                aria-label="Remove tag"
                @click="removeTag(tag)"
              >
                ×
              </button>
            </li>
          </ul>

          <p class="tag-count">
            {{ tagsFor(category).length }} / 5
          </p>
        </section>
      </div>

      <p class="total-tags">
        Total tags: {{ tags.length }} / 35
      </p>

      <Transition name="message-fade">
        <p
          v-if="message"
          class="catalog-message"
          :class="{ success: messageIsSuccess }"
        >
          {{ message }}
        </p>
      </Transition>

      <button
        class="catalog-submit"
        type="button"
        :disabled="!canCatalog || submitting"
        @click="catalogEdit"
      >
        {{ submitting ? "Cataloging..." : "Catalog Edit" }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.catalog-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
}

.back-button {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
}

/*
 * Form sits left of the decorative reel.
 */
.catalog-panel {
  position: relative;
  z-index: 1;

  width: min(90vw, 520px);
  margin-left: 34%;
  padding: 4.5rem 0 3rem;

  transform: translateX(-50%);
}

/* Catalog an Edit: */
.catalog-title {
  margin: 0 0 1rem;

  color: #006cff;

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

/* Video URL + Caption */
.basic-fields {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  margin-bottom: 1.4rem;
}

.basic-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.basic-field label {
  width: 80px;
  flex-shrink: 0;
}

.basic-field input {
  width: 240px;
}

/* Tags: */
.tags-title {
  margin: 0 0 0.8rem;

  color: red;

  font-family: "Montella", serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1;
}

.tag-categories {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.tag-category {
  margin: 0;
}

/*
 * Category + input + Add all sit on the same line.
 */
.tag-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-title {
  width: 110px;
  flex-shrink: 0;

  margin: 0;

  font-family: "Times New Roman", Times, serif;
  font-size: 1rem;
  font-weight: 400;
  text-align: right;
}

.tag-entry {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.tag-entry input {
  width: 240px;
}

/*
 * Add is visually text, but remains a real button.
 */
.add-tag {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: red;

  font: inherit;
  cursor: pointer;
}

.add-tag:hover,
.add-tag:focus-visible {
  text-decoration: underline;
}

.add-tag:disabled {
  opacity: 0.4;
  cursor: default;
  text-decoration: none;
}

.selected-tags {
  margin: 0.35rem 0 0 110px;
  padding-left: 0.75rem;
}

.remove-tag {
  appearance: none;

  border: 0;
  padding: 0 0.2rem;

  background: transparent;

  cursor: pointer;
}

.remove-tag:hover,
.remove-tag:focus-visible {
  color: red;
}

.tag-count {
  margin: 0.15rem 0 0 110px;
  padding-left: 0.75rem;

  font-size: 0.75rem;
}

.total-tags {
  margin: 1rem 0 0.5rem;
}

/*
 * Successful catalog message is red.
 */
.catalog-message {
  margin: 0.5rem 0;
}

.catalog-message.success {
  color: red;
}

/*
 * Vue Transition:
 * after 3 seconds the success message fades away.
 */
.message-fade-enter-active,
.message-fade-leave-active {
  transition: opacity 0.8s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
}

.catalog-submit {
  margin-top: 0.5rem;
}

@media (max-width: 700px) {
  .catalog-page {
    padding: 1rem;
  }

  .back-button {
    position: static;
    margin-bottom: 2rem;
  }

  .catalog-panel {
    width: 100%;
    margin-left: 0;
    padding: 0;
    transform: none;
  }

  .catalog-title {
    font-size: 2.4rem;
  }

  .basic-field {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.2rem;
  }

  .basic-field label {
    width: auto;
  }

  .basic-field input {
    width: min(100%, 280px);
  }

  .tag-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .category-title {
    width: auto;
    text-align: left;
  }

  .tag-entry {
    width: 100%;
  }

  .tag-entry input {
    width: min(100%, 280px);
  }

  .selected-tags,
  .tag-count {
    margin-left: 0;
    padding-left: 0;
  }
}
</style>