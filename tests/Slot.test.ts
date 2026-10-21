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
        username: string;
        media: string;
        caption: string;
      };
    }[];
  };

  expect(folderContents.items).toHaveLength(1);

  expect(folderContents.items[0]).toEqual({
    post,
    details: {
      username: "amber",
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

test("deleting one folder preserves the user's other folders", async () => {
  const firstResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Folder A",
    },
  );

  const secondResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Folder B",
    },
  );

  const thirdResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Folder C",
    },
  );

  expect(firstResult.ok).toBe(true);
  expect(secondResult.ok).toBe(true);
  expect(thirdResult.ok).toBe(true);

  if (
    !secondResult.ok ||
    typeof secondResult.value !== "object" ||
    secondResult.value === null ||
    !("folder" in secondResult.value) ||
    typeof secondResult.value.folder !== "string"
  ) {
    throw new Error("Expected Folder B to be created");
  }

  const folderB = secondResult.value.folder;

  const deleteResult = await app.invoker.invoke(
    "/slot/folder/delete",
    {
      session: amberSession,
      folder: folderB,
    },
  );

  expect(deleteResult.ok).toBe(true);

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
    throw new Error("Expected folders result");
  }

  const result = foldersResult.value.result as {
    folders: {
      folder: string;
      name: string;
    }[];
  };

expect(result.folders).toHaveLength(2);

expect(
  result.folders.map((folder) => folder.name),
).toEqual(
  expect.arrayContaining([
    "Folder A",
    "Folder C",
  ]),
);
});

test("creating a duplicate folder returns FOLDER_NAME_TAKEN", async () => {
  const first = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Duplicate Test Folder",
    },
  );

  expect(first.ok).toBe(true);

  const duplicate = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Duplicate Test Folder",
    },
  );

  expect(duplicate.ok).toBe(false);

  if (duplicate.ok) {
    throw new Error(
      "Expected duplicate folder creation to fail",
    );
  }

  expect(duplicate.error.kind).toBe("domain");

  if (duplicate.error.kind !== "domain") {
    throw new Error(
      "Expected a domain error",
    );
  }

 expect(duplicate.error.value).toBe(
  "FOLDER_NAME_TAKEN",
);
});

test("adding the same post to a folder twice returns ALREADY_IN_FOLDER", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Duplicate Slot Test",
    },
  );

  expect(folderResult.ok).toBe(true);

  if (
    !folderResult.ok ||
    typeof folderResult.value !== "object" ||
    folderResult.value === null ||
    !("folder" in folderResult.value) ||
    typeof folderResult.value.folder !== "string"
  ) {
    throw new Error(
      "Expected folder creation to return a folder",
    );
  }

  const folder = folderResult.value.folder;

  const postResult = await app.invoker.invoke(
    "/catalog/post",
    {
      session: amberSession,
      media: "https://example.com/duplicate-slot.mp4",
      caption: "Duplicate slot test",
    },
  );

  expect(postResult.ok).toBe(true);

  if (
    !postResult.ok ||
    typeof postResult.value !== "object" ||
    postResult.value === null ||
    !("post" in postResult.value) ||
    typeof postResult.value.post !== "string"
  ) {
    throw new Error(
      "Expected catalog to return a post",
    );
  }

  const post = postResult.value.post;

  // First add should succeed.
  const firstAdd = await app.invoker.invoke(
    "/slot/add",
    {
      session: amberSession,
      folder,
      post,
    },
  );

  expect(firstAdd.ok).toBe(true);

  // Same Post + same folder should now give
  // our friendly domain error.
  const duplicateAdd = await app.invoker.invoke(
    "/slot/add",
    {
      session: amberSession,
      folder,
      post,
    },
  );

  expect(duplicateAdd.ok).toBe(false);

  if (duplicateAdd.ok) {
    throw new Error(
      "Expected duplicate slot to fail",
    );
  }

  expect(duplicateAdd.error.kind).toBe("domain");

  if (duplicateAdd.error.kind !== "domain") {
    throw new Error(
      "Expected a domain error",
    );
  }

  expect(duplicateAdd.error.value).toBe(
    "ALREADY_IN_FOLDER",
  );

  // Make sure the failed second request did not
  // change the folder's contents.
  const folderContents = await app.invoker.invoke(
    "/slot/folder",
    {
      session: amberSession,
      folder,
    },
  );

  expect(folderContents.ok).toBe(true);

  if (
    !folderContents.ok ||
    typeof folderContents.value !== "object" ||
    folderContents.value === null ||
    !("result" in folderContents.value)
  ) {
    throw new Error(
      "Expected folder contents",
    );
  }

  const result = folderContents.value.result as {
    items: {
      post: string;
    }[];
  };

  expect(result.items).toHaveLength(1);
  expect(result.items[0]?.post).toBe(post);
});

test("renaming a folder to an existing folder name returns FOLDER_NAME_TAKEN", async () => {
  const firstResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Rename Source",
    },
  );

  const secondResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Rename Target",
    },
  );

  expect(firstResult.ok).toBe(true);
  expect(secondResult.ok).toBe(true);

  if (
    !firstResult.ok ||
    typeof firstResult.value !== "object" ||
    firstResult.value === null ||
    !("folder" in firstResult.value) ||
    typeof firstResult.value.folder !== "string"
  ) {
    throw new Error(
      "Expected first folder creation to succeed",
    );
  }

  const firstFolder = firstResult.value.folder;

  const renameResult = await app.invoker.invoke(
    "/slot/folder/rename",
    {
      session: amberSession,
      folder: firstFolder,
      name: "Rename Target",
    },
  );

  expect(renameResult.ok).toBe(false);

  if (renameResult.ok) {
    throw new Error(
      "Expected duplicate folder rename to fail",
    );
  }

  expect(renameResult.error.kind).toBe("domain");

  if (renameResult.error.kind !== "domain") {
    throw new Error(
      "Expected a domain error",
    );
  }

  expect(renameResult.error.value).toBe(
    "FOLDER_NAME_TAKEN",
  );

  /*
   * Verify the failed rename did not change
   * either folder.
   */
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
    throw new Error(
      "Expected folder list",
    );
  }

  const result = foldersResult.value.result as {
    folders: {
      folder: string;
      name: string;
    }[];
  };

  expect(
    result.folders.map((folder) => folder.name),
  ).toEqual(
    expect.arrayContaining([
      "Rename Source",
      "Rename Target",
    ]),
  );
});