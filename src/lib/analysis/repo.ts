import { cacheLife } from "next/cache";
import { extKey } from "../path";
import { filesFromUrl } from "../source";
import { analyzeFiles } from "./index";

export type CountOptions = { url: string; ext?: string | null; ignore?: string | null };

const list = (v?: string | null) =>
    (v ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

/** Total lines of code in a remote repo, optionally limited by extensions and ignored paths. */
export async function countRepoLines({ url, ext, ignore }: CountOptions): Promise<number> {
    "use cache";
    cacheLife("hours");

    const exts = list(ext).map((e) => (e.startsWith(".") ? e : `.${e}`));
    const ignored = list(ignore).map((i) => i.replace(/\/+$/, ""));

    const { files } = await filesFromUrl(url);
    const kept = files.filter((f) => {
        const p = f.path.toLowerCase();
        if (ignored.some((i) => p === i || p.startsWith(`${i}/`) || p.split("/").includes(i))) return false;
        return exts.length === 0 || exts.includes(extKey(f.path));
    });

    return analyzeFiles(kept).reduce((sum, f) => sum + f.code, 0);
}
