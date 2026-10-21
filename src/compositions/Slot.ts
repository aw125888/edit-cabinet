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

const {
  Posting,
  Collecting,
  Sessioning,
  Registering,
} = concepts;

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
  ({ folder }, { item, user, username, media, caption }) =>
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

          Registering._username({ user }).is({
            username,
          }),
        ).form({
          username,
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
  ({
    session,
    user,
    name,
    folder,
  }) =>
    receive({
      session,
      name,
    })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          no(
            Collecting._folderNamed({
              user,
              name,
            }),
          ),
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
          )
          .named("available-name"),

        where(
          Collecting._folderNamed({
            user,
            name,
          }).is({}),
        )
          .then(
            respond({
              error: "FOLDER_NAME_TAKEN",
            }),
          )
          .named("duplicate-name"),
      ),
);

/**
 * Adds a Post only to a folder belonging to
 * the signed-in user.
 */
const AddToFolder = endpoint(
  "/slot/add",
  ({
    session,
    user,
    folder,
    post,
    entry,
  }) =>
    receive({
      session,
      folder,
      post,
    })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        /*
         * User owns the folder and the Post
         * is not already in it.
         */
        where(
          Collecting._foldersFor({
            user,
          }).is({
            folder,
          }),

          no(
            Collecting._itemInFolder({
              folder,
              item: post,
            }),
          ),
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
          .named("available"),

        /*
         * User owns the folder, but the Post
         * is already inside it.
         */
        where(
          Collecting._foldersFor({
            user,
          }).is({
            folder,
          }),

          Collecting._itemInFolder({
            folder,
            item: post,
          }).is({}),
        )
          .then(
            respond({
              error: "ALREADY_IN_FOLDER",
            }),
          )
          .named("already-added"),

        /*
         * User does not own this folder.
         */
        where(
          no(
            Collecting._foldersFor({
              user,
            }).is({
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
    receive({
      session,
      folder,
      name,
    })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        /*
         * User owns this folder and no folder
         * with the requested name exists.
         */
        where(
          Collecting._foldersFor({
            user,
          }).is({
            folder,
          }),

          no(
            Collecting._folderNamed({
              user,
              name,
            }),
          ),
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
          .named("available-name"),

        /*
         * User owns this folder, but another
         * folder already uses the requested name.
         */
        where(
          Collecting._foldersFor({
            user,
          }).is({
            folder,
          }),

          Collecting._folderNamed({
            user,
            name,
          }).is({}),
        )
          .then(
            respond({
              error: "FOLDER_NAME_TAKEN",
            }),
          )
          .named("duplicate-name"),

        /*
         * User does not own the folder.
         */
        where(
          no(
            Collecting._foldersFor({
              user,
            }).is({
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
    receive({
      session,
      folder,
    })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        where(
          Collecting._getFolder({
            folder,
          }).is({
            user,
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
            Collecting._getFolder({
              folder,
            }).is({
              user,
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

