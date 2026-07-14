import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Break, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

import { cn } from "@/lib/utils";

for (const [names, grammar] of [
    [["typescript", "ts", "tsx"], typescript],
    [["javascript", "js", "jsx"], javascript],
    [["json"], json],
    [["python", "py"], python],
    [["bash", "sh", "zsh"], bash],
    [["sql"], sql],
    [["yaml", "yml"], yaml],
    [["html", "xml"], xml],
    [["css"], css],
    [["scss"], scss],
    [["go"], go],
    [["rust", "rs"], rust],
    [["java"], java],
    [["c", "cpp"], cpp],
    [["kotlin", "kt"], kotlin],
    [["swift"], swift],
    [["php"], php],
    [["ruby", "rb"], ruby],
] as const) {
    for (const name of names) hljs.registerLanguage(name, grammar);
}

function highlightCode(code: string, lang?: string): string {
    const language = lang && hljs.getLanguage(lang) ? lang : undefined;
    return language
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : hljs.highlightAuto(code).value;
}

const SOFT_BREAK = "\u2028";
const FENCE_RE = /(```[\s\S]*?```)/g;
const LANG_TAGS = new Set([
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "py",
    "python",
    "sh",
    "bash",
    "zsh",
    "sql",
    "yaml",
    "yml",
    "html",
    "css",
    "scss",
    "go",
    "rs",
    "rust",
    "java",
    "c",
    "cpp",
    "kt",
    "swift",
    "php",
    "rb",
]);

function splitLangTag(text: string): { lang?: string; text: string } {
    const [first, ...rest] = text.split(SOFT_BREAK);
    return rest.length > 0 && LANG_TAGS.has(first.toLowerCase())
        ? { lang: first.toLowerCase(), text: rest.join(SOFT_BREAK) }
        : { text };
}

function normalizeMarkdown(raw: string): string {
    return raw
        .split(FENCE_RE)
        .map((segment, i) =>
            i % 2 === 1 ? normalizeFence(segment) : normalizeSegment(segment),
        )
        .join("");
}

function normalizeSegment(segment: string): string {
    return segment
        .replace(/<br\s*\/?>/gi, SOFT_BREAK)
        .replace(/`([^`\n]*)`/g, (match, code: string) =>
            code.includes("\\n")
                ? "`" + code.replace(/\\n/g, SOFT_BREAK) + "`"
                : match,
        );
}

function normalizeFence(segment: string): string {
    if (segment.includes("\n")) return segment;
    const inner = segment.slice(3, -3);
    return inner.includes("\\n")
        ? "`" + inner.replace(/\\n/g, SOFT_BREAK) + "`"
        : segment;
}

const remarkSoftBreaks: Plugin<[], Root> = () => (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
        if (!parent || index == null || !node.value.includes(SOFT_BREAK))
            return;
        const pieces = node.value.split(SOFT_BREAK);
        const replacement = pieces.flatMap((piece, i) =>
            i === 0
                ? [{ type: "text", value: piece } as Text]
                : [
                      { type: "break" } as Break,
                      { type: "text", value: piece } as Text,
                  ],
        );
        parent.children.splice(index, 1, ...replacement);
        return index + replacement.length;
    });
};

function dropNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { node, ...rest } = props;
    return rest;
}

const components: Components = {
    p: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <p
                className={cn("[&:not(:first-child)]:mt-3", className)}
                {...rest}
            />
        );
    },
    a: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <a
                className={cn(
                    "font-medium underline underline-offset-4",
                    className,
                )}
                target="_blank"
                rel="noreferrer"
                {...rest}
            />
        );
    },
    strong: (props) => {
        const { className, ...rest } = dropNode(props);
        return <strong className={cn("font-semibold", className)} {...rest} />;
    },
    ul: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <ul
                className={cn(
                    "list-disc space-y-1 pl-5 [&:not(:first-child)]:mt-3",
                    className,
                )}
                {...rest}
            />
        );
    },
    ol: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <ol
                className={cn(
                    "list-decimal space-y-1 pl-5 [&:not(:first-child)]:mt-3",
                    className,
                )}
                {...rest}
            />
        );
    },
    li: (props) => {
        const { className, ...rest } = dropNode(props);
        return <li className={cn("leading-relaxed", className)} {...rest} />;
    },
    blockquote: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <blockquote
                className={cn(
                    "border-l-2 border-current/20 pl-3 opacity-80",
                    className,
                )}
                {...rest}
            />
        );
    },
    hr: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <hr className={cn("my-4 border-current/15", className)} {...rest} />
        );
    },
    h1: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <h1
                className={cn(
                    "mt-4 text-base font-semibold first:mt-0",
                    className,
                )}
                {...rest}
            />
        );
    },
    h2: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <h2
                className={cn(
                    "mt-4 text-base font-semibold first:mt-0",
                    className,
                )}
                {...rest}
            />
        );
    },
    h3: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <h3
                className={cn(
                    "mt-3 text-sm font-semibold first:mt-0",
                    className,
                )}
                {...rest}
            />
        );
    },
    pre: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <pre
                className={cn(
                    "mt-3 overflow-x-auto rounded-lg bg-foreground/10 p-3 text-xs first:mt-0",
                    className,
                )}
                {...rest}
            />
        );
    },
    code: (props) => {
        const { className, children, ...rest } = dropNode(props);
        const text = typeof children === "string" ? children : null;
        const fenceLang = /language-(\w+)/.exec(className ?? "")?.[1];

        if (fenceLang && text != null) {
            return (
                <code
                    className={cn(
                        "hljs font-mono text-xs [pre_&]:bg-transparent [pre_&]:p-0",
                        className,
                    )}
                    dangerouslySetInnerHTML={{
                        __html: highlightCode(text, fenceLang),
                    }}
                    {...rest}
                />
            );
        }

        if (text?.includes(SOFT_BREAK)) {
            const { lang, text: stripped } = splitLangTag(text);
            const plain = stripped
                .split(SOFT_BREAK)
                .join("\n")
                .replace(/\n+$/, "");
            return (
                <code
                    className={cn(
                        "hljs rounded bg-foreground/10 px-1 py-0.5 font-mono text-xs whitespace-pre-wrap [pre_&]:bg-transparent [pre_&]:p-0",
                        className,
                    )}
                    dangerouslySetInnerHTML={{
                        __html: highlightCode(plain, lang),
                    }}
                    {...rest}
                />
            );
        }

        return (
            <code
                className={cn(
                    "rounded bg-foreground/10 px-1 py-0.5 font-mono text-xs [pre_&]:bg-transparent [pre_&]:p-0",
                    className,
                )}
                {...rest}
            >
                {children}
            </code>
        );
    },
    table: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <div className="mt-3 overflow-x-auto first:mt-0">
                <table
                    className={cn("w-full border-collapse text-xs", className)}
                    {...rest}
                />
            </div>
        );
    },
    thead: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <thead
                className={cn("border-b border-current/15", className)}
                {...rest}
            />
        );
    },
    th: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <th
                className={cn("px-2 py-1.5 text-left font-medium", className)}
                {...rest}
            />
        );
    },
    td: (props) => {
        const { className, ...rest } = dropNode(props);
        return (
            <td
                className={cn(
                    "border-t border-current/10 px-2 py-1.5 align-top",
                    className,
                )}
                {...rest}
            />
        );
    },
};

function Markdown({
    className,
    children,
}: {
    className?: string;
    children: string;
}) {
    return (
        <div
            className={cn("text-sm leading-relaxed wrap-break-word", className)}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkSoftBreaks]}
                components={components}
            >
                {normalizeMarkdown(children)}
            </ReactMarkdown>
        </div>
    );
}

export { Markdown };
