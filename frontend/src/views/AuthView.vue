<script setup lang="ts">
import { ref } from "vue";
import { api } from "../api";

const emit = defineEmits<{
  authenticated: [username: string];
}>();

const username = ref("");
const password = ref("");
const mode = ref<"login" | "register">("login");
const submitting = ref(false);
const message = ref("");

async function submit() {
  const cleanUsername = username.value.trim();

  if (!cleanUsername || !password.value) {
    message.value = "Enter a username and password.";
    return;
  }

  submitting.value = true;
  message.value = "";

  try {
    const result =
      mode.value === "register"
        ? await api.auth.register({
            username: cleanUsername,
            password: password.value,
          })
        : await api.auth.login({
            username: cleanUsername,
            password: password.value,
          });

    if ("error" in result) {
      if (result.error === "UNAUTHORIZED") {
        message.value = "The username or password is incorrect.";
      } else if (result.error === "CONFLICT") {
        message.value = "That username is already taken.";
      } else {
        message.value = `Could not ${
          mode.value === "register" ? "register" : "sign in"
        }: ${result.error}`;
      }

      return;
    }

    const me = await api.auth.me({});

    if ("error" in me) {
      message.value = "Signed in, but could not load your account.";
      return;
    }

    password.value = "";
    emit("authenticated", me.username);
  } catch (error) {
    console.error(error);
    message.value = "Could not connect to the backend.";
  } finally {
    submitting.value = false;
  }
}

function switchMode() {
  mode.value = mode.value === "login" ? "register" : "login";
  password.value = "";
  message.value = "";
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel">
      <h1 class="auth-logo">
        Edit Cabinet
      </h1>

      <p class="auth-instruction">
        {{
          mode === "login"
            ? "Enter your information below:"
            : "Create your account below:"
        }}
      </p>

      <form
        class="auth-form"
        @submit.prevent="submit"
      >
        <div class="auth-field">
          <label for="username">
            Username:
          </label>

          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            minlength="3"
            maxlength="32"
            required
          />
        </div>

        <div class="auth-field">
          <label for="password">
            Password:
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            :autocomplete="
              mode === 'register'
                ? 'new-password'
                : 'current-password'
            "
            minlength="8"
            maxlength="128"
            required
          />
        </div>

        <button
          class="auth-submit"
          type="submit"
          :disabled="submitting"
        >
          {{
            submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"
          }}
        </button>
      </form>

      <p
        v-if="message"
        class="auth-message"
      >
        {{ message }}
      </p>

      <p class="auth-switch">
        <template v-if="mode === 'login'">
          Need an account?
          <button
            class="auth-switch-button"
            type="button"
            @click="switchMode"
          >
            Register
          </button>
        </template>

        <template v-else>
          Already have an account?
          <button
            class="auth-switch-button"
            type="button"
            @click="switchMode"
          >
            Sign in
          </button>
        </template>
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  width: 100%;
  min-height: 100vh;

  display: grid;
  place-items: center;
}
.auth-panel {
  width: min(90vw, 360px);
  text-align: center;
}

/* Brand */
.auth-logo {
  margin: 0 0 0.45rem;
  font-family: "Montella", serif;
  font-size: 3.75rem;
  font-weight: normal;
  line-height: 1;
}

.auth-logo:hover {
  color: pink;
}
/* Enter your information below */
.auth-instruction {
  margin: 0 0 0.8rem;
  font-size: 0.9rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.auth-field {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.auth-field label {
  width: 78px;
  flex-shrink: 0;
  text-align: right;
}

.auth-field input {
  width: 180px;
  min-width: 0;
  box-sizing: border-box;
}

.auth-submit {
  align-self: center;
  margin-top: 0.25rem;
}

.auth-message {
  margin: 0.5rem 0 0;
  text-align: center;
}

.auth-switch {
  margin: 0.55rem 0 0;
  text-align: center;
}

.auth-switch-button {
  appearance: none;
  border: 0;
  padding: 0;
  margin-left: 0.15rem;

  background: none;
  color: green;

  font: inherit;
  cursor: pointer;
}

.auth-switch-button:hover,
.auth-switch-button:focus-visible {
  text-decoration: underline;
}

@media (max-width: 450px) {
  .auth-panel {
    width: 90vw;
  }

  .auth-logo {
    font-size: 2rem;
  }

  .auth-field label {
    width: 72px;
  }

  .auth-field input {
    width: 160px;
  }
}
</style>