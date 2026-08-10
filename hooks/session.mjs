#!/usr/bin/env node
// Sessie-capture (ADR-02): legt vast wanneer er gewerkt is, als geheugensteun
// voor /wbso:dag.
//
// Dit bestand schrijft UITSLUITEND naar sessies-<jaar>.jsonl. Het importeert
// bewust niets uit grootboek.mjs en kent geen enkel pad naar de urenregistratie.
// Wat hier belandt zijn waarnemingen; een boeking ontstaat pas als de gebruiker
// hem bevestigt. Een test bewaakt die scheiding.
//
// Faalt stil: een hook die klaagt over een ontbrekende configuratie zou elke
// Claude Code-sessie in elk willekeurig project vervuilen.

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { bepaalWortel, leesConfig, sessiepad } from "../src/config.mjs";

async function leesInvoer() {
  const stukken = [];
  for await (const stuk of process.stdin) stukken.push(stuk);
  const tekst = Buffer.concat(stukken).toString("utf8").trim();
  return tekst === "" ? {} : JSON.parse(tekst);
}

try {
  const invoer = await leesInvoer();
  const cwd = invoer.cwd ?? process.cwd();

  const { wortel } = bepaalWortel(cwd);
  const config = leesConfig(wortel);
  if (config.capture?.sessies !== true) process.exit(0);

  const nu = new Date();
  const regel = {
    gebeurtenis: invoer.hook_event_name ?? "onbekend",
    tijdstip: nu.toISOString(),
    sessie: invoer.session_id ?? null,
    cwd,
  };

  const pad = sessiepad(wortel, nu.getFullYear());
  mkdirSync(dirname(pad), { recursive: true });
  appendFileSync(pad, `${JSON.stringify(regel)}\n`, "utf8");
} catch {
  // Geen configuratie, geen schrijfrechten, onleesbare invoer: stil stoppen.
}

process.exit(0);
