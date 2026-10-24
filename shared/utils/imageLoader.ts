import { ImageLoaderProps } from "next/image";

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const q = quality ?? 75;

  if (src.includes("/storage/v1/object/public/")) {
    const renderUrl = src.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    return `${renderUrl}?width=${width}&quality=${q}`;
  }

  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
