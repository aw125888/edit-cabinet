import {
  MongoServerError,
  type Collection,
  type Db,
} from "mongodb";

export interface Folder<User extends string> {
  _id: string;
  owner: User;
  name: string;
}

export interface FolderItem<Item extends string> {
  _id: string;
  folder: string;
  item: Item;
}

export class CollectingConcept<
  User extends string,
  Item extends string
> {
  private readonly folders: Collection<Folder<User>>;
  private readonly folderItems: Collection<FolderItem<Item>>;
  private readonly ready: Promise<[string, string]>;

  constructor(db: Db) {
    this.folders =
      db.collection<Folder<User>>("collecting.folders");

    this.folderItems =
      db.collection<FolderItem<Item>>("collecting.folderItems");

    this.ready = Promise.all([
      this.folders.createIndex(
        { owner: 1, name: 1 },
        { unique: true },
      ),
      this.folderItems.createIndex(
        { folder: 1, item: 1 },
        { unique: true },
      ),
    ]);
  }

  async createFolder({
    user,
    name,
  }: {
    user: User;
    name: string;
  }): Promise<{ folder: string }> {
    await this.ready;

    const folder: Folder<User> = {
      _id: crypto.randomUUID(),
      owner: user,
      name,
    };

    try {
      await this.folders.insertOne(folder);
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        throw new Error(
          `User "${user}" already has a folder named "${name}".`,
        );
      }

      throw error;
    }

    return { folder: folder._id };
  }

  async deleteFolder({
    folder,
  }: {
    folder: string;
  }): Promise<{}> {
    await this.ready;

    const existing = await this.folders.findOne({
      _id: folder,
    });

    if (!existing) {
      throw new Error(
        `Folder with ID "${folder}" does not exist.`,
      );
    }

    await this.folders.deleteOne({
      _id: folder,
    });

    await this.folderItems.deleteMany({
      folder,
    });

    return {};
  }

  async addToFolder({
    folder,
    item,
  }: {
    folder: string;
    item: Item;
  }): Promise<{ entry: string }> {
    await this.ready;

    const existingFolder = await this.folders.findOne({
      _id: folder,
    });

    if (!existingFolder) {
      throw new Error(
        `Folder with ID "${folder}" does not exist.`,
      );
    }

    const entry: FolderItem<Item> = {
      _id: crypto.randomUUID(),
      folder,
      item,
    };

    try {
      await this.folderItems.insertOne(entry);
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        throw new Error(
          `Item "${item}" is already in folder "${folder}".`,
        );
      }

      throw error;
    }

    return { entry: entry._id };
  }

  async removeFromFolder({
    folder,
    item,
  }: {
    folder: string;
    item: Item;
  }): Promise<{}> {
    await this.ready;

    const entry = await this.folderItems.findOne({
      folder,
      item,
    });

    if (!entry) {
      throw new Error(
        `Item "${item}" is not in folder "${folder}".`,
      );
    }

    await this.folderItems.deleteOne({
      _id: entry._id,
    });

    return {};
  }

  async removeFromAllFolders({
    item,
  }: {
    item: Item;
  }): Promise<{}> {
    await this.ready;

    await this.folderItems.deleteMany({
      item,
    });

    return {};
  }

  async renameFolder({
    folder,
    name,
  }: {
    folder: string;
    name: string;
  }): Promise<{}> {
    await this.ready;

    const existing = await this.folders.findOne({
      _id: folder,
    });

    if (!existing) {
      throw new Error(
        `Folder with ID "${folder}" does not exist.`,
      );
    }

    try {
      await this.folders.updateOne(
        { _id: folder },
        { $set: { name } },
      );
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000
      ) {
        throw new Error(
          `User "${existing.owner}" already has a folder named "${name}".`,
        );
      }

      throw error;
    }

    return {};
  }

  async _foldersFor({
    user,
  }: {
    user: User;
  }): Promise<{ folder: string; name: string }[]> {
    await this.ready;

    const folders = await this.folders
      .find({ owner: user })
      .sort({ _id: 1 })
      .toArray();

    return folders.map((folder) => ({
      folder: folder._id,
      name: folder.name,
    }));
  }

  async _itemsIn({
    folder,
  }: {
    folder: string;
  }): Promise<{ item: Item }[]> {
    await this.ready;

    const items = await this.folderItems
      .find({ folder })
      .sort({ item: 1 })
      .toArray();

    return items.map((entry) => ({
      item: entry.item,
    }));
  }

  async _getFolder({
  folder,
}: {
  folder: string;
}): Promise<{ user: User; name: string }[]> {
  await this.ready;

  const found = await this.folders.findOne({
    _id: folder,
  });

  if (found === null) {
    return [];
  }

  return [
    {
      user: found.owner,
      name: found.name,
    },
  ];
}

async _folderNamed({
  user,
  name,
}: {
  user: User;
  name: string;
}): Promise<{ folder: string }[]> {
  await this.ready;

  const folder = await this.folders.findOne({
    owner: user,
    name,
  });

  if (!folder) {
    return [];
  }

  return [
    {
      folder: folder._id,
    },
  ];
}

async _itemInFolder({
  folder,
  item,
}: {
  folder: string;
  item: Item;
}): Promise<{ entry: string }[]> {
  await this.ready;

  const entry = await this.folderItems.findOne({
    folder,
    item,
  });

  if (!entry) {
    return [];
  }

  return [
    {
      entry: entry._id,
    },
  ];
}
}

