<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../api";

defineEmits<{
  back: [];
}>();

interface Folder {
  folder: string;
  name: string;
}

interface CabinetItem {
  post: string;
  details: {
    user: string;
    media: string;
    caption: string;
  };
}

const folders = ref<Folder[]>([]);
const selectedFolder = ref<Folder | null>(null);
const items = ref<CabinetItem[]>([]);

const message = ref("");
const loading = ref(false);

const editingFolder = ref<string | null>(null);
const renameInput = ref("");

async function loadFolders() {
  loading.value = true;
  message.value = "";

  try {
    const result = await api.slot.folders({
      user: "amber",
    });

    if ("error" in result) {
      message.value = `Could not load folders: ${result.error}`;
      return;
    }

    folders.value = result.result.folders;

    if (folders.value.length === 0) {
      message.value = "You don't have any folders yet.";
    }
  } catch (error) {
    console.error(error);
    message.value = "Could not connect to the backend.";
  } finally {
    loading.value = false;
  }
}

async function openFolder(folder: Folder) {
  loading.value = true;
  message.value = "";

  try {
    const result = await api.slot.folder({
      folder: folder.folder,
    });

    if ("error" in result) {
      message.value = `Could not load folder: ${result.error}`;
      return;
    }

    selectedFolder.value = folder;
    items.value = result.result.items;

    if (items.value.length === 0) {
      message.value = "This folder is empty.";
    }
  } catch (error) {
    console.error(error);
    message.value = "Could not connect to the backend.";
  } finally {
    loading.value = false;
  }
}

function backToFolders() {
  selectedFolder.value = null;
  items.value = [];
  message.value = "";
}

onMounted(() => {
  loadFolders();
});

async function removePost(post: string) {
  if (selectedFolder.value === null) {
    return;
  }

  const result = await api.slot.remove({
    folder: selectedFolder.value.folder,
    post,
  });

  if ("error" in result) {
    message.value = `Could not remove edit: ${result.error}`;
    return;
  }

  // Refresh the open folder.
  await openFolder(selectedFolder.value);
  message.value = "Edit removed.";
}

function startRename(folder: Folder) {
  editingFolder.value = folder.folder;
  renameInput.value = folder.name;
}

function cancelRename() {
  editingFolder.value = null;
  renameInput.value = "";
}

async function renameFolder(folder: Folder) {
  const name = renameInput.value.trim();

  if (!name) {
    return;
  }

  const result = await api.slot.folder.rename({
    folder: folder.folder,
    name,
  });

  if ("error" in result) {
    message.value = `Could not rename folder: ${result.error}`;
    return;
  }

  editingFolder.value = null;
  renameInput.value = "";

  await loadFolders();
  message.value = "Folder renamed.";
}

async function deleteFolder(folder: Folder) {
  const result = await api.slot.folder.delete({
    folder: folder.folder,
  });

  if ("error" in result) {
    message.value = `Could not delete folder: ${result.error}`;
    return;
  }

  await loadFolders();
  message.value = "Folder deleted.";
}
</script>

<template>
  <main>
    <button
      v-if="selectedFolder === null"
      type="button"
      @click="$emit('back')"
    >
      ← Back
    </button>

    <button
      v-else
      type="button"
      @click="backToFolders"
    >
      ← Back to folders
    </button>

    <h1>My Cabinet</h1>

    <p v-if="loading">
      Loading...
    </p>

    <p>{{ message }}</p>

    <!-- Folder list -->
    <section v-if="selectedFolder === null">
      <h2>Your Folders</h2>

      <ul>
        <li
  v-for="folder in folders"
  :key="folder.folder"
>
  <template v-if="editingFolder !== folder.folder">
    <button
      type="button"
      @click="openFolder(folder)"
    >
      {{ folder.name }}
    </button>

    <button
      type="button"
      @click="startRename(folder)"
    >
      Rename
    </button>

    <button
      type="button"
      @click="deleteFolder(folder)"
    >
      Delete
    </button>
  </template>

  <template v-else>
    <input
      v-model="renameInput"
      type="text"
      @keyup.enter="renameFolder(folder)"
    />

    <button
      type="button"
      @click="renameFolder(folder)"
    >
      Save
    </button>

    <button
      type="button"
      @click="cancelRename"
    >
      Cancel
    </button>
  </template>
</li>
      </ul>
    </section>

    <!-- Selected folder -->
    <section v-else>
      <h2>{{ selectedFolder.name }}</h2>

      <article
        v-for="item in items"
        :key="item.post"
        
      >
        <h3>
          {{ item.details.caption || "Untitled edit" }}
        </h3>

        <p>
          Video:
          <a
            :href="item.details.media"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ item.details.media }}
          </a>
        </p>

        <p>
          Cataloged by {{ item.details.user }}
        </p>

        <button
            type="button"
            @click="removePost(item.post)"
            >
            Remove from folder
            </button>
      </article>
    </section>
  </main>
</template>