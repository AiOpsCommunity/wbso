import assert from "node:assert/strict";
import { test } from "node:test";
import { alsDatum, isWerkdag, werkdagenIn, werkdagenTussen } from "../src/werkdagen.mjs";

test("alsDatum knipt het dagdeel uit een tijdstip", () => {
  assert.equal(alsDatum("2026-03-02T18:22:04Z"), "2026-03-02");
  assert.equal(alsDatum("2026-03-02"), "2026-03-02");
});

test("isWerkdag herkent het weekend", () => {
  assert.equal(isWerkdag("2026-03-06"), true); // vrijdag
  assert.equal(isWerkdag("2026-03-07"), false); // zaterdag
  assert.equal(isWerkdag("2026-03-08"), false); // zondag
  assert.equal(isWerkdag("2026-03-09"), true); // maandag
});

test("zelfde dag is nul werkdagen", () => {
  assert.equal(werkdagenTussen("2026-03-02", "2026-03-02"), 0);
});

test("vrijdag naar maandag is één werkdag", () => {
  assert.equal(werkdagenTussen("2026-03-06", "2026-03-09"), 1);
});

test("weekend telt niet mee", () => {
  // maandag 2 maart t/m maandag 9 maart: vijf werkdagen
  assert.equal(werkdagenTussen("2026-03-02", "2026-03-09"), 5);
});

test("registratie op een zaterdag telt de tussenliggende werkdagen", () => {
  assert.equal(werkdagenTussen("2026-03-06", "2026-03-07"), 0);
});

test("telling over de jaarwisseling", () => {
  // woensdag 31 december 2025 naar vrijdag 2 januari 2026: donderdag + vrijdag
  assert.equal(werkdagenTussen("2025-12-31", "2026-01-02"), 2);
});

test("een registratie vóór de werkdatum geeft een negatief aantal", () => {
  assert.equal(werkdagenTussen("2026-03-09", "2026-03-06"), -1);
});

test("terug in de tijd over alleen weekenddagen geeft nul, niet negatief", () => {
  // Maandag 2 maart terug naar zondag 1 maart: er ligt geen werkdag tussen.
  // Het teken van deze functie is daarom géén betrouwbare richtingaanwijzer;
  // wie richting wil weten, vergelijkt de datums zelf (zie validatie.mjs).
  assert.equal(werkdagenTussen("2026-03-02", "2026-03-01"), 0);
});

test("werkdagenIn geeft alleen maandag tot en met vrijdag", () => {
  assert.deepEqual(werkdagenIn("2026-03-06", "2026-03-10"), [
    "2026-03-06",
    "2026-03-09",
    "2026-03-10",
  ]);
});

test("werkdagenIn is leeg voor een weekend", () => {
  assert.deepEqual(werkdagenIn("2026-03-07", "2026-03-08"), []);
});
