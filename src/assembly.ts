import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";
import { catalogComposition} from "./compositions/Catalog.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: catalogComposition,
    initialize: {
      Posting: [db], 
      Tagging: [db], 
    }, 
  });
}
