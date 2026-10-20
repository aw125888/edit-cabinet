import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";

import { CollectingConcept } from "../src/concepts/Collecting.ts";
import { openTestDb, type TestDb } from "./test-db.ts";

let testDb: TestDb;
let collecting: CollectingConcept<string, string>;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();

  collecting = new CollectingConcept<string, string>(
    testDb.db,
  );
});

afterAll(async () => {
  await testDb.close();
});


test("a user can create a folder and add an item to it", async () => {
  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Spooky Weather 2027",
  });

  await collecting.addToFolder({
    folder,
    item: "post-123",
  });

  const folders = await collecting._foldersFor({
    user: "amber",
  });

  expect(folders).toEqual([
    {
      folder,
      name: "Spooky Weather 2027",
    },
  ]);

  const items = await collecting._itemsIn({
    folder,
  });

  expect(items).toEqual([
    {
      item: "post-123",
    },
  ]);
});

test("a user can remove an item from a folder", async () => {
  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  await collecting.addToFolder({
    folder,
    item: "post-123",
  });

  await collecting.removeFromFolder({
    folder,
    item: "post-123",
  });

  const items = await collecting._itemsIn({ folder });

  expect(items).toEqual([]);
});

test("a user can rename a folder", async () => {
  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Old Name",
  });

  await collecting.renameFolder({
    folder,
    name: "Spooky Weather 2027",
  });

  const folders = await collecting._foldersFor({
    user: "amber",
  });

  expect(folders).toEqual([
    {
      folder,
      name: "Spooky Weather 2027",
    },
  ]);
});


test("deleting a folder removes the folder and its items", async () => {
  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  await collecting.addToFolder({
    folder,
    item: "post-123",
  });

  await collecting.deleteFolder({ folder });

  const folders = await collecting._foldersFor({
    user: "amber",
  });

  expect(folders).toEqual([]);

  const items = await collecting._itemsIn({
    folder,
  });

  expect(items).toEqual([]);
});

test("removeFromAllFolders removes an item from every folder", async () => {
  const { folder: folderA } = await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  const { folder: folderB } = await collecting.createFolder({
    user: "amber",
    name: "Inspiration",
  });

  await collecting.addToFolder({
    folder: folderA,
    item: "post-123",
  });

  await collecting.addToFolder({
    folder: folderB,
    item: "post-123",
  });

  await collecting.removeFromAllFolders({
    item: "post-123",
  });

  expect(
    await collecting._itemsIn({ folder: folderA }),
  ).toEqual([]);

  expect(
    await collecting._itemsIn({ folder: folderB }),
  ).toEqual([]);
});


test("a user cannot create two folders with the same name", async () => {
  await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  await expect(
    collecting.createFolder({
      user: "amber",
      name: "Favorites",
    }),
  ).rejects.toThrow();
});


test("the same item cannot be added to the same folder twice", async () => {
  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  await collecting.addToFolder({
    folder,
    item: "post-123",
  });

  await expect(
    collecting.addToFolder({
      folder,
      item: "post-123",
    }),
  ).rejects.toThrow();
});


test("a user cannot rename a folder to another folder's name", async () => {
  await collecting.createFolder({
    user: "amber",
    name: "Favorites",
  });

  const { folder } = await collecting.createFolder({
    user: "amber",
    name: "Inspiration",
  });

  await expect(
    collecting.renameFolder({
      folder,
      name: "Favorites",
    }),
  ).rejects.toThrow();
});

