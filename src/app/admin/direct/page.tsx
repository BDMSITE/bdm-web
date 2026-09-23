import type { Metadata } from "next";
import {
  PageHead,
  Card,
  Badge,
  TableShell,
  Th,
  Td,
  RowActions,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "En direct (ticker)" };

/* MAQUETTE — Pilotage du bandeau « En direct » : messages épinglés par la
   rédaction + flux automatiques tirés de l'activité du site. Données d'exemple. */

const EPINGLES = [
  { msg: "Pique-nique des Béninois d'Île-de-France — dans 3 jours", lien: "/agenda", periode: "20 → 27 sept.", statut: "En ligne", tone: "green" as const },
  { msg: "Atelier HCBE : questionnaire diaspora, donnez votre avis", lien: "/contact", periode: "1 → 15 oct.", statut: "Programmé", tone: "gray" as const },
  { msg: "Maintenance du site dimanche 6 h — 7 h (GMT+1)", lien: "—", periode: "4 → 5 oct.", statut: "Brouillon", tone: "yellow" as const },
];

const FLUX_AUTO = [
  { flux: "Nouvelles offres d'emploi validées", detail: "dès validation en modération", actif: true },
  { flux: "Nouveaux membres (prénom + ville)", detail: "avec leur accord, max 1 par heure", actif: true },
  { flux: "Événements de l'agenda", detail: "rappel automatique à J-3", actif: true },
  { flux: "Nouvelles bonnes adresses", detail: "dès validation", actif: false },
  { flux: "Articles publiés (rédaction + membres)", detail: "à la publication", actif: false },
];

export default function AdminDirectPage() {
  return (
    <>
      <PageHead
        title="En direct (ticker)"
        desc="Le bandeau qui défile sous la navigation : messages épinglés par la rédaction, complétés par les flux automatiques."
      >
        <button className="whitespace-nowrap rounded bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">
          Épingler un message
        </button>
      </PageHead>

      <div className="space-y-6">
        <Card title="Messages épinglés (prioritaires dans le bandeau)">
          <TableShell head={<><Th>Message</Th><Th>Lien</Th><Th>Période</Th><Th>Statut</Th><Th>Actions</Th></>}>
            {EPINGLES.map((e) => (
              <tr key={e.msg} className="hover:bg-primary-faint">
                <Td className="font-semibold">{e.msg}</Td>
                <Td className="text-ink-2">{e.lien}</Td>
                <Td className="whitespace-nowrap text-muted">{e.periode}</Td>
                <Td><Badge tone={e.tone}>{e.statut}</Badge></Td>
                <Td><RowActions items={["Modifier", "Retirer"]} /></Td>
              </tr>
            ))}
          </TableShell>
        </Card>

        <Card title="Flux automatiques (activité du site)">
          <ul className="divide-y divide-line">
            {FLUX_AUTO.map((f) => (
              <li key={f.flux} className="flex items-center gap-4 px-4 py-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" defaultChecked={f.actif} className="h-4 w-4 accent-primary" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{f.flux}</span>
                    <span className="block text-xs text-muted">{f.detail}</span>
                  </span>
                </label>
                <Badge tone={f.actif ? "green" : "gray"}>{f.actif ? "Actif" : "Inactif"}</Badge>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            Les messages épinglés passent toujours avant les flux automatiques. Le bandeau se met
            à jour au fil de l&apos;activité du site (branché à la base en S5).
          </p>
        </Card>
      </div>
    </>
  );
}
