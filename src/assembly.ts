import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";
import { catalogComposition} from "./compositions/Catalog.ts";
import { searchComposition } from "./compositions/Search.ts";
import {slotComposition} from "./compositions/Slot.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";
import { manageComposition } from "./compositions/Manage.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    composition: {
  ...catalogComposition,
  ...searchComposition,
  ...slotComposition,
  ...manageComposition,

  reusable: {
    accounts,
    passwords,
  },
},
    instances: applicationConceptSet.implementations(
  "mongo",
  {
    database: db,
  },
),
  });
}
