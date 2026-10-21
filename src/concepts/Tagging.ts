import {
  MongoServerError,
  type Collection,
  type Db,
} from "mongodb";

export interface Tag<Category> {
  _id: string;
  name: string;
  normalizedName: string;
  category: Category;
}

export interface TagAssignment<Item> {
  _id: string;
  tag: string;
  item: Item;
}

export class TaggingConcept<
  Item extends string,
  Category extends string
> {
  private readonly tags: Collection<Tag<Category>>;
  private readonly tagAssignments: Collection<TagAssignment<Item>>;
  private readonly ready: Promise<[string, string]>;

  constructor(db: Db) {
    this.tags = db.collection<Tag<Category>>("tagging.tags");
    this.tagAssignments =
      db.collection<TagAssignment<Item>>("tagging.tagAssignments");

    this.ready = Promise.all([
      this.tags.createIndex(
        { normalizedName: 1, category: 1 },
        { unique: true },
      ),
      this.tagAssignments.createIndex(
        { tag: 1, item: 1 },
        { unique: true },
      ),
    ]);
  }

  async createTag({
    name,
    category,
  }: {
    name: string;
    category: Category;
  }): Promise<{ tag: string }> {
    await this.ready;

    const displayName = name.trim();
    const normalizedName = displayName.toLowerCase();

    const tag: Tag<Category> = {
      _id: crypto.randomUUID(),
      name: displayName,
      normalizedName,
      category,
    };

    try {
      await this.tags.insertOne(tag);
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        throw new Error(
          `Tag with name "${name}" and category "${category}" already exists.`,
        );
      }

      throw error;
    }

    return { tag: tag._id };
  }

  async tagItem({
    tag,
    item,
  }: {
    tag: string;
    item: Item;
  }): Promise<{ assignment: string }> {
    await this.ready;

    const tagExists = await this.tags.findOne({ _id: tag });

    if (!tagExists) {
      throw new Error(`Tag with ID ${tag} does not exist.`);
    }

    const assignment: TagAssignment<Item> = {
      _id: crypto.randomUUID(),
      tag: tagExists._id,
      item,
    };

    try {
      await this.tagAssignments.insertOne(assignment);
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        throw new Error(
          `Item "${item}" is already tagged with tag ID "${tag}".`,
        );
      }

      throw error;
    }

    return { assignment: assignment._id };
  }

  async untagItem({
    assignment,
  }: {
    assignment: string;
  }): Promise<{}> {
    const assignmentExists =
      await this.tagAssignments.findOne({ _id: assignment });

    if (!assignmentExists) {
      throw new Error(
        `Tag assignment with ID ${assignment} does not exist.`,
      );
    }

    await this.tagAssignments.deleteOne({ _id: assignment });

    return {};
  }

  async untagAll({
    item,
  }: {
    item: Item;
  }): Promise<{}> {
    await this.tagAssignments.deleteMany({ item });

    return {};
  }

  async _itemsFor({
    tag,
  }: {
    tag: string;
  }): Promise<{ item: Item }[]> {
    const assignments = await this.tagAssignments
      .find({ tag })
      .sort({ item: 1 })
      .toArray();

    return assignments.map((assignment) => ({
      item: assignment.item,
    }));
  }

  async _findTag({
    name,
    category,
  }: {
    name: string;
    category: Category;
  }): Promise<{ tag: string }[]> {
    const normalizedName = name.trim().toLowerCase();

    const tag = await this.tags.findOne({
      normalizedName,
      category,
    });

    return tag ? [{ tag: tag._id }] : [];
  }

  async _tagsFor({
  item,
}: {
  item: Item;
}): Promise<
  {
    assignment: string;
    tag: string;
    name: string;
    category: Category;
  }[]
> {
  const assignments = await this.tagAssignments
    .find({ item })
    .toArray();

  const results: {
    assignment: string;
    tag: string;
    name: string;
    category: Category;
  }[] = [];

  for (const assignment of assignments) {
    const tag = await this.tags.findOne({
      _id: assignment.tag,
    });

    if (tag !== null) {
      results.push({
        assignment: assignment._id,
        tag: tag._id,
        name: tag.name,
        category: tag.category,
      });
    }
  }

  results.sort((a, b) =>
    a.tag.localeCompare(b.tag),
  );

  return results;
}
}