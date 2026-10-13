import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: {},
    initialize: {
      Posting: [db], 
      Tagging: [db], 
    }, 
  });
}
