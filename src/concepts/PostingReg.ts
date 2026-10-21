import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/posting.md" with { type: "text" };
import type { Db } from "mongodb";
import { PostingConcept } from "./Posting.ts";

export const PostingReg = registerConcept({
  class: PostingConcept,
  spec,

  floors: {
    mongo: (
      { database }: { database: Db },
    ) => new PostingConcept(database),
  },
});