import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { catalogComposition } from "../src/compositions/Catalog.ts";
import { openTestDb, type TestDb } from "./test-db.ts";

import type { Post } from "../src/concepts/Posting.ts";
import type {
  Tag,
  TagAssignment,
} from "../src/concepts/Tagging.ts";

let testDb: TestDb;
let app: ReturnType<typeof assemble>;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();

  app = assemble({
    conceptSet: applicationConceptSet,
    composition: catalogComposition,
    initialize: {
      Posting: [testDb.db],
      Tagging: [testDb.db],
    },
  });
});

afterAll(async () => {
  await testDb.close();
});
test("catalog creates a post and attaches its tags", async () => {
  const tags = [
    { name: "Girlhood", category: "Aesthetic" },
    { name: "Daenerys", category: "Character" },
  ];

  const result = await app.invoker.invoke("/catalog/post", {
    user: "amber",
    media: "https://example.com/video",
    caption: "test",
    tags,
  });

  expect(result.ok).toBe(true);

if (!result.ok) {
  throw new Error("Catalog post creation failed");
}

if (
  typeof result.value !== "object" ||
  result.value === null ||
  !("post" in result.value) ||
  typeof result.value.post !== "string"
) {
  throw new Error("Catalog endpoint returned an invalid post result");
}

  const post = result.value.post;

  for (const tag of tags) {
    const tagResult = await app.invoker.invoke("/catalog/tag", {
      post,
      name: tag.name,
      category: tag.category,
    });

    expect(tagResult.ok).toBe(true);
  }

  const createdPost = await testDb.db
  .collection<Post<string, string>>("posting.posts")
  .findOne({ _id: post });

expect(createdPost?.author).toBe("amber");
expect(createdPost?.media).toBe("https://example.com/video");
expect(createdPost?.caption).toBe("test");

const createdTags = await testDb.db
  .collection<Tag<string>>("tagging.tags")
  .find({})
  .toArray();

expect(createdTags).toHaveLength(2);

const assignments = await testDb.db
  .collection<TagAssignment<string>>("tagging.tagAssignments")
  .find({ item: post })
  .toArray();

expect(assignments).toHaveLength(2);

});


test("catalog reuses an existing tag instead of creating a duplicate", async () => {
  const { tag } = await app.concepts.Tagging.createTag({
    name: "Girlhood",
    category: "Aesthetic",
  });

  const result = await app.invoker.invoke("/catalog/tag", {
    post: "post123",
    name: "Girlhood",
    category: "Aesthetic",
  });

  expect(result.ok).toBe(true);

  const matchingTags = await testDb.db
    .collection<Tag<string>>("tagging.tags")
    .find({
      name: "Girlhood",
      category: "Aesthetic",
    })
    .toArray();

  expect(matchingTags).toHaveLength(1);
  expect(matchingTags[0]?._id).toBe(tag);

  const assignments = await testDb.db
    .collection<TagAssignment<string>>("tagging.tagAssignments")
    .find({ item: "post123" })
    .toArray();

  expect(assignments).toHaveLength(1);
  expect(assignments[0]?.tag).toBe(tag);
});

test("catalog creates a missing tag and attaches it to the post", async () => {
  const result = await app.invoker.invoke("/catalog/tag", {
    post: "post123",
    name: "Daenerys",
    category: "Character",
  });

  expect(result.ok).toBe(true);

  const createdTag = await testDb.db
    .collection<Tag<string>>("tagging.tags")
    .findOne({
      name: "Daenerys",
      category: "Character",
    });

  expect(createdTag).not.toBeNull();

  if (createdTag === null) {
    throw new Error("Expected Catalog to create the missing tag");
  }

  const assignment = await testDb.db
    .collection<TagAssignment<string>>("tagging.tagAssignments")
    .findOne({
      item: "post123",
      tag: createdTag._id,
    });

  expect(assignment).not.toBeNull();
});