// Validatie van het grootboek. Onderscheidt bewust twee soorten uitkomsten:
//
//   fouten   — de registratie klopt niet en moet gerepareerd worden
//   signalen — het klopt formeel, maar er is iets om naar te kijken
//
// Een werkdag zonder boeking is nadrukkelijk een signaal en nooit een fout: de
// tool weet niet of er die dag gewerkt is.

import { aanvraagVan } from "./config.mjs";
import { BoekingFout, controleerBoeking, effectieveBoekingen, leesRegels } from "./grootboek.mjs";
import { alsDatum, werkdagenIn, werkdagenTussen } from "./werkdagen.mjs";

export const TERMIJN_WERKDAGEN = 10;
/** Vanaf hoeveel werkdagen een nog niet geboekte werkdag als bijna-te-laat geldt. */
const WAARSCHUWING_VANAF = 8;

export function valideerGrootboek(wortel, jaar, config, { nu = new Date() } = {}) {
  const aanvraag = aanvraagVan(config, jaar);
  const regels = leesRegels(wortel, jaar);
  const fouten = [];
  const signalen = [];

  // Per regel dezelfde controle als bij het toevoegen, zodat een met de hand
  // bewerkt grootboek dezelfde eisen krijgt als een via de tool geschreven regel.
  for (const [i, { regelnummer, boeking }] of regels.entries()) {
    const eerdere = regels.slice(0, i);
    const { id, geregistreerd_op, ...invoer } = boeking;

    if (!id) fouten.push({ regelnummer, melding: "boeking heeft geen id" });
    if (!geregistreerd_op) {
      fouten.push({ regelnummer, melding: "boeking heeft geen geregistreerd_op" });
    }

    try {
      controleerBoeking(invoer, { config, jaar, bestaande: eerdere });
    } catch (fout) {
      if (!(fout instanceof BoekingFout)) throw fout;
      fouten.push({ regelnummer, melding: fout.message });
    }

    if (geregistreerd_op && boeking.datum) {
      // Op de kalenderdatum vergelijken, niet op het teken van de
      // werkdagentelling: ligt de registratie één dag vóór de werkdatum en is
      // dat een zondag, dan zijn er nul werkdagen verschil en zou het teken
      // niets verraden.
      const registratiedag = alsDatum(geregistreerd_op);
      const werkdagen = werkdagenTussen(boeking.datum, registratiedag);
      if (registratiedag < boeking.datum) {
        fouten.push({
          regelnummer,
          melding: `geregistreerd_op (${registratiedag}) ligt vóór de werkdatum (${boeking.datum})`,
        });
      } else if (werkdagen > TERMIJN_WERKDAGEN) {
        fouten.push({
          regelnummer,
          melding: `${werkdagen} werkdagen tussen werkdatum en registratie — de WBSO eist ten hoogste ${TERMIJN_WERKDAGEN}`,
        });
      }
    }
  }

  const effectieve = effectieveBoekingen(regels);
  const geboekteDagen = new Set(effectieve.map((b) => b.datum));
  const vandaag = alsDatum(nu.toISOString());
  const [start, eind] = aanvraag.periode;
  const tot = vandaag < eind ? vandaag : eind;

  for (const dag of werkdagenIn(start, tot)) {
    if (geboekteDagen.has(dag) || dag === vandaag) continue;
    const verstreken = werkdagenTussen(dag, vandaag);
    if (verstreken > TERMIJN_WERKDAGEN) {
      signalen.push({
        dag,
        melding: `werkdag zonder boeking, ${verstreken} werkdagen geleden — niet meer tijdig te registreren`,
      });
    } else if (verstreken >= WAARSCHUWING_VANAF) {
      signalen.push({
        dag,
        melding: `werkdag zonder boeking, nog ${TERMIJN_WERKDAGEN - verstreken} werkdagen om te registreren`,
      });
    }
  }

  if (aanvraag.verklaringnummer === null) {
    signalen.push({
      melding: `verklaringnummer voor ${jaar} ontbreekt nog — vul het in zodra de beschikking van RVO binnen is`,
    });
  }

  return { fouten, signalen, aantalRegels: regels.length };
}
