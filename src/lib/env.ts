/** Build-mode flags. In the static GitHub Pages build these are set via next.config. */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC === "1";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a /public asset path with the base path (no-op on the server build). */
export const asset = (p: string) => `${BASE_PATH}${p}`;
