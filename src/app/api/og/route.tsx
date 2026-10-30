import { ImageResponse } from "next/og";
import { OG_SIZE, GREEN, YELLOW, RED, INK, publicSansBold } from "@/lib/og";

/* Image de partage 1200×630 (WhatsApp, Facebook, LinkedIn). Composition plate inspirée
   du drapeau : colonne verte, bandes jaune et rouge, titre en Public Sans 800. Aucune
   photo : le PNG reste sous 100 Ko, condition pour que WhatsApp affiche l'aperçu.
   ?t=titre&k=rubrique&s=lieu ; sans paramètre : visuel générique du site. */

export const revalidate = 86400;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("t") ?? "Le média et le réseau de la diaspora béninoise").slice(0, 120);
  const kind = (searchParams.get("k") ?? "").slice(0, 40);
  const place = (searchParams.get("s") ?? "").slice(0, 80);
  const font = await publicSansBold();
  const size = title.length > 80 ? 54 : title.length > 50 ? 64 : 78;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, fontFamily: "Public Sans", color: "#fff" }}>
        <div style={{ width: 96, display: "flex", flexDirection: "column", background: GREEN }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 22 }}>
            <div style={{ flex: 1, background: YELLOW }} />
            <div style={{ flex: 1, background: RED }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "38px 64px 0 56px" }}>
            <div style={{ display: "flex", fontSize: 34, letterSpacing: -0.5 }}>
              Béninois&nbsp;<span style={{ color: YELLOW }}>du Monde</span>
            </div>
            {kind ? <div style={{ display: "flex", background: YELLOW, color: INK, fontSize: 22, letterSpacing: 2, textTransform: "uppercase", padding: "8px 18px" }}>{kind}</div> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end", padding: "0 64px 56px 56px" }}>
            <div style={{ display: "flex", fontSize: size, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 980 }}>{title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30, fontSize: 24, color: "rgba(255,255,255,.82)" }}>
              {place ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 12, height: 12, background: YELLOW }} />{place}</div> : null}
              {place ? <div style={{ width: 1, height: 26, background: "rgba(255,255,255,.35)" }} /> : null}
              <div style={{ display: "flex" }}>Partenaire officiel du HCBE</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Public Sans", data: font, weight: 800, style: "normal" }] },
  );
}
