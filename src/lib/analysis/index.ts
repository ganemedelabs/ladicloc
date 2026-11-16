import { MAX_FILE_BYTES } from "../constants";
import { detect } from "../languages";
import type { FileStat, RawFile } from "../types";
import { countLines } from "./count-lines";

const isBinary = (data: Uint8Array) => data.subarray(0, 8000).includes(0);

export function analyzeFiles(files: RawFile[]): FileStat[] {
    const decoder = new TextDecoder();
    const out: FileStat[] = [];
    for (const f of files) {
        if (f.data.length > MAX_FILE_BYTES || isBinary(f.data)) continue;
        const [lang, syntax] = detect(f.path);
        out.push({ path: f.path, lang, ...countLines(decoder.decode(f.data), syntax) });
    }
    return out;
}
