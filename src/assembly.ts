import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";
import { catalogComposition} from "./compositions/Catalog.ts";
import { searchComposition } from "./compositions/Search.ts";
import {slotComposition} from "./compositions/Slot.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: {
      ...catalogComposition,
      ...searchComposition,
      ...slotComposition,
    },
    initialize: {
      Posting: [db], 
      Tagging: [db], 
      Collecting: [db],
    }, 
  });
}
