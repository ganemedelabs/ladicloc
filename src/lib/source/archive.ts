import { gunzipSync, unzipSync } from "fflate";
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

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b;
const isGzip = (b: Uint8Array) => b[0] === 0x1f && b[1] === 0x8b;
const isTar = (b: Uint8Array) => b.length > 262 && String.fromCharCode(...b.subarray(257, 262)) === "ustar";

function stripTop(files: RawFile[]): RawFile[] {
    const top = files[0]?.path.split("/")[0];
    const strip = files.length > 0 && files.every((f) => f.path.startsWith(top + "/"));
    return strip ? files.map((f) => ({ ...f, path: f.path.slice(top.length + 1) })) : files;
}

function filesFromTar(buf: Uint8Array): RawFile[] {
    const files: RawFile[] = [];
    const dec = new TextDecoder();
    let off = 0;
    while (off + 512 <= buf.length) {
        const header = buf.subarray(off, off + 512);
        if (header.every((x) => x === 0)) break;

        const name = dec.decode(header.subarray(0, 100)).replace(/\0.*$/, "");
        const prefix = dec.decode(header.subarray(345, 500)).replace(/\0.*$/, "");
        const size = parseInt(dec.decode(header.subarray(124, 136)).replace(/\0.*$/, "").trim() || "0", 8);
        const type = String.fromCharCode(header[156]);
        const path = prefix ? `${prefix}/${name}` : name;

        off += 512;
        const isFile = type === "0" || type === "\0";
        if (isFile && size <= MAX_FILE_BYTES && !path.split("/").includes(".git")) {
            files.push({ path, data: buf.slice(off, off + size) });
        }
        off += Math.ceil(size / 512) * 512;
    }
    return files;
}

export function filesFromArchive(buf: Uint8Array): RawFile[] {
    if (isGzip(buf)) buf = gunzipSync(buf); // .gz / .tgz -> maybe tar inside
    if (isZip(buf)) return stripTop(filesFromZip(buf));
    if (isTar(buf)) return stripTop(filesFromTar(buf));
    throw new Error("Unsupported archive format.");
}
