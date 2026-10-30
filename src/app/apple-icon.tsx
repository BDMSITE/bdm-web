import { ImageResponse } from "next/og";
import { GREEN, YELLOW, RED, INK, publicSansBold } from "@/lib/og";

/* Icône iOS (ajout à l'écran d'accueil) : même dessin que /api/icone, 180×180. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await publicSansBold();
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Public Sans", color: INK }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, letterSpacing: -2 }}>BdM</div>
        <div style={{ display: "flex", height: 20 }}>
          <div style={{ flex: 1, background: GREEN }} />
          <div style={{ flex: 1, background: YELLOW }} />
          <div style={{ flex: 1, background: RED }} />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Public Sans", data: font, weight: 800, style: "normal" }] },
  );
}
