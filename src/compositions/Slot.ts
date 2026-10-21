import {
  endpoint,
  receive,
  respond,
} from "@mit-sdg/sync-engine/boundary";

import {
  each,
  form,
  former,
  no,
  where,
} from "@mit-sdg/sync-engine/language";

import { concepts } from "../concepts.ts";

const { Posting, Collecting, Sessioning } = concepts;

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

/**
 * Returns all folders belonging to the signed-in user.
 */
const GetFolders = endpoint(
  "/slot/folders",
  ({ session, user }) =>
    receive({ session })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        respond({
          result: UserFolders({ user }),
        }),
      ),
);

/**
 * Returns a folder's contents only when the folder
 * belongs to the signed-in user.
 */
const GetFolder = endpoint(
  "/slot/folder",
  ({ session, user, folder }) =>
    receive({ session, folder })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._foldersFor({ user }).is({
            folder,
          }),
        )
          .then(
            respond({
              result: FolderContents({ folder }),
            }),
          )
          .named("owned"),

        where(
          no(
            Collecting._foldersFor({ user }).is({
              folder,
            }),
          ),
        )
          .then(
            respond({
              error: "FORBIDDEN",
            }),
          )
          .named("not-owned"),
      ),
);

/**
 * Creates a folder owned by the signed-in user.
 */
const CreateFolder = endpoint(
  "/slot/folder/create",
  ({ session, user, name, folder }) =>
    receive({ session, name })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        Collecting.createFolder({
          user,
          name,
        }).responds({
          folder,
        }),
      )
      .then(
        respond({
          folder,
        }),
      ),
);

/**
 * Adds a Post only to a folder belonging to
 * the signed-in user.
 */
const AddToFolder = endpoint(
  "/slot/add",
  ({ session, user, folder, post, entry }) =>
    receive({ session, folder, post })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._foldersFor({ user }).is({
            folder,
          }),
        )
          .then(
            Collecting.addToFolder({
              folder,
              item: post,
            }).responds({
              entry,
            }),
          )
          .then(
            respond({
              entry,
            }),
          )
          .named("owned"),

        where(
          no(
            Collecting._foldersFor({ user }).is({
              folder,
            }),
          ),
        )
          .then(
            respond({
              error: "FORBIDDEN",
            }),
          )
          .named("not-owned"),
      ),
);

/**
 * Removes a Post only from a folder belonging
 * to the signed-in user.
 */
const RemoveFromFolder = endpoint(
  "/slot/remove",
  ({ session, user, folder, post }) =>
    receive({ session, folder, post })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._foldersFor({ user }).is({
            folder,
          }),
        )
          .then(
            Collecting.removeFromFolder({
              folder,
              item: post,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned"),

        where(
          no(
            Collecting._foldersFor({ user }).is({
              folder,
            }),
          ),
        )
          .then(
            respond({
              error: "FORBIDDEN",
            }),
          )
          .named("not-owned"),
      ),
);

/**
 * Renames only a folder belonging to the
 * signed-in user.
 */
const RenameFolder = endpoint(
  "/slot/folder/rename",
  ({ session, user, folder, name }) =>
    receive({ session, folder, name })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._foldersFor({ user }).is({
            folder,
          }),
        )
          .then(
            Collecting.renameFolder({
              folder,
              name,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned"),

        where(
          no(
            Collecting._foldersFor({ user }).is({
              folder,
            }),
          ),
        )
          .then(
            respond({
              error: "FORBIDDEN",
            }),
          )
          .named("not-owned"),
      ),
);

/**
 * Deletes only a folder belonging to the
 * signed-in user.
 */
const DeleteFolder = endpoint(
  "/slot/folder/delete",
  ({ session, user, folder }) =>
    receive({ session, folder })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._foldersFor({ user }).is({
            folder,
          }),
        )
          .then(
            Collecting.deleteFolder({
              folder,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned"),

        where(
          no(
            Collecting._foldersFor({ user }).is({
              folder,
            }),
          ),
        )
          .then(
            respond({
              error: "FORBIDDEN",
            }),
          )
          .named("not-owned"),
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