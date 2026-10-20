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
  user: string;
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
const slottingPost = ref<string | null>(null);
const newFolderName = ref("");
const slotMessage = ref("");

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

const canSearch = computed(() => selectedTags.value.length >= 1);

async function loadFolders() {
  const result = await api.slot.folders({
    user: "amber",
  });

  if ("error" in result) {
    throw new Error(`Could not load folders: ${result.error}`);
  }

  folders.value = result.result.folders;
}

async function openSlot(post: string) {
  slottingPost.value = post;
  slotMessage.value = "";

  try {
    await loadFolders();
  } catch (error) {
    console.error(error);
    slotMessage.value = "Could not load folders.";
  }
}

function closeSlot() {
  slottingPost.value = null;
  newFolderName.value = "";
  slotMessage.value = "";
}

async function createFolder() {
  const name = newFolderName.value.trim();

  if (!name) {
    return;
  }

  const result = await api.slot.folder.create({
    user: "amber",
    name,
  });

  if ("error" in result) {
    slotMessage.value = `Could not create folder: ${result.error}`;
    return;
  }

  newFolderName.value = "";
  await loadFolders();
}

async function addPostToFolder(folder: string) {
  if (slottingPost.value === null) {
    return;
  }

  const result = await api.slot.add({
    folder,
    post: slottingPost.value,
  });

  if ("error" in result) {
    slotMessage.value = `Could not slot edit: ${result.error}`;
    return;
  }

  slotMessage.value = "Edit slotted!";
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
  results.value = [];
  message.value = "Searching...";

  try {
    // Maps each matching Post ID to the number of searched tags it matched.
    const matchCounts = new Map<string, number>();

    // Search once for each selected tag.
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

      // Count how many selected tags matched each Post.
      for (const item of tagResult.results.items) {
        const oldCount = matchCounts.get(item.item) ?? 0;
        matchCounts.set(item.item, oldCount + 1);
      }
    }

    const foundResults: SearchResult[] = [];

    // Get the actual Post details and all associated tags.
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

    // Posts matching the most searched tags appear first.
    foundResults.sort((a, b) => b.matches - a.matches);

    results.value = foundResults;

    if (foundResults.length === 0) {
      message.value = "No matching edits found.";
    } else {
      message.value = `Found ${foundResults.length} matching edit(s).`;
    }
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
  <main>
    <button type="button" @click="$emit('back')">
      ← Back
    </button>

    <h1>Search</h1>

    <p>Search for edits by tag.</p>

    <section
      v-for="category in categories"
      :key="category"
    >
      <h3>{{ category }}</h3>

      <div>
        <input
          v-model="tagInputs[category]"
          type="text"
          :placeholder="`Search ${category}`"
          @keyup.enter="addTag(category)"
        />

        <button
          type="button"
          @click="addTag(category)"
        >
          Add
        </button>
      </div>

      <ul>
        <li
          v-for="tag in tagsFor(category)"
          :key="`${tag.category}-${tag.name}`"
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
    </section>

    <p>Search tags: {{ selectedTags.length }}</p>

    <button
      type="button"
      :disabled="!canSearch || searching"
      @click="search"
    >
      {{ searching ? "Searching..." : "Search" }}
    </button>

    <p>{{ message }}</p>

    <section v-if="results.length > 0">
      <h2>Results</h2>

      <article
        v-for="result in results"
        :key="result.post"
      >
        <h3>
          {{ result.caption || "Untitled edit" }}
        </h3>

        <p>
          {{ result.matches }}
          matching
          {{ result.matches === 1 ? "tag" : "tags" }}
        </p>

        <p>
          Video:
          <a
            :href="result.media"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ result.media }}
          </a>
        </p>

        <p>
          Cataloged by {{ result.user }}
        </p>

        <h4>Tags</h4>

        <ul>
          <li
            v-for="tag in result.tags"
            :key="tag.tag"
          >
            {{ tag.name }} — {{ tag.category }}
          </li>
        </ul>
        <button
  type="button"
  @click="openSlot(result.post)"
>
  Slot
</button>

<div v-if="slottingPost === result.post">
  <h4>Slot this edit</h4>

  <p v-if="folders.length === 0">
    You don't have any folders yet.
  </p>

  <ul>
    <li
      v-for="folder in folders"
      :key="folder.folder"
    >
      {{ folder.name }}

      <button
        type="button"
        @click="addPostToFolder(folder.folder)"
      >
        Add here
      </button>
    </li>
  </ul>

  <div>
    <input
      v-model="newFolderName"
      type="text"
      placeholder="New folder name"
      @keyup.enter="createFolder"
    />

    <button
      type="button"
      @click="createFolder"
    >
      Create Folder
    </button>
  </div>

  <p>{{ slotMessage }}</p>

  <button
    type="button"
    @click="closeSlot"
  >
    Cancel
  </button>
</div>
        
      </article>
    </section>
  </main>
</template>