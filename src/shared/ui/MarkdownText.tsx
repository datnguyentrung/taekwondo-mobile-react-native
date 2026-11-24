import { Fragment } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

type MarkdownTextProps = {
  children: string;
  baseColor?: string;
};

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold_italic"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "strike"; value: string }
  | { type: "underline"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; url: string };

const INLINE_PATTERN =
  /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|~~[^~]+~~|<u>[^<]+<\/u>|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;

function parseInlineTokens(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(INLINE_PATTERN)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, idx) });
    }

    const raw = match[0];
    if (raw.startsWith("***") && raw.endsWith("***")) {
      tokens.push({ type: "bold_italic", value: raw.slice(3, -3) });
    } else if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push({ type: "bold", value: raw.slice(2, -2) });
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push({ type: "italic", value: raw.slice(1, -1) });
    } else if (raw.startsWith("~~") && raw.endsWith("~~")) {
      tokens.push({ type: "strike", value: raw.slice(2, -2) });
    } else if (raw.startsWith("<u>") && raw.endsWith("</u>")) {
      tokens.push({ type: "underline", value: raw.slice(3, -4) });
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      tokens.push({ type: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(raw);
      if (linkMatch) {
        tokens.push({
          type: "link",
          label: linkMatch[1],
          url: linkMatch[2].trim(),
        });
      } else {
        tokens.push({ type: "text", value: raw });
      }
    }

    lastIndex = idx + raw.length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(input: string, baseColor: string, keyPrefix: string) {
  const tokens = parseInlineTokens(input);
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (token.type) {
      case "bold_italic":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={[styles.baseText, styles.bold, styles.italic, { color: baseColor }]}
          >
            {token.value}
          </ThemedText>
        );
      case "bold":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={[styles.baseText, styles.bold, { color: baseColor }]}
          >
            {token.value}
          </ThemedText>
        );
      case "italic":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={[styles.baseText, styles.italic, { color: baseColor }]}
          >
            {token.value}
          </ThemedText>
        );
      case "strike":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={[styles.baseText, styles.strike, { color: baseColor }]}
          >
            {token.value}
          </ThemedText>
        );
      case "underline":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={[styles.baseText, styles.underline, { color: baseColor }]}
          >
            {token.value}
          </ThemedText>
        );
      case "code":
        return (
          <ThemedText key={key} type="bodySmall" style={styles.inlineCode}>
            {` ${token.value} `}
          </ThemedText>
        );
      case "link":
        return (
          <ThemedText
            key={key}
            type="bodySmall"
            style={styles.link}
            onPress={() => {
              void Linking.openURL(token.url).catch(() => {});
            }}
          >
            {token.label}
          </ThemedText>
        );
      case "text":
      default:
        return (
          <Fragment key={key}>{token.value}</Fragment>
        );
    }
  });
}

export function MarkdownText({
  children,
  baseColor = Colors.light.text,
}: MarkdownTextProps) {
  const normalized = children.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code block ```
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing ```
      elements.push(
        <View key={`code-${i}`} style={styles.codeBlock}>
          <ThemedText type="bodySmall" style={styles.codeBlockText}>
            {codeLines.join("\n")}
          </ThemedText>
        </View>,
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Horizontal rule (---)
    if (/^\s*---+\s*$/.test(line)) {
      elements.push(<View key={`hr-${i}`} style={styles.hr} />);
      i += 1;
      continue;
    }

    // Headings # through ######
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const headingStyle = HEADING_STYLES[level];
      elements.push(
        <ThemedText
          key={`h${level}-${i}`}
          type="bodySmall"
          style={[headingStyle, { color: baseColor }]}
        >
          {renderInline(headingMatch[2], baseColor, `h${level}-${i}`)}
        </ThemedText>,
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <View key={`quote-${i}`} style={styles.quoteBlock}>
          <ThemedText
            type="bodySmall"
            style={[styles.baseText, styles.quoteText]}
          >
            {renderInline(line.slice(2), Colors.light.textSecondary, `quote-${i}`)}
          </ThemedText>
        </View>,
      );
      i += 1;
      continue;
    }

    // Bullet list (- or *)
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      elements.push(
        <View key={`ul-${i}`} style={styles.listRow}>
          <ThemedText
            type="bodySmall"
            style={[styles.baseText, styles.listMarker, { color: baseColor }]}
          >
            •
          </ThemedText>
          <ThemedText
            type="bodySmall"
            style={[styles.baseText, styles.listBody, { color: baseColor }]}
          >
            {renderInline(bulletMatch[1], baseColor, `ul-${i}`)}
          </ThemedText>
        </View>,
      );
      i += 1;
      continue;
    }

    // Numbered list (1. ...)
    const orderedMatch = /^(\d+\.)\s+(.*)$/.exec(line);
    if (orderedMatch) {
      elements.push(
        <View key={`ol-${i}`} style={styles.listRow}>
          <ThemedText
            type="bodySmall"
            style={[styles.baseText, styles.listMarker, { color: baseColor }]}
          >
            {orderedMatch[1]}
          </ThemedText>
          <ThemedText
            type="bodySmall"
            style={[styles.baseText, styles.listBody, { color: baseColor }]}
          >
            {renderInline(orderedMatch[2], baseColor, `ol-${i}`)}
          </ThemedText>
        </View>,
      );
      i += 1;
      continue;
    }

    // Regular paragraph line
    elements.push(
      <ThemedText
        key={`p-${i}`}
        type="bodySmall"
        style={[styles.baseText, { color: baseColor }]}
      >
        {renderInline(line, baseColor, `p-${i}`)}
      </ThemedText>,
    );
    i += 1;
  }

  return <View style={styles.container}>{elements}</View>;
}

const MONO_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  baseText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  strike: {
    textDecorationLine: "line-through",
  },
  underline: {
    textDecorationLine: "underline",
  },
  hr: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginVertical: 6,
  },
  h1: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 2,
  },
  h2: {
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 2,
  },
  h3: {
    fontSize: 16.5,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  h4: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 2,
  },
  h5: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  h6: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 2,
  },
  inlineCode: {
    fontFamily: MONO_FONT,
    fontSize: 13.5,
    backgroundColor: "#E2E4E9",
    color: "#1F2937",
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: "#1E293B",
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 2,
  },
  codeBlockText: {
    fontFamily: MONO_FONT,
    fontSize: 13,
    lineHeight: 19,
    color: "#F8FAFC",
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    paddingLeft: 10,
    paddingVertical: 2,
    marginVertical: 2,
  },
  quoteText: {
    color: Colors.light.textSecondary,
    fontStyle: "italic",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: 2,
  },
  listMarker: {
    fontWeight: "700",
  },
  listBody: {
    flex: 1,
  },
  link: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.light.primary,
    textDecorationLine: "underline",
  },
});

const HEADING_STYLES = {
  1: styles.h1,
  2: styles.h2,
  3: styles.h3,
  4: styles.h4,
  5: styles.h5,
  6: styles.h6,
} as const;
