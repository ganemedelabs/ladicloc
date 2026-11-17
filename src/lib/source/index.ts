import type { RawFile } from "../types";
import { filesFromArchive } from "./archive";
import { readWithProgress, type ProgressFn } from "./download";
import { cloneRepo } from "./git";
import { archiveUrl, assertPublic, repoName } from "./url";

export { filesFromArchive };
export type { RawFile };

export async function filesFromUrl(raw: string, onProgress?: ProgressFn): Promise<{ name: string; files: RawFile[] }> {
    const u = new URL(raw.trim());
    assertPublic(u);
    const name = repoName(u);

    const archive = archiveUrl(u);
    if (archive) {
        const res = await fetch(archive);
        if (res.ok) return { name, files: filesFromArchive(await readWithProgress(res, onProgress)) };
    }
    return { name, files: await cloneRepo(u.href) };
}
