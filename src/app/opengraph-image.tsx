import { ImageResponse } from "next/og";
import { OgFrame, ogSize, publicSvgDataUri } from "@/lib/og";

export const alt = "NOIRÉ: find the scent that feels like you";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  const image = await publicSvgDataUri("/images/editorial/hero.svg");
  return new ImageResponse(
    <OgFrame
      eyebrow="Modern fragrance house"
      title="Find the scent that feels like you."
      subtitle="Twelve eaux de parfum for every mood, moment and memory."
      image={image}
    />,
    size,
  );
}
