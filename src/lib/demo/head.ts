export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — BetCheck` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — BetCheck` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
