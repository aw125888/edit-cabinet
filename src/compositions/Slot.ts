import {
  endpoint,
  receive,
  respond,
} from "@mit-sdg/sync-engine/boundary";

import {
  each,
  form,
  former,
  where,
} from "@mit-sdg/sync-engine/language";

import { concepts } from "../concepts.ts";

const { Posting, Collecting } = concepts;

const UserFolders = former(
  "the folders for user (user)",
  ({ user }, { folder, name }) =>
    form({
      folders: each(
        Collecting._foldersFor({ user }).is({
          folder,
          name,
        }),
      ).form({
        folder,
        name,
      }),
    }),
);

const GetFolders = endpoint(
  "/slot/folders",
  ({ user }) =>
    receive({ user })
      .then(
        respond({
          result: UserFolders({ user }),
        }),
      ),
);

const FolderContents = former(
  "the contents of folder (folder)",
  ({ folder }, { item, user, media, caption }) =>
    form({
      items: each(
        Collecting._itemsIn({ folder }).is({ item }),
      ).form({
        post: item,

        details: where(
          Posting._get({ post: item }).is({
            user,
            media,
            caption,
          }),
        ).form({
          user,
          media,
          caption,
        }),
      }),
    }),
);

const GetFolder = endpoint(
  "/slot/folder",
  ({ folder }) =>
    receive({ folder })
      .then(
        respond({
          result: FolderContents({ folder }),
        }),
      ),
);

const CreateFolder = endpoint(
  "/slot/folder/create",
  ({ user, name, folder }) =>
    receive({ user, name })
      .then(
        Collecting.createFolder({
          user,
          name,
        }).responds({ folder }),
      )
      .then(
        respond({ folder }),
      ),
);

const AddToFolder = endpoint(
  "/slot/add",
  ({ folder, post, entry }) =>
    receive({ folder, post })
      .then(
        Collecting.addToFolder({
          folder,
          item: post,
        }).responds({ entry }),
      )
      .then(
        respond({ entry }),
      ),
);

const RemoveFromFolder = endpoint(
  "/slot/remove",
  ({ folder, post }) =>
    receive({ folder, post })
      .then(
        Collecting.removeFromFolder({
          folder,
          item: post,
        }),
      )
      .then(
        respond({}),
      ),
);

const RenameFolder = endpoint(
  "/slot/folder/rename",
  ({ folder, name }) =>
    receive({ folder, name })
      .then(
        Collecting.renameFolder({
          folder,
          name,
        }),
      )
      .then(
        respond({}),
      ),
);

const DeleteFolder = endpoint(
  "/slot/folder/delete",
  ({ folder }) =>
    receive({ folder })
      .then(
        Collecting.deleteFolder({
          folder,
        }),
      )
      .then(
        respond({}),
      ),
);

export const slotComposition = {
  Slot: {
    CreateFolder,
    AddToFolder,
    GetFolders,
    GetFolder,

    UserFolders,
    FolderContents,
    RemoveFromFolder,
    RenameFolder,
    DeleteFolder,
  },
};

