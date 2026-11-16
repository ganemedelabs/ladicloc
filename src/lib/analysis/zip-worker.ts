import { filesFromZip } from "../source/zip";
import { analyzeFiles } from "./index";

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    try {
        const stats = analyzeFiles(filesFromZip(new Uint8Array(e.data)));
        self.postMessage({ ok: true, stats });
    } catch (err) {
        self.postMessage({ ok: false, error: err instanceof Error ? err.message : "Could not read that zip file." });
    }
};
