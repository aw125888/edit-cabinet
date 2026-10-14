import {
  httpPolicy,
  type HttpPolicy,
} from "@mit-sdg/sync-engine-http/policy";

export function editCabinetApiPolicy(): HttpPolicy {
  return httpPolicy({
    publicOrigin: "http://localhost:3000",
    basePath: "/api",
    publicErrors: {},
    browser: {
      origins: ["http://localhost:5173"],
    },
  });
}