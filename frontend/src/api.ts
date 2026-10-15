import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { ApplicationWireHttp } from "../../generated/wire.ts";

export const api = createHttpClient<ApplicationWireHttp>({
  baseUrl: "http://localhost:3000/api",
});

