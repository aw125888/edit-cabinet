import { assembleApplication } from "./src/assembly.ts";
import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { editCabinetApiPolicy } from "./src/edge.ts";

const policy = editCabinetApiPolicy();

export default {
  assemble: assembleApplication,
  title: "Application",

  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Catalog.md", import.meta.url),
      new URL("./design/compositions/Search.md", import.meta.url),
    ],
  },

  wireName: "ApplicationWire",

  projections: [
    httpWire({
      policy,
      name: "ApplicationWireHttp",
    }),
  ],
};