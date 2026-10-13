import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import {PostingReg} from "./concepts/PostingReg.ts"; 

export const applicationConceptSet = conceptSet({
    Posting: PostingReg, 
});
export const { concepts } = applicationConceptSet;
