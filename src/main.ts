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

const dist =
  `${import.meta.dir}/../frontend/dist`;

const server = Bun.serve({
  hostname:
    process.env.HOST ??
    "127.0.0.1",

  port:
    Number(process.env.PORT) ||
    3000,

  routes: {
    "/health": new Response("ok"),

    "/api/*": async (request) => {
      return handler(request);
    },
  },

  async fetch(request) {
    const pathname =
      new URL(request.url).pathname;

    const file =
      Bun.file(dist + pathname);

    return new Response(
      (await file.exists())
        ? file
        : Bun.file(
            `${dist}/index.html`,
          ),
    );
  },
});

console.log(
  `EDIT CABINET listening on ${server.url}`,
);