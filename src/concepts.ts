import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import { PostingReg } from "./concepts/PostingReg.ts";
import { TaggingReg } from "./concepts/TaggingReg.ts";
import { CollectingReg } from "./concepts/CollectingReg.ts";

export const applicationConceptSet = conceptSet({
  Posting: PostingReg,
  Tagging: TaggingReg,
  Collecting: CollectingReg,
});

export const { concepts } = applicationConceptSet;