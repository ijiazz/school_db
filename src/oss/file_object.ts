export * from "./file_object/type.ts";

import { fsAPI as nodeFsAPI } from "./file_object/node_file_object.ts";
import { fsAPI as denoFsApi } from "./file_object/deno_file_object.ts";
import type { Fs } from "./file_object/type.ts";

export const fsAPI: Fs = typeof globalThis.Deno === "object" ? { ...nodeFsAPI, ...denoFsApi } : nodeFsAPI;
