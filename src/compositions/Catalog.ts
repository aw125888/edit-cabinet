import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Posting, Tagging} = concepts;

const CreateCatalogPost = endpoint(
  "/catalog/post",
  ({ user, media, caption, post }) =>
    receive({ user, media, caption })
      .then(
        Posting.createPost({ user, media, caption })
          .responds({ post })
      )
      .then(respond({ post })),
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
    Catalog: {CreateCatalogPost, AttachCatalogTag}, 
}