export function ogImagePathFor(pathname) {
  if (pathname === "/") return "/og/home.png";
  const slug = pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9]+/gi, "--")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `/og/${slug || "home"}.png`;
}

export function ogImageUrlFor(origin, pathname) {
  return new URL(ogImagePathFor(pathname), origin).toString();
}
