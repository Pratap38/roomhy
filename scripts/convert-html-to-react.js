const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SOURCE_FOLDERS = [
  "website",
  "superadmin",
  "tenant",
  "propertyowner",
  "digital-checkin"
];

const REACT_PAGES_ROOT = path.join(ROOT, "react-app", "src", "pages");

const readFile = (filePath) => fs.readFileSync(filePath, "utf8");

const parseAttributes = (attrString) => {
  const attrs = {};
  if (!attrString) return attrs;
  const regex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = regex.exec(attrString))) {
    const key = match[1];
    if (key === "/") {
      continue;
    }
    const value = match[2] ?? match[3] ?? match[4];
    if (value === undefined) {
      attrs[key] = true;
    } else {
      attrs[key] = value;
    }
  }
  return attrs;
};

const shouldPrefixAsset = (value) => {
  if (!value) return false;
  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#") ||
    value.startsWith("data:") ||
    value.startsWith("javascript:")
  ) {
    return false;
  }
  return (
    value.startsWith("assets/") ||
    value.startsWith("js/") ||
    value.startsWith("images/") ||
    value.startsWith("css/")
  );
};

const withAssetPrefix = (value, folder) => {
  if (!folder || !value) return value;
  if (!shouldPrefixAsset(value)) return value;
  return `/${folder}/${value}`;
};

const extractTag = (html, tagName) => {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = html.match(regex);
  return match ? match[1] : "";
};

const extractTagOpen = (html, tagName) => {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>`, "i");
  const match = html.match(regex);
  return match ? match[1] : "";
};

const extractAllTags = (html, tagName) => {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const results = [];
  let match;
  while ((match = regex.exec(html))) {
    results.push({ attrs: parseAttributes(match[1]), content: match[2] });
  }
  return results;
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

const ATTR_MAP = {
  "class": "className",
  "for": "htmlFor",
  "tabindex": "tabIndex",
  "maxlength": "maxLength",
  "minlength": "minLength",
  "readonly": "readOnly",
  "colspan": "colSpan",
  "rowspan": "rowSpan",
  "contenteditable": "contentEditable",
  "crossorigin": "crossOrigin",
  "referrerpolicy": "referrerPolicy",
  "srcset": "srcSet",
  "autocomplete": "autoComplete",
  "autocapitalize": "autoCapitalize",
  "autofocus": "autoFocus",
  "spellcheck": "spellCheck",
  "enctype": "encType",
  "novalidate": "noValidate",
  "usemap": "useMap",
  "allowfullscreen": "allowFullScreen",
  "allowpaymentrequest": "allowPaymentRequest",
  "xlink:href": "xlinkHref",
  "xmlns:xlink": "xmlnsXlink",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset"
};

const EVENT_MAP = {
  "onclick": "onClick",
  "onchange": "onChange",
  "onsubmit": "onSubmit",
  "oninput": "onInput",
  "onkeyup": "onKeyUp",
  "onkeydown": "onKeyDown",
  "onkeypress": "onKeyPress",
  "onload": "onLoad",
  "onerror": "onError",
  "onfocus": "onFocus",
  "onblur": "onBlur"
};

const toCamelCase = (value) =>
  value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const parseStyle = (styleText) => {
  const entries = [];
  styleText.split(";").forEach((chunk) => {
    const [rawKey, ...rest] = chunk.split(":");
    if (!rawKey || !rest.length) return;
    const key = toCamelCase(rawKey.trim());
    const value = rest.join(":").trim();
    if (!key) return;
    entries.push(`${key}: ${JSON.stringify(value)}`);
  });
  return `{{ ${entries.join(", ")} }}`;
};

const escapeTextBraces = (html) => {
  let out = "";
  let inTag = false;
  for (let i = 0; i < html.length; i += 1) {
    const ch = html[i];
    if (ch === "<") {
      inTag = true;
      out += ch;
      continue;
    }
    if (ch === ">") {
      inTag = false;
      out += ch;
      continue;
    }
    if (!inTag && ch === "{") {
      out += "{\"{\"}";
      continue;
    }
    if (!inTag && ch === "}") {
      out += "{\"}\"}";
      continue;
    }
    out += ch;
  }
  return out;
};

const convertHtmlToJsx = (html, folder) => {
  let output = html.replace(/<!--([\s\S]*?)-->/g, "");

  const tagRegex = /<\/?[^>]+>/g;
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = tagRegex.exec(output))) {
    const tag = match[0];
    result += escapeTextBraces(output.slice(lastIndex, match.index));
    lastIndex = match.index + tag.length;

    if (tag.startsWith("</")) {
      result += tag;
      continue;
    }
    if (tag.startsWith("<!")) {
      continue;
    }

    const tagMatch = tag.match(/^<([\w:-]+)([\s\S]*?)\/?>(?:\s*)$/);
    if (!tagMatch) {
      result += tag;
      continue;
    }
    const tagName = tagMatch[1];
    const attrString = tagMatch[2] || "";
    const isVoid = VOID_TAGS.has(tagName.toLowerCase());

    const attrs = [];
    const attrRegex = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString))) {
      const rawKey = attrMatch[1];
      if (rawKey === "/") {
        continue;
      }
      const rawValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4];
      const lowerKey = rawKey.toLowerCase();
      const mappedKey = ATTR_MAP[lowerKey] || rawKey;

      if (EVENT_MAP[lowerKey] && rawValue != null) {
        const handlerCode = rawValue;
        const handler = `{function(event) { try { return Function('event', ${JSON.stringify(
          handlerCode
        )}).call(event.currentTarget, event); } catch (err) { console.error(err); } }}`;
        attrs.push(`${EVENT_MAP[lowerKey]}=${handler}`);
        continue;
      }

      if (mappedKey === "style" && rawValue != null) {
        attrs.push(`style=${parseStyle(rawValue)}`);
        continue;
      }

      if (rawValue == null) {
        attrs.push(mappedKey);
        continue;
      }

      const normalizedValue =
        (mappedKey === "src" || mappedKey === "href" || mappedKey === "poster" || mappedKey === "xlinkHref")
          ? withAssetPrefix(rawValue, folder)
          : rawValue;

      const isBoolean =
        normalizedValue === "" ||
        normalizedValue.toLowerCase() === lowerKey ||
        normalizedValue.toLowerCase() === "true";
      if (isBoolean) {
        attrs.push(mappedKey);
        continue;
      }

      attrs.push(`${mappedKey}=${JSON.stringify(normalizedValue)}`);
    }

    const attrOut = attrs.length ? ` ${attrs.join(" ")}` : "";
    result += isVoid ? `<${tagName}${attrOut} />` : `<${tagName}${attrOut}>`;
  }

  result += escapeTextBraces(output.slice(lastIndex));
  return result;
};

const stripScripts = (html) => {
  const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const scripts = [];
  const inlineScripts = [];
  let cleaned = html;
  let match;
  while ((match = regex.exec(html))) {
    const attrs = parseAttributes(match[1]);
    if (attrs.src) {
      scripts.push(attrs);
    } else {
      inlineScripts.push(match[2] || "");
    }
  }
  cleaned = cleaned.replace(regex, "");
  return { cleaned, scripts, inlineScripts };
};

const extractTrailingJs = (html) => {
  let cleaned = html;
  const inlineScripts = [];

  // Remove stray closing script tags if any exist.
  cleaned = cleaned.replace(/<\/script>/gi, "");

  const lastTagClose = cleaned.lastIndexOf(">");
  if (lastTagClose === -1) return { cleaned, inlineScripts };

  const trailing = cleaned.slice(lastTagClose + 1);
  const trailingTrimmed = trailing.trim();
  if (!trailingTrimmed) {
    return { cleaned, inlineScripts };
  }

  const looksLikeJs = /^(function|const|let|var|if|for|while|switch|try|class|\/\/|\/\*|\(|return)\b/.test(
    trailingTrimmed
  );
  if (!looksLikeJs) {
    return { cleaned, inlineScripts };
  }

  inlineScripts.push(trailingTrimmed);
  cleaned = cleaned.slice(0, lastTagClose + 1);
  return { cleaned, inlineScripts };
};

const extractLooseJs = (html) => {
  let cleaned = html;
  const inlineScripts = [];
  if (/<script\b/i.test(cleaned)) return { cleaned, inlineScripts };

  const match = cleaned.match(/(?:^|\n)\s*(function|const|let|var|if|for|while|switch|try|class|\/\/|\/\*)\b/);
  if (!match) return { cleaned, inlineScripts };

  const index = match.index ?? -1;
  if (index <= 0) return { cleaned, inlineScripts };

  const jsBlock = cleaned.slice(index).trim();
  if (!jsBlock) return { cleaned, inlineScripts };

  inlineScripts.push(jsBlock);
  cleaned = cleaned.slice(0, index);
  return { cleaned, inlineScripts };
};

const sanitizeInlineScript = (script) => {
  if (!script) return "";
  let out = script;
  out = out.replace(/<script\b[^>]*>/gi, "");
  out = out.replace(/<\/script>/gi, "");
  out = out.replace(/<\/body>/gi, "");
  out = out.replace(/<\/html>/gi, "");
  return out.trim();
};

const extractSelfClosingTags = (html, tagName) => {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  const results = [];
  let match;
  while ((match = regex.exec(html))) {
    results.push(parseAttributes(match[1]));
  }
  return results;
};

const toComponentName = (folder, baseName) => {
  const clean = `${folder}-${baseName}`
    .replace(/\.html$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return clean || "HtmlPage";
};

const stringify = (value) => JSON.stringify(value, null, 2);

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const convertHtmlToReact = (htmlPath) => {
  const relPath = path.relative(ROOT, htmlPath).replace(/\\/g, "/");
  const folder = relPath.split("/")[0];
  const baseName = path.basename(relPath, ".html");
  const componentName = toComponentName(folder, baseName);

  const html = readFile(htmlPath);

  const htmlAttrs = parseAttributes(extractTagOpen(html, "html"));

  const headContent = extractTag(html, "head");
  let bodyAttrs = {};
  let rawBodyHtml = "";
  let bodyEndIndex = -1;
  const bodyOpenMatch = html.match(/<body\b([^>]*)>/i);
  if (bodyOpenMatch) {
    bodyAttrs = parseAttributes(bodyOpenMatch[1]);
    const bodyStart = html.indexOf(bodyOpenMatch[0]) + bodyOpenMatch[0].length;
    bodyEndIndex = html.toLowerCase().lastIndexOf("</body>");
    if (bodyEndIndex > bodyStart) {
      rawBodyHtml = html.slice(bodyStart, bodyEndIndex);
    }
  }

  const title = extractTag(headContent, "title").trim();

  const metas = extractSelfClosingTags(headContent, "meta");
  const bases = extractSelfClosingTags(headContent, "base");
  const links = extractSelfClosingTags(headContent, "link").map((link) => ({
    ...link,
    href: withAssetPrefix(link.href, folder)
  }));
  const styles = extractAllTags(headContent, "style").map((entry) => entry.content || "");
  const scriptsRaw = extractAllTags(headContent, "script");

  const scripts = [];
  const inlineScripts = [];

  scriptsRaw.forEach((entry) => {
    const attrs = entry.attrs || {};
    if (attrs.src) {
      scripts.push({
        ...attrs,
        src: withAssetPrefix(attrs.src, folder)
      });
    } else {
      inlineScripts.push(sanitizeInlineScript(entry.content || ""));
    }
  });

  const bodyScriptExtraction = stripScripts(rawBodyHtml);
  const afterBodyHtml = bodyEndIndex >= 0 ? html.slice(bodyEndIndex + 7) : "";
  const afterBodyScripts = stripScripts(afterBodyHtml);
  const trailingExtraction = extractTrailingJs(bodyScriptExtraction.cleaned);
  const bodyHtml = convertHtmlToJsx(trailingExtraction.cleaned, folder);
  bodyScriptExtraction.scripts.forEach((script) =>
    scripts.push({
      ...script,
      src: withAssetPrefix(script.src, folder)
    })
  );
  bodyScriptExtraction.inlineScripts.forEach((script) => inlineScripts.push(sanitizeInlineScript(script)));
  afterBodyScripts.scripts.forEach((script) =>
    scripts.push({
      ...script,
      src: withAssetPrefix(script.src, folder)
    })
  );
  afterBodyScripts.inlineScripts.forEach((script) => inlineScripts.push(sanitizeInlineScript(script)));
  trailingExtraction.inlineScripts.forEach((script) => inlineScripts.push(sanitizeInlineScript(script)));

  const bodyJsx = bodyHtml;

  const reactFolder = path.join(REACT_PAGES_ROOT, folder);
  ensureDir(reactFolder);
  const reactPath = path.join(reactFolder, `${baseName}.jsx`);

  const bodyIndented = bodyJsx.split("\n").map((line) => `      ${line}`).join("\n");
  const fileContent = `import React from "react";\nimport { useHtmlPage } from "../../utils/htmlPage";\n\nexport default function ${componentName}() {\n  useHtmlPage({\n    title: ${stringify(title || "")},\n    bodyClass: ${stringify(bodyAttrs.class || "")},\n    htmlAttrs: ${stringify(htmlAttrs)},\n    metas: ${stringify(metas)},\n    bases: ${stringify(bases)},\n    links: ${stringify(links)},\n    styles: ${stringify(styles)},\n    scripts: ${stringify(scripts)},\n    inlineScripts: ${stringify(inlineScripts)}\n  });\n\n  return (\n    <div className=\"html-page\">\n${bodyIndented}\n    </div>\n  );\n}\n`;

  fs.writeFileSync(reactPath, fileContent, "utf8");

  return { htmlPath: relPath, reactPath: path.relative(ROOT, reactPath).replace(/\\/g, "/") };
};

const htmlFiles = [];
const filterRaw = process.env.FILTER_HTML || "";
const filterList = filterRaw
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const filterSet = new Set(filterList);

for (const folder of SOURCE_FOLDERS) {
  const folderPath = path.join(ROOT, folder);
  if (!fs.existsSync(folderPath)) continue;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        if (filterSet.size > 0) {
          const rel = path.relative(ROOT, fullPath).replace(/\\/g, "/");
          if (!filterSet.has(rel)) continue;
        }
        htmlFiles.push(fullPath);
      }
    }
  };
  walk(folderPath);
}

const results = htmlFiles.map(convertHtmlToReact);

console.log(`Converted ${results.length} HTML files:`);
for (const result of results) {
  console.log(`- ${result.htmlPath} -> ${result.reactPath}`);
}
