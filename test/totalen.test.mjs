import assert from "node:assert/strict";
import { test } from "node:test";
import { effectieveBoekingen, leesRegels, voegToe } from "../src/grootboek.mjs";
import { berekenTotalen, naarCsv, totalenVan } from "../src/totalen.mjs";
import { maakOpslagmap, tellerId } from "./hulp.mjs";

function opstelling(configOverschrijf) {
  const { opslagmap, config, opruimen } = maakOpslagmap(configOverschrijf);
  const id = tellerId();
  const boek = (invoer, nu = new Date("2026-03-03T10:00:00Z")) =>
    voegToe(opslagmap, "2026", invoer, { config, nu, id });
  return { opslagmap, config, boek, opruimen };
}

test("totalen tellen per maand en per project", (t) => {
  const { opslagmap, config, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "A" });
  boek({ datum: "2026-03-03", uren: 3, soort: "sao", project: "beta", omschrijving: "B" });
  boek({ datum: "2026-04-01", uren: 2, soort: "overig", omschrijving: "CI" });

  const totalen = totalenVan(opslagmap, "2026", config);

  assert.equal(totalen.sao, 10);
  assert.equal(totalen.overig, 2);
  assert.deepEqual(totalen.perMaand, {
    "2026-03": { sao: 10, overig: 0 },
    "2026-04": { sao: 0, overig: 2 },
  });
  assert.deepEqual(totalen.perProject, { alfa: 7, beta: 3 });
});

test("gecorrigeerde uren worden niet dubbel geteld", (t) => {
  const { opslagmap, config, boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek({
    datum: "2026-03-02",
    uren: 7,
    soort: "sao",
    project: "alfa",
    omschrijving: "A",
  });
  boek({
    datum: "2026-03-02",
    uren: 5,
    soort: "sao",
    project: "alfa",
    omschrijving: "A bijgesteld",
    corrigeert: eerste.id,
  });

  assert.equal(totalenVan(opslagmap, "2026", config).sao, 5);
});

test("een project zonder boekingen staat op nul in plaats van te ontbreken", (t) => {
  const { opslagmap, config, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "A" });

  assert.deepEqual(totalenVan(opslagmap, "2026", config).perProject, { alfa: 7, beta: 0 });
});

test("S&O-aandeel en resterende uren", (t) => {
  const { opslagmap, config, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-02", uren: 30, soort: "sao", project: "alfa", omschrijving: "A" });
  boek({ datum: "2026-03-03", uren: 10, soort: "overig", omschrijving: "CI" });

  const totalen = totalenVan(opslagmap, "2026", config);
  assert.equal(totalen.aandeel, 75);
  assert.equal(totalen.aangevraagd, 100);
  assert.equal(totalen.resterend, 70);
  assert.equal(totalen.overschrijding, 0);
});

test("overschrijding van de aangevraagde uren wordt gemeld", (t) => {
  const { opslagmap, config, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-02", uren: 60, soort: "sao", project: "alfa", omschrijving: "A" });
  boek({ datum: "2026-03-03", uren: 60, soort: "sao", project: "alfa", omschrijving: "B" });

  const totalen = totalenVan(opslagmap, "2026", config);
  assert.equal(totalen.resterend, -20);
  assert.equal(totalen.overschrijding, 20);
});

test("leeg grootboek geeft nullen in plaats van een fout", (t) => {
  const { opslagmap, config, opruimen } = opstelling();
  t.after(opruimen);

  const totalen = totalenVan(opslagmap, "2026", config);
  assert.equal(totalen.sao, 0);
  assert.equal(totalen.aandeel, 0);
  assert.equal(totalen.resterend, 100);
});

test("berekenTotalen negeert ingetrokken boekingen", () => {
  const config = maakOpslagmap().config;
  const totalen = berekenTotalen(
    [{ datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "A" }],
    config,
    "2026",
  );
  assert.equal(totalen.sao, 7);
});

test("CSV bevat een kopregel en de effectieve boekingen op datum gesorteerd", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-05", uren: 2, soort: "overig", omschrijving: "CI" });
  boek({ datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "A" });

  const regels = naarCsv(effectieveBoekingen(leesRegels(opslagmap, "2026"))).trimEnd().split("\n");

  assert.equal(regels[0], "datum,uren,soort,project,omschrijving,ref,geregistreerd_op");
  assert.match(regels[1], /^2026-03-02,7,sao,alfa,A,,/);
  assert.match(regels[2], /^2026-03-05,2,overig,,CI,,/);
});

test("CSV citeert velden met een komma", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  boek({
    datum: "2026-03-02",
    uren: 7,
    soort: "sao",
    project: "alfa",
    omschrijving: "Normaliseren van bedragen, datums en tijden",
  });

  const csv = naarCsv(effectieveBoekingen(leesRegels(opslagmap, "2026")));
  assert.match(csv, /"Normaliseren van bedragen, datums en tijden"/);
});
