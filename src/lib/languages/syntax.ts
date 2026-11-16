import type { Syntax } from "../types";

export const C: Syntax = { line: ["//"], block: [["/*", "*/"]] };
export const HASH: Syntax = { line: ["#"] };
export const MARKUP: Syntax = { block: [["<!--", "-->"]] };
export const SFC: Syntax = {
    line: ["//"],
    block: [
        ["/*", "*/"],
        ["<!--", "-->"],
    ],
};
