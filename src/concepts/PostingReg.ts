import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/posting.md" with { type: "text" };
import { PostingConcept } from "./Posting.ts";

export const PostingReg = registerConcept({
  class: PostingConcept,
  spec,
});