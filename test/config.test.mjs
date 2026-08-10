import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { ConfigFout, bepaalWortel, leesConfig, valideerConfig } from "../src/config.mjs";
import { maakConfig } from "./hulp.mjs";

function tijdelijkProject() {
  const map = mkdtempSync(join(tmpdir(), "wbso-project-"));
  mkdirSync(join(map, ".git"));
  return { map, opruimen: () => rmSync(map, { recursive: true, force: true }) };
}

function schrijfConfig(map, config) {
  mkdirSync(map, { recursive: true });
  writeFileSync(join(map, "config.json"), JSON.stringify(config), "utf8");
}

test("een geldige configuratie komt ongewijzigd terug", () => {
  const config = maakConfig();
  assert.deepEqual(valideerConfig(config), config);
});

test("lege afbakening wordt geweigerd", () => {
  assert.throws(() => valideerConfig(maakConfig({ afbakening: [] })), /afbakening/);
});

test("onbekende velden worden gemeld", () => {
  assert.throws(() => valideerConfig({ ...maakConfig(), extra: 1 }), /onbekende velden: extra/);
});

test("periode moet binnen het aanvraagjaar vallen", () => {
  const config = maakConfig();
  config.aanvragen["2026"].periode = ["2026-09-01", "2027-01-31"];
  assert.throws(() => valideerConfig(config), /jaargrens/);
});

test("periode met einddatum vóór startdatum wordt geweigerd", () => {
  const config = maakConfig();
  config.aanvragen["2026"].periode = ["2026-12-01", "2026-03-01"];
  assert.throws(() => valideerConfig(config), /startdatum ligt na de einddatum/);
});

test("dubbele project-ids worden geweigerd", () => {
  const config = maakConfig();
  config.aanvragen["2026"].projecten.push({ id: "alfa", naam: "Nog een Alfa", knelpunten: [] });
  assert.throws(() => valideerConfig(config), /meer dan één keer/);
});

test("verklaringnummer mag null zijn zolang de beschikking niet binnen is", () => {
  const config = maakConfig();
  config.aanvragen["2026"].verklaringnummer = null;
  assert.doesNotThrow(() => valideerConfig(config));
});

test("onbekende opslagvorm wordt geweigerd", () => {
  const config = maakConfig();
  config.administratie.opslag = "ergens";
  assert.throws(() => valideerConfig(config), /administratie.opslag/);
});

test("wortel bij meegecommit ligt in het project", (t) => {
  const { map, opruimen } = tijdelijkProject();
  t.after(opruimen);
  schrijfConfig(join(map, ".wbso"), maakConfig());

  const uitslag = bepaalWortel(map, "/geen-thuis");
  assert.equal(uitslag.wortel, join(map, ".wbso"));
  assert.equal(uitslag.extern, false);
});

test("wortel wordt ook gevonden vanuit een submap", (t) => {
  const { map, opruimen } = tijdelijkProject();
  t.after(opruimen);
  schrijfConfig(join(map, ".wbso"), maakConfig());
  const diep = join(map, "src", "diep");
  mkdirSync(diep, { recursive: true });

  assert.equal(bepaalWortel(diep, "/geen-thuis").wortel, join(map, ".wbso"));
});

test("wortel bij buiten ligt in de thuismap onder de projectnaam", (t) => {
  const { map, opruimen } = tijdelijkProject();
  const thuis = mkdtempSync(join(tmpdir(), "wbso-thuis-"));
  t.after(() => {
    opruimen();
    rmSync(thuis, { recursive: true, force: true });
  });

  const projectnaam = map.split("/").pop();
  schrijfConfig(join(thuis, ".wbso", projectnaam), maakConfig({ administratie: { naam: "T", opslag: "buiten" } }));

  const uitslag = bepaalWortel(map, thuis);
  assert.equal(uitslag.wortel, join(thuis, ".wbso", projectnaam));
  assert.equal(uitslag.extern, true);
});

test("zonder configuratie volgt een uitlegbare fout", (t) => {
  const { map, opruimen } = tijdelijkProject();
  t.after(opruimen);

  assert.throws(() => bepaalWortel(map, "/geen-thuis"), ConfigFout);
  assert.throws(() => bepaalWortel(map, "/geen-thuis"), /wbso:init/);
});

test("onleesbare JSON geeft een duidelijke melding", (t) => {
  const { map, opruimen } = tijdelijkProject();
  t.after(opruimen);
  mkdirSync(join(map, ".wbso"), { recursive: true });
  writeFileSync(join(map, ".wbso", "config.json"), "{ dit is geen json", "utf8");

  assert.throws(() => leesConfig(join(map, ".wbso")), /geen geldige JSON/);
});
