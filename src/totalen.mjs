// Totalen en export. Rekent altijd over de effectieve boekingen — dus ná het
// toepassen van correcties (ADR-01). Simpelweg alle regels optellen zou
// gecorrigeerde uren dubbel tellen.

import { aanvraagVan } from "./config.mjs";
import { effectieveBoekingen, leesRegels } from "./grootboek.mjs";

const CSV_KOLOMMEN = ["datum", "uren", "soort", "project", "omschrijving", "ref", "geregistreerd_op"];

export function berekenTotalen(effectieve, config, jaar) {
  const aanvraag = aanvraagVan(config, jaar);

  const perMaand = new Map();
  const perProject = new Map();
  let sao = 0;
  let overig = 0;

  for (const boeking of effectieve) {
    const uren = boeking.uren ?? 0;
    const maand = boeking.datum.slice(0, 7);
    const bucket = perMaand.get(maand) ?? { sao: 0, overig: 0 };

    if (boeking.soort === "sao") {
      sao += uren;
      bucket.sao += uren;
      perProject.set(boeking.project, (perProject.get(boeking.project) ?? 0) + uren);
    } else {
      overig += uren;
      bucket.overig += uren;
    }
    perMaand.set(maand, bucket);
  }

  const totaal = sao + overig;
  const resterend = aanvraag.aangevraagde_uren - sao;

  return {
    jaar: String(jaar),
    sao,
    overig,
    aandeel: totaal > 0 ? Math.round((sao / totaal) * 100) : 0,
    aangevraagd: aanvraag.aangevraagde_uren,
    resterend,
    overschrijding: resterend < 0 ? -resterend : 0,
    perMaand: Object.fromEntries([...perMaand].sort(([a], [b]) => a.localeCompare(b))),
    perProject: Object.fromEntries(
      aanvraag.projecten.map((p) => [p.id, perProject.get(p.id) ?? 0]),
    ),
  };
}

export function totalenVan(wortel, jaar, config) {
  return berekenTotalen(effectieveBoekingen(leesRegels(wortel, jaar)), config, jaar);
}

function csvVeld(waarde) {
  const tekst = waarde === undefined || waarde === null ? "" : String(waarde);
  return /[",\n]/.test(tekst) ? `"${tekst.replaceAll('"', '""')}"` : tekst;
}

/** CSV van de effectieve boekingen — voor de boekhouder, niet voor de tool zelf. */
export function naarCsv(effectieve) {
  const regels = [CSV_KOLOMMEN.join(",")];
  for (const boeking of [...effectieve].sort((a, b) => a.datum.localeCompare(b.datum))) {
    regels.push(CSV_KOLOMMEN.map((kolom) => csvVeld(boeking[kolom])).join(","));
  }
  return `${regels.join("\n")}\n`;
}
