import { filesFromArchive } from "../source/archive";
import { analyzeFiles } from "./index";

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    try {
        const stats = analyzeFiles(filesFromArchive(new Uint8Array(e.data)));
        self.postMessage({ ok: true, stats });
    } catch (err) {
        self.postMessage({
            ok: false,
            error: err instanceof Error ? err.message : "Could not read that archive file.",
        });
    }
};
