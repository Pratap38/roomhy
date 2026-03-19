import { useHtmlPage } from "./htmlPage.js";

export const useHeadAssets = ({
  title,
  metas = [],
  links = [],
  scripts = [],
  htmlAttrs = {},
  bodyAttrs = {},
  bases = [],
  styles = [],
  inlineScripts = [],
  disableMobileSidebar = false
} = {}) => {
  useHtmlPage({
    title,
    metas,
    links,
    scripts,
    bases,
    styles,
    inlineScripts,
    htmlAttrs,
    bodyClass: bodyAttrs.class || bodyAttrs.className || "",
    disableMobileSidebar
  });
};
