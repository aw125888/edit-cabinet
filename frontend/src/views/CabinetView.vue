<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";

import { api } from "../api";
import folderImage from "../assets/folders.jpg";

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

type MessageType =
  | "normal"
  | "success"
  | "delete"
  | "error";

const folders = ref<Folder[]>([]);
const selectedFolder = ref<Folder | null>(null);
const items = ref<CabinetItem[]>([]);

const message = ref("");
const messageType =
  ref<MessageType>("normal");
const messageVisible = ref(false);

const loading = ref(false);

const editingFolder =
  ref<string | null>(null);
const renameInput = ref("");

const newFolderName = ref("");
const creatingFolder = ref(false);

let messageTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

let fadeTimer:
  | ReturnType<typeof setTimeout>
  | undefined;

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
  type: "normal" | "error" = "normal",
) {
  clearMessageTimers();

  message.value = text;
  messageType.value = type;
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

function friendlyError(error: string) {
  switch (error) {
    case "FORBIDDEN":
      return "You don't have permission to do that.";

    case "UNAUTHORIZED":
      return "Please sign in again.";

    case "INVALID_REQUEST":
      return "That request could not be completed.";
    
    case "CONFLICT":
      return "This video has already been cataloged.";

    default:
      return "Something went wrong. Please try again.";
  }
}

/* ==============================
   FOLDERS
   ============================== */

async function loadFolders(
  preserveMessage = false,
) {
  loading.value = true;

  if (!preserveMessage) {
    clearMessage();
  }

  try {
    const result =
      await api.slot.folders({});

    if ("error" in result) {
      showPermanentMessage(
        friendlyError(result.error),
        "error",
      );

      return;
    }

    folders.value =
      result.result.folders;

    if (
      folders.value.length === 0 &&
      !preserveMessage
    ) {
      showPermanentMessage(
        "You don't have any folders yet.",
      );
    }
  } catch (error) {
    console.error(error);

    showPermanentMessage(
      "Could not connect to the backend.",
      "error",
    );
  } finally {
    loading.value = false;
  }
}

async function createFolder() {
  const name =
    newFolderName.value.trim();

  if (!name || creatingFolder.value) {
    return;
  }

  creatingFolder.value = true;
  clearMessage();

  try {
    const result =
      await api.slot.folder.create({
        name,
      });

    if ("error" in result) {
      if (result.error === "CONFLICT") {
        showPermanentMessage(
          "You already have a folder with that name.",
          "error",
        );
      } else {
        showPermanentMessage(
          friendlyError(result.error),
          "error",
        );
      }

      return;
    }

    newFolderName.value = "";

    await loadFolders(true);

    showTemporaryMessage(
      "Folder created.",
      "success",
    );
  } catch (error) {
    console.error(error);

    showPermanentMessage(
      "Could not connect to the backend.",
      "error",
    );
  } finally {
    creatingFolder.value = false;
  }
}

async function openFolder(
  folder: Folder,
) {
  loading.value = true;
  clearMessage();

  try {
    const result =
      await api.slot.folder({
        folder: folder.folder,
      });

    if ("error" in result) {
      showPermanentMessage(
        friendlyError(result.error),
        "error",
      );

      return;
    }

    selectedFolder.value = folder;
    items.value =
      result.result.items;

    if (items.value.length === 0) {
      showPermanentMessage(
        "This folder is empty.",
      );
    }
  } catch (error) {
    console.error(error);

    showPermanentMessage(
      "Could not connect to the backend.",
      "error",
    );
  } finally {
    loading.value = false;
  }
}

function backToFolders() {
  selectedFolder.value = null;
  items.value = [];

  clearMessage();
}

async function removePost(
  post: string,
) {
  if (selectedFolder.value === null) {
    return;
  }

  const folder =
    selectedFolder.value;

  const result =
    await api.slot.remove({
      folder: folder.folder,
      post,
    });

  if ("error" in result) {
    showPermanentMessage(
      friendlyError(result.error),
      "error",
    );

    return;
  }

  await openFolder(folder);

  showTemporaryMessage(
    "Edit removed.",
    "delete",
  );
}

/* ==============================
   RENAME
   ============================== */

function startRename(
  folder: Folder,
) {
  editingFolder.value =
    folder.folder;

  renameInput.value =
    folder.name;

  clearMessage();
}

function cancelRename() {
  editingFolder.value = null;
  renameInput.value = "";
}

async function renameFolder(
  folder: Folder,
) {
  const name =
    renameInput.value.trim();

  if (!name) {
    return;
  }

  const result =
    await api.slot.folder.rename({
      folder: folder.folder,
      name,
    });

  if ("error" in result) {
    if (result.error === "CONFLICT") {
      showPermanentMessage(
        "You already have a folder with that name.",
        "error",
      );
    } else {
      showPermanentMessage(
        friendlyError(result.error),
        "error",
      );
    }

    return;
  }

  editingFolder.value = null;
  renameInput.value = "";

  await loadFolders(true);

  showTemporaryMessage(
    "Folder renamed.",
    "success",
  );
}

/* ==============================
   DELETE
   ============================== */

async function deleteFolder(
  folder: Folder,
) {
  const result =
    await api.slot.folder.delete({
      folder: folder.folder,
    });

  if ("error" in result) {
    showPermanentMessage(
      friendlyError(result.error),
      "error",
    );

    return;
  }

  await loadFolders(true);

  showTemporaryMessage(
    "Folder deleted.",
    "delete",
  );
}

onMounted(() => {
  loadFolders();
});

onBeforeUnmount(() => {
  clearMessageTimers();
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

    <!-- =========================
         MAIN COLLECTIONS VIEW
         ========================= -->
    <template
      v-if="selectedFolder === null"
    >
      <!-- DECORATIVE IMAGE -->
      <img
        class="folder-image"
        :src="folderImage"
        alt=""
        aria-hidden="true"
      />

      <div class="collections-content">
        <h1 class="page-title">
          Slotted By Me:
        </h1>

        <!--
          Reserved space means reactions can
          appear/fade without moving the content.
        -->
        <div class="status-area">
          <p
            v-if="loading"
            class="status-message"
          >
            Loading...
          </p>

          <p
            v-else-if="message"
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

        <section class="folder-panel">
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
                  <span class="folder-name">
                    {{ folder.name }}
                  </span>

                  <div class="folder-actions">
                    <button
                      class="purple-action"
                      type="button"
                      @click="
                        openFolder(folder)
                      "
                    >
                      Inspect
                    </button>

                    <button
                      class="blue-action"
                      type="button"
                      @click="
                        startRename(folder)
                      "
                    >
                      Rename
                    </button>

                    <button
                      class="red-action"
                      type="button"
                      @click="
                        deleteFolder(folder)
                      "
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
                    maxlength="50"
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

          <!-- CREATE BELOW CURRENT FOLDERS -->
          <div class="create-folder-section">
            <p class="section-heading">
              Create New Folder:
            </p>

            <div class="create-folder-row">
              <input
                v-model="newFolderName"
                type="text"
                maxlength="50"
                placeholder="New folder name"
                @keyup.enter="createFolder"
              />

              <button
                class="green-action"
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
        </section>
      </div>
    </template>

    <!-- =========================
         SELECTED FOLDER
         ========================= -->
    <template v-else>
      <h1
        class="page-title folder-title"
      >
        {{ selectedFolder.name }}:
      </h1>

      <div class="status-area">
        <p
          v-if="loading"
          class="status-message"
        >
          Loading...
        </p>

        <p
          v-else-if="message"
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
            <p class="card-line">
              <span class="card-label">
                Cataloged By:
              </span>

              <span class="cataloger">
                @{{ item.details.username }}
              </span>
            </p>
          </article>

          <button
            class="remove-post"
            type="button"
            @click="
              removePost(item.post)
            "
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

  z-index: 5;
}

/* ==============================
   MAIN COLLECTIONS LAYOUT
   ============================== */

.collections-content {
  position: relative;

  z-index: 1;

  width: min(90vw, 560px);

  margin: 0 auto;
}

/*
 * Decorative folder image on the left,
 * vertically centered in the viewport.
 */
.folder-image {
  position: fixed;

  top: 50%;
  left: 5rem;

  width: min(25vw, 330px);
  max-height: 65vh;

  object-fit: contain;

  transform: translateY(-50%);

  pointer-events: none;
}

/* ==============================
   TITLE
   ============================== */

.page-title {
  margin: 2rem 0 1.5rem;

  text-align: center;

  color: rgb(239, 14, 160);

  font-family: "Montella", serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1;
}

/* ==============================
   STATUS
   ============================== */

/*
 * Permanent reserved space.
 * Messages can fade without shifting
 * the folder panel up or down.
 */
.status-area {
  height: 2.5rem;

  margin: 0 0 1rem;

  display: flex;
  align-items: center;
  justify-content: center;
}

.status-message {
  margin: 0;

  text-align: center;

  font-size: 0.85rem;

  opacity: 1;

  transition: opacity 0.8s ease;
}

.status-normal {
  color: #181818;
}

.status-success {
  color: green;
}

.status-delete {
  color: red;
}

.status-error {
  color: red;
}

.status-hidden {
  opacity: 0;
}

/* ==============================
   FOLDER MANAGEMENT
   ============================== */

.folder-panel {
  width: min(90vw, 500px);

  margin: 0 auto;
}

.current-folders {
  margin: 0;
}

.create-folder-section {
  margin-top: 2rem;
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
  min-width: 0;

  font-size: 0.9rem;

  overflow-wrap: anywhere;
}

.folder-actions {
  display: flex;
  align-items: center;

  flex-shrink: 0;

  gap: 0.8rem;
}

.rename-input {
  width: 220px;
}

/* ==============================
   TEXT ACTIONS
   ============================== */

.red-action,
.green-action,
.blue-action,
.purple-action,
.plain-action {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.purple-action {
  color: purple;
}

.blue-action {
  color: blue;
}

.red-action {
  color: red;
}

.green-action {
  color:green;
}


.plain-action {
  color: #181818;
}

.red-action:hover,
.red-action:focus-visible,
.green-action:hover,
.green-action:focus-visible,
.blue-action:hover,
.blue-action:focus-visible,
.purple-action:hover,
.purple-action:focus-visible,
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
  margin-bottom: 1.5rem;
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

  color: blue;

  font-size: 0.85rem;
  font-style: italic;
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

@media (max-width: 1100px) {
  .folder-image {
    left: 2rem;

    width: min(22vw, 240px);
  }

  .collections-content {
    margin-left: auto;
    margin-right: 5%;
  }
}

@media (max-width: 900px) {
  .cabinet-page {
    padding: 2rem;
  }

  .folder-image {
    display: none;
  }

  .collections-content {
    margin: 0 auto;
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

  .folder-row {
    align-items: flex-start;
    flex-direction: column;

    gap: 0.4rem;
  }

  .folder-actions {
    flex-wrap: wrap;
  }

  .create-folder-row {
    align-items: flex-start;
    flex-direction: column;

    gap: 0.5rem;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style>