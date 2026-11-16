// Verdana advance widths per 1000 em (approximate), used to size the badge without a font engine.
const W: Record<string, number> = {
    " ": 352,
    ".": 364,
    ",": 364,
    "-": 408,
    ":": 454,
    "/": 432,
    "%": 1002,
    "+": 838,
    _: 636,
    a: 601,
    b: 623,
    c: 521,
    d: 623,
    e: 596,
    f: 352,
    g: 623,
    h: 633,
    i: 274,
    j: 344,
    k: 592,
    l: 274,
    m: 973,
    n: 633,
    o: 607,
    p: 623,
    q: 623,
    r: 427,
    s: 521,
    t: 394,
    u: 633,
    v: 592,
    w: 818,
    x: 592,
    y: 592,
    z: 525,
    A: 684,
    B: 686,
    C: 698,
    D: 770,
    E: 632,
    F: 575,
    G: 775,
    H: 752,
    I: 421,
    J: 455,
    K: 693,
    L: 557,
    M: 843,
    N: 748,
    O: 787,
    P: 603,
    Q: 787,
    R: 695,
    S: 684,
    T: 616,
    U: 732,
    V: 684,
    W: 989,
    X: 685,
    Y: 614,
    Z: 685,
};
for (const d of "0123456789") W[d] = 636;

const FONT_SIZE = 11;

/** Text width in px at 11px Verdana. */
const measure = (text: string) => ([...text].reduce((sum, ch) => sum + (W[ch] ?? 600), 0) / 1000) * FONT_SIZE;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderBadge(label: string, value: string, color = "#007ec6", labelColor = "#555"): string {
    const pad = 5;
    const lt = measure(label);
    const vt = measure(value);
    const lw = Math.round(lt + pad * 2);
    const vw = Math.round(vt + pad * 2);
    const width = lw + vw;

    // Text is drawn at 10x and scaled down by 0.1 for sub-pixel positioning.
    const lx = (lw / 2) * 10;
    const vx = (lw + vw / 2) * 10;
    const ltl = Math.round(lt * 10);
    const vtl = Math.round(vt * 10);
    const l = esc(label);
    const v = esc(value);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${l}: ${v}">
<title>${l}: ${v}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)">
<rect width="${lw}" height="20" fill="${labelColor}"/>
<rect x="${lw}" width="${vw}" height="20" fill="${color}"/>
<rect width="${width}" height="20" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
<text aria-hidden="true" x="${lx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${ltl}">${l}</text>
<text x="${lx}" y="140" transform="scale(.1)" textLength="${ltl}">${l}</text>
<text aria-hidden="true" x="${vx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${vtl}">${v}</text>
<text x="${vx}" y="140" transform="scale(.1)" textLength="${vtl}">${v}</text>
</g>
</svg>`;
}
