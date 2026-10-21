import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Tagging.md" with { type: "text" };
import type { Db } from "mongodb";
import { TaggingConcept } from "./Tagging.ts";

export const TaggingReg = registerConcept({
  class: TaggingConcept,
  spec,

  floors: {
    mongo: (
      { database }: { database: Db },
    ) => new TaggingConcept(database),
  },
});