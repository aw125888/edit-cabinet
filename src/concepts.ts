import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import {PostingReg} from "./concepts/PostingReg.ts"; 
import { TaggingReg } from "./concepts/TaggingReg.ts";

export const applicationConceptSet = conceptSet({
    Posting: PostingReg, 
    Tagging: TaggingReg
});
export const { concepts } = applicationConceptSet;
