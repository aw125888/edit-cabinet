import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Collecting.md" with { type: "text" };
import type { Db } from "mongodb";
import { CollectingConcept } from "./Collecting.ts";

export const CollectingReg = registerConcept({
  class: CollectingConcept,
  spec,

  floors: {
    mongo: (
      { database }: { database: Db },
    ) => new CollectingConcept(database),
  },
});