// Het grootboek (ADR-01): append-only, één JSONL-bestand per kalenderjaar.
//
// Dit bestand kent bewust maar één schrijfoperatie: `voegToe`. Er is geen
// wijzig- of verwijderfunctie, ook niet intern. Corrigeren gebeurt door een
// nieuwe regel toe te voegen die naar de te corrigeren regel verwijst. Wie
// regels overschrijft, wist het bewijs dat hij tijdig heeft geregistreerd.

import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { SOORTEN, aanvraagVan, grootboekpad } from "./config.mjs";

export class BoekingFout extends Error {}

const VELDEN = [
  "id",
  "datum",
  "geregistreerd_op",
  "uren",
  "soort",
  "project",
  "omschrijving",
  "ref",
  "corrigeert",
  "ingetrokken",
];

/** Lees alle regels van een kalenderjaar, met regelnummer voor foutmeldingen. */
export function leesRegels(wortel, jaar) {
  const pad = grootboekpad(wortel, jaar);
  if (!existsSync(pad)) return [];

  const regels = [];
  const tekst = readFileSync(pad, "utf8");
  for (const [i, regel] of tekst.split("\n").entries()) {
    if (regel.trim() === "") continue;
    try {
      regels.push({ regelnummer: i + 1, boeking: JSON.parse(regel) });
    } catch (fout) {
      throw new BoekingFout(`${pad} regel ${i + 1} bevat geen geldige JSON: ${fout.message}`);
    }
  }
  return regels;
}

/**
 * Pas correcties toe en geef de boekingen die daadwerkelijk gelden.
 *
 * Een regel telt niet mee als hij door een latere regel gecorrigeerd is, of als
 * hij zichzelf als ingetrokken markeert. Bij een keten van correcties blijft
 * alleen de laatste over — de tussenliggende zijn immers zelf gecorrigeerd.
 */
export function effectieveBoekingen(regels) {
  const gecorrigeerd = new Set();
  for (const { boeking } of regels) {
    if (boeking.corrigeert) gecorrigeerd.add(boeking.corrigeert);
  }
  return regels
    .filter(({ boeking }) => !gecorrigeerd.has(boeking.id) && boeking.ingetrokken !== true)
    .map(({ regelnummer, boeking }) => ({ regelnummer, ...boeking }));
}

function eisNietLeeg(waarde, veld) {
  if (typeof waarde !== "string" || waarde.trim() === "") {
    throw new BoekingFout(`${veld} moet een niet-lege tekst zijn`);
  }
}

/**
 * Controleer een voorgenomen boeking tegen de configuratie en het grootboek.
 * Gooit BoekingFout met een uitlegbare melding; geeft anders niets terug.
 */
export function controleerBoeking(invoer, { config, jaar, bestaande }) {
  const aanvraag = aanvraagVan(config, jaar);

  if (typeof invoer.datum !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(invoer.datum)) {
    throw new BoekingFout(`datum "${invoer.datum}" moet de vorm jjjj-mm-dd hebben`);
  }
  if (invoer.datum.slice(0, 4) !== String(jaar)) {
    throw new BoekingFout(
      `datum ${invoer.datum} hoort niet in het grootboek van ${jaar} — een S&O-verklaring loopt nooit over de jaargrens`,
    );
  }

  const [start, eind] = aanvraag.periode;
  if (invoer.datum < start || invoer.datum > eind) {
    throw new BoekingFout(
      `datum ${invoer.datum} valt buiten de S&O-periode (${start} t/m ${eind}); die uren zijn niet verrekenbaar`,
    );
  }

  if (invoer.ingetrokken === true) {
    if (!invoer.corrigeert) {
      throw new BoekingFout("een intrekking moet via corrigeert naar de in te trekken boeking verwijzen");
    }
    eisNietLeeg(invoer.omschrijving, "omschrijving");
  } else {
    if (!Number.isFinite(invoer.uren) || invoer.uren <= 0) {
      throw new BoekingFout(`uren "${invoer.uren}" moet een positief getal zijn`);
    }
    if (!SOORTEN.includes(invoer.soort)) {
      throw new BoekingFout(`soort "${invoer.soort}" moet ${SOORTEN.join(" of ")} zijn`);
    }
    eisNietLeeg(invoer.omschrijving, "omschrijving");

    if (invoer.soort === "sao") {
      const ids = aanvraag.projecten.map((p) => p.id);
      if (!invoer.project) {
        throw new BoekingFout(`een S&O-boeking moet naar een project verwijzen. Bekend: ${ids.join(", ")}`);
      }
      if (!ids.includes(invoer.project)) {
        throw new BoekingFout(`onbekend project "${invoer.project}". Bekend: ${ids.join(", ")}`);
      }
    }
  }

  if (invoer.corrigeert) {
    const doel = bestaande.find(({ boeking }) => boeking.id === invoer.corrigeert);
    if (!doel) {
      throw new BoekingFout(`corrigeert verwijst naar onbekende boeking "${invoer.corrigeert}"`);
    }
    const alGecorrigeerd = bestaande.some(({ boeking }) => boeking.corrigeert === invoer.corrigeert);
    if (alGecorrigeerd) {
      throw new BoekingFout(
        `boeking "${invoer.corrigeert}" is al gecorrigeerd; corrigeer de meest recente versie ervan`,
      );
    }
  }
}

/**
 * Voeg een boeking toe aan het grootboek van een kalenderjaar.
 *
 * `geregistreerd_op` wordt hier gezet en nooit door de aanroeper meegegeven —
 * dat veld is het bewijs voor de tien-werkdageneis en mag niet stuurbaar zijn.
 */
export function voegToe(wortel, jaar, invoer, { config, nu = new Date(), id = randomUUID } = {}) {
  if ("geregistreerd_op" in invoer) {
    throw new BoekingFout("geregistreerd_op wordt door het grootboek gezet en mag niet worden meegegeven");
  }
  const onbekend = Object.keys(invoer).filter((k) => !VELDEN.includes(k));
  if (onbekend.length > 0) {
    throw new BoekingFout(`onbekende velden in de boeking: ${onbekend.join(", ")}`);
  }

  const bestaande = leesRegels(wortel, jaar);
  controleerBoeking(invoer, { config, jaar, bestaande });

  const boeking = {
    id: id(),
    datum: invoer.datum,
    geregistreerd_op: nu.toISOString(),
    ...(invoer.ingetrokken === true
      ? { ingetrokken: true }
      : {
          uren: invoer.uren,
          soort: invoer.soort,
          ...(invoer.project ? { project: invoer.project } : {}),
        }),
    omschrijving: invoer.omschrijving,
    ...(invoer.ref ? { ref: invoer.ref } : {}),
    ...(invoer.corrigeert ? { corrigeert: invoer.corrigeert } : {}),
  };

  const pad = grootboekpad(wortel, jaar);
  mkdirSync(dirname(pad), { recursive: true });
  appendFileSync(pad, `${JSON.stringify(boeking)}\n`, "utf8");
  return boeking;
}
