import type { FileStat } from "../types";

export function analyzeZip(file: File): Promise<FileStat[]> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./zip-worker.ts", import.meta.url));
        worker.onmessage = (e: MessageEvent<{ ok: boolean; stats?: FileStat[]; error?: string }>) => {
            worker.terminate();
            if (e.data.ok) resolve(e.data.stats!);
            else reject(new Error(e.data.error));
        };
        worker.onerror = () => {
            worker.terminate();
            reject(new Error("Failed to process the zip file."));
        };
        file.arrayBuffer().then((buf) => worker.postMessage(buf, [buf]), reject);
    });
}
