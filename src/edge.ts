import {
  httpPolicy,
  type HttpPolicy,
} from "@mit-sdg/sync-engine-http/policy";

import { accountsHttp } from "./compositions/reusable/accounts.ts";
import { passwordsHttp } from "./compositions/reusable/passwords.ts";

export function editCabinetApiPolicy(): HttpPolicy {
  return httpPolicy({
    publicOrigin:
      process.env.PUBLIC_ORIGIN ??
      "http://127.0.0.1:3000",

    basePath: "/api",

    publicErrors: {
      ...accountsHttp.publicErrors,
      ...passwordsHttp.publicErrors,

      FORBIDDEN: "FORBIDDEN",

      FOLDER_NAME_TAKEN: "CONFLICT",
      ALREADY_IN_FOLDER: "CONFLICT",
      MEDIA_ALREADY_CATALOGED: "CONFLICT",
    },

    cookies: {
      session: {
        ...accountsHttp.sessionCookie(
          "edit-cabinet-session",
          passwordsHttp.startingSessions,
        ),
      },
    },
  });
}