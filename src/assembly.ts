import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";
import { catalogComposition} from "./compositions/Catalog.ts";
import { searchComposition } from "./compositions/Search.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: {
      ...catalogComposition,
      ...searchComposition,
    },
    initialize: {
      Posting: [db], 
      Tagging: [db], 
    }, 
  });
}
