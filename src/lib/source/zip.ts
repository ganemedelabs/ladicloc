import { unzipSync } from "fflate";
import { MAX_FILE_BYTES } from "../constants";
import type { RawFile } from "../types";

export function filesFromZip(buf: Uint8Array): RawFile[] {
    const entries = unzipSync(buf, {
        filter: (f) => !f.name.endsWith("/") && !f.name.split("/").includes(".git") && f.originalSize <= MAX_FILE_BYTES,
    });
    const names = Object.keys(entries);
    const top = names[0]?.split("/")[0];
    const strip = names.length > 0 && names.every((n) => n.startsWith(top + "/"));
    return names.map((n) => ({ path: strip ? n.slice(top.length + 1) : n, data: entries[n] }));
}
