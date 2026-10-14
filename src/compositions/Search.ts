import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, where, form, no } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Posting, Tagging } = concepts;


const ItemsForTag = former(
  "the items for tag (tag)",
  ({ tag }, { item }) =>
    form({
      items: each(
        Tagging._itemsFor({ tag }).is({ item }),
      ).form({ item }),
    }),

);

const SearchTag = endpoint(
  "/search/tag",
  ({ name, category, tag }) =>
    receive({ name, category })
      .then(
        where(
          Tagging._findTag({
            name,
            category,
          }).is({ tag }),
        )
          .then(
            respond({
              results: ItemsForTag({ tag }),
            }),
          )
          .named("tag-exists"),

        where(
          no(
            Tagging._findTag({
              name,
              category,
            }),
          ),
        )
          .then(
            respond({
              results: { items: [] },
            }),
          )
          .named("tag-missing"),
      ),
);

export const searchComposition = {
  Search: {
    SearchTag,
    ItemsForTag,
  },
};