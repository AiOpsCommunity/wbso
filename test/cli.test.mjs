// Tests op bin/wbso zelf: de skills leunen op de exitcodes en de JSON-vorm,
// dus die zijn onderdeel van het contract en niet alleen presentatie.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { maakConfig } from "./hulp.mjs";

const WBSO = fileURLToPath(new URL("../bin/wbso", import.meta.url));

function project(configOverschrijf) {
  const map = mkdtempSync(join(tmpdir(), "wbso-cli-"));
  mkdirSync(join(map, ".git"));
  mkdirSync(join(map, ".wbso"));
  writeFileSync(
    join(map, ".wbso", "config.json"),
    JSON.stringify(maakConfig(configOverschrijf)),
    "utf8",
  );
  return { map, opruimen: () => rmSync(map, { recursive: true, force: true }) };
}

function draai(map, args, invoer) {
  try {
    const uit = execFileSync(WBSO, [...args, "--cwd", map], {
      input: invoer,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, uit };
  } catch (fout) {
    return { code: fout.status, uit: fout.stdout ?? "", fouttekst: fout.stderr ?? "" };
  }
}

test("projectmap werkt zonder bestaande configuratie", (t) => {
  const map = mkdtempSync(join(tmpdir(), "wbso-nieuw-"));
  mkdirSync(join(map, ".git"));
  t.after(() => rmSync(map, { recursive: true, force: true }));

  const { code, uit } = draai(map, ["locaties"]);
  assert.equal(code, 0);

  const uitslag = JSON.parse(uit);
  assert.equal(uitslag.locaties.meegecommit, join(uitslag.projectmap, ".wbso"));
  assert.match(uitslag.locaties.buiten, /\.wbso\//);
});

test("valideer-config keurt een geldige configuratie goed zonder te schrijven", (t) => {
  const map = mkdtempSync(join(tmpdir(), "wbso-nieuw-"));
  mkdirSync(join(map, ".git"));
  t.after(() => rmSync(map, { recursive: true, force: true }));

  const { code, uit } = draai(map, ["valideer-config"], JSON.stringify(maakConfig()));
  assert.equal(code, 0);
  assert.equal(JSON.parse(uit).geldig, true);
  assert.equal(
    existsSync(join(map, ".wbso", "config.json")),
    false,
    "valideren mag niets wegschrijven — dat doet de skill zelf",
  );
});

test("valideer-config wijst een lege afbakening af", (t) => {
  const map = mkdtempSync(join(tmpdir(), "wbso-nieuw-"));
  mkdirSync(join(map, ".git"));
  t.after(() => rmSync(map, { recursive: true, force: true }));

  const { code, fouttekst } = draai(
    map,
    ["valideer-config"],
    JSON.stringify(maakConfig({ afbakening: [] })),
  );
  assert.equal(code, 1);
  assert.match(JSON.parse(fouttekst).fout, /afbakening/);
});

test("opslagmap toont de opgeloste opslagmap", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  const { code, uit } = draai(map, ["opslag"]);
  assert.equal(code, 0);
  assert.equal(JSON.parse(uit).extern, false);
});

test("toevoegen schrijft een boeking en geeft hem terug", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  const boeking = JSON.stringify({
    datum: "2026-03-02",
    uren: 7,
    soort: "sao",
    project: "alfa",
    omschrijving: "Werk",
  });
  const { code, uit } = draai(map, ["toevoegen", "--jaar", "2026"], boeking);

  assert.equal(code, 0);
  const geschreven = JSON.parse(uit);
  assert.equal(geschreven.uren, 7);
  assert.ok(geschreven.id, "boeking hoort een id te krijgen");
  assert.ok(geschreven.geregistreerd_op, "boeking hoort een registratiemoment te krijgen");
});

test("toevoegen weigert een boeking buiten de periode met exitcode 1", (t) => {
  const { map, opruimen } = project({
    aanvragen: {
      2026: {
        periode: ["2026-09-01", "2026-12-31"],
        aangevraagde_uren: 440,
        tarief: 50,
        forfait: true,
        verklaringnummer: null,
        projecten: [{ id: "alfa", naam: "Alfa", knelpunten: [] }],
      },
    },
  });
  t.after(opruimen);

  const boeking = JSON.stringify({
    datum: "2026-08-15",
    uren: 7,
    soort: "sao",
    project: "alfa",
    omschrijving: "Werk",
  });
  const { code, fouttekst } = draai(map, ["toevoegen", "--jaar", "2026"], boeking);

  assert.equal(code, 1);
  assert.match(JSON.parse(fouttekst).fout, /buiten de S&O-periode/);
});

test("valideer geeft exitcode 0 bij een schoon grootboek", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  const { code, uit } = draai(map, ["valideer", "--jaar", "2026"]);
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(uit).fouten, []);
});

test("valideer geeft exitcode 1 bij fouten", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  writeFileSync(
    join(map, ".wbso", "uren-2026.jsonl"),
    `${JSON.stringify({ datum: "2026-03-02", uren: 7, soort: "sao", project: "gamma", omschrijving: "X" })}\n`,
    "utf8",
  );

  const { code, uit } = draai(map, ["valideer", "--jaar", "2026"]);
  assert.equal(code, 1);
  assert.ok(JSON.parse(uit).fouten.length > 0);
});

test("totalen levert een leesbaar overzicht", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  draai(
    map,
    ["toevoegen", "--jaar", "2026"],
    JSON.stringify({
      datum: "2026-03-02",
      uren: 7,
      soort: "sao",
      project: "alfa",
      omschrijving: "Werk",
    }),
  );

  const { code, uit } = draai(map, ["totalen", "--jaar", "2026"]);
  assert.equal(code, 0);
  assert.equal(JSON.parse(uit).sao, 7);
});

test("export levert CSV op stdout", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  draai(
    map,
    ["toevoegen", "--jaar", "2026"],
    JSON.stringify({
      datum: "2026-03-02",
      uren: 7,
      soort: "sao",
      project: "alfa",
      omschrijving: "Werk",
    }),
  );

  const { code, uit } = draai(map, ["export", "--jaar", "2026"]);
  assert.equal(code, 0);
  assert.match(uit.split("\n")[0], /^datum,uren,soort/);
});

test("zonder configuratie volgt een uitlegbare fout", (t) => {
  const map = mkdtempSync(join(tmpdir(), "wbso-leeg-"));
  mkdirSync(join(map, ".git"));
  t.after(() => rmSync(map, { recursive: true, force: true }));

  const { code, fouttekst } = draai(map, ["totalen"]);
  assert.equal(code, 1);
  assert.match(JSON.parse(fouttekst).fout, /wbso:init/);
});

test("onbekend commando geeft exitcode 2", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  const { code } = draai(map, ["bestaatniet"]);
  assert.equal(code, 2);
});

test("ongeldig jaartal wordt geweigerd", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  const { code, fouttekst } = draai(map, ["totalen", "--jaar", "26"]);
  assert.equal(code, 1);
  assert.match(JSON.parse(fouttekst).fout, /jaartal/);
});
