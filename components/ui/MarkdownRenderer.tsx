"use client";

import React, { useMemo } from "react";
import { cn, getMediaUrl } from "@/lib/utils";
import Image from "next/image";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * A robust, safe, and rich Markdown parser & renderer optimized for Persian RTL text,
 * supporting headings, inline imagery, blockquotes, lists, tables, bold/italic, code blocks,
 * and horizontal rules.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const elements = useMemo(() => {
    if (!content) return [];
    return parseMarkdownBlocks(content);
  }, [content]);

  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "prose-persian space-y-4 text-slate-800 leading-loose text-sm sm:text-base font-normal tracking-normal select-text",
        className
      )}
      dir="rtl"
    >
      {elements.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return (
              <h1
                key={idx}
                className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 pt-6 pb-2 border-b border-slate-100 mt-6 mb-3 leading-tight"
              >
                {renderInlineFormatting(block.text)}
              </h1>
            );
          case "h2":
            return (
              <h2
                key={idx}
                className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 pt-5 pb-1 mt-5 mb-2 leading-snug flex items-center gap-2"
              >
                <span className="w-1.5 h-6 bg-primary rounded-full inline-block shrink-0" />
                <span>{renderInlineFormatting(block.text)}</span>
              </h2>
            );
          case "h3":
            return (
              <h3
                key={idx}
                className="text-base sm:text-lg font-bold text-slate-900 pt-4 mt-4 mb-2 leading-snug"
              >
                {renderInlineFormatting(block.text)}
              </h3>
            );
          case "h4":
            return (
              <h4
                key={idx}
                className="text-sm sm:text-base font-bold text-slate-800 pt-3 mt-3 mb-1"
              >
                {renderInlineFormatting(block.text)}
              </h4>
            );
          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="p-4 sm:p-5 my-4 bg-slate-50 border-r-4 border-primary rounded-2xl text-slate-700 italic font-medium leading-relaxed shadow-xs"
              >
                <p>{renderInlineFormatting(block.text)}</p>
              </blockquote>
            );
          case "image": {
            const rawUrl = block.url;
            const fullUrl = rawUrl ? getMediaUrl(rawUrl) : "";
            return (
              <figure key={idx} className="my-6 space-y-2">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullUrl}
                    alt={block.alt || "تصویر مقاله"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/property-placeholder.svg";
                    }}
                  />
                </div>
                {block.alt && block.alt.trim() !== "" && (
                  <figcaption className="text-center text-xs text-slate-500 font-medium pt-1">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "ul":
            return (
              <ul key={idx} className="space-y-2 my-3 list-disc pr-6 text-slate-700">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineFormatting(item)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="space-y-2 my-3 list-decimal pr-6 text-slate-700">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderInlineFormatting(item)}
                  </li>
                ))}
              </ol>
            );
          case "codeblock":
            return (
              <div key={idx} className="my-4 rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto dir-ltr text-left">
                {block.lang && (
                  <div className="text-[10px] text-slate-400 font-sans uppercase mb-2 border-b border-slate-800 pb-1">
                    {block.lang}
                  </div>
                )}
                <pre className="leading-relaxed whitespace-pre-wrap">{block.text}</pre>
              </div>
            );
          case "hr":
            return <hr key={idx} className="my-8 border-t border-slate-200" />;
          case "table":
            return (
              <div key={idx} className="my-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs sm:text-sm">
                  {block.headers.length > 0 && (
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                      <tr>
                        {block.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3">
                            {renderInlineFormatting(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-700">
                            {renderInlineFormatting(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "p":
          default:
            return (
              <p key={idx} className="leading-loose text-slate-700">
                {renderInlineFormatting(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

// ── Markdown Block Parser ───────────────────────────────────────────────────

type MarkdownBlock =
  | { type: "h1" | "h2" | "h3" | "h4"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "image"; alt: string; url: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "codeblock"; lang?: string; text: string }
  | { type: "hr" }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "p"; text: string };

function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "codeblock", lang, text: codeLines.join("\n") });
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Single standalone Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({ type: "image", alt: imgMatch[1], url: imgMatch[2] });
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      blocks.push({ type: "h4", text: trimmed.slice(5) });
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Unordered list (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
      ) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list (1. 2. etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Table detection: | header | header |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
        const headers = parseRow(tableLines[0]);
        const isDivider = (r: string) => /^\|[\s-:]+\|$/.test(r.replace(/\|/g, "||"));
        const dataStart = isDivider(tableLines[1]) ? 2 : 1;
        const rows: string[][] = [];
        for (let t = dataStart; t < tableLines.length; t++) {
          rows.push(parseRow(tableLines[t]));
        }
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Regular paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("---") &&
      !/^!\[(.*?)\]\((.*?)\)$/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
    ) {
      pLines.push(lines[i]);
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: "p", text: pLines.join(" ") });
    }
  }

  return blocks;
}

// ── Inline Formatting Parser (Bold, Italic, Links, Code, Inline Images) ──────

function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize string for inline elements:
  // 1. Inline image: ![alt](url)
  // 2. Link: [label](url)
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Code: `code`
  // 6. Strikethrough: ~~text~~

  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  const pattern = /(!?\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(__.*?__)|(\*.*?\*)|(_.*?_)|(`.*?`)|(~~.*?~~)/;

  while (remaining) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    if (match.index > 0) {
      tokens.push(remaining.slice(0, match.index));
    }

    const matchedStr = match[0];

    // Inline image: ![alt](url)
    if (matchedStr.startsWith("![")) {
      const imgMatch = matchedStr.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const fullUrl = getMediaUrl(imgMatch[2]);
        tokens.push(
          <span key={keyIndex++} className="inline-block my-2 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullUrl}
              alt={imgMatch[1]}
              className="rounded-xl max-h-96 mx-auto object-cover border border-slate-200"
            />
          </span>
        );
      } else {
        tokens.push(matchedStr);
      }
    }
    // Link: [label](url)
    else if (matchedStr.startsWith("[")) {
      const linkMatch = matchedStr.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        tokens.push(
          <a
            key={keyIndex++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold underline hover:text-primary/80 transition-colors mx-1"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(matchedStr);
      }
    }
    // Bold: **text** or __text__
    else if (matchedStr.startsWith("**") || matchedStr.startsWith("__")) {
      const inner = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={keyIndex++} className="font-black text-slate-900">
          {inner}
        </strong>
      );
    }
    // Inline code: `code`
    else if (matchedStr.startsWith("`")) {
      const inner = matchedStr.slice(1, -1);
      tokens.push(
        <code
          key={keyIndex++}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 text-primary font-mono text-xs dir-ltr inline-block mx-0.5 border border-slate-200/60"
        >
          {inner}
        </code>
      );
    }
    // Strikethrough: ~~text~~
    else if (matchedStr.startsWith("~~")) {
      const inner = matchedStr.slice(2, -2);
      tokens.push(
        <del key={keyIndex++} className="line-through text-slate-400">
          {inner}
        </del>
      );
    }
    // Italic: *text* or _text_
    else if (matchedStr.startsWith("*") || matchedStr.startsWith("_")) {
      const inner = matchedStr.slice(1, -1);
      tokens.push(
        <em key={keyIndex++} className="italic text-slate-800">
          {inner}
        </em>
      );
    }

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return tokens;
}
