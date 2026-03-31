const WEBSITE_ORIGIN = "https://roomhy.com";
const DEFAULT_IMAGE = `${WEBSITE_ORIGIN}/website/images/logoroomhy.jpg`;

const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

export const getWebsiteCanonicalUrl = (path = "/website/index") => {
  const normalizedPath = String(path || "/website/index").startsWith("/")
    ? String(path || "/website/index")
    : `/${String(path || "website/index")}`;
  return `${trimSlash(WEBSITE_ORIGIN)}${normalizedPath}`;
};

export const buildSeoConfig = ({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  robots = "index, follow",
  keywords = [],
  jsonLd = null
}) => {
  const canonical = getWebsiteCanonicalUrl(path);
  const keywordText = Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : String(keywords || "");
  const metas = [
    { name: "description", content: description },
    keywordText ? { name: "keywords", content: keywordText } : null,
    { name: "robots", content: robots },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    { property: "og:site_name", content: "Roomhy" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ].filter(Boolean);

  const links = [{ rel: "canonical", href: canonical }];
  const headScripts = jsonLd
    ? [
        {
          attrs: { type: "application/ld+json" },
          content: JSON.stringify(jsonLd)
        }
      ]
    : [];

  return { title, canonical, metas, links, headScripts };
};

export const buildOrganizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Roomhy",
  url: WEBSITE_ORIGIN,
  logo: DEFAULT_IMAGE,
  email: "hello@roomhy.com",
  telephone: "+91 99830 05030",
  sameAs: []
});

export const buildWebsiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Roomhy",
  url: WEBSITE_ORIGIN,
  potentialAction: {
    "@type": "SearchAction",
    target: `${WEBSITE_ORIGIN}/website/ourproperty?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});

export const buildBreadcrumbJsonLd = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: getWebsiteCanonicalUrl(item.path)
  }))
});
