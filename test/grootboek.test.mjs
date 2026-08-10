import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { grootboekpad } from "../src/config.mjs";
import { BoekingFout, effectieveBoekingen, leesRegels, voegToe } from "../src/grootboek.mjs";
import { maakOpslagmap, tellerId } from "./hulp.mjs";

function opstelling(configOverschrijf) {
  const { opslagmap, config, opruimen } = maakOpslagmap(configOverschrijf);
  const id = tellerId();
  const boek = (invoer, nu = new Date("2026-03-03T18:22:04Z")) =>
    voegToe(opslagmap, "2026", invoer, { config, nu, id });
  return { opslagmap, config, boek, opruimen };
}

const BASIS = { datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "Werk" };

test("boeking krijgt beide datums", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  const boeking = boek(BASIS);
  assert.equal(boeking.datum, "2026-03-02");
  assert.equal(boeking.geregistreerd_op, "2026-03-03T18:22:04.000Z");
});

test("geregistreerd_op mag niet door de aanroeper worden gezet", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(
    () => boek({ ...BASIS, geregistreerd_op: "2020-01-01T00:00:00Z" }),
    BoekingFout,
  );
});

test("datum buiten het kalenderjaar wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, datum: "2027-01-04" }), /jaargrens/);
});

test("datum buiten de aanvraagperiode wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling({
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

  assert.throws(() => boek({ ...BASIS, datum: "2026-08-15" }), /buiten de S&O-periode/);
});

test("S&O-boeking met onbekend project wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, project: "gamma" }), /onbekend project/);
});

test("S&O-boeking zonder project wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  const { project, ...zonder } = BASIS;
  assert.throws(() => boek(zonder), /moet naar een project verwijzen/);
});

test("overig-boeking heeft geen project nodig", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  const boeking = boek({ datum: "2026-03-02", uren: 2, soort: "overig", omschrijving: "CI" });
  assert.equal(boeking.soort, "overig");
  assert.equal(boeking.project, undefined);
});

test("lege omschrijving wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, omschrijving: "  " }), /omschrijving/);
});

test("uren moeten positief zijn", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, uren: 0 }), /positief/);
  assert.throws(() => boek({ ...BASIS, uren: -3 }), /positief/);
});

test("uren naar beneden bijstellen telt de correctie", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek(BASIS);
  boek({ ...BASIS, uren: 5, omschrijving: "Werk (bijgesteld)", corrigeert: eerste.id });

  const effectief = effectieveBoekingen(leesRegels(opslagmap, "2026"));
  assert.equal(effectief.length, 1);
  assert.equal(effectief[0].uren, 5);
});

test("een ingetrokken boeking telt niet meer mee", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek(BASIS);
  boek({
    datum: "2026-03-02",
    ingetrokken: true,
    omschrijving: "Bleek routinewerk",
    corrigeert: eerste.id,
  });

  assert.equal(leesRegels(opslagmap, "2026").length, 2);
  assert.deepEqual(effectieveBoekingen(leesRegels(opslagmap, "2026")), []);
});

test("keten van twee correcties laat alleen de laatste staan", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek(BASIS);
  const tweede = boek({ ...BASIS, uren: 5, corrigeert: eerste.id });
  boek({ ...BASIS, uren: 6, corrigeert: tweede.id });

  const effectief = effectieveBoekingen(leesRegels(opslagmap, "2026"));
  assert.equal(effectief.length, 1);
  assert.equal(effectief[0].uren, 6);
});

test("een al gecorrigeerde boeking kan niet nogmaals gecorrigeerd worden", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek(BASIS);
  boek({ ...BASIS, uren: 5, corrigeert: eerste.id });

  assert.throws(() => boek({ ...BASIS, uren: 4, corrigeert: eerste.id }), /al gecorrigeerd/);
});

test("correctie naar een onbekende boeking wordt geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, corrigeert: "bestaat-niet" }), /onbekende boeking/);
});

test("toevoegen wijzigt of verwijdert nooit een bestaande regel", (t) => {
  const { opslagmap, boek, opruimen } = opstelling();
  t.after(opruimen);

  const eerste = boek(BASIS);
  const naEerste = readFileSync(grootboekpad(opslagmap, "2026"), "utf8");

  boek({ ...BASIS, uren: 5, corrigeert: eerste.id });
  boek({ datum: "2026-03-04", uren: 3, soort: "overig", omschrijving: "CI" });

  const naAlles = readFileSync(grootboekpad(opslagmap, "2026"), "utf8");
  assert.ok(naAlles.startsWith(naEerste), "de eerste regel moet ongewijzigd vooraan blijven staan");
  assert.equal(naAlles.trimEnd().split("\n").length, 3);
});

test("onbekende velden in een boeking worden geweigerd", (t) => {
  const { boek, opruimen } = opstelling();
  t.after(opruimen);

  assert.throws(() => boek({ ...BASIS, tarief: 50 }), /onbekende velden/);
});
