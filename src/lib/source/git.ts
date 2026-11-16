import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RawFile } from "../types";

const run = promisify(execFile);

export async function cloneRepo(url: string): Promise<RawFile[]> {
    const dir = await mkdtemp(path.join(tmpdir(), "loc-"));
    try {
        await run("git", ["clone", "--depth", "1", "--single-branch", "--", url, dir], {
            timeout: 60_000,
            env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        });
        const out: RawFile[] = [];
        const walk = async (rel: string) => {
            for (const e of await readdir(path.join(dir, rel), { withFileTypes: true })) {
                if (e.name === ".git") continue;
                const r = rel ? `${rel}/${e.name}` : e.name;
                if (e.isDirectory()) await walk(r);
                else if (e.isFile()) out.push({ path: r, data: await readFile(path.join(dir, r)) });
            }
        };
        await walk("");
        return out;
    } catch {
        throw new Error("Could not fetch that repository. It may be private, missing, or unreachable.");
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}
