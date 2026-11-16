export function assertPublic(u: URL) {
    const h = u.hostname;
    if (
        u.protocol !== "https:" ||
        h === "localhost" ||
        h.includes(":") ||
        /\.(local|internal)$/.test(h) ||
        /^(0|10|127)\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)
    )
        throw new Error("Only public https:// repository URLs are supported.");
}

/** Direct zip-archive URL for GitHub, GitLab and Bitbucket, or null if the host is unknown. */
export function archiveUrl(u: URL): string | null {
    const parts = u.pathname
        .replace(/\.git$/, "")
        .split("/")
        .filter(Boolean);
    if (u.hostname === "github.com" && parts.length >= 2) {
        const ref = parts[2] === "tree" ? parts.slice(3).join("/") : "";
        return `https://codeload.github.com/${parts[0]}/${parts[1]}/zip/${ref || "HEAD"}`;
    }
    if (u.hostname.includes("gitlab")) {
        const dash = parts.indexOf("-");
        const proj = dash === -1 ? parts : parts.slice(0, dash);
        const ref = dash !== -1 && parts[dash + 1] === "tree" ? parts.slice(dash + 2).join("/") : "HEAD";
        return `${u.origin}/${proj.join("/")}/-/archive/${ref}/${proj[proj.length - 1]}-${ref.replace(/\//g, "-")}.zip`;
    }
    if (u.hostname === "bitbucket.org" && parts.length >= 2) {
        return `https://bitbucket.org/${parts[0]}/${parts[1]}/get/HEAD.zip`;
    }
    return null;
}

/** `owner/repo` for display, falling back to the hostname. */
export function repoName(u: URL): string {
    return (
        u.pathname
            .replace(/\.git$/, "")
            .split("/")
            .filter(Boolean)
            .slice(0, 2)
            .join("/") || u.hostname
    );
}
