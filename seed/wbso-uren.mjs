#!/usr/bin/env node
// Telt en controleert de WBSO-urenregistratie (docs/wbso-uren-2026.csv).
// Draaien: pnpm wbso:uren
//
// De registratie is het bewijsstuk richting RVO: uren moeten binnen 10 werkdagen
// zijn vastgelegd en herleidbaar zijn tot het S&O-project. Dit script bewaakt
// alleen de vorm — of een uur écht S&O is, blijft een inhoudelijk oordeel
// (zie de afbakening in docs/wbso-projectomschrijving-2026.md).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CSV = fileURLToPath(new URL("../docs/wbso-uren-2026.csv", import.meta.url));

/** Aangevraagd bij RVO; boven dit aantal is niet verrekenbaar. */
const AANGEVRAAGD = 440;
const PERIODE_START = "2026-09-01";
const PERIODE_EIND = "2026-12-31";
/** Meer dan dit op één dag is geen registratiefout maar wel het narekenen waard. */
const UREN_PER_DAG_SIGNAAL = 12;

const SOORTEN = new Set(["sao", "overig"]);
const MAANDEN = [
  "",
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

/** Minimale RFC4180-parser: velden mogen komma's bevatten mits ze gequote zijn. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch !== '"') {
        field += ch;
      } else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function leesRegels() {
  const rows = parseCsv(readFileSync(CSV, "utf8"));
  const [kop, ...rest] = rows;
  if (kop?.join(",") !== "datum,uren,soort,omschrijving,ref") {
    throw new Error(`Onverwachte kopregel in ${CSV}`);
  }
  return rest.map((cols, i) => {
    const [datum = "", uren = "", soort = "", omschrijving = "", ref = ""] = cols.map((c) =>
      c.trim(),
    );
    return { regel: i + 2, datum, uren, soort, omschrijving, ref };
  });
}

function controleer(regels) {
  const fouten = [];
  const signalen = [];
  const perDag = new Map();

  for (const r of regels) {
    const waar = `regel ${r.regel}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.datum))
      fouten.push(`${waar}: datum "${r.datum}" is niet jjjj-mm-dd`);
    else if (r.datum < PERIODE_START || r.datum > PERIODE_EIND) {
      fouten.push(
        `${waar}: ${r.datum} valt buiten de S&O-periode (${PERIODE_START} t/m ${PERIODE_EIND})`,
      );
    }

    const uren = Number(r.uren.replace(",", "."));
    if (!Number.isFinite(uren) || uren <= 0)
      fouten.push(`${waar}: uren "${r.uren}" is geen positief getal`);
    else perDag.set(r.datum, (perDag.get(r.datum) ?? 0) + uren);

    if (!SOORTEN.has(r.soort))
      fouten.push(`${waar}: soort "${r.soort}" moet "sao" of "overig" zijn`);
    if (r.omschrijving === "")
      fouten.push(`${waar}: omschrijving is leeg — RVO wil weten wáár aan gewerkt is`);
    if (r.soort === "sao" && r.ref === "") {
      signalen.push(`${waar}: S&O-uren zonder ref (knelpunt, ADR of OpenSpec-change)`);
    }
  }

  for (const [datum, uren] of perDag) {
    if (uren > UREN_PER_DAG_SIGNAAL) signalen.push(`${datum}: ${uren} uur op één dag — narekenen`);
  }
  return { fouten, signalen };
}

function tel(regels) {
  const perMaand = new Map();
  let sao = 0;
  let overig = 0;

  for (const r of regels) {
    const uren = Number(r.uren.replace(",", "."));
    if (!Number.isFinite(uren) || uren <= 0 || !SOORTEN.has(r.soort)) continue;
    const maand = r.datum.slice(0, 7);
    const bucket = perMaand.get(maand) ?? { sao: 0, overig: 0 };
    if (r.soort === "sao") {
      bucket.sao += uren;
      sao += uren;
    } else {
      bucket.overig += uren;
      overig += uren;
    }
    perMaand.set(maand, bucket);
  }
  return { perMaand, sao, overig };
}

function toon(n) {
  return n.toFixed(1).replace(".", ",").padStart(7);
}

const regels = leesRegels();
const { fouten, signalen } = controleer(regels);
const { perMaand, sao, overig } = tel(regels);

console.log(`\nWBSO-urenregistratie 2026 — ${regels.length} regels\n`);
console.log("maand      S&O    overig");
for (const maand of [...perMaand.keys()].sort()) {
  const { sao: s, overig: o } = perMaand.get(maand);
  const label = `${MAANDEN[Number(maand.slice(5, 7))]} ${maand.slice(0, 4)}`;
  console.log(`${label.padEnd(9)}${toon(s)}   ${toon(o)}`);
}

const rest = AANGEVRAAGD - sao;
const deel = sao + overig > 0 ? Math.round((sao / (sao + overig)) * 100) : 0;
console.log(`${"".padEnd(9)}${"-------"}   ${"-------"}`);
console.log(`${"totaal".padEnd(9)}${toon(sao)}   ${toon(overig)}`);
console.log(`\nS&O-aandeel: ${deel}%`);
console.log(
  rest >= 0
    ? `Aangevraagd ${AANGEVRAAGD} uur — nog ${toon(rest).trim()} te gaan.`
    : `LET OP: ${toon(-rest).trim()} uur bóven de aangevraagde ${AANGEVRAAGD}. Meerwerk is niet verrekenbaar.`,
);

if (signalen.length > 0) {
  console.log("\nSignalen:");
  for (const s of signalen) console.log(`  - ${s}`);
}
if (fouten.length > 0) {
  console.log("\nFouten:");
  for (const f of fouten) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("");
