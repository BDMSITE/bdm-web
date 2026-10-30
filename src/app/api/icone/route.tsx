import { ImageResponse } from "next/og";
import { GREEN, YELLOW, RED, INK, publicSansBold } from "@/lib/og";

/* Icône d'écran d'accueil (manifest) : « BdM » sur fond blanc, bande tricolore en bas.
   ?s=192|512 ; ?m=1 pour la version « maskable » (fond plein, marges de sécurité). */

export const revalidate = 86400;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const s = Math.min(1024, Math.max(48, Number(searchParams.get("s") ?? 512) || 512));
  const maskable = searchParams.get("m") === "1";
  const font = await publicSansBold();
  const pad = maskable ? s * 0.12 : 0;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Public Sans", color: INK }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s * (maskable ? 0.3 : 0.36), letterSpacing: -s * 0.012, paddingTop: pad }}>BdM</div>
        <div style={{ display: "flex", height: s * 0.11, marginBottom: pad }}>
          <div style={{ flex: 1, background: GREEN }} />
          <div style={{ flex: 1, background: YELLOW }} />
          <div style={{ flex: 1, background: RED }} />
        </div>
      </div>
    ),
    { width: s, height: s, fonts: [{ name: "Public Sans", data: font, weight: 800, style: "normal" }] },
  );
}
