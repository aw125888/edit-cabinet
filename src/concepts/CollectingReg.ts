import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Collecting.md" with { type: "text" };
import { CollectingConcept } from "./Collecting.ts";

export const CollectingReg = registerConcept({
  class: CollectingConcept,
  spec,
});