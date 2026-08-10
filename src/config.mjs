// Configuratie lezen, valideren en de opslagmap bepalen (ADR-03).
//
// De opslagmap wordt hier één keer opgelost; geen enkele skill of ander
// bronbestand kent de opslagkeuze verder nog.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

export const OPSLAGVORMEN = ["meegecommit", "lokaal", "buiten"];
const SOORTEN = ["sao", "overig"];

export class ConfigFout extends Error {}

/** Zoek de projectmap: de dichtstbijzijnde map met .git, anders `start` zelf. */
export function vindProjectmap(start) {
  let map = resolve(start);
  for (;;) {
    if (existsSync(join(map, ".git"))) return map;
    const ouder = dirname(map);
    if (ouder === map) return resolve(start);
    map = ouder;
  }
}

/**
 * Bepaal waar de WBSO-bestanden staan.
 *
 * Bij `meegecommit` en `lokaal` is dat `.wbso/` in het project; bij `buiten`
 * `~/.wbso/<projectnaam>/`. De indeling binnen die opslagmap is in alle gevallen
 * identiek. Omdat de opslagkeuze zelf in de config staat, wordt eerst de
 * projectmap geprobeerd en daarna pas de map buiten het project.
 */
export function bepaalOpslagmap(cwd = process.cwd(), thuis = homedir()) {
  const projectmap = vindProjectmap(cwd);

  const inProject = join(projectmap, ".wbso");
  if (existsSync(join(inProject, "config.json"))) {
    return { opslagmap: inProject, projectmap, extern: false };
  }

  const buiten = join(thuis, ".wbso", basename(projectmap));
  if (existsSync(join(buiten, "config.json"))) {
    return { opslagmap: buiten, projectmap, extern: true };
  }

  throw new ConfigFout(
    `Geen WBSO-configuratie gevonden voor ${projectmap}. Draai /wbso:init om er een aan te maken.`,
  );
}

/** Pad naar het grootboek van een kalenderjaar. */
export function grootboekpad(opslagmap, jaar) {
  return join(opslagmap, `uren-${jaar}.jsonl`);
}

/** Pad naar het sessiebestand van een kalenderjaar. */
export function sessiepad(opslagmap, jaar) {
  return join(opslagmap, `sessies-${jaar}.jsonl`);
}

function eisObject(waarde, pad) {
  if (waarde === null || typeof waarde !== "object" || Array.isArray(waarde)) {
    throw new ConfigFout(`${pad} moet een object zijn`);
  }
}

function eisOnbekendeVeldenLeeg(waarde, toegestaan, pad) {
  const onbekend = Object.keys(waarde).filter((k) => !toegestaan.includes(k));
  if (onbekend.length > 0) {
    throw new ConfigFout(`${pad} bevat onbekende velden: ${onbekend.join(", ")}`);
  }
}

function eisDatum(waarde, pad) {
  if (typeof waarde !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(waarde)) {
    throw new ConfigFout(`${pad} moet een datum zijn in de vorm jjjj-mm-dd`);
  }
  return waarde;
}

function valideerAanvraag(aanvraag, jaar) {
  const pad = `aanvragen.${jaar}`;
  eisObject(aanvraag, pad);
  eisOnbekendeVeldenLeeg(
    aanvraag,
    ["periode", "aangevraagde_uren", "tarief", "forfait", "verklaringnummer", "projecten"],
    pad,
  );

  if (!Array.isArray(aanvraag.periode) || aanvraag.periode.length !== 2) {
    throw new ConfigFout(`${pad}.periode moet [startdatum, einddatum] zijn`);
  }
  const [start, eind] = aanvraag.periode.map((d, i) =>
    eisDatum(d, `${pad}.periode[${i}]`),
  );
  if (start > eind) throw new ConfigFout(`${pad}.periode: startdatum ligt na de einddatum`);
  if (start.slice(0, 4) !== String(jaar) || eind.slice(0, 4) !== String(jaar)) {
    throw new ConfigFout(
      `${pad}.periode moet volledig binnen ${jaar} vallen — een S&O-verklaring loopt nooit over de jaargrens`,
    );
  }

  if (!Number.isFinite(aanvraag.aangevraagde_uren) || aanvraag.aangevraagde_uren <= 0) {
    throw new ConfigFout(`${pad}.aangevraagde_uren moet een positief getal zijn`);
  }
  if (!Number.isFinite(aanvraag.tarief) || aanvraag.tarief <= 0 || aanvraag.tarief > 100) {
    throw new ConfigFout(`${pad}.tarief moet een percentage tussen 0 en 100 zijn`);
  }
  if (typeof aanvraag.forfait !== "boolean") {
    throw new ConfigFout(`${pad}.forfait moet true (kostenforfait) of false (werkelijke kosten) zijn`);
  }
  if (aanvraag.verklaringnummer !== null && typeof aanvraag.verklaringnummer !== "string") {
    throw new ConfigFout(`${pad}.verklaringnummer moet een tekst zijn, of null zolang het onbekend is`);
  }

  if (!Array.isArray(aanvraag.projecten) || aanvraag.projecten.length === 0) {
    throw new ConfigFout(`${pad}.projecten moet minstens één S&O-project bevatten`);
  }
  const ids = new Set();
  for (const [i, project] of aanvraag.projecten.entries()) {
    eisObject(project, `${pad}.projecten[${i}]`);
    eisOnbekendeVeldenLeeg(project, ["id", "naam", "knelpunten"], `${pad}.projecten[${i}]`);
    if (typeof project.id !== "string" || project.id.trim() === "") {
      throw new ConfigFout(`${pad}.projecten[${i}].id moet een niet-lege tekst zijn`);
    }
    if (ids.has(project.id)) {
      throw new ConfigFout(`${pad}.projecten bevat het id "${project.id}" meer dan één keer`);
    }
    ids.add(project.id);
    if (typeof project.naam !== "string" || project.naam.trim() === "") {
      throw new ConfigFout(`${pad}.projecten[${i}].naam moet een niet-lege tekst zijn`);
    }
    if (!Array.isArray(project.knelpunten)) {
      throw new ConfigFout(`${pad}.projecten[${i}].knelpunten moet een lijst zijn`);
    }
  }
}

/** Valideer een configuratie-object en geef het terug. Gooit ConfigFout bij problemen. */
export function valideerConfig(config) {
  eisObject(config, "config");
  eisOnbekendeVeldenLeeg(config, ["administratie", "capture", "aanvragen", "afbakening"], "config");

  eisObject(config.administratie, "administratie");
  eisOnbekendeVeldenLeeg(config.administratie, ["naam", "opslag"], "administratie");
  if (typeof config.administratie.naam !== "string" || config.administratie.naam.trim() === "") {
    throw new ConfigFout("administratie.naam moet een niet-lege tekst zijn");
  }
  if (!OPSLAGVORMEN.includes(config.administratie.opslag)) {
    throw new ConfigFout(`administratie.opslag moet een van ${OPSLAGVORMEN.join(", ")} zijn`);
  }

  eisObject(config.capture, "capture");
  eisOnbekendeVeldenLeeg(config.capture, ["git", "sessies"], "capture");
  for (const sleutel of ["git", "sessies"]) {
    if (typeof config.capture[sleutel] !== "boolean") {
      throw new ConfigFout(`capture.${sleutel} moet true of false zijn`);
    }
  }

  eisObject(config.aanvragen, "aanvragen");
  const jaren = Object.keys(config.aanvragen);
  if (jaren.length === 0) throw new ConfigFout("aanvragen moet minstens één kalenderjaar bevatten");
  for (const jaar of jaren) {
    if (!/^\d{4}$/.test(jaar)) throw new ConfigFout(`aanvragen bevat "${jaar}", verwacht een jaartal`);
    valideerAanvraag(config.aanvragen[jaar], jaar);
  }

  // Een lege afbakening betekent dat álles als S&O wordt aangeboden. Dat is de
  // gevaarlijkste standaardwaarde die dit gereedschap kan hebben.
  if (!Array.isArray(config.afbakening) || config.afbakening.length === 0) {
    throw new ConfigFout(
      "afbakening moet minstens één vermelding bevatten — zonder afbakening wordt al je werk als S&O voorgesteld",
    );
  }
  for (const [i, regel] of config.afbakening.entries()) {
    if (typeof regel !== "string" || regel.trim() === "") {
      throw new ConfigFout(`afbakening[${i}] moet een niet-lege tekst zijn`);
    }
  }

  return config;
}

/** Lees en valideer de configuratie vanaf de opgeloste opslagmap. */
export function leesConfig(opslagmap) {
  const pad = join(opslagmap, "config.json");
  let ruw;
  try {
    ruw = readFileSync(pad, "utf8");
  } catch {
    throw new ConfigFout(`Kan ${pad} niet lezen`);
  }
  let config;
  try {
    config = JSON.parse(ruw);
  } catch (fout) {
    throw new ConfigFout(`${pad} bevat geen geldige JSON: ${fout.message}`);
  }
  return valideerConfig(config);
}

/** De aanvraag van een kalenderjaar, of een duidelijke fout als die er niet is. */
export function aanvraagVan(config, jaar) {
  const aanvraag = config.aanvragen[String(jaar)];
  if (!aanvraag) {
    const bekend = Object.keys(config.aanvragen).join(", ");
    throw new ConfigFout(`Geen aanvraag geconfigureerd voor ${jaar}. Bekende jaren: ${bekend}`);
  }
  return aanvraag;
}

export { SOORTEN };
