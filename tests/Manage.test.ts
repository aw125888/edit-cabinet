import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { catalogComposition } from "../src/compositions/Catalog.ts";
import { manageComposition } from "../src/compositions/Manage.ts";
import { slotComposition } from "../src/compositions/Slot.ts";

import { composition as accounts } from "../src/compositions/reusable/accounts.ts";
import { composition as passwords } from "../src/compositions/reusable/passwords.ts";

import { openTestDb, type TestDb } from "./test-db.ts";

import type { Post } from "../src/concepts/Posting.ts";
import type { TagAssignment } from "../src/concepts/Tagging.ts";
import type { FolderItem } from "../src/concepts/Collecting.ts";

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
      ...manageComposition,

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

async function createPost(
  session: string,
  caption: string,
) {
  const result = await app.invoker.invoke("/catalog/post", {
    session,
    media: "https://example.com/video.mp4",
    caption,
  });

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("post" in result.value) ||
    typeof result.value.post !== "string"
  ) {
    throw new Error("Expected Catalog to create a Post");
  }

  return result.value.post;
}

test("manage returns only the signed-in user's posts", async () => {
  const amberPost1 = await createPost(
    amberSession,
    "Amber edit one",
  );

  const amberPost2 = await createPost(
    amberSession,
    "Amber edit two",
  );

  await createPost(
    bobSession,
    "Bob edit",
  );

  const result = await app.invoker.invoke("/manage/posts", {
    session: amberSession,
  });

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("result" in result.value)
  ) {
    throw new Error("Expected Manage to return Posts");
  }

  const value = result.value.result as {
    posts: {
      post: string;
      media: string;
      caption: string;
    }[];
  };

  expect(value.posts).toHaveLength(2);

expect(value.posts).toEqual(
  expect.arrayContaining([
    {
      post: amberPost1,
      media: "https://example.com/video.mp4",
      caption: "Amber edit one",
      tags: [],
    },
    {
      post: amberPost2,
      media: "https://example.com/video.mp4",
      caption: "Amber edit two",
      tags: [],
    },
  ]),
);

  expect(
    value.posts.some((post) => post.caption === "Bob edit"),
  ).toBe(false);
});

test("a user can edit the caption of their own post", async () => {
  const post = await createPost(
    amberSession,
    "Old caption",
  );

  const result = await app.invoker.invoke(
    "/manage/caption",
    {
      session: amberSession,
      post,
      caption: "New caption",
    },
  );

  expect(result.ok).toBe(true);

  const storedPost = await testDb.db
    .collection<Post<string, string>>("posting.posts")
    .findOne({
      _id: post,
    });

  expect(storedPost?.caption).toBe("New caption");
  expect(storedPost?.author).toBe(amberUser);
});

test("a user cannot edit another user's post", async () => {
  const post = await createPost(
    amberSession,
    "Amber caption",
  );

  const result = await app.invoker.invoke(
    "/manage/caption",
    {
      session: bobSession,
      post,
      caption: "Bob changed this",
    },
  );

  expect(result.ok).toBe(false);

  const storedPost = await testDb.db
    .collection<Post<string, string>>("posting.posts")
    .findOne({
      _id: post,
    });

  expect(storedPost?.caption).toBe("Amber caption");
  expect(storedPost?.author).toBe(amberUser);
});

test("a user cannot delete another user's post", async () => {
  const post = await createPost(
    amberSession,
    "Amber edit",
  );

  const result = await app.invoker.invoke(
    "/manage/delete",
    {
      session: bobSession,
      post,
    },
  );

  expect(result.ok).toBe(false);

  const storedPost = await testDb.db
    .collection<Post<string, string>>("posting.posts")
    .findOne({
      _id: post,
    });

  expect(storedPost).not.toBeNull();
});

test("deleting a post removes its tags and all folder references", async () => {
  const post = await createPost(
    amberSession,
    "Delete me",
  );

  // Give the Post a tag.
  const tagResult = await app.invoker.invoke(
    "/catalog/tag",
    {
      post,
      name: "Girlhood",
      category: "Aesthetic/Concept",
    },
  );

  expect(tagResult.ok).toBe(true);

  // Amber saves the Post.
  const amberFolderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: amberSession,
      name: "Amber Folder",
    },
  );

  if (
    !amberFolderResult.ok ||
    typeof amberFolderResult.value !== "object" ||
    amberFolderResult.value === null ||
    !("folder" in amberFolderResult.value) ||
    typeof amberFolderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Amber to create a folder");
  }

  const amberFolder = amberFolderResult.value.folder;

  await app.invoker.invoke("/slot/add", {
    session: amberSession,
    folder: amberFolder,
    post,
  });

  // Bob independently saves Amber's Post.
  const bobFolderResult = await app.invoker.invoke(
    "/slot/folder/create",
    {
      session: bobSession,
      name: "Bob Folder",
    },
  );

  if (
    !bobFolderResult.ok ||
    typeof bobFolderResult.value !== "object" ||
    bobFolderResult.value === null ||
    !("folder" in bobFolderResult.value) ||
    typeof bobFolderResult.value.folder !== "string"
  ) {
    throw new Error("Expected Bob to create a folder");
  }

  const bobFolder = bobFolderResult.value.folder;

  await app.invoker.invoke("/slot/add", {
    session: bobSession,
    folder: bobFolder,
    post,
  });

  // Amber deletes the Post she owns.
  const deleteResult = await app.invoker.invoke(
    "/manage/delete",
    {
      session: amberSession,
      post,
    },
  );

  expect(deleteResult.ok).toBe(true);

  // The Post itself is gone.
  const storedPost = await testDb.db
    .collection<Post<string, string>>("posting.posts")
    .findOne({
      _id: post,
    });

  expect(storedPost).toBeNull();

  // Its tag assignments are gone.
  const assignments = await testDb.db
    .collection<TagAssignment<string>>(
      "tagging.tagAssignments",
    )
    .find({
      item: post,
    })
    .toArray();

  expect(assignments).toHaveLength(0);

  // Every folder reference is gone, regardless of owner.
  const folderItems = await testDb.db
    .collection<FolderItem<string>>(
      "collecting.folderItems",
    )
    .find({
      item: post,
    })
    .toArray();

  expect(folderItems).toHaveLength(0);
});

test("a user can add a new tag to their own post", async () => {
  const post = await createPost(
    amberSession,
    "Test edit",
  );

  const addResult = await app.invoker.invoke(
    "/manage/tag/add",
    {
      session: amberSession,
      post,
      name: "Girlhood",
      category: "Aesthetic/Concept",
    },
  );

  expect(addResult.ok).toBe(true);

  const managed = await app.invoker.invoke(
    "/manage/posts",
    {
      session: amberSession,
    },
  );

  expect(managed.ok).toBe(true);

  if (
    !managed.ok ||
    typeof managed.value !== "object" ||
    managed.value === null ||
    !("result" in managed.value)
  ) {
    throw new Error("Expected managed posts");
  }

  const posts = (
    managed.value.result as {
      posts: {
        post: string;
        media: string;
        caption: string;
        tags: {
          assignment: string;
          tag: string;
          name: string;
          category: string;
        }[];
      }[];
    }
  ).posts;

  const managedPost = posts.find(
    (item) => item.post === post,
  );

  expect(managedPost).toBeDefined();

  expect(managedPost?.tags).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "Girlhood",
        category: "Aesthetic/Concept",
      }),
    ]),
  );
});

test("a user can remove one tag from their own post without removing the others", async () => {
  const post = await createPost(
    amberSession,
    "Test edit",
  );

  const first = await app.invoker.invoke(
    "/manage/tag/add",
    {
      session: amberSession,
      post,
      name: "Girlhood",
      category: "Aesthetic/Concept",
    },
  );

  const second = await app.invoker.invoke(
    "/manage/tag/add",
    {
      session: amberSession,
      post,
      name: "Daenerys Targaryen",
      category: "Characters",
    },
  );

  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);

  if (
    !first.ok ||
    typeof first.value !== "object" ||
    first.value === null ||
    !("assignment" in first.value) ||
    typeof first.value.assignment !== "string"
  ) {
    throw new Error(
      "Expected first tag assignment",
    );
  }

  const removeResult = await app.invoker.invoke(
    "/manage/tag/remove",
    {
      session: amberSession,
      post,
      assignment: first.value.assignment,
    },
  );

  expect(removeResult.ok).toBe(true);

  const managed = await app.invoker.invoke(
    "/manage/posts",
    {
      session: amberSession,
    },
  );

  expect(managed.ok).toBe(true);

  if (
    !managed.ok ||
    typeof managed.value !== "object" ||
    managed.value === null ||
    !("result" in managed.value)
  ) {
    throw new Error("Expected managed posts");
  }

  const posts = (
    managed.value.result as {
      posts: {
        post: string;
        tags: {
          assignment: string;
          tag: string;
          name: string;
          category: string;
        }[];
      }[];
    }
  ).posts;

  const managedPost = posts.find(
    (item) => item.post === post,
  );

  expect(managedPost).toBeDefined();
  expect(managedPost?.tags).toHaveLength(1);

  expect(managedPost?.tags[0]).toEqual(
    expect.objectContaining({
      name: "Daenerys Targaryen",
      category: "Characters",
    }),
  );
});

test("a user cannot add a tag to another user's post", async () => {
  const post = await createPost(
    amberSession,
    "Amber private edit",
  );

  const result = await app.invoker.invoke(
    "/manage/tag/add",
    {
      session: bobSession,
      post,
      name: "Girlhood",
      category: "Aesthetic/Concept",
    },
  );

  expect(result.ok).toBe(false);

  const assignments = await testDb.db
    .collection<TagAssignment<string>>(
      "tagging.tagAssignments",
    )
    .find({
      item: post,
    })
    .toArray();

  expect(assignments).toHaveLength(0);
});

test("a user cannot remove a tag from another user's post", async () => {
  const post = await createPost(
    amberSession,
    "Amber private edit",
  );

  const addResult = await app.invoker.invoke(
    "/manage/tag/add",
    {
      session: amberSession,
      post,
      name: "Girlhood",
      category: "Aesthetic/Concept",
    },
  );

  expect(addResult.ok).toBe(true);

  if (
    !addResult.ok ||
    typeof addResult.value !== "object" ||
    addResult.value === null ||
    !("assignment" in addResult.value) ||
    typeof addResult.value.assignment !== "string"
  ) {
    throw new Error(
      "Expected Amber to create a tag assignment",
    );
  }

  const assignment = addResult.value.assignment;

  const removeResult = await app.invoker.invoke(
    "/manage/tag/remove",
    {
      session: bobSession,
      post,
      assignment,
    },
  );

  expect(removeResult.ok).toBe(false);

  /*
   * Make sure Bob's failed request did not
   * actually remove Amber's assignment.
   */
  const storedAssignment = await testDb.db
    .collection<TagAssignment<string>>(
      "tagging.tagAssignments",
    )
    .findOne({
      _id: assignment,
    });

  expect(storedAssignment).not.toBeNull();
});