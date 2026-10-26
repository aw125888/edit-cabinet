<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  ref,
} from "vue";

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

type Category =
  (typeof categories)[number];

interface CatalogTag {
  name: string;
  category: Category;
}

type MessageType =
  | "normal"
  | "success"
  | "error";

const media = ref("");
const caption = ref("");
const tags = ref<CatalogTag[]>([]);

const tagInputs =
  ref<Record<Category, string>>({
    "Aesthetic/Concept": "",
    "Media": "",
    "Characters": "",
    "Musical Artist": "",
    "Song": "",
    "Public Figure": "",
    "Things": "",
  });

const message = ref("");
const messageType =
  ref<MessageType>("normal");
const messageVisible = ref(false);

const submitting = ref(false);

let messageTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

let fadeTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

/* ==============================
   HELPERS
   ============================== */

function categoryLabel(
  category: Category,
) {
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

/* ==============================
   MESSAGES
   ============================== */

function clearMessageTimers() {
  if (messageTimer !== undefined) {
    clearTimeout(messageTimer);
    messageTimer = undefined;
  }

  if (fadeTimer !== undefined) {
    clearTimeout(fadeTimer);
    fadeTimer = undefined;
  }
}

function clearMessage() {
  clearMessageTimers();

  message.value = "";
  messageType.value = "normal";
  messageVisible.value = false;
}

function showPermanentMessage(
  text: string,
  type: MessageType = "normal",
) {
  clearMessageTimers();

  message.value = text;
  messageType.value = type;
  messageVisible.value = true;
}

function showTemporaryMessage(
  text: string,
  type: "success" | "error",
) {
  clearMessageTimers();

  message.value = text;
  messageType.value = type;
  messageVisible.value = true;

  messageTimer = setTimeout(() => {
    messageVisible.value = false;

    fadeTimer = setTimeout(() => {
      message.value = "";
      messageType.value = "normal";
      fadeTimer = undefined;
    }, 800);

    messageTimer = undefined;
  }, 2500);
}

function friendlyError(
  error: string,
) {
  switch (error) {
    case "FORBIDDEN":
      return "You don't have permission to do that.";

    case "UNAUTHORIZED":
      return "Please sign in again.";

    case "INVALID_REQUEST":
      return "That request could not be completed.";

    case "CONFLICT":
      return "That edit could not be cataloged because it conflicts with existing data.";

    default:
      return "Something went wrong. Please try again.";
  }
}

/* ==============================
   TAGS
   ============================== */

function tagsFor(
  category: Category,
) {
  return tags.value.filter(
    (tag) =>
      tag.category === category,
  );
}

function addTag(
  category: Category,
) {
  const name =
    tagInputs.value[
      category
    ].trim();

  if (!name) {
    return;
  }

  if (
    tagsFor(category).length >= 5
  ) {
    showTemporaryMessage(
      `You can add at most 5 tags to ${categoryLabel(category)}.`,
      "error",
    );

    return;
  }

  const duplicate =
    tags.value.some(
      (tag) =>
        tag.category === category &&
        tag.name.toLowerCase() ===
          name.toLowerCase(),
    );

  if (duplicate) {
    showTemporaryMessage(
      `"${name}" is already in ${categoryLabel(category)}.`,
      "error",
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

function removeTag(
  tagToRemove: CatalogTag,
) {
  tags.value =
    tags.value.filter(
      (tag) =>
        tag !== tagToRemove,
    );
}

/* ==============================
   CATALOG
   ============================== */

const canCatalog =
  computed(() => {
    return (
      media.value.trim() !== "" &&
      tags.value.length >= 1
    );
  });

async function catalogEdit() {
  if (!canCatalog.value) {
    return;
  }

  submitting.value = true;

  showPermanentMessage(
    "Cataloging edit...",
  );

  try {
    const postResult =
      await api.catalog.post({
        media: media.value.trim(),
        caption:
          caption.value.trim(),
      });

    if ("error" in postResult) {
      showTemporaryMessage(
        friendlyError(
          postResult.error,
        ),
        "error",
      );

      return;
    }

    const post =
      postResult.post;

    for (
      const tag
      of tags.value
    ) {
      const tagResult =
        await api.catalog.tag({
          post,
          name: tag.name,
          category: tag.category,
        });

      if ("error" in tagResult) {
        showTemporaryMessage(
          `The edit was created, but the tag "${tag.name}" could not be attached. Please try again.`,
          "error",
        );

        return;
      }
    }

    media.value = "";
    caption.value = "";
    tags.value = [];

    for (
      const category
      of categories
    ) {
      tagInputs.value[
        category
      ] = "";
    }

    showTemporaryMessage(
      "Edit cataloged!",
      "success",
    );
  } catch (error) {
    console.error(error);

    showTemporaryMessage(
      "Could not connect to the backend. Please try again.",
      "error",
    );
  } finally {
    submitting.value = false;
  }
}

onBeforeUnmount(() => {
  clearMessageTimers();
});
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

      <!-- BASIC FIELDS -->
      <div class="basic-fields">
        <div class="basic-field">
          <label for="media">
            Video URL:
          </label>

          <input
            id="media"
            v-model="media"
            type="url"
            maxlength="2000"
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
            maxlength="200"
            placeholder="Caption"
          />
        </div>
      </div>

      <!-- TAGS -->
      <h2 class="tags-title">
        Tags:
      </h2>

      <div class="tag-categories">
        <section
          v-for="
            category in categories
          "
          :key="category"
          class="tag-category"
        >
          <div class="tag-row">
            <h3 class="category-title">
              {{
                categoryLabel(
                  category
                )
              }}:
            </h3>

            <div class="tag-entry">
              <input
                v-model="
                  tagInputs[
                    category
                  ]
                "
                type="text"
                maxlength="50"
                :placeholder="
                  `Add ${categoryLabel(category)} tag`
                "
                :disabled="
                  tagsFor(
                    category
                  ).length >= 5
                "
                @keyup.enter="
                  addTag(category)
                "
              />

              <button
                class="add-tag"
                type="button"
                :disabled="
                  tagsFor(
                    category
                  ).length >= 5
                "
                @click="
                  addTag(category)
                "
              >
                Add
              </button>
            </div>
          </div>

          <ul
            v-if="
              tagsFor(
                category
              ).length > 0
            "
            class="selected-tags"
          >
            <li
              v-for="
                tag in tagsFor(
                  category
                )
              "
              :key="tag.name"
            >
              {{ tag.name }}

              <button
                class="remove-tag"
                type="button"
                aria-label="Remove tag"
                @click="
                  removeTag(tag)
                "
              >
                ×
              </button>
            </li>
          </ul>

          <p class="tag-count">
            {{
              tagsFor(
                category
              ).length
            }}
            / 5
          </p>
        </section>
      </div>

      <p class="total-tags">
        Total tags:
        {{ tags.length }} / 35
      </p>

      <!--
        Fixed-height area prevents the
        Catalog button from jumping when
        feedback appears or fades.
      -->
      <div class="status-area">
        <p
          v-if="message"
          class="catalog-message"
          :class="[
            `message-${messageType}`,
            {
              'message-hidden':
                !messageVisible,
            },
          ]"
        >
          {{ message }}
        </p>
      </div>

      <button
        class="catalog-submit"
        type="button"
        :disabled="
          !canCatalog ||
          submitting
        "
        @click="catalogEdit"
      >
        {{
          submitting
            ? "Cataloging..."
            : "Catalog Edit"
        }}
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

  transform:
    translateX(-50%);
}

/* ==============================
   TITLE
   ============================== */

.catalog-title {
  margin: 0 0 1rem;

  color: #006cff;

  font-family:
    "Montella",
    serif;

  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

/* ==============================
   BASIC FIELDS
   ============================== */

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

/* ==============================
   TAGS
   ============================== */

.tags-title {
  margin: 0 0 0.8rem;

  color: red;

  font-family:
    "Montella",
    serif;

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

.tag-row {
  display: flex;
  align-items: center;

  gap: 0.75rem;
}

.category-title {
  width: 110px;

  flex-shrink: 0;

  margin: 0;

  font-family:
    "Times New Roman",
    Times,
    serif;

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

.add-tag {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: green;

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
  margin:
    0.35rem
    0
    0
    110px;

  padding-left: 0.75rem;
}

.remove-tag {
  appearance: none;

  border: 0;

  padding:
    0
    0.2rem;

  background: transparent;

  cursor: pointer;
}

.remove-tag:hover,
.remove-tag:focus-visible {
  color: red;
}

.tag-count {
  margin:
    0.15rem
    0
    0
    110px;

  padding-left: 0.75rem;

  font-size: 0.75rem;
}

.total-tags {
  margin: 1rem 0 0.5rem;
}

/* ==============================
   STATUS
   ============================== */

.status-area {
  height: 2.25rem;

  display: flex;
  align-items: center;

  margin: 0.25rem 0;
}

.catalog-message {
  margin: 0;

  opacity: 1;

  font-size: 0.85rem;

  transition:
    opacity 0.8s ease;
}

.message-normal {
  color: #181818;
}

.message-success {
  color: green;
}

.message-error {
  color: red;
}

.message-hidden {
  opacity: 0;
}

/* ==============================
   SUBMIT
   ============================== */

.catalog-submit {
  margin-top: 0.5rem;
}

/* ==============================
   RESPONSIVE
   ============================== */

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
    align-items:
      flex-start;

    flex-direction:
      column;

    gap: 0.2rem;
  }

  .basic-field label {
    width: auto;
  }

  .basic-field input {
    width:
      min(
        100%,
        280px
      );
  }

  .tag-row {
    align-items:
      flex-start;

    flex-direction:
      column;

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
    width:
      min(
        100%,
        280px
      );
  }

  .selected-tags,
  .tag-count {
    margin-left: 0;

    padding-left: 0;
  }
}
</style>