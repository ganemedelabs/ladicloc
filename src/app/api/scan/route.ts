import { analyzeFiles } from "@/lib/analysis";
import { filesFromUrl, filesFromZip, type RawFile } from "@/lib/source";

export const maxDuration = 300;

export async function POST(req: Request) {
    const enc = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (o: object) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
            let last = 0;
            const onProgress = (loaded: number, total?: number) => {
                const now = Date.now();
                if (now - last < 100) return; // throttle
                last = now;
                send({ type: "progress", phase: "downloading", loaded, total });
            };

            try {
                let name = "";
                let raw: RawFile[];
                if (req.headers.get("content-type")?.includes("multipart/form-data")) {
                    const file = (await req.formData()).get("file");
                    if (!(file instanceof File)) throw new Error("No file received.");
                    name = file.name.replace(/\.zip$/i, "");
                    raw = filesFromZip(new Uint8Array(await file.arrayBuffer()));
                } else {
                    const { url } = await req.json();
                    ({ name, files: raw } = await filesFromUrl(String(url ?? ""), onProgress));
                }
                send({ type: "progress", phase: "analyzing" });
                send({ type: "done", name, files: analyzeFiles(raw) });
            } catch (e) {
                send({ type: "error", error: e instanceof Error ? e.message : "Scan failed." });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
}
