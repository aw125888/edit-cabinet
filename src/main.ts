import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";

import { assembleApplication } from "./assembly.ts";
import { editCabinetApiPolicy } from "./edge.ts";

const application = assembleApplication();

const gateway = createGateway({
  application,
});

const handler = createHttpHandler({
  application,
  gateway,
  policy: editCabinetApiPolicy(),
});

const server = Bun.serve({
  hostname: "localhost",
  port: 3000,
  fetch: handler,
});

console.log(`EDIT CABINET API listening on ${server.url}`);