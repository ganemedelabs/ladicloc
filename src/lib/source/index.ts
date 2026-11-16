import type { RawFile } from "../types";
import { readWithProgress, type ProgressFn } from "./download";
import { cloneRepo } from "./git";
import { archiveUrl, assertPublic, repoName } from "./url";
import { filesFromZip } from "./zip";

export { filesFromZip };
export type { RawFile };

export async function filesFromUrl(raw: string, onProgress?: ProgressFn): Promise<{ name: string; files: RawFile[] }> {
    const u = new URL(raw.trim());
    assertPublic(u);
    const name = repoName(u);

    const zip = archiveUrl(u);
    if (zip) {
        const res = await fetch(zip);
        if (res.ok) return { name, files: filesFromZip(await readWithProgress(res, onProgress)) };
    }
    return { name, files: await cloneRepo(u.href) };
}
