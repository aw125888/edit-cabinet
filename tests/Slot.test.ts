import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { slotComposition } from "../src/compositions/Slot.ts";
import { openTestDb, type TestDb } from "./test-db.ts";
import { catalogComposition } from "../src/compositions/Catalog.ts";

import type {
  Folder,
  FolderItem,
} from "../src/concepts/Collecting.ts";

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
    ...catalogComposition,
    ...slotComposition,
  }, 
    initialize: {
      Posting: [testDb.db],
      Tagging: [testDb.db],
      Collecting: [testDb.db],
    },
  });
});

afterAll(async () => {
  await testDb.close();
});

test("slot creates a personal folder", async () => {
  const result = await app.invoker.invoke(
    "/slot/folder/create",
    {
      user: "amber",
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

  expect(storedFolder?.owner).toBe("amber");
  expect(storedFolder?.name).toBe("Spooky Weather 2027");
});

test("slot adds a post to a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      user: "amber",
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
    user: "amber",
    name: "Favorites",
  });

  await app.invoker.invoke("/slot/folder/create", {
    user: "amber",
    name: "Spooky Weather 2027",
  });

  // Make sure another user's folders aren't returned.
  await app.invoker.invoke("/slot/folder/create", {
    user: "someone-else",
    name: "Other Folder",
  });

  const result = await app.invoker.invoke("/slot/folders", {
    user: "amber",
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
  // 1. Create a real Post.
  const postResult = await app.invoker.invoke("/catalog/post", {
    user: "amber",
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

  // 2. Create a folder.
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      user: "amber",
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

  // 3. Slot the Post.
  const addResult = await app.invoker.invoke("/slot/add", {
    folder,
    post,
  });

  expect(addResult.ok).toBe(true);

  // 4. Read the folder back.
  const result = await app.invoker.invoke("/slot/folder", {
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
    user: "amber",
    media: "https://example.com/spooky-edit",
    caption: "Spooky edit",
  },
});
});


test("slot renames a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      user: "amber",
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
      folder,
      name: "New Name",
    },
  );

  expect(renameResult.ok).toBe(true);

  const foldersResult = await app.invoker.invoke(
    "/slot/folders",
    {
      user: "amber",
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
    folders: { folder: string; name: string }[];
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
      user: "amber",
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
    { folder },
  );

  expect(deleteResult.ok).toBe(true);

  const foldersResult = await app.invoker.invoke(
    "/slot/folders",
    {
      user: "amber",
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
    folders: { folder: string; name: string }[];
  };

  expect(
    value.folders.some((item) => item.folder === folder),
  ).toBe(false);
});

test("slot removes a post from a folder", async () => {
  const folderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      user: "amber",
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
    folder,
    post: "post-123",
  });

  const removeResult = await app.invoker.invoke(
    "/slot/remove",
    {
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