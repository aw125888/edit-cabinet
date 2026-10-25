import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Posting, Tagging, Sessioning} = concepts;

const CreateCatalogPost = endpoint(
  "/catalog/post",
  ({ session, user, media, caption, post }) =>
    receive({ session, media, caption })
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
            Posting._getByMedia({
              media,
            }),
          ),
        )
          .then(
            Posting.createPost({
              user,
              media,
              caption,
            }).responds({
              post,
            }),
          )
          .then(
            respond({
              post,
            }),
          )
          .named("media-available"),

        where(
          Posting._getByMedia({
            media,
          }),
        )
          .then(
            respond({
              error:
                "MEDIA_ALREADY_CATALOGED",
            }),
          )
          .named(
            "media-already-cataloged",
          ),
      ),
);

const GetCatalogCount = endpoint(
  "/catalog/count",
  ({ count }) =>
    receive({})
      .then(
        where(
          Posting._count({}).is({
            count,
          }),
        )
          .then(
            respond({
              count,
            }),
          )
          .named("count"),
      ),
);
const AttachCatalogTag = endpoint(
  "/catalog/tag",
  ({
    post,
    name,
    category,
    tag,
    newTag,
    assignment,
  }) =>
    receive({ post, name, category })
      .then(
        where(
          Tagging._findTag({
            name,
            category,
          }).is({ tag }),
        )
          .then(
            Tagging.tagItem({
              tag,
              item: post,
            }).responds({ assignment }),
          )
          .then(respond({ assignment }))
          .named("tag-exists"),

        where(
          no(
            Tagging._findTag({
              name,
              category,
            }),
          ),
        )
          .then(Tagging.createTag({ name, category }).responds({ tag: newTag }))
          .then(Tagging.tagItem({ tag: newTag, item: post }).responds({ assignment }))
          .then(respond({ assignment }))
          .named("tag-missing"),
      ),
);

export const catalogComposition = {
    Catalog: {CreateCatalogPost, GetCatalogCount, AttachCatalogTag}, 
}