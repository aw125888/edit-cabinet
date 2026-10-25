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

test("_get returns an existing post", async () => {
  const { post } = await posting.createPost({
    user: "amber",
    media: "https://example.com/video",
    caption: "Daenerys edit",
  });

  const results = await posting._get({ post });

  expect(results).toHaveLength(1);
  expect(results[0]?.user).toBe("amber");
  expect(results[0]?.media).toBe("https://example.com/video");
  expect(results[0]?.caption).toBe("Daenerys edit");
});

test("_get returns no row for a nonexistent post", async () => {
  const results = await posting._get({
    post: "does-not-exist",
  });

  expect(results).toEqual([]);
});


test("_postsBy returns all posts cataloged by a user", async () => {
  const first = await posting.createPost({
    user: "amber",
    media: "video-1",
    caption: "First edit",
  });

  const second = await posting.createPost({
    user: "amber",
    media: "video-2",
    caption: "Second edit",
  });

  await posting.createPost({
    user: "bob",
    media: "video-3",
    caption: "Bob edit",
  });

  const posts = await posting._postsBy({
    user: "amber",
  });

  expect(posts).toHaveLength(2);

  expect(posts).toEqual(
    expect.arrayContaining([
      {
        post: first.post,
        media: "video-1",
        caption: "First edit",
      },
      {
        post: second.post,
        media: "video-2",
        caption: "Second edit",
      },
    ]),
  );
});

test("_postsBy returns no posts for a user with no cataloged posts", async () => {
  const posts = await posting._postsBy({
    user: "nobody",
  });

  expect(posts).toEqual([]);
});


test(
  "createPost rejects duplicate media",
  async () => {
    await posting.createPost({
      user: "amber",
      media:
        "https://example.com/same-video",
      caption: "First catalog",
    });

    await expect(
      posting.createPost({
        user: "bob",
        media:
          "https://example.com/same-video",
        caption: "Second catalog",
      }),
    ).rejects.toThrow(
      "A Post with this media already exists.",
    );

    const posts =
      await testDb.db
        .collection<
          Post<string, string>
        >("posting.posts")
        .find({
          media:
            "https://example.com/same-video",
        })
        .toArray();

    expect(posts).toHaveLength(1);
    expect(posts[0]?.author).toBe(
      "amber",
    );
  },
);


test("_getByMedia returns the post for existing media", async () => {
  const { post } =
    await posting.createPost({
      user: "amber",
      media: "https://example.com/video",
      caption: "test",
    });

  const results =
    await posting._getByMedia({
      media: "https://example.com/video",
    });

  expect(results).toEqual([
    { post },
  ]);
});

test("_getByMedia returns no row for nonexistent media", async () => {
  const results =
    await posting._getByMedia({
      media: "https://example.com/missing",
    });

  expect(results).toEqual([]);
});

test("_count returns the total number of cataloged posts", async () => {
  await posting.createPost({
    user: "amber",
    media: "video-1",
    caption: "First",
  });

  await posting.createPost({
    user: "bob",
    media: "video-2",
    caption: "Second",
  });

  const result =
    await posting._count();
    expect(result).toEqual(
  { count: 2 },
);

});