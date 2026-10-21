import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import { PostingReg } from "./concepts/PostingReg.ts";
import { TaggingReg } from "./concepts/TaggingReg.ts";
import { CollectingReg } from "./concepts/CollectingReg.ts";
import { RegisteringReg } from "./concepts/RegisteringReg.ts";
import { SessioningReg } from "./concepts/SessioningReg.ts";
import { AuthenticatingReg } from "./concepts/AuthenticatingReg.ts";

export const applicationConceptSet = conceptSet({
  Posting: PostingReg,
  Tagging: TaggingReg,
  Collecting: CollectingReg,
  Registering: RegisteringReg,
  Sessioning: SessioningReg,
  Authenticating: AuthenticatingReg,
});

export const { concepts } = applicationConceptSet;