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
    username: string;
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

const newFolderName = ref("");
const creatingFolder = ref(false);

async function loadFolders() {
  loading.value = true;
  message.value = "";

  try {
    const result = await api.slot.folders({});

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

async function createFolder() {
  const name = newFolderName.value.trim();

  if (!name || creatingFolder.value) {
    return;
  }

  creatingFolder.value = true;
  message.value = "";

  try {
    const result = await api.slot.folder.create({
      name,
    });

    if ("error" in result) {
      message.value = `Could not create folder: ${result.error}`;
      return;
    }

    newFolderName.value = "";

    await loadFolders();

    message.value = "Folder created.";
  } catch (error) {
    console.error(error);
    message.value = "Could not connect to the backend.";
  } finally {
    creatingFolder.value = false;
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

onMounted(() => {
  loadFolders();
});
</script>

<template>
  <main class="cabinet-page">
    <!-- BACK -->
    <button
      v-if="selectedFolder === null"
      class="back-button"
      type="button"
      @click="$emit('back')"
    >
      ← Home
    </button>

    <button
      v-else
      class="back-button"
      type="button"
      @click="backToFolders"
    >
      ← Back to folders
    </button>

    <!-- MAIN CABINET VIEW -->
    <template v-if="selectedFolder === null">
      <h1 class="page-title">
        My Cabinet:
      </h1>

      <p
        v-if="loading"
        class="status-message"
      >
        Loading...
      </p>

      <p
        v-if="message"
        class="status-message"
      >
        {{ message }}
      </p>

      <section class="folder-panel">
        <!-- CREATE -->
        <div class="create-folder-section">
          <p class="section-heading">
            Create New Folder:
          </p>

          <div class="create-folder-row">
            <input
              v-model="newFolderName"
              type="text"
              placeholder="New folder name"
              @keyup.enter="createFolder"
            />

            <button
              class="red-action"
              type="button"
              :disabled="
                creatingFolder ||
                !newFolderName.trim()
              "
              @click="createFolder"
            >
              {{
                creatingFolder
                  ? "Creating..."
                  : "Create Folder"
              }}
            </button>
          </div>
        </div>

        <!-- CURRENT FOLDERS -->
        <div class="current-folders">
          <p class="section-heading">
            Current Folders:
          </p>

          <p
            v-if="
              folders.length === 0 &&
              !loading
            "
            class="empty-message"
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
              class="folder-row"
            >
              <template
                v-if="
                  editingFolder !==
                  folder.folder
                "
              >
                <button
                  class="folder-name"
                  type="button"
                  @click="openFolder(folder)"
                >
                  {{ folder.name }}
                </button>

                <div class="folder-actions">
                  <button
                    class="blue-action"
                    type="button"
                    @click="startRename(folder)"
                  >
                    Rename
                  </button>

                  <button
                    class="red-action"
                    type="button"
                    @click="deleteFolder(folder)"
                  >
                    Delete
                  </button>
                </div>
              </template>

              <!-- RENAME -->
              <template v-else>
                <input
                  v-model="renameInput"
                  class="rename-input"
                  type="text"
                  @keyup.enter="
                    renameFolder(folder)
                  "
                />

                <div class="folder-actions">
                  <button
                    class="blue-action"
                    type="button"
                    @click="
                      renameFolder(folder)
                    "
                  >
                    Save
                  </button>

                  <button
                    class="plain-action"
                    type="button"
                    @click="cancelRename"
                  >
                    Cancel
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <!-- SELECTED FOLDER -->
    <template v-else>
      <h1 class="page-title folder-title">
        {{ selectedFolder.name }}:
      </h1>

      <p
        v-if="loading"
        class="status-message"
      >
        Loading...
      </p>

      <p
        v-if="message"
        class="status-message"
      >
        {{ message }}
      </p>

      <section
        v-if="items.length > 0"
        class="items-grid"
      >
        <div
          v-for="item in items"
          :key="item.post"
          class="item-wrapper"
        >
          <article class="cabinet-card">
            <!-- VIDEO -->
            <p class="card-line">
              <span class="card-label">
                Video:
              </span>

              <a
                class="video-link"
                :href="item.details.media"
                target="_blank"
                rel="noopener noreferrer"
              >
                Link
              </a>
            </p>

            <!-- CAPTION -->
            <p class="card-line">
              <span class="card-label">
                Caption:
              </span>

              <span class="card-content">
                {{
                  item.details.caption ||
                  "Untitled edit"
                }}
              </span>
            </p>

            <!-- CATALOGER -->
            <p class="card-line cataloger-line">
              <span class="card-label">
                Cataloged By:
              </span>

              <span class="cataloger">
                @{{ item.details.username }}
              </span>
            </p>
          </article>

          <!-- REMOVE OUTSIDE CARD -->
          <button
            class="remove-post"
            type="button"
            @click="removePost(item.post)"
          >
            Remove from folder
          </button>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.cabinet-page {
  position: relative;

  width: 100%;
  min-height: 100vh;

  padding: 2rem 4rem 4rem;
}

/* ==============================
   BACK
   ============================== */

.back-button {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
}

/* ==============================
   TITLE
   ============================== */

.page-title {
  margin: 2rem 0 3rem;

  text-align: center;

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

.status-message {
  margin: -1.5rem 0 1.5rem;

  text-align: center;

  font-size: 0.85rem;
}

/* ==============================
   FOLDER MANAGEMENT
   ============================== */

.folder-panel {
  width: min(90vw, 500px);

  margin: 0 auto;
}

.create-folder-section {
  margin-bottom: 2rem;
}

.section-heading {
  margin: 0 0 0.5rem;

  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 1rem;
  font-weight: 400;
}

.create-folder-row {
  display: flex;
  align-items: center;

  gap: 1rem;
}

.create-folder-row input {
  width: 220px;
}

.current-folders {
  margin-top: 1rem;
}

.empty-message {
  margin: 0.5rem 0;

  font-size: 0.85rem;
}

/* ==============================
   FOLDER LIST
   ============================== */

.folder-list {
  margin: 0.5rem 0 0;
  padding: 0;

  list-style: none;
}

.folder-row {
  min-height: 2.25rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  padding: 0.45rem 0;

  border-bottom: 1px solid #d5d5d5;
}

.folder-name {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 0.9rem;

  cursor: pointer;
}

.folder-name:hover,
.folder-name:focus-visible {
  color: pink;
}

.folder-actions {
  display: flex;
  align-items: center;

  gap: 0.8rem;
}

.rename-input {
  width: 220px;
}

/* ==============================
   TEXT ACTIONS
   ============================== */

.red-action,
.blue-action,
.plain-action {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.red-action {
  color: red;
}

.blue-action {
  color: blue;
}

.plain-action {
  color: #181818;
}

.red-action:hover,
.red-action:focus-visible,
.blue-action:hover,
.blue-action:focus-visible,
.plain-action:hover,
.plain-action:focus-visible {
  text-decoration: underline;
}

.red-action:disabled {
  opacity: 0.4;

  cursor: default;
  text-decoration: none;
}

/* ==============================
   FOLDER CONTENTS
   ============================== */

.folder-title {
  margin-bottom: 3rem;
}

.items-grid {
  width: min(100%, 1000px);

  margin: 0 auto;

  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  align-items: start;

  gap: 2rem 1.5rem;
}

.item-wrapper {
  min-width: 0;
}

.cabinet-card {
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

.card-line {
  margin: 0 0 0.55rem;
}

.card-line:last-child {
  margin-bottom: 0;
}

.card-label {
  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 1rem;
  font-weight: 400;
}

.card-content {
  margin-left: 0.2rem;

  font-size: 0.85rem;
}

.video-link {
  margin-left: 0.2rem;

  font-size: 0.85rem;
}

.cataloger {
  margin-left: 0.2rem;

  font-size: 0.85rem;
  font-style: italic;

  color: blue;
}

/* ==============================
   REMOVE
   ============================== */

.remove-post {
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

.remove-post:hover,
.remove-post:focus-visible {
  text-decoration: underline;
}

/* ==============================
   RESPONSIVE
   ============================== */

@media (max-width: 900px) {
  .cabinet-page {
    padding: 2rem;
  }

  .items-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .cabinet-page {
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

  .folder-panel {
    width: 100%;
  }

  .create-folder-row {
    align-items: flex-start;
    flex-direction: column;

    gap: 0.5rem;
  }

  .folder-row {
    align-items: flex-start;
    flex-direction: column;

    gap: 0.4rem;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style>