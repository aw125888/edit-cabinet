import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { composition as accounts } from "../src/compositions/reusable/accounts.ts";
import { composition as passwords } from "../src/compositions/reusable/passwords.ts";
import { openTestDb, type TestDb } from "./test-db.ts";

let testDb: TestDb;
let app: ReturnType<typeof assemble>;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();

  app = assemble({
    conceptSet: applicationConceptSet,

    composition: {
      reusable: {
        accounts,
        passwords,
      },
    },

    instances: applicationConceptSet.implementations("mongo", {
      database: testDb.db,
    }),
  });
});

afterAll(async () => {
  await testDb.close();
});


test("a user can register and use their session", async () => {
  const registerResult = await app.invoker.invoke(
    "/auth/register",
    {
      username: "amber",
      password: "password123",
    },
  );

  expect(registerResult.ok).toBe(true);

  if (
    !registerResult.ok ||
    typeof registerResult.value !== "object" ||
    registerResult.value === null ||
    !("session" in registerResult.value) ||
    typeof registerResult.value.session !== "string"
  ) {
    throw new Error("Expected registration to return a session");
  }

  const session = registerResult.value.session;

  const meResult = await app.invoker.invoke("/auth/me", {
    session,
  });

  expect(meResult.ok).toBe(true);

  if (
    !meResult.ok ||
    typeof meResult.value !== "object" ||
    meResult.value === null ||
    !("username" in meResult.value)
  ) {
    throw new Error("Expected /auth/me to return a username");
  }

  expect(meResult.value.username).toBe("amber");
});

test("a registered user can sign in with their password", async () => {
  await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "password123",
  });

  const result = await app.invoker.invoke("/auth/login", {
    username: "amber",
    password: "password123",
  });

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("session" in result.value) ||
    typeof result.value.session !== "string"
  ) {
    throw new Error("Expected sign in to return a session");
  }
});


test("sign in rejects an incorrect password", async () => {
  await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "password123",
  });

  const result = await app.invoker.invoke("/auth/login", {
    username: "amber",
    password: "wrongpassword",
  });

  expect(result.ok).toBe(false);
});

test("registration rejects a duplicate username", async () => {
  await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "password123",
  });

  const result = await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "differentpassword",
  });

  expect(result.ok).toBe(false);
});

test("a user can sign out and the session can no longer be used", async () => {
  const registerResult = await app.invoker.invoke(
    "/auth/register",
    {
      username: "amber",
      password: "password123",
    },
  );

  if (
    !registerResult.ok ||
    typeof registerResult.value !== "object" ||
    registerResult.value === null ||
    !("session" in registerResult.value) ||
    typeof registerResult.value.session !== "string"
  ) {
    throw new Error("Expected registration to return a session");
  }

  const session = registerResult.value.session;

  const logoutResult = await app.invoker.invoke(
    "/auth/logout",
    {
      session,
    },
  );

  expect(logoutResult.ok).toBe(true);

  const meResult = await app.invoker.invoke("/auth/me", {
    session,
  });

  expect(meResult.ok).toBe(false);
});

test("registration rejects an invalid password", async () => {
  const result = await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "short",
  });

  expect(result.ok).toBe(false);
});

