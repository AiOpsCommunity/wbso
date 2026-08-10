import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { test } from "node:test";
import { grootboekpad } from "../src/config.mjs";
import { voegToe } from "../src/grootboek.mjs";
import { valideerGrootboek } from "../src/validatie.mjs";
import { maakWortel, tellerId } from "./hulp.mjs";

const BASIS = { datum: "2026-03-02", uren: 7, soort: "sao", project: "alfa", omschrijving: "Werk" };

function opstelling(configOverschrijf) {
  const { wortel, config, opruimen } = maakWortel(configOverschrijf);
  const id = tellerId();
  const boek = (invoer, nu) => voegToe(wortel, "2026", invoer, { config, nu: new Date(nu), id });
  const valideer = (nu) => valideerGrootboek(wortel, "2026", config, { nu: new Date(nu) });
  return { wortel, config, boek, valideer, opruimen };
}

/** Schrijf een regel buiten voegToe om, zodat een met de hand bewerkt grootboek te testen is. */
function schrijfRuw(wortel, boeking) {
  appendFileSync(grootboekpad(wortel, "2026"), `${JSON.stringify(boeking)}\n`, "utf8");
}

test("schoon grootboek levert geen fouten", (t) => {
  const { boek, valideer, opruimen } = opstelling();
  t.after(opruimen);

  boek(BASIS, "2026-03-03T10:00:00Z");
  const uitslag = valideer("2026-03-04T10:00:00Z");
  assert.deepEqual(uitslag.fouten, []);
});

test("te laat geregistreerde boeking wordt als fout gemeld", (t) => {
  const { boek, valideer, opruimen } = opstelling();
  t.after(opruimen);

  // 2 maart is maandag; 20 maart is vrijdag — veertien werkdagen later.
  boek(BASIS, "2026-03-20T10:00:00Z");
  const uitslag = valideer("2026-03-20T12:00:00Z");

  assert.equal(uitslag.fouten.length, 1);
  assert.match(uitslag.fouten[0].melding, /14 werkdagen/);
});

test("registratie op de tiende werkdag is nog op tijd", (t) => {
  const { boek, valideer, opruimen } = opstelling();
  t.after(opruimen);

  // maandag 2 maart + 10 werkdagen = maandag 16 maart
  boek(BASIS, "2026-03-16T10:00:00Z");
  assert.deepEqual(valideer("2026-03-16T12:00:00Z").fouten, []);
});

test("registratie vóór de werkdatum is een fout", (t) => {
  const { wortel, valideer, opruimen } = opstelling();
  t.after(opruimen);

  schrijfRuw(wortel, { id: "x", ...BASIS, geregistreerd_op: "2026-03-01T10:00:00Z" });
  const uitslag = valideer("2026-03-05T10:00:00Z");

  assert.match(uitslag.fouten[0].melding, /vóór de werkdatum/);
});

test("ontbrekend id en geregistreerd_op worden gemeld", (t) => {
  const { wortel, valideer, opruimen } = opstelling();
  t.after(opruimen);

  schrijfRuw(wortel, BASIS);
  const meldingen = valideer("2026-03-05T10:00:00Z").fouten.map((f) => f.melding);

  assert.ok(meldingen.some((m) => /geen id/.test(m)));
  assert.ok(meldingen.some((m) => /geen geregistreerd_op/.test(m)));
});

test("met de hand toegevoegde regel met onbekend project wordt gemeld", (t) => {
  const { wortel, valideer, opruimen } = opstelling();
  t.after(opruimen);

  schrijfRuw(wortel, {
    id: "x",
    ...BASIS,
    project: "gamma",
    geregistreerd_op: "2026-03-03T10:00:00Z",
  });

  assert.match(valideer("2026-03-04T10:00:00Z").fouten[0].melding, /onbekend project/);
});

test("werkdag zonder boeking die de grens nadert geeft een signaal", (t) => {
  const { valideer, opruimen } = opstelling();
  t.after(opruimen);

  // maandag 2 maart is niet geboekt; op 13 maart (vrijdag) is dat negen werkdagen terug.
  const signalen = valideer("2026-03-13T10:00:00Z").signalen;
  const tweeMaart = signalen.find((s) => s.dag === "2026-03-02");

  assert.ok(tweeMaart, "2 maart hoort in de signalen te staan");
  assert.match(tweeMaart.melding, /nog 1 werkdagen om te registreren/);
});

test("een geboekte dag levert geen signaal op", (t) => {
  const { boek, valideer, opruimen } = opstelling();
  t.after(opruimen);

  boek(BASIS, "2026-03-03T10:00:00Z");
  const signalen = valideer("2026-03-13T10:00:00Z").signalen;

  assert.equal(signalen.filter((s) => s.dag === "2026-03-02").length, 0);
});

test("werkdag die de termijn al voorbij is wordt als zodanig gemeld", (t) => {
  const { valideer, opruimen } = opstelling();
  t.after(opruimen);

  const signalen = valideer("2026-03-20T10:00:00Z").signalen;
  const tweeMaart = signalen.find((s) => s.dag === "2026-03-02");

  assert.match(tweeMaart.melding, /niet meer tijdig te registreren/);
});

test("vandaag levert nooit een signaal op", (t) => {
  const { valideer, opruimen } = opstelling();
  t.after(opruimen);

  const signalen = valideer("2026-03-13T10:00:00Z").signalen;
  assert.equal(signalen.filter((s) => s.dag === "2026-03-13").length, 0);
});

test("ontbrekend verklaringnummer geeft een signaal", (t) => {
  const { valideer, opruimen } = opstelling({
    aanvragen: {
      2026: {
        periode: ["2026-01-01", "2026-12-31"],
        aangevraagde_uren: 100,
        tarief: 36,
        forfait: true,
        verklaringnummer: null,
        projecten: [{ id: "alfa", naam: "Alfa", knelpunten: [] }],
      },
    },
  });
  t.after(opruimen);

  const signalen = valideer("2026-01-05T10:00:00Z").signalen;
  assert.ok(signalen.some((s) => /verklaringnummer/.test(s.melding)));
});
