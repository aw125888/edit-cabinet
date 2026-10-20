import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "../src/concepts.ts";
import { catalogComposition } from "../src/compositions/Catalog.ts";
import { searchComposition } from "../src/compositions/Search.ts";
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
      ...catalogComposition,
      ...searchComposition,
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

test("searching an existing tag returns its associated post", async () => {
  const postResult = await app.invoker.invoke("/catalog/post", {
    user: "amber",
    media: "https://example.com/video.mp4",
    caption: "Minimalism edit",
  });

  expect(postResult.ok).toBe(true);

  if (
    !postResult.ok ||
    typeof postResult.value !== "object" ||
    postResult.value === null ||
    !("post" in postResult.value) ||
    typeof postResult.value.post !== "string"
  ) {
    throw new Error("Expected catalog to return a post");
  }

  const post = postResult.value.post;

  const tagResult = await app.invoker.invoke("/catalog/tag", {
    post,
    name: "Minimalism",
    category: "Aesthetic/Concept",
  });

  expect(tagResult.ok).toBe(true);

  const searchResult = await app.invoker.invoke("/search/tag", {
    name: "Minimalism",
    category: "Aesthetic/Concept",
  });

  expect(searchResult.ok).toBe(true);

  expect(searchResult.ok).toBe(true);

if (
  !searchResult.ok ||
  typeof searchResult.value !== "object" ||
  searchResult.value === null ||
  !("results" in searchResult.value)
) {
  throw new Error("Expected search results");
}

const results = searchResult.value.results as {
  items: { item: string }[];
};

expect(results.items).toHaveLength(1);
expect(results.items[0]?.item).toBe(post);
});


test("searching a nonexistent tag returns no posts", async () => {
  const result = await app.invoker.invoke("/search/tag", {
    name: "Does Not Exist",
    category: "Aesthetic/Concept",
  });

  expect(result.ok).toBe(true);

  if (
    !result.ok ||
    typeof result.value !== "object" ||
    result.value === null ||
    !("results" in result.value)
  ) {
    throw new Error("Expected search results");
  }

  const results = result.value.results as {
    items: { item: string }[];
  };

  expect(results.items).toEqual([]);
});



test("search post returns post details and all associated tags", async () => {
  const postResult = await app.invoker.invoke("/catalog/post", {
    user: "amber",
    media: "https://example.com/video.mp4",
    caption: "Daenerys edit",
  });

  if (
    !postResult.ok ||
    typeof postResult.value !== "object" ||
    postResult.value === null ||
    !("post" in postResult.value) ||
    typeof postResult.value.post !== "string"
  ) {
    throw new Error("Expected catalog to return a post");
  }

  const post = postResult.value.post;

  await app.invoker.invoke("/catalog/tag", {
    post,
    name: "Girlhood",
    category: "Aesthetic/Concept",
  });

  await app.invoker.invoke("/catalog/tag", {
    post,
    name: "Daenerys Targaryen",
    category: "Characters",
  });

  const result = await app.invoker.invoke("/search/post", {
    post,
  });

  expect(result.ok).toBe(true);

  if (
  !result.ok ||
  typeof result.value !== "object" ||
  result.value === null ||
  !("result" in result.value)
) {
  throw new Error("Expected a search post result");
}

const searchPost = result.value.result as {
  post: string;
  user: string;
  media: string;
  caption: string;
  tags: {
    tag: string;
    name: string;
    category: string;
  }[];
};

expect(searchPost.post).toBe(post);
expect(searchPost.user).toBe("amber");
expect(searchPost.media).toBe("https://example.com/video.mp4");
expect(searchPost.caption).toBe("Daenerys edit");

expect(searchPost.tags).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      name: "Girlhood",
      category: "Aesthetic/Concept",
    }),
    expect.objectContaining({
      name: "Daenerys Targaryen",
      category: "Characters",
    }),
  ]),
);

expect(searchPost.tags).toHaveLength(2);
});