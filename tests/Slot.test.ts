import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { slotComposition } from "../src/compositions/Slot.ts";
import { catalogComposition } from "../src/compositions/Catalog.ts";
import { composition as accounts } from "../src/compositions/reusable/accounts.ts";
import { composition as passwords } from "../src/compositions/reusable/passwords.ts";
import { openTestDb, type TestDb } from "./test-db.ts";

import type {
  Folder,
  FolderItem,
} from "../src/concepts/Collecting.ts";

let testDb: TestDb;
let app: ReturnType<typeof assemble>;

let amberSession: string;
let amberUser: string;
let bobSession: string;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();

  app = assemble({
    conceptSet: applicationConceptSet,

    composition: {
      ...catalogComposition,
      ...slotComposition,

      reusable: {
        accounts,
        passwords,
      },
    },

    instances: applicationConceptSet.implementations("mongo", {
      database: testDb.db,
    }),
  });

  const amberResult = await app.invoker.invoke("/auth/register", {
    username: "amber",
    password: "password123",
  });

  if (
    !amberResult.ok ||
    typeof amberResult.value !== "object" ||
    amberResult.value === null ||
    !("session" in amberResult.value) ||
    typeof amberResult.value.session !== "string" ||
    !("user" in amberResult.value) ||
    typeof amberResult.value.user !== "string"
  ) {
    throw new Error("Expected Amber registration to succeed");
  }

  amberSession = amberResult.value.session;
  amberUser = amberResult.value.user;

  const bobResult = await app.invoker.invoke("/auth/register", {
    username: "bob",
    password: "password123",
  });

  if (
    !bobResult.ok ||
    typeof bobResult.value !== "object" ||
    bobResult.value === null ||
    !("session" in bobResult.value) ||
    typeof bobResult.value.session !== "string"
  ) {
    throw new Error("Expected Bob registration to succeed");
  }

  bobSession = bobResult.value.session;
});

afterAll(async () => {
  await testDb.close();
});

test("slot creates a personal folder", async () => {
  const result = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Spooky Weather 2027",
    },
  );

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("folder" in result.value) ||
    typeof result.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = result.value.folder;

  const storedFolder = await testDb.db
    .collection<Folder<string>>("collecting.folders")
    .findOne({ _id: folder });

  expect(storedFolder?.owner).toBe(amberUser);
  expect(storedFolder?.name).toBe("Spooky Weather 2027");
});

test("slot adds a post to a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Spooky Weather 2027",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = folderResult.value.folder;

  const result = await app.invoker.invoke("/slot/add", {
    session: amberSession,
    folder,
    post: "post-123",
  });

  expect(result.ok).toBe(true);

  const storedEntry = await testDb.db
    .collection<FolderItem<string>>("collecting.folderItems")
    .findOne({
      folder,
      item: "post-123",
    });

  expect(storedEntry).not.toBeNull();
});

test("slot returns all folders for a user", async () => {
  await app.invoker.invoke("/slot/folder/create", {
    session: amberSession,
    name: "Favorites",
  });

  await app.invoker.invoke("/slot/folder/create", {
    session: amberSession,
    name: "Spooky Weather 2027",
  });

  // Bob's folder should not appear in Amber's cabinet.
  await app.invoker.invoke("/slot/folder/create", {
    session: bobSession,
    name: "Other Folder",
  });

  const result = await app.invoker.invoke("/slot/folders", {
    session: amberSession,
  });

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("result" in result.value)
  ) {
    throw new Error("Expected Slot to return folders");
  }

  const value = result.value.result as {
    folders: {
      folder: string;
      name: string;
    }[];
  };

  expect(value.folders).toHaveLength(2);

  expect(value.folders.map((folder) => folder.name)).toEqual(
    expect.arrayContaining([
      "Favorites",
      "Spooky Weather 2027",
    ]),
  );
});

test("slot returns the post details inside a folder", async () => {
  const postResult = await app.invoker.invoke("/catalog/post", {
    session: amberSession,
    media: "https://example.com/spooky-edit",
    caption: "Spooky edit",
  });

  if (
    !postResult.ok ||
    typeof postResult.value !== "object" ||
    postResult.value === null ||
    !("post" in postResult.value) ||
    typeof postResult.value.post !== "string"
  ) {
    throw new Error("Expected Catalog to return a post");
  }

  const post = postResult.value.post;

  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Spooky Weather 2027",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = folderResult.value.folder;

  const addResult = await app.invoker.invoke("/slot/add", {
    session: amberSession,
    folder,
    post,
  });

  expect(addResult.ok).toBe(true);

  const result = await app.invoker.invoke("/slot/folder", {
    session: amberSession,
    folder,
  });

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("result" in result.value)
  ) {
    throw new Error("Expected Slot to return folder contents");
  }

  const folderContents = result.value.result as {
    items: {
      post: string;
      details: {
        user: string;
        media: string;
        caption: string;
      };
    }[];
  };

  expect(folderContents.items).toHaveLength(1);

  expect(folderContents.items[0]).toEqual({
    post,
    details: {
      user: amberUser,
      media: "https://example.com/spooky-edit",
      caption: "Spooky edit",
    },
  });
});

test("slot renames a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Old Name",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = folderResult.value.folder;

  const renameResult = await app.invoker.invoke(
    "/slot/folder/rename",
    {
      session: amberSession,
      folder,
      name: "New Name",
    },
  );

  expect(renameResult.ok).toBe(true);

  const foldersResult = await app.invoker.invoke(
    "/slot/folders",
    {
      session: amberSession,
    },
  );

  expect(foldersResult.ok).toBe(true);

  if (
    !foldersResult.ok ||
    typeof foldersResult.value !== "object" ||
    foldersResult.value === null ||
    !("result" in foldersResult.value)
  ) {
    throw new Error("Expected Slot to return folders");
  }

  const value = foldersResult.value.result as {
    folders: {
      folder: string;
      name: string;
    }[];
  };

  expect(value.folders).toContainEqual({
    folder,
    name: "New Name",
  });
});

test("slot deletes a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Delete Me",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = folderResult.value.folder;

  const deleteResult = await app.invoker.invoke(
    "/slot/folder/delete",
    {
      session: amberSession,
      folder,
    },
  );

  expect(deleteResult.ok).toBe(true);

  const foldersResult = await app.invoker.invoke(
    "/slot/folders",
    {
      session: amberSession,
    },
  );

  if (
    !foldersResult.ok ||
    typeof foldersResult.value !== "object" ||
    foldersResult.value === null ||
    !("result" in foldersResult.value)
  ) {
    throw new Error("Expected Slot to return folders");
  }

  const value = foldersResult.value.result as {
    folders: {
      folder: string;
      name: string;
    }[];
  };

  expect(
    value.folders.some((item) => item.folder === folder),
  ).toBe(false);
});

test("slot removes a post from a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Favorites",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Slot to return a folder");
  }

  const folder = folderResult.value.folder;

  await app.invoker.invoke("/slot/add", {
    session: amberSession,
    folder,
    post: "post-123",
  });

  const removeResult = await app.invoker.invoke(
    "/slot/remove",
    {
      session: amberSession,
      folder,
      post: "post-123",
    },
  );

  expect(removeResult.ok).toBe(true);

  const storedEntry = await testDb.db
    .collection<FolderItem<string>>("collecting.folderItems")
    .findOne({
      folder,
      item: "post-123",
    });

  expect(storedEntry).toBeNull();
});

test("a user cannot access another user's folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Private Folder",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const folder = folderResult.value.folder;

  const result = await app.invoker.invoke("/slot/folder", {
    session: bobSession,
    folder,
  });

  expect(result.ok).toBe(false);
});

test("a user cannot add a post to another user's folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Add Test",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const folder = folderResult.value.folder;

  const result = await app.invoker.invoke("/slot/add", {
    session: bobSession,
    folder,
    post: "post-123",
  });

  expect(result.ok).toBe(false);

  const storedEntry = await testDb.db
    .collection<FolderItem<string>>("collecting.folderItems")
    .findOne({
      folder,
      item: "post-123",
    });

  expect(storedEntry).toBeNull();
});

test("a user cannot remove a post from another user's folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Remove Test",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const folder = folderResult.value.folder;

  const addResult = await app.invoker.invoke("/slot/add", {
    session: amberSession,
    folder,
    post: "post-123",
  });

  expect(addResult.ok).toBe(true);

  const result = await app.invoker.invoke("/slot/remove", {
    session: bobSession,
    folder,
    post: "post-123",
  });

  expect(result.ok).toBe(false);

  // Make sure Bob's failed request did not actually remove it.
  const storedEntry = await testDb.db
    .collection<FolderItem<string>>("collecting.folderItems")
    .findOne({
      folder,
      item: "post-123",
    });

  expect(storedEntry).not.toBeNull();
});

test("a user cannot rename another user's folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Original Name",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const folder = folderResult.value.folder;

  const result = await app.invoker.invoke(
    "/slot/folder/rename",
    {
      session: bobSession,
      folder,
      name: "Bob Was Here",
    },
  );

  expect(result.ok).toBe(false);

  // Make sure the failed request did not change Amber's folder.
  const storedFolder = await testDb.db
    .collection<Folder<string>>("collecting.folders")
    .findOne({
      _id: folder,
    });

  expect(storedFolder?.name).toBe("Amber Original Name");
  expect(storedFolder?.owner).toBe(amberUser);
});

test("a user cannot delete another user's folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Keep This",
    },
  );

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const folder = folderResult.value.folder;

  const result = await app.invoker.invoke(
    "/slot/folder/delete",
    {
      session: bobSession,
      folder,
    },
  );

  expect(result.ok).toBe(false);

  // Make sure the failed request did not delete Amber's folder.
  const storedFolder = await testDb.db
    .collection<Folder<string>>("collecting.folders")
    .findOne({
      _id: folder,
    });

  expect(storedFolder).not.toBeNull();
  expect(storedFolder?.owner).toBe(amberUser);
});