import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { test } from "node:test";
import { grootboekpad } from "../src/config.mjs";
import { voegToe } from "../src/grootboek.mjs";
import { berekenAfwijking, stelMededelingSamen } from "../src/mededeling.mjs";
import { maakOpslagmap, tellerId } from "./hulp.mjs";

function opstelling(configOverschrijf) {
  const { opslagmap, config, opruimen } = maakOpslagmap(configOverschrijf);
  const id = tellerId();
  const boek = (invoer, nu = "2026-03-03T10:00:00Z") =>
    voegToe(opslagmap, "2026", invoer, { config, nu: new Date(nu), id });
  const rapport = (nu = "2026-03-04T10:00:00Z") =>
    stelMededelingSamen(opslagmap, "2026", config, { nu: new Date(nu) });
  return { opslagmap, config, boek, rapport, opruimen };
}

test("gelijk aantal uren geeft geen gevolg", () => {
  assert.deepEqual(berekenAfwijking(100, 100), { verschil: 0, richting: "gelijk", gevolg: null });
});

test("minder gerealiseerd betekent terugvorderen", () => {
  const afwijking = berekenAfwijking(390, 440);
  assert.equal(afwijking.verschil, 50);
  assert.equal(afwijking.richting, "minder");
  assert.match(afwijking.gevolg, /teruggevorderd/);
});

test("meer gerealiseerd wordt niet vergoed", () => {
  const afwijking = berekenAfwijking(460, 440);
  assert.equal(afwijking.verschil, 20);
  assert.equal(afwijking.richting, "meer");
  assert.match(afwijking.gevolg, /niet vergoed/);
});

test("rapport is niet gereed zolang er validatiefouten zijn", (t) => {
  const { opslagmap, rapport, opruimen } = opstelling();
  t.after(opruimen);

  writeFileSync(
    grootboekpad(opslagmap, "2026"),
    `${JSON.stringify({ datum: "2026-03-02", uren: 7, soort: "sao", project: "gamma", omschrijving: "X" })}\n`,
    "utf8",
  );

  const uitslag = rapport();
  assert.equal(uitslag.gereed, false);
  assert.ok(uitslag.fouten.length > 0);
  assert.equal(uitslag.gerealiseerd, undefined, "een niet-gereed rapport toont geen totalen");
});

test("gereed rapport bevat totalen per project en de afwijking", (t) => {
  const { boek, rapport, opruimen } = opstelling();
  t.after(opruimen);

  boek({ datum: "2026-03-02", uren: 30, soort: "sao", project: "alfa", omschrijving: "A" });
  boek({ datum: "2026-03-03", uren: 10, soort: "sao", project: "beta", omschrijving: "B" });

  const uitslag = rapport();
  assert.equal(uitslag.gereed, true);
  assert.equal(uitslag.gerealiseerd, 40);
  assert.equal(uitslag.aangevraagd, 100);
  assert.equal(uitslag.afwijking.richting, "minder");
  assert.deepEqual(uitslag.perProject, { alfa: 30, beta: 10 });
});

test("rapport neemt het verklaringnummer over", (t) => {
  const { rapport, opruimen } = opstelling();
  t.after(opruimen);

  assert.equal(rapport().verklaringnummer, "R123456");
});
