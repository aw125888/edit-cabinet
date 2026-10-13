import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { PostingConcept, type Post } from "../src/concepts/Posting.ts";
import { openTestDb, type TestDb } from "./test-db.ts";


let testDb: TestDb;
let posting: PostingConcept<string, string>;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();
  posting = new PostingConcept<string, string>(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});


test("createPost returns a post identity", async () => {
  const {post} = await posting.createPost({
    user: "amber",
    media: "https://example.com/video",
    caption: "test caption",
  });

    const createdPost = await testDb.db.collection<Post<string, string>>("posting.posts").findOne({ _id: post });

  expect(createdPost?.author).toBe("amber"); 
  expect(createdPost?.media).toBe("https://example.com/video"); 
  expect(createdPost?.caption).toBe("test caption");
});

test("editCaption updates the caption of an existing post", async () => {
    const { post } = await posting.createPost({
        user: "amber",
        media: "https://example.com/video",
        caption: "initial caption",
    });

    await posting.editCaption({ post, caption: "updated caption" });
    
    const updatedPost = await testDb.db.collection<Post<string, string>>("posting.posts").findOne({ _id: post });
    expect(updatedPost?.caption).toBe("updated caption");
});

test("deletePost removes an existing post", async () => {
    const { post } = await posting.createPost({
        user: "amber",
        media: "https://example.com/video",
        caption: "test caption",
    });

    await posting.deletePost({ post });
    
    const deletedPost = await testDb.db.collection<Post<string, string>>("posting.posts").findOne({ _id: post });
    expect(deletedPost).toBeNull();
});

test("deletePost throws an error when trying to delete a non-existent post", async () => {
    const nonExistentPostId = "non-existent-post-id";

    await expect(posting.deletePost({ post: nonExistentPostId })).rejects.toThrowError(
        `Post with ID ${nonExistentPostId} does not exist.`
    );
});

test("editCaption throws an error when trying to edit a non-existent post", async () => {
    const nonExistentPostId = "non-existent-post-id";

    await expect(posting.editCaption({ post: nonExistentPostId, caption: "new caption" })).rejects.toThrowError(
        `Post with ID ${nonExistentPostId} does not exist.`
    );
});