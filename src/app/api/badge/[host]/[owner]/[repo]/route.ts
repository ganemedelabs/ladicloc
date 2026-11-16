import { countRepoLines } from "@/lib/analysis/repo";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ host: string; owner: string; repo: string }> }
) {
    const { host, owner, repo } = await params;
    const { searchParams } = new URL(req.url);

    const total = await countRepoLines({
        url: `https://${host}/${owner}/${repo}`,
        ext: searchParams.get("ext"),
        ignore: searchParams.get("ignore"),
    });

    return NextResponse.json(
        {
            schemaVersion: 1,
            label: "lines of code",
            message: new Intl.NumberFormat("en", { notation: "compact" }).format(total),
            color: "blue",
        },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
}
