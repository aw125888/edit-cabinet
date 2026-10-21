<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "./api";

import HomeView from "./views/HomeView.vue";
import CatalogView from "./views/CatalogView.vue";
import SearchView from "./views/SearchView.vue";
import CabinetView from "./views/CabinetView.vue";
import AuthView from "./views/AuthView.vue";
import MyEditsView from "./views/MyEditsView.vue";

type View =
  | "home"
  | "catalog"
  | "search"
  | "cabinet"
  | "manage";

const currentView = ref<View>("home");

const username = ref<string | null>(null);
const checkingAuth = ref(true);
const menuOpen = ref(false);

async function checkAuth() {
  try {
    const result = await api.auth.me({});

    if ("error" in result) {
      username.value = null;
      return;
    }

    username.value = result.username;
  } catch (error) {
    console.error(error);
    username.value = null;
  } finally {
    checkingAuth.value = false;
  }
}

function authenticated(name: string) {
  username.value = name;
  currentView.value = "home";
}

function navigate(view: View) {
  currentView.value = view;
  menuOpen.value = false;
}

async function logout() {
  menuOpen.value = false;

  try {
    await api.auth.logout({});
  } catch (error) {
    console.error(error);
  } finally {
    username.value = null;
    currentView.value = "home";
  }
}

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <main
    v-if="checkingAuth"
    class="loading-page"
  >
    <p>Loading...</p>
  </main>

  <AuthView
    v-else-if="username === null"
    @authenticated="authenticated"
  />

  <div
    v-else
    class="authenticated-app"
  >
    <!-- Persistent account/navigation menu -->
    <nav class="account-nav">
      <button
        class="profile-toggle"
        type="button"
        aria-label="Open account menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="14"
            r="8"
          />

          <path
            d="M8 42c0-9 7-15 16-15s16 6 16 15"
          />
        </svg>
      </button>

      <div
        v-if="menuOpen"
        class="account-menu"
      >
        <p class="account-username">
          @{{ username }}
        </p>

        <button
          type="button"
          @click="navigate('cabinet')"
        >
          My Cabinet
        </button>

        <button
          type="button"
          @click="navigate('manage')"
        >
          My Edits
        </button>

        <button
          type="button"
          @click="logout"
        >
          Log Out
        </button>
      </div>
    </nav>

    <HomeView
      v-if="currentView === 'home'"
      @catalog="navigate('catalog')"
      @search="navigate('search')"
    />

    <CatalogView
      v-else-if="currentView === 'catalog'"
      @back="navigate('home')"
    />

    <SearchView
      v-else-if="currentView === 'search'"
      @back="navigate('home')"
    />

    <CabinetView
      v-else-if="currentView === 'cabinet'"
      @back="navigate('home')"
    />

    <MyEditsView
      v-else-if="currentView === 'manage'"
      @back="navigate('home')"
    />
  </div>
</template>

<style scoped>
.loading-page {
  width: 100%;
  min-height: 100vh;

  display: grid;
  place-items: center;
}

.authenticated-app {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

/* Persistent account menu */
.account-nav {
  position: fixed;
  top: 1.5rem;
  right: 1.75rem;
  z-index: 100;
}

.profile-toggle {
  width: 42px;
  height: 42px;

  display: grid;
  place-items: center;

  padding: 0;
  border: 0;
  background: transparent;

  color: #181818;
  cursor: pointer;

  transition: color 0.2s ease;
}

.profile-toggle svg {
  width: 38px;
  height: 38px;

  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.profile-toggle:hover,
.profile-toggle:focus-visible {
  color: pink;
}

.account-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;

  width: 190px;
  padding: 1.25rem;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;

  background: white;
  border: 1px solid #181818;
}

.account-username {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  font-style: italic;
  color: rgb(77, 77, 255);
}

.account-menu button {
  appearance: none;

  border: 0;
  padding: 0;

  background: transparent;

  font: inherit;
  font-size: 1rem;

  cursor: pointer;
}

.account-menu button:hover,
.account-menu button:focus-visible {
  color: pink;
}

.account-menu button:last-child:hover,
.account-menu button:last-child:focus-visible {
  color: red;
}

@media (max-width: 450px) {
  .account-nav {
    top: 1rem;
    right: 1rem;
  }

  .account-menu {
    width: 160px;
  }
}
</style>