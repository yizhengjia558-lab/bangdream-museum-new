import { cn, assetUrl } from "@/lib/utils";

interface AssetImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

/** Native img — avoids Next/Image issues with Chinese asset paths on Windows. */
export function AssetImage({ src, alt, className, fill, priority }: AssetImageProps) {
  const url = assetUrl(src);

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={className} />
  );
}
