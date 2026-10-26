<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
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
const openSlots = ref<Set<string>>(new Set());

const newFolderNames =
  ref<Record<string, string>>({});

const slotMessages =
  ref<Record<string, string>>({});

const addedFolders =
  ref<Set<string>>(new Set());

const selectedTags =
  ref<SearchTag[]>([]);

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

const results =
  ref<SearchResult[]>([]);

const message = ref("");
const searching = ref(false);
const hasSearched = ref(false);

const slotMessageTimers =
  new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

const canSearch = computed(() => {
  return selectedTags.value.length >= 1;
});

/* ==============================
   LABELS
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

function resultCategoryLabel(
  category: string,
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
   ERRORS
   ============================== */

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

    default:
      return "Something went wrong. Please try again.";
  }
}

/* ==============================
   SLOT MESSAGES
   ============================== */

function clearSlotMessage(
  post: string,
) {
  const timer =
    slotMessageTimers.get(post);

  if (timer !== undefined) {
    clearTimeout(timer);
    slotMessageTimers.delete(post);
  }

  slotMessages.value[post] = "";
}

function showSlotMessage(
  post: string,
  text: string,
) {
  clearSlotMessage(post);

  slotMessages.value[post] = text;

  const timer = setTimeout(() => {
    slotMessages.value[post] = "";
    slotMessageTimers.delete(post);
  }, 2500);

  slotMessageTimers.set(
    post,
    timer,
  );
}

function clearAllSlotMessageTimers() {
  for (
    const timer
    of slotMessageTimers.values()
  ) {
    clearTimeout(timer);
  }

  slotMessageTimers.clear();
}

/* ==============================
   SLOT HELPERS
   ============================== */

function slotKey(
  post: string,
  folder: string,
) {
  return `${post}:${folder}`;
}

function isAdded(
  post: string,
  folder: string,
) {
  return addedFolders.value.has(
    slotKey(post, folder),
  );
}

async function loadFolders() {
  const result =
    await api.slot.folders({});

  if ("error" in result) {
    throw new Error(
      friendlyError(result.error),
    );
  }

  folders.value =
    result.result.folders;
}

async function loadAddedFolders(
  post: string,
) {
  const next =
    new Set(addedFolders.value);

  for (
    const folder
    of folders.value
  ) {
    const result =
      await api.slot.folder({
        folder: folder.folder,
      });

    if ("error" in result) {
      continue;
    }

    const alreadyContainsPost =
      result.result.items.some(
        (item) =>
          item.post === post,
      );

    if (alreadyContainsPost) {
      next.add(
        slotKey(
          post,
          folder.folder,
        ),
      );
    }
  }

  addedFolders.value = next;
}

function availableFolders(
  post: string,
) {
  return folders.value.filter(
    (folder) =>
      !isAdded(
        post,
        folder.folder,
      ),
  );
}

/* ==============================
   SLOT PANEL
   ============================== */

async function toggleSlot(
  post: string,
) {
  const next =
    new Set(openSlots.value);

  if (next.has(post)) {
    next.delete(post);
    openSlots.value = next;

    clearSlotMessage(post);

    return;
  }

  next.add(post);
  openSlots.value = next;

  clearSlotMessage(post);

  try {
    await loadFolders();
    await loadAddedFolders(post);
  } catch (error) {
    if (error instanceof Error) {
      showSlotMessage(
        post,
        error.message,
      );
    } else {
      showSlotMessage(
        post,
        "Something went wrong. Please try again.",
      );
    }
  }
}

/* ==============================
   CREATE FOLDER
   ============================== */

async function createFolder(
  post: string,
) {
  const name = (
    newFolderNames.value[
      post
    ] ?? ""
  ).trim();

  if (!name) {
    return;
  }

  clearSlotMessage(post);

  const result =
    await api.slot.folder.create({
      name,
    });

  if ("error" in result) {
    let text =
      "Something went wrong. Please try again.";

    if (
      result.error === "CONFLICT"
    ) {
      text =
        "You already have a folder with that name.";
    } else if (
      result.error ===
      "UNAUTHORIZED"
    ) {
      text =
        "Please sign in again.";
    } else if (
      result.error ===
      "INVALID_REQUEST"
    ) {
      text =
        "That folder could not be created.";
    }

    showSlotMessage(
      post,
      text,
    );

    return;
  }

  newFolderNames.value[post] = "";

  clearSlotMessage(post);

  try {
    await loadFolders();
  } catch (error) {
    console.error(error);

    showSlotMessage(
      post,
      "Folder was created, but the folder list could not be refreshed.",
    );
  }
}

/* ==============================
   ADD TO FOLDER
   ============================== */

async function addPostToFolder(
  post: string,
  folder: string,
) {
  if (isAdded(post, folder)) {
    return;
  }

  clearSlotMessage(post);

  const result =
    await api.slot.add({
      folder,
      post,
    });

  if ("error" in result) {
    let text =
      "Something went wrong. Please try again.";

    if (
      result.error === "CONFLICT"
    ) {
      text =
        "This edit is already in that folder.";
    } else if (
      result.error === "FORBIDDEN"
    ) {
      text =
        "You don't have permission to add to that folder.";
    } else if (
      result.error ===
      "UNAUTHORIZED"
    ) {
      text =
        "Please sign in again.";
    } else if (
      result.error ===
      "INVALID_REQUEST"
    ) {
      text =
        "This edit could not be added to that folder.";
    }

    showSlotMessage(
      post,
      text,
    );

    return;
  }

  const next =
    new Set(addedFolders.value);

  next.add(
    slotKey(
      post,
      folder,
    ),
  );

  addedFolders.value = next;

  clearSlotMessage(post);
}

/* ==============================
   SEARCH TAGS
   ============================== */

function tagsFor(
  category: Category,
) {
  return selectedTags.value.filter(
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

  const duplicate =
    selectedTags.value.some(
      (tag) =>
        tag.category ===
          category &&
        tag.name.toLowerCase() ===
          name.toLowerCase(),
    );

  if (duplicate) {
    message.value =
      `"${name}" is already selected.`;

    return;
  }

  selectedTags.value.push({
    name,
    category,
  });

  tagInputs.value[
    category
  ] = "";

  message.value = "";
}

function removeTag(
  tagToRemove: SearchTag,
) {
  selectedTags.value =
    selectedTags.value.filter(
      (tag) =>
        tag !== tagToRemove,
    );
}

/* ==============================
   SEARCH
   ============================== */

async function search() {
  if (!canSearch.value) {
    return;
  }

  searching.value = true;
  hasSearched.value = false;

  results.value = [];
  message.value = "";

  openSlots.value =
    new Set();

  addedFolders.value =
    new Set();

  clearAllSlotMessageTimers();

  slotMessages.value = {};
  newFolderNames.value = {};

  try {
    const matchCounts =
      new Map<string, number>();

    for (
      const tag
      of selectedTags.value
    ) {
      const tagResult =
        await api.search.tag({
          name: tag.name,
          category:
            tag.category,
        });

      if (
        "error" in tagResult
      ) {
        console.error(
          "Search tag error:",
          tagResult.error,
        );

        throw new Error(
          "Something went wrong while searching. Please try again.",
        );
      }

      for (
        const item
        of tagResult.results
          .items
      ) {
        const oldCount =
          matchCounts.get(
            item.item,
          ) ?? 0;

        matchCounts.set(
          item.item,
          oldCount + 1,
        );
      }
    }

    const foundResults:
      SearchResult[] = [];

    for (
      const [
        post,
        matches,
      ]
      of matchCounts
    ) {
      const postResult =
        await api.search.post({
          post,
        });

      if (
        "error" in postResult
      ) {
        console.error(
          "Search post error:",
          postResult.error,
        );

        throw new Error(
          "A matching edit could not be loaded. Please try again.",
        );
      }

      foundResults.push({
        ...postResult.result,
        matches,
      });
    }

    foundResults.sort(
      (a, b) =>
        b.matches -
        a.matches,
    );

    results.value =
      foundResults;

    hasSearched.value = true;
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error
    ) {
      message.value =
        error.message;
    } else {
      message.value =
        "Something went wrong while searching. Please try again.";
    }
  } finally {
    searching.value = false;
  }
}

onBeforeUnmount(() => {
  clearAllSlotMessageTimers();
});
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
      <!-- SEARCH -->
      <section class="search-panel">
        <h1 class="search-title">
          Search:
        </h1>

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
                    `Search ${categoryLabel(category)} tag`
                  "
                  @keyup.enter="
                    addTag(
                      category
                    )
                  "
                />

                <button
                  class="add-tag"
                  type="button"
                  @click="
                    addTag(
                      category
                    )
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
                :key="
                  `${tag.category}-${tag.name}`
                "
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
          </section>
        </div>

        <p class="search-count">
          Search tags:
          {{ selectedTags.length }}
        </p>

        <button
          class="search-submit"
          type="button"
          :disabled="
            !canSearch ||
            searching
          "
          @click="search"
        >
          {{
            searching
              ? "Searching..."
              : "Search"
          }}
        </button>

        <p
          v-if="message"
          class="search-message"
        >
          {{ message }}
        </p>
      </section>

      <!-- RESULTS -->
      <section
        v-if="hasSearched"
        class="results-panel"
      >
        <h2 class="results-title">
          Results:
        </h2>

        <p
          v-if="
            results.length === 0
          "
          class="no-results"
        >
          No matching edits found.
        </p>

        <div
          v-else
          class="results-grid"
        >
          <div
            v-for="
              result in results
            "
            :key="result.post"
            class="result-wrapper"
          >
            <p class="matching-tags">
              {{ result.matches }}
              matching
              {{
                result.matches ===
                1
                  ? "tag"
                  : "tags"
              }}
            </p>

            <article
              class="result-card"
            >
              <!-- VIDEO -->
              <p class="result-line">
                <span
                  class="result-label"
                >
                  Video:
                </span>

                <a
                  class="video-link"
                  :href="
                    result.media
                  "
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Link
                </a>
              </p>

              <!-- CAPTION -->
              <p class="result-line">
                <span
                  class="result-label"
                >
                  Caption:
                </span>

                <span
                  class="result-content result-caption"
                >
                  {{
                    result.caption ||
                    "Untitled edit"
                  }}
                </span>
              </p>

              <!-- CATALOGER -->
              <p class="result-line">
                <span
                  class="result-label"
                >
                  Cataloged By:
                </span>

                <span
                  class="result-content"
                >
                  @{{ result.username }}
                </span>
              </p>

              <!-- TAGS -->
              <div
                class="result-tag-section"
              >
                <p
                  class="result-label"
                >
                  Tags:
                </p>

                <ul
                  class="result-tags"
                >
                  <li
                    v-for="
                      tag in result.tags
                    "
                    :key="tag.tag"
                  >
                    <span
                      class="tag-name"
                    >
                      {{ tag.name }}
                    </span>

                    <span
                      class="tag-category-label"
                    >
                      [{{
                        resultCategoryLabel(
                          tag.category
                        )
                      }}]
                    </span>
                  </li>
                </ul>
              </div>

              <!-- SLOT -->
              <button
                class="slot-button"
                type="button"
                :aria-expanded="
                  openSlots.has(
                    result.post
                  )
                "
                @click="
                  toggleSlot(
                    result.post
                  )
                "
              >
                {{
                  openSlots.has(
                    result.post
                  )
                    ? "Hide Slot Options"
                    : "Slot"
                }}
              </button>

              <div
                v-if="
                  openSlots.has(
                    result.post
                  )
                "
                class="slot-panel"
              >
                <p
                  class="slot-heading"
                >
                  Current Available Folders:
                </p>

                <p
                  v-if="
                    availableFolders(
                      result.post
                    ).length === 0
                  "
                  class="no-folders"
                >
                  No available folders.
                </p>

                <ul
                  v-else
                  class="folder-list"
                >
                  <li
                    v-for="
                      folder in
                        availableFolders(
                          result.post
                        )
                    "
                    :key="
                      folder.folder
                    "
                  >
                    <span>
                      {{ folder.name }}
                    </span>

                    <button
                      class="text-action add-folder-action"
                      type="button"
                      @click="
                        addPostToFolder(
                          result.post,
                          folder.folder
                        )
                      "
                    >
                      Add here
                    </button>
                  </li>
                </ul>

                <p
                  class="slot-heading create-heading"
                >
                  Create New Folder:
                </p>

                <div
                  class="new-folder"
                >
                  <input
                    v-model="
                      newFolderNames[
                        result.post
                      ]
                    "
                    type="text"
                    maxlength="50"
                    placeholder="New folder name"
                    @keyup.enter="
                      createFolder(
                        result.post
                      )
                    "
                  />

                  <button
                    class="text-action create-folder-action"
                    type="button"
                    @click="
                      createFolder(
                        result.post
                      )
                    "
                  >
                    Create Folder
                  </button>
                </div>

                <p
                  v-if="
                    slotMessages[
                      result.post
                    ]
                  "
                  class="slot-message"
                >
                  {{
                    slotMessages[
                      result.post
                    ]
                  }}
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
  width: min(
    1180px,
    calc(100% - 4rem)
  );

  margin: 0 auto;

  display: grid;
  grid-template-columns:
    minmax(400px, 470px)
    minmax(500px, 1fr);

  gap: 4.5rem;

  padding: 4.5rem 0 3rem;
}

/* ==============================
   SEARCH
   ============================== */

.search-panel {
  min-width: 0;
}

.search-title {
  margin: 0 0 1rem;

  color: green;

  font-family:
    "Montella",
    serif;

  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

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
  width: 220px;
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

  color: red;
}

/* ==============================
   RESULTS
   ============================== */

.results-panel {
  min-width: 0;
}

.results-title {
  margin: 0 0 1.5rem;

  color: orange;

  font-family:
    "Montella",
    serif;

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

  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );

  align-items: start;

  gap: 1.75rem;
}

.result-wrapper {
  min-width: 0;
}

.matching-tags {
  margin: 0 0 0.3rem;

  color: orange;

  font-size: 0.85rem;
}

.result-card {
  min-width: 0;

  padding:
    0.65rem
    0.75rem;

  border:
    1px
    solid
    #181818;

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  font-size: 0.82rem;
}

.result-label,
.slot-heading {
  font-family:
    "Times New Roman",
    Times,
    serif;

  font-style: italic;
  font-weight: 400;
}

.result-label {
  font-size: 0.95rem;
}

.result-line {
  margin: 0 0 0.35rem;

  font-size: 0.82rem;
  font-weight: 400;
}

.result-content {
  font-size: 0.82rem;
}

.video-link {
  margin-left: 0.2rem;

  font-size: 0.82rem;
}

.result-caption {
  overflow-wrap: anywhere;
}

.result-tag-section {
  margin-top: 0.35rem;
}

.result-tag-section
  > .result-label {
  margin: 0 0 0.1rem;
}

.result-tags {
  margin: 0.1rem 0 0;

  padding-left: 1.1rem;

  list-style: disc;
}

.result-tags li {
  margin: 0.08rem 0;

  font-size: 0.8rem;
  font-weight: 400;
}

.tag-name {
  color: #181818;
}

.tag-category-label {
  margin-left: 0.15rem;

  color: #181818;

  font-size: 0.68rem;
  font-weight: 400;
}

/* ==============================
   SLOT
   ============================== */

.slot-button {
  appearance: none;

  margin-top: 0.55rem;

  border: 0;
  padding: 0;

  background: transparent;
  color: blue;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.slot-button:hover,
.slot-button:focus-visible {
  text-decoration: underline;
}

.slot-panel {
  margin-top: 0.75rem;

  padding-top: 0.6rem;

  border-top:
    1px
    solid
    #d5d5d5;
}

.slot-heading {
  margin: 0 0 0.3rem;

  font-size: 0.9rem;
}

.no-folders {
  margin:
    0.2rem
    0
    0.6rem;

  font-size: 0.78rem;
}

.folder-list {
  margin:
    0.2rem
    0
    0.6rem;

  padding: 0;

  list-style: none;
}

.folder-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.5rem;

  margin: 0.2rem 0;

  font-size: 0.8rem;
}

.text-action {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 0.78rem;

  cursor: pointer;
}

.text-action:hover,
.text-action:focus-visible {
  text-decoration: underline;
}

.add-folder-action,
.create-folder-action {
  color: green;
}

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
  margin-top: 0.65rem;
}

.new-folder {
  display: flex;
  align-items: center;

  gap: 0.65rem;
}

.new-folder input {
  min-width: 0;
  width: 135px;

  font-size: 0.78rem;
}

.slot-message {
  margin: 0.4rem 0 0;

  color: red;

  font-size: 0.78rem;

  animation:
    slot-message-in
    0.2s
    ease;
}

@keyframes slot-message-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ==============================
   RESPONSIVE
   ============================== */

@media (max-width: 1100px) {
  .search-layout {
    width: min(
      900px,
      calc(100% - 2rem)
    );

    grid-template-columns:
      minmax(360px, 430px)
      minmax(0, 1fr);

    gap: 2.5rem;
  }

  .results-grid {
    grid-template-columns:
      1fr;
  }
}

@media (max-width: 800px) {
  .search-page {
    padding: 1rem;
  }

  .back-button {
    position: static;

    margin-bottom: 2rem;
  }

  .search-layout {
    display: block;

    width: min(
      520px,
      100%
    );

    padding: 0;
  }

  .results-panel {
    margin-top: 3rem;
  }

  .results-grid {
    grid-template-columns:
      1fr;
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
    width: min(
      100%,
      280px
    );
  }

  .selected-tags {
    margin-left: 0;

    padding-left: 0;
  }
}
</style>