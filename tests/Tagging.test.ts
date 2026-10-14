import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import {
  TaggingConcept,
  type Tag,
  type TagAssignment,
} from "../src/concepts/Tagging.ts";
import { openTestDb, type TestDb } from "./test-db.ts";

let testDb: TestDb;
let tagging: TaggingConcept<string, string>;

beforeAll(async () => {
  testDb = await openTestDb();
});

beforeEach(async () => {
  await testDb.db.dropDatabase();
  tagging = new TaggingConcept<string, string>(testDb.db);
});

afterAll(async () => {
  await testDb.close();
});

test("createTag returns a tag identity", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    const createdTag = await testDb.db.collection<Tag<string>>("tagging.tags").findOne({ _id: tag });
    expect(createdTag?.name).toBe("testtag");
    expect(createdTag?.category).toBe("Aesthetic");
});

test("tagItem creates a tag assignment", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    const { assignment } = await tagging.tagItem({
        tag,
        item: "post123",
    });

    const createdAssignment = await testDb.db.collection<TagAssignment<string>>("tagging.tagAssignments").findOne({ _id: assignment });
    expect(createdAssignment?.tag).toBe(tag);
    expect(createdAssignment?.item).toBe("post123");
});

test("untagItem removes a tag assignment", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    const { assignment } = await tagging.tagItem({
        tag,
        item: "post123",
    });

    await tagging.untagItem({ assignment });

    const deletedAssignment = await testDb.db.collection<TagAssignment<string>>("tagging.tagAssignments").findOne({ _id: assignment });
    expect(deletedAssignment).toBeNull();
});    

test("untagAll removes all tag assignments for an item", async () => {
    const { tag: tag1 } = await tagging.createTag({
        name: "testtag1",
        category: "Aesthetic",
    });

    const { tag: tag2 } = await tagging.createTag({
        name: "testtag2",
        category: "Aesthetic",
    });

    await tagging.tagItem({ tag: tag1, item: "post123" });
    await tagging.tagItem({ tag: tag2, item: "post123" });

    await tagging.untagAll({ item: "post123" });

    const remainingAssignments = await testDb.db.collection("tagging.tagAssignments").find({ item: "post123" }).toArray();
    expect(remainingAssignments.length).toBe(0);
});

test("itemsFor returns all items for a given tag", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    await tagging.tagItem({ tag, item: "post123" });
    await tagging.tagItem({ tag, item: "post456" });

    const items = await tagging._itemsFor({ tag });
    const itemIds = items.map(item => item.item);

    expect(items).toEqual([
        { item: "post123" },
        { item: "post456" },
        ]);
}); 

test("createTag throws an error for duplicate tags", async () => {
    await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    await expect(tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    })).rejects.toThrowError(`Tag with name "testtag" and category "Aesthetic" already exists.`);
});

test("tagItem throws an error for non-existent tag", async () => {
    await expect(tagging.tagItem({
        tag: "nonexistenttag",
        item: "post123",
    })).rejects.toThrowError(`Tag with ID nonexistenttag does not exist.`);
});

test("untagItem throws an error for non-existent assignment", async () => {
    await expect(tagging.untagItem({
        assignment: "nonexistentassignment",
    })).rejects.toThrowError(`Tag assignment with ID nonexistentassignment does not exist.`);
}); 

test("tagItem throws an error for duplicate assignment", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    await tagging.tagItem({ tag, item: "post123" });

    await expect(tagging.tagItem({ tag, item: "post123" })).rejects.toThrowError(
        `Item "post123" is already tagged with tag ID "${tag}".`
    );
});

test("findTag returns the tag ID for an existing tag", async () => {
    const { tag } = await tagging.createTag({
        name: "testtag",
        category: "Aesthetic",
    });

    const foundTag = await tagging._findTag({ name: "testtag", category: "Aesthetic" });
    expect(foundTag).toEqual([{ tag: tag }]);
});

test("findTag returns null for a non-existent tag", async () => {
    const foundTag = await tagging._findTag({ name: "nonexistenttag", category: "Aesthetic" });
    expect(foundTag).toEqual([]);
});





