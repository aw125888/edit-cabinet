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

interface SearchTag {
  name: string;
  category: Category;
}

interface ResultTag {
  tag: string;
  name: string;
  category: string;
}

interface SearchResult {
  post: string;
  username: string;
  media: string;
  caption: string;
  tags: ResultTag[];
  matches: number;
}

interface Folder {
  folder: string;
  name: string;
}

const folders = ref<Folder[]>([]);

/*
 * Multiple Slot panels can now be open at once.
 */
const openSlots = ref<Set<string>>(new Set());

/*
 * Each post gets its own new-folder input.
 */
const newFolderNames = ref<Record<string, string>>({});

/*
 * Each post gets its own Slot status message.
 */
const slotMessages = ref<Record<string, string>>({});

/*
 * Tracks post/folder combinations that have already
 * successfully been added during this UI session.
 */
const addedFolders = ref<Set<string>>(new Set());

const selectedTags = ref<SearchTag[]>([]);

const tagInputs = ref<Record<Category, string>>({
  "Aesthetic/Concept": "",
  "Media": "",
  "Characters": "",
  "Musical Artist": "",
  "Song": "",
  "Public Figure": "",
  "Things": "",
});

const results = ref<SearchResult[]>([]);
const message = ref("");
const searching = ref(false);
const hasSearched = ref(false);

const canSearch = computed(() => selectedTags.value.length >= 1);

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

function slotKey(post: string, folder: string) {
  return `${post}:${folder}`;
}

function isAdded(post: string, folder: string) {
  return addedFolders.value.has(slotKey(post, folder));
}

async function loadFolders() {
  const result = await api.slot.folders({});

  if ("error" in result) {
    throw new Error(`Could not load folders: ${result.error}`);
  }

  folders.value = result.result.folders;
}

/*
 * Clicking Slot toggles only THAT post.
 * Other open Slot panels remain open.
 */
async function toggleSlot(post: string) {
  const next = new Set(openSlots.value);

  if (next.has(post)) {
    next.delete(post);
    openSlots.value = next;
    return;
  }

  next.add(post);
  openSlots.value = next;

  slotMessages.value[post] = "";

  try {
    await loadFolders();
  } catch (error) {
    console.error(error);
    slotMessages.value[post] = "Could not load folders.";
  }
}

async function createFolder(post: string) {
  const name = (newFolderNames.value[post] ?? "").trim();

  if (!name) {
    return;
  }

  const result = await api.slot.folder.create({
    name,
  });

  if ("error" in result) {
    slotMessages.value[post] =
      `Could not create folder: ${result.error}`;
    return;
  }

  newFolderNames.value[post] = "";
  slotMessages.value[post] = "Folder created.";

  await loadFolders();
}

async function addPostToFolder(
  post: string,
  folder: string,
) {
  if (isAdded(post, folder)) {
    return;
  }

  const result = await api.slot.add({
    folder,
    post,
  });

  if ("error" in result) {
    slotMessages.value[post] =
      `Could not slot edit: ${result.error}`;
    return;
  }

  const next = new Set(addedFolders.value);
  next.add(slotKey(post, folder));
  addedFolders.value = next;

  slotMessages.value[post] = "";
}

function tagsFor(category: Category) {
  return selectedTags.value.filter(
    (tag) => tag.category === category,
  );
}

function addTag(category: Category) {
  const name = tagInputs.value[category].trim();

  if (!name) {
    return;
  }

  const duplicate = selectedTags.value.some(
    (tag) =>
      tag.category === category &&
      tag.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    message.value = `"${name}" is already selected.`;
    return;
  }

  selectedTags.value.push({
    name,
    category,
  });

  tagInputs.value[category] = "";
  message.value = "";
}

function removeTag(tagToRemove: SearchTag) {
  selectedTags.value = selectedTags.value.filter(
    (tag) => tag !== tagToRemove,
  );
}

async function search() {
  if (!canSearch.value) {
    return;
  }

  searching.value = true;
  hasSearched.value = false;
  results.value = [];
  message.value = "";

  /*
   * Reset open result controls when performing
   * a completely new search.
   */
  openSlots.value = new Set();
  addedFolders.value = new Set();
  slotMessages.value = {};
  newFolderNames.value = {};

  try {
    const matchCounts = new Map<string, number>();

    for (const tag of selectedTags.value) {
      const tagResult = await api.search.tag({
        name: tag.name,
        category: tag.category,
      });

      if ("error" in tagResult) {
        throw new Error(
          `Search failed for tag "${tag.name}": ${tagResult.error}`,
        );
      }

      for (const item of tagResult.results.items) {
        const oldCount = matchCounts.get(item.item) ?? 0;
        matchCounts.set(item.item, oldCount + 1);
      }
    }

    const foundResults: SearchResult[] = [];

    for (const [post, matches] of matchCounts) {
      const postResult = await api.search.post({
        post,
      });

      if ("error" in postResult) {
        throw new Error(
          `Could not retrieve post "${post}": ${postResult.error}`,
        );
      }

      foundResults.push({
        ...postResult.result,
        matches,
      });
    }

    foundResults.sort((a, b) => b.matches - a.matches);

    results.value = foundResults;
    hasSearched.value = true;
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      message.value = error.message;
    } else {
      message.value = "Search failed.";
    }
  } finally {
    searching.value = false;
  }
}
</script>

<template>
  <main class="search-page">
    <button
      class="back-button"
      type="button"
      @click="$emit('back')"
    >
      ← Home
    </button>

    <div class="search-layout">
      <!-- LEFT SIDE: SEARCH -->
      <section class="search-panel">
        <h1 class="search-title">
          Search:
        </h1>

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
                  :placeholder="`Search ${categoryLabel(category)} tag`"
                  @keyup.enter="addTag(category)"
                />

                <button
                  class="add-tag"
                  type="button"
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
                :key="`${tag.category}-${tag.name}`"
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
          </section>
        </div>

        <p class="search-count">
          Search tags: {{ selectedTags.length }}
        </p>

        <button
          class="search-submit"
          type="button"
          :disabled="!canSearch || searching"
          @click="search"
        >
          {{ searching ? "Searching..." : "Search" }}
        </button>

        <!-- Errors remain on Search side -->
        <p
          v-if="message"
          class="search-message"
        >
          {{ message }}
        </p>
      </section>

      <!-- RIGHT SIDE: RESULTS -->
      <section
        v-if="hasSearched"
        class="results-panel"
      >
        <h2 class="results-title">
          Results:
        </h2>

        <!-- Zero-result state -->
        <p
          v-if="results.length === 0"
          class="no-results"
        >
          No matching edits found.
        </p>

        <!-- Result cards -->
        <div
          v-else
          class="results-grid"
        >
          <div
            v-for="result in results"
            :key="result.post"
            class="result-wrapper"
          >
            <p class="matching-tags">
              {{ result.matches }}
              matching
              {{ result.matches === 1 ? "tag" : "tags" }}
            </p>

            <article class="result-card">
              <!-- Video -->
              <p class="result-line">
                <span class="result-label">
                  Video:
                </span>

                <a
                  class="video-link"
                  :href="result.media"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Link
                </a>
              </p>

              <!-- Caption -->
              <p class="result-caption">
                {{ result.caption || "Untitled edit" }}
              </p>

              <!-- Cataloger -->
              <p class="result-line">
                <span class="result-label">
                  Cataloged By:
                </span>

                <span class="result-content">
                  @{{ result.username }}
                </span>
              </p>

              <!-- Tags -->
              <div class="result-tag-section">
                <p class="result-label">
                  Tags:
                </p>

                <ul class="result-tags">
                  <li
                    v-for="tag in result.tags"
                    :key="tag.tag"
                  >
                    <span class="tag-name">
                      {{ tag.name }}
                    </span>

                    <span class="tag-category-label">
                      [{{ categoryLabel(tag.category as Category) }}]
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Slot toggles open/closed -->
              <button
                class="slot-button"
                type="button"
                :aria-expanded="openSlots.has(result.post)"
                @click="toggleSlot(result.post)"
              >
                Slot
              </button>

              <div
                v-if="openSlots.has(result.post)"
                class="slot-panel"
              >
                <p class="slot-heading">
                  Current Available Folders:
                </p>

                <p
                  v-if="folders.length === 0"
                  class="no-folders"
                >
                  No available folders.
                </p>

                <ul
                  v-else
                  class="folder-list"
                >
                  <li
                    v-for="folder in folders"
                    :key="folder.folder"
                  >
                    <span>
                      {{ folder.name }}
                    </span>

                    <button
                      class="text-action add-here"
                      type="button"
                      :disabled="isAdded(result.post, folder.folder)"
                      @click="addPostToFolder(
                        result.post,
                        folder.folder
                      )"
                    >
                      {{
                        isAdded(result.post, folder.folder)
                          ? "Added"
                          : "Add here"
                      }}
                    </button>
                  </li>
                </ul>

                <p class="slot-heading create-heading">
                  Create New Folder:
                </p>

                <div class="new-folder">
                  <input
                    v-model="newFolderNames[result.post]"
                    type="text"
                    placeholder="New folder name"
                    @keyup.enter="createFolder(result.post)"
                  />

                  <button
                    class="text-action"
                    type="button"
                    @click="createFolder(result.post)"
                  >
                    Create Folder
                  </button>
                </div>

                <p
                  v-if="slotMessages[result.post]"
                  class="slot-message"
                >
                  {{ slotMessages[result.post] }}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.search-page {
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

/* ==============================
   MAIN LAYOUT
   ============================== */

.search-layout {
  width: 100%;

  display: grid;
  grid-template-columns:
    minmax(420px, 520px)
    minmax(0, 1fr);

  gap: 4rem;

  padding: 4.5rem 3rem 3rem;
}

/* ==============================
   SEARCH SIDE
   ============================== */

.search-panel {
  min-width: 0;
}

.search-title {
  margin: 0 0 1rem;

  color: green;

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

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

.search-count {
  margin: 1rem 0 0.5rem;
}

.search-submit {
  margin-top: 0.5rem;
}

.search-message {
  margin: 0.5rem 0;
}

/* ==============================
   RESULTS SIDE
   ============================== */

.results-panel {
  min-width: 0;
}

.results-title {
  margin: 0 0 1.5rem;

  color: orange;

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

.no-results {
  margin: 0;

  font-size: 0.9rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 1.5rem;
}

.result-wrapper {
  min-width: 0;
}

.matching-tags {
  margin: 0 0 0.35rem;

  color: orange;

  font-size: 0.9rem;
}

.result-card {
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

.result-label {
  font-family: "Times New Roman", Times, serif;
  font-size: 1rem;
  font-weight: 400;
}

.result-line {
  margin: 0 0 0.55rem;

  font-size: 0.85rem;
  font-weight: 400;
}

.result-content {
  font-size: 0.85rem;
}

.video-link {
  margin-left: 0.2rem;
  font-size: 0.85rem;
}

.result-caption {
  margin: 0 0 0.55rem;

  font-size: 0.85rem;
  font-weight: 400;
}

.result-tag-section {
  margin-top: 0.5rem;
}

.result-tag-section > .result-label {
  margin: 0 0 0.2rem;
}

.result-tags {
  margin: 0.2rem 0 0;
  padding-left: 1.25rem;

  list-style: disc;
}

.result-tags li {
  margin: 0.15rem 0;

  font-size: 0.85rem;
  font-weight: 400;
}

.tag-name {
  color: #181818;
}

.tag-category-label {
  margin-left: 0.2rem;

  color: #181818;

  font-size: 0.72rem;
  font-weight: 400;
}

/* ==============================
   SLOT
   ============================== */

.slot-button {
  margin-top: 0.75rem;
}

.slot-panel {
  margin-top: 1rem;
}

.slot-heading {
  margin: 0 0 0.4rem;

  font-family: "Times New Roman", Times, serif;
  font-size: 0.95rem;
  font-weight: 400;
}

.no-folders {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.8rem;
}

.folder-list {
  margin: 0.25rem 0 0.75rem;
  padding: 0;

  list-style: none;
}

.folder-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  margin: 0.3rem 0;
}

.text-action {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;
  color: red;

  font: inherit;

  cursor: pointer;
}

.text-action:hover,
.text-action:focus-visible {
  text-decoration: underline;
}

/*
 * After successful slotting:
 * Add here → Added
 * fades visually and cannot be pressed.
 */
.text-action:disabled {
  color: #777;
  opacity: 0.45;

  cursor: default;
  text-decoration: none;

  transition:
    color 0.5s ease,
    opacity 0.5s ease;
}

.create-heading {
  margin-top: 0.8rem;
}

.new-folder {
  display: flex;
  align-items: center;

  gap: 0.75rem;
}

.new-folder input {
  min-width: 0;
  width: 140px;
}

.slot-message {
  margin: 0.5rem 0 0;

  color: red;
  font-size: 0.8rem;
}

/* ==============================
   RESPONSIVE
   ============================== */

@media (max-width: 1200px) {
  .search-layout {
    gap: 2rem;

    padding-left: 1rem;
    padding-right: 1rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .search-page {
    padding: 1rem;
  }

  .back-button {
    position: static;
    margin-bottom: 2rem;
  }

  .search-layout {
    display: block;
    padding: 0;
  }

  .results-panel {
    margin-top: 3rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .search-title,
  .results-title {
    font-size: 2.4rem;
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

  .selected-tags {
    margin-left: 0;
    padding-left: 0;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }
}
</style>