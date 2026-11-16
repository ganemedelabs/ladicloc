import { countRepoLines } from "@/lib/analysis/repo";
import { renderBadge } from "@/lib/badge";

const HEADERS = { "Content-Type": "image/svg+xml; charset=utf-8" };

export async function GET(
    req: Request,
    { params }: { params: Promise<{ host: string; owner: string; repo: string }> }
) {
    const { host, owner, repo } = await params;
    const { searchParams } = new URL(req.url);

    try {
        const total = await countRepoLines({
            url: `https://${host}/${owner}/${repo}`,
            ext: searchParams.get("ext"),
            ignore: searchParams.get("ignore"),
        });
        const value = new Intl.NumberFormat("en", { notation: "compact" }).format(total).toLowerCase();

        return new Response(renderBadge("lines of code", value), {
            headers: { ...HEADERS, "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
        });
    } catch {
        // Short cache, so a transient failure doesn't stick.
        return new Response(renderBadge("lines of code", "unavailable", "#9f9f9f"), {
            headers: { ...HEADERS, "Cache-Control": "public, s-maxage=60" },
        });
    }
}
