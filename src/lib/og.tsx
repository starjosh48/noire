import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/config";

export const ogSize = { width: 1200, height: 630 };

/** Inline a public/ SVG so the OG renderer doesn't need to fetch it. */
export async function publicSvgDataUri(publicPath: string) {
  const svg = await readFile(join(process.cwd(), "public", publicPath.replace(/^\//, "")), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function OgFrame({
  eyebrow,
  title,
  subtitle,
  footer,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: string;
  image: string;
}) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f7f3ed", color: "#1a1918" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: "64px 56px" }}>
        <div style={{ fontSize: 30, letterSpacing: 12 }}>NOIRÉ</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, letterSpacing: 4, color: "#5f5850", textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: 72, lineHeight: 1.05, marginTop: 18, letterSpacing: -1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 26, marginTop: 20, color: "#3a3734" }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: 20, color: "#5f5850" }}>{footer ?? new URL(siteConfig.url).host}</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} width={560} height={630} style={{ objectFit: "cover" }} alt="" />
    </div>
  );
}
