import { iconSlug } from "@/lib/languages";

export default function LangIcon({ lang }: { lang: string }) {
    const slug = iconSlug(lang);
    if (!slug) return <span aria-hidden className="inline-block size-4 shrink-0" />;
    return (
        // Plain <img> on purpose: next/image would route this through /_next/image,
        // which rejects remote hosts not in next.config and doesn't optimise SVGs anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`https://cdn.simpleicons.org/${slug}`}
            alt=""
            aria-hidden
            width={16}
            height={16}
            loading="lazy"
            className="size-4 shrink-0"
            onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
            }}
        />
    );
}
