import { MAX_ARCHIVE_BYTES } from "../constants";

export type ProgressFn = (loaded: number, total?: number) => void; // eslint-disable-line no-unused-vars

export async function readWithProgress(
    res: Response,
    onProgress?: ProgressFn,
    maxBytes = MAX_ARCHIVE_BYTES
): Promise<Uint8Array> {
    const total = Number(res.headers.get("content-length")) || undefined;
    const tooBig = () => new Error(`That repository is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`);

    if (total && total > maxBytes) {
        await res.body?.cancel();
        throw tooBig();
    }

    if (!res.body) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.length > maxBytes) throw tooBig();
        onProgress?.(buf.length, total ?? buf.length);
        return buf;
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.length;

        if (loaded > maxBytes) {
            await reader.cancel();
            throw tooBig();
        }

        chunks.push(value);
        onProgress?.(loaded, total);
    }

    const out = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
    }
    return out;
}
