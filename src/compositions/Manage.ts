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
  Tagging,
  Collecting,
  Sessioning,
} = concepts;

/**
 * Forms all Posts cataloged by a user,
 * including their current tags.
 */
const UserPosts = former(
  "the posts for user (user)",
  (
    { user },
    {
      post,
      media,
      caption,
      assignment,
      tag,
      name,
      category,
    },
  ) =>
    form({
      posts: each(
        Posting._postsBy({ user }).is({
          post,
          media,
          caption,
        }),
      ).form({
        post,
        media,
        caption,

        tags: each(
          Tagging._tagsFor({
            item: post,
          }).is({
            assignment,
            tag,
            name,
            category,
          }),
        ).form({
          assignment,
          tag,
          name,
          category,
        }),
      }),
    }),
);

/**
 * Returns Posts cataloged by the signed-in user.
 */
const GetPosts = endpoint(
  "/manage/posts",
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
          result: UserPosts({ user }),
        }),
      ),
);

/**
 * Lets the owner of a Post edit its caption.
 */
const EditCaption = endpoint(
  "/manage/caption",
  ({ session, user, post, caption }) =>
    receive({
      session,
      post,
      caption,
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
          Posting._get({ post }).is({
            user,
          }),
        )
          .then(
            Posting.editCaption({
              post,
              caption,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned"),

        where(
          no(
            Posting._get({ post }).is({
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

/**
 * Adds a Tag to a Post owned by the signed-in user.
 *
 * If the Tag already exists, reuse it.
 * Otherwise create it first.
 */
const AddTag = endpoint(
  "/manage/tag/add",
  ({
    session,
    user,
    post,
    name,
    category,
    tag,
    newTag,
    assignment,
  }) =>
    receive({
      session,
      post,
      name,
      category,
    })
      .then(
        Sessioning.use({
          session,
        }).responds({
          subject: user,
        }),
      )
      .then(
        // Owner + tag already exists
        where(
          Posting._get({ post }).is({
            user,
          }),
          Tagging._findTag({
            name,
            category,
          }).is({
            tag,
          }),
        )
          .then(
            Tagging.tagItem({
              tag,
              item: post,
            }).responds({
              assignment,
            }),
          )
          .then(
            respond({
              assignment,
            }),
          )
          .named("owned-tag-exists"),

        // Owner + tag does not exist yet
        where(
          Posting._get({ post }).is({
            user,
          }),
          no(
            Tagging._findTag({
              name,
              category,
            }),
          ),
        )
          .then(
            Tagging.createTag({
              name,
              category,
            }).responds({
              tag: newTag,
            }),
          )
          .then(
            Tagging.tagItem({
              tag: newTag,
              item: post,
            }).responds({
              assignment,
            }),
          )
          .then(
            respond({
              assignment,
            }),
          )
          .named("owned-tag-missing"),

        // User does not own the post
        where(
          no(
            Posting._get({ post }).is({
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
/**
 * Removes one TagAssignment from a Post owned
 * by the signed-in user.
 *
 * The assignment must also belong to that Post.
 */
const RemoveTag = endpoint(
  "/manage/tag/remove",
  ({
    session,
    user,
    post,
    assignment,
  }) =>
    receive({
      session,
      post,
      assignment,
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
          Posting._get({ post }).is({
            user,
          }),

          Tagging._tagsFor({
            item: post,
          }).is({
            assignment,
          }),
        )
          .then(
            Tagging.untagItem({
              assignment,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned-assignment"),

        where(
          no(
            Posting._get({ post }).is({
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
/**
 * Deletes a Post owned by the signed-in user and cleans up
 * references from Tagging and Collecting first.
 */
const DeletePost = endpoint(
  "/manage/delete",
  ({ session, user, post }) =>
    receive({
      session,
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
        where(
          Posting._get({ post }).is({
            user,
          }),
        )
          .then(
            Tagging.untagAll({
              item: post,
            }),
          )
          .then(
            Collecting.removeFromAllFolders({
              item: post,
            }),
          )
          .then(
            Posting.deletePost({
              post,
            }),
          )
          .then(
            respond({}),
          )
          .named("owned"),

        where(
          no(
            Posting._get({ post }).is({
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

export const manageComposition = {
  Manage: {
    GetPosts,
    EditCaption,
    AddTag,
    RemoveTag,
    DeletePost,
    UserPosts,
  },
};