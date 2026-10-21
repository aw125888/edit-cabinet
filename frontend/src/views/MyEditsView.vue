<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";

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

interface ManagedTag {
  assignment: string;
  tag: string;
  name: string;
  category: Category;
}

interface ManagedPost {
  post: string;
  media: string;
  caption: string;
  tags: ManagedTag[];
}

type MessageType =
  | "normal"
  | "success"
  | "delete";

const posts = ref<ManagedPost[]>([]);
const loading = ref(true);

const message = ref("");
const messageType =
  ref<MessageType>("normal");
const messageVisible = ref(false);

const editingPost =
  ref<string | null>(null);
const editedCaption = ref("");

/*
 * Which cards currently have their
 * Add Tags controls expanded.
 */
const editingTags =
  ref<Set<string>>(new Set());

/*
 * Each post gets its own set of tag inputs.
 */
const tagInputs = ref<
  Record<string, Record<Category, string>>
>({});

let messageTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

let fadeTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

function emptyTagInputs(): Record<Category, string> {
  return {
    "Aesthetic/Concept": "",
    "Media": "",
    "Characters": "",
    "Musical Artist": "",
    "Song": "",
    "Public Figure": "",
    "Things": "",
  };
}

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
) {
  clearMessageTimers();

  message.value = text;
  messageType.value = "normal";
  messageVisible.value = true;
}

function showTemporaryMessage(
  text: string,
  type: "success" | "delete",
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

async function loadPosts() {
  loading.value = true;
  clearMessage();

  try {
    const result =
      await api.manage.posts({});

    if ("error" in result) {
      showPermanentMessage(
        `Could not load your edits: ${result.error}`,
      );
      return;
    }

    posts.value =
      result.result.posts as ManagedPost[];

    /*
     * Give every loaded post its own
     * independent tag inputs.
     */
    for (const post of posts.value) {
      if (!tagInputs.value[post.post]) {
        tagInputs.value[post.post] =
          emptyTagInputs();
      }
    }

    if (posts.value.length === 0) {
      showPermanentMessage(
        "You haven't cataloged any edits yet.",
      );
    }
  } catch (error) {
    console.error(error);

    showPermanentMessage(
      "Could not load your edits.",
    );
  } finally {
    loading.value = false;
  }
}

/* ==============================
   CAPTION EDITING
   ============================== */

function startEditing(
  post: ManagedPost,
) {
  editingPost.value = post.post;
  editedCaption.value = post.caption;

  clearMessage();
}

function cancelEditing() {
  editingPost.value = null;
  editedCaption.value = "";
}

async function saveCaption(
  post: ManagedPost,
) {
  const caption =
    editedCaption.value.trim();

  const result =
    await api.manage.caption({
      post: post.post,
      caption,
    });

  if ("error" in result) {
    showPermanentMessage(
      `Could not update caption: ${result.error}`,
    );
    return;
  }

  post.caption = caption;

  editingPost.value = null;
  editedCaption.value = "";

  showTemporaryMessage(
    "Caption updated.",
    "success",
  );
}

/* ==============================
   TAG EDITING
   ============================== */

function tagsFor(
  post: ManagedPost,
  category: Category,
) {
  return post.tags.filter(
    (tag) => tag.category === category,
  );
}

function toggleTagEditor(
  post: ManagedPost,
) {
  const next =
    new Set(editingTags.value);

  if (next.has(post.post)) {
    next.delete(post.post);
  } else {
    next.add(post.post);

    if (!tagInputs.value[post.post]) {
      tagInputs.value[post.post] =
        emptyTagInputs();
    }
  }

  editingTags.value = next;
}

async function addTag(
  post: ManagedPost,
  category: Category,
) {
  const inputs =
    tagInputs.value[post.post];

  if (!inputs) {
    return;
  }

  const name =
    inputs[category].trim();

  if (!name) {
    return;
  }

  /*
   * Same 5-per-category rule as Catalog.
   */
  if (
    tagsFor(post, category).length >= 5
  ) {
    showPermanentMessage(
      `You can add at most 5 tags to ${categoryLabel(category)}.`,
    );
    return;
  }

  /*
   * Prevent duplicate name/category
   * combinations in the UI.
   */
  const duplicate = post.tags.some(
    (tag) =>
      tag.category === category &&
      tag.name.toLowerCase() ===
        name.toLowerCase(),
  );

  if (duplicate) {
    showPermanentMessage(
      `"${name}" is already in ${categoryLabel(category)}.`,
    );
    return;
  }

  const result =
    await api.manage.tag.add({
      post: post.post,
      name,
      category,
    });

  if ("error" in result) {
    showPermanentMessage(
      `Could not add tag: ${result.error}`,
    );
    return;
  }

  /*
   * Reload so the card gets the canonical
   * assignment/tag IDs from the backend.
   */
  inputs[category] = "";

  await refreshPosts();

  showTemporaryMessage(
    "Tag added.",
    "success",
  );
}

async function removeTag(
  post: ManagedPost,
  tag: ManagedTag,
) {
  /*
   * A cataloged edit must retain
   * at least one tag.
   */
  if (post.tags.length <= 1) {
    showPermanentMessage(
      "An edit must have at least one tag.",
    );
    return;
  }

  const result =
    await api.manage.tag.remove({
      post: post.post,
      assignment: tag.assignment,
    });

  if ("error" in result) {
    showPermanentMessage(
      `Could not remove tag: ${result.error}`,
    );
    return;
  }

  /*
   * We can update this locally because
   * removing a tag doesn't create any new IDs.
   */
  post.tags = post.tags.filter(
    (existingTag) =>
      existingTag.assignment !==
      tag.assignment,
  );

  showTemporaryMessage(
    "Tag removed.",
    "delete",
  );
}

/*
 * Refresh posts without showing Loading...
 * or collapsing the tag editor.
 */
async function refreshPosts() {
  try {
    const result =
      await api.manage.posts({});

    if ("error" in result) {
      showPermanentMessage(
        `Could not refresh your edits: ${result.error}`,
      );
      return;
    }

    posts.value =
      result.result.posts as ManagedPost[];

    for (const post of posts.value) {
      if (!tagInputs.value[post.post]) {
        tagInputs.value[post.post] =
          emptyTagInputs();
      }
    }
  } catch (error) {
    console.error(error);

    showPermanentMessage(
      "Could not refresh your edits.",
    );
  }
}

/* ==============================
   DELETE
   ============================== */

async function deletePost(
  post: ManagedPost,
) {
  const confirmed = window.confirm(
    "Delete this edit? It will also be removed from any folders it has been saved to.",
  );

  if (!confirmed) {
    return;
  }

  const result =
    await api.manage.delete({
      post: post.post,
    });

  if ("error" in result) {
    showPermanentMessage(
      `Could not delete edit: ${result.error}`,
    );
    return;
  }

  posts.value = posts.value.filter(
    (item) =>
      item.post !== post.post,
  );

  /*
   * Clean up local UI state for
   * the deleted post.
   */
  const next =
    new Set(editingTags.value);

  next.delete(post.post);
  editingTags.value = next;

  delete tagInputs.value[post.post];

  showTemporaryMessage(
    "Edit deleted.",
    "delete",
  );
}

onMounted(() => {
  loadPosts();
});

onBeforeUnmount(() => {
  clearMessageTimers();
});
</script>

<template>
  <main class="my-edits-page">
    <button
      class="back-button"
      type="button"
      @click="$emit('back')"
    >
      ← Home
    </button>

    <h1 class="page-title">
      Cataloged By Me:
    </h1>

    <p
      v-if="loading"
      class="loading-message"
    >
      Loading...
    </p>

    <!--
      Permanent reserved message space,
      so cards never jump when a reaction fades.
    -->
    <div class="status-area">
      <p
        v-if="message"
        class="status-message"
        :class="[
          `status-${messageType}`,
          {
            'status-hidden':
              !messageVisible,
          },
        ]"
      >
        {{ message }}
      </p>
    </div>

    <section
      v-if="
        !loading &&
        posts.length > 0
      "
      class="edits-grid"
    >
      <div
        v-for="post in posts"
        :key="post.post"
        class="edit-wrapper"
      >
        <article class="edit-card">
          <!-- VIDEO -->
          <p class="edit-line">
            <span class="edit-label">
              Video:
            </span>

            <a
              class="video-link"
              :href="post.media"
              target="_blank"
              rel="noopener noreferrer"
            >
              Link
            </a>
          </p>

          <!-- CAPTION -->
          <div
            v-if="
              editingPost !== post.post
            "
            class="caption-row"
          >
            <p class="caption-text">
              <span class="edit-label">
                Caption:
              </span>

              <span
                class="caption-content"
              >
                {{
                  post.caption ||
                  "Untitled edit"
                }}
              </span>
            </p>

            <button
              class="edit-caption-button"
              type="button"
              @click="
                startEditing(post)
              "
            >
              Edit Caption
            </button>
          </div>

          <!-- CAPTION EDITOR -->
          <div
            v-else
            class="caption-editor"
          >
            <label
              class="edit-label"
              :for="
                `caption-${post.post}`
              "
            >
              Caption:
            </label>

            <input
              :id="
                `caption-${post.post}`
              "
              v-model="editedCaption"
              type="text"
              @keyup.enter="
                saveCaption(post)
              "
            />

            <button
              class="save-button"
              type="button"
              @click="
                saveCaption(post)
              "
            >
              Save
            </button>

            <button
              class="cancel-button"
              type="button"
              @click="cancelEditing"
            >
              Cancel
            </button>
          </div>

          <!-- CURRENT TAGS -->
          <div class="tags-section">
            <p class="edit-label tags-label">
              Tags:
            </p>

            <ul class="current-tags">
              <li
                v-for="tag in post.tags"
                :key="tag.assignment"
              >
                <span class="tag-text">
                  {{ tag.name }}
                </span>

                <span
                  class="tag-category"
                >
                  [{{
                    categoryLabel(
                      tag.category
                    )
                  }}]
                </span>

                <button
                  class="remove-tag-button"
                  type="button"
                  :disabled="
                    post.tags.length <= 1
                  "
                  :title="
                    post.tags.length <= 1
                      ? 'An edit must keep at least one tag'
                      : 'Remove tag'
                  "
                  @click="
                    removeTag(post, tag)
                  "
                >
                  ×
                </button>
              </li>
            </ul>

            <button
              class="edit-tags-button"
              type="button"
              :aria-expanded="
                editingTags.has(
                  post.post
                )
              "
              @click="
                toggleTagEditor(post)
              "
            >
              {{
                editingTags.has(
                  post.post
                )
                  ? "Hide Tag Editor"
                  : "Add Tags"
              }}
            </button>

            <!-- ADD TAGS -->
            <div
              v-if="
                editingTags.has(
                  post.post
                )
              "
              class="tag-editor"
            >
              <div
                v-for="
                  category in categories
                "
                :key="category"
                class="tag-editor-row"
              >
                <label
                  class="tag-editor-label"
                >
                  {{
                    categoryLabel(
                      category
                    )
                  }}:
                </label>

                <input
                  :value="tagInputs[post.post]?.[category] ?? ''"
                  type="text"
                  :placeholder="`Add ${categoryLabel(category)} tag`"
                  :disabled="tagsFor(post, category).length >= 5"
                  @input="
                    tagInputs[post.post]![category] =
                      ($event.target as HTMLInputElement).value
                  "
                  @keyup.enter="addTag(post, category)"
                />

                <button
                  class="add-tag-button"
                  type="button"
                  :disabled="
                    tagsFor(
                      post,
                      category
                    ).length >= 5
                  "
                  @click="
                    addTag(
                      post,
                      category
                    )
                  "
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </article>

        <!-- DELETE OUTSIDE CARD -->
        <button
          class="delete-button"
          type="button"
          @click="
            deletePost(post)
          "
        >
          Delete
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.my-edits-page {
  position: relative;

  width: 100%;
  min-height: 100vh;

  padding: 2rem 4rem 4rem;
}

.back-button {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
}

/* ==============================
   PAGE TITLE
   ============================== */

.page-title {
  margin: 2rem 0 3rem;

  text-align: center;

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

.loading-message {
  text-align: center;
}

/* ==============================
   STATUS
   ============================== */

.status-area {
  height: 2.5rem;

  margin: -1.5rem 0 1.5rem;

  display: flex;
  align-items: center;
  justify-content: center;
}

.status-message {
  margin: 0;

  text-align: center;
  opacity: 1;

  transition: opacity 0.8s ease;
}

.status-normal {
  color: inherit;
}

.status-success {
  color: green;
}

.status-delete {
  color: red;
}

.status-hidden {
  opacity: 0;
}

/* ==============================
   CARD GRID
   ============================== */

.edits-grid {
  width: min(100%, 1000px);

  margin: 0 auto;

  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  align-items: start;

  gap: 2rem 1.5rem;
}

.edit-wrapper {
  min-width: 0;
}

.edit-card {
  min-width: 0;

  padding: 0.75rem;

  border: 1px solid #181818;

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  font-size: 0.85rem;
}

/* ==============================
   COMMON LABELS
   ============================== */

.edit-label {
  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 1rem;
  font-weight: 400;
}

.edit-line {
  margin: 0 0 0.65rem;
}

.video-link {
  margin-left: 0.2rem;

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  font-size: 0.85rem;
}

/* ==============================
   CAPTION
   ============================== */

.caption-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  gap: 0.75rem;

  margin-bottom: 0.75rem;
}

.caption-text {
  min-width: 0;
  margin: 0;
}

.caption-content {
  margin-left: 0.2rem;

  font-size: 0.85rem;
}

.edit-caption-button {
  flex-shrink: 0;

  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: blue;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.edit-caption-button:hover,
.edit-caption-button:focus-visible,
.edit-caption-button:active {
  text-decoration: underline;
}

/* ==============================
   CAPTION EDITOR
   ============================== */

.caption-editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 0.5rem;

  margin-bottom: 0.75rem;
}

.caption-editor input {
  min-width: 0;
  width: 130px;
}

.save-button,
.cancel-button {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.save-button {
  color: blue;
}

.cancel-button {
  color: #181818;
}

.save-button:hover,
.save-button:focus-visible,
.cancel-button:hover,
.cancel-button:focus-visible {
  text-decoration: underline;
}

/* ==============================
   CURRENT TAGS
   ============================== */

.tags-section {
  margin-top: 0.65rem;
}

.tags-label {
  margin: 0 0 0.2rem;
}

.current-tags {
  margin: 0.2rem 0 0.55rem;

  padding-left: 1.25rem;

  list-style: disc;
}

.current-tags li {
  margin: 0.15rem 0;

  font-size: 0.82rem;
}

.tag-text {
  color: #181818;
}

.tag-category {
  margin-left: 0.2rem;

  color: #181818;

  font-size: 0.7rem;
}

/*
 * Small × next to each tag.
 */
.remove-tag-button {
  appearance: none;

  margin-left: 0.35rem;

  border: 0;
  padding: 0;

  background: transparent;
  color: red;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.remove-tag-button:hover,
.remove-tag-button:focus-visible {
  text-decoration: underline;
}

.remove-tag-button:disabled {
  color: #999;
  opacity: 0.5;

  cursor: default;
  text-decoration: none;
}

/* ==============================
   TAG EDITOR TOGGLE
   ============================== */

.edit-tags-button {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: blue;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.edit-tags-button:hover,
.edit-tags-button:focus-visible {
  text-decoration: underline;
}

/* ==============================
   ADD TAG EDITOR
   ============================== */

.tag-editor {
  margin-top: 0.75rem;

  padding-top: 0.65rem;

  border-top: 1px solid #d5d5d5;

  display: flex;
  flex-direction: column;

  gap: 0.45rem;
}

.tag-editor-row {
  display: grid;

  grid-template-columns:
    76px
    minmax(0, 1fr)
    auto;

  align-items: center;

  gap: 0.4rem;
}

.tag-editor-label {
  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 0.8rem;

  text-align: right;
}

.tag-editor-row input {
  min-width: 0;
  width: 100%;

  font-size: 0.75rem;
}

.add-tag-button {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: red;

  font: inherit;
  font-size: 0.75rem;

  cursor: pointer;
}

.add-tag-button:hover,
.add-tag-button:focus-visible {
  text-decoration: underline;
}

.add-tag-button:disabled {
  color: #999;
  opacity: 0.5;

  cursor: default;
  text-decoration: none;
}

/* ==============================
   DELETE
   ============================== */

.delete-button {
  appearance: none;

  margin-top: 0.4rem;

  border: 0;
  padding: 0;

  background: transparent;
  color: red;

  font: inherit;
  font-size: 0.85rem;

  cursor: pointer;
}

.delete-button:hover,
.delete-button:focus-visible {
  text-decoration: underline;
}

/* ==============================
   RESPONSIVE
   ============================== */

@media (max-width: 900px) {
  .my-edits-page {
    padding: 2rem;
  }

  .edits-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .my-edits-page {
    padding: 1rem;
  }

  .back-button {
    position: static;

    margin-bottom: 2rem;
  }

  .page-title {
    margin-top: 0;

    font-size: 2.4rem;
  }

  .edits-grid {
    grid-template-columns: 1fr;
  }

  .tag-editor-row {
    grid-template-columns: 1fr;
  }

  .tag-editor-label {
    text-align: left;
  }
}
</style>