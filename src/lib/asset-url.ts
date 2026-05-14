/**
 * Asset-import normalization helper.
 *
 * The bundle used to be Vite-built; `import logo from "@/assets/foo.png"`
 * returned a plain URL string and `<img src={logo} />` just worked.
 *
 * Under Next.js the same import returns a StaticImageData object
 * { src, width, height, blurDataURL? } -- so the same JSX renders
 * "[object Object]" as the src attribute and the image fails to
 * load. (Next would prefer you use next/image, but for the small
 * decorative assets we already have spread across the codebase,
 * the simpler fix is to just reach into .src.)
 *
 * This helper accepts either shape and gives back a string URL,
 * so call sites can stay byte-identical across either bundler.
 */
export type AssetImport = string | { src: string };

export const assetUrl = (asset: AssetImport): string =>
  typeof asset === "string" ? asset : asset.src;
