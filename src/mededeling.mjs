// De mededeling: het jaaroverzicht dat vóór 31 maart naar RVO gaat.
//
// De afwijking tussen gerealiseerde en aangevraagde uren wordt hier berekend en
// niet in een skilltekst, omdat er een financieel gevolg aan hangt: te weinig
// gerealiseerde uren betekent terugbetalen, te veel wordt niet vergoed.

import { aanvraagVan } from "./config.mjs";
import { totalenVan } from "./totalen.mjs";
import { valideerGrootboek } from "./validatie.mjs";

export function berekenAfwijking(gerealiseerd, aangevraagd) {
  const verschil = gerealiseerd - aangevraagd;
  if (verschil === 0) return { verschil: 0, richting: "gelijk", gevolg: null };
  if (verschil < 0) {
    return {
      verschil: -verschil,
      richting: "minder",
      gevolg:
        "Je hebt minder uren gerealiseerd dan aangevraagd; het verschil wordt teruggevorderd.",
    };
  }
  return {
    verschil,
    richting: "meer",
    gevolg:
      "Je hebt meer uren gerealiseerd dan aangevraagd; het meerdere wordt niet vergoed — de S&O-verklaring is een maximum.",
  };
}

/**
 * Stel de mededeling samen. Zolang er validatiefouten openstaan is het rapport
 * niet gereed: een mededeling doen op een grootboek dat niet klopt is erger dan
 * hem uitstellen.
 */
export function stelMededelingSamen(opslagmap, jaar, config, { nu = new Date() } = {}) {
  const controle = valideerGrootboek(opslagmap, jaar, config, { nu });
  if (controle.fouten.length > 0) {
    return { gereed: false, fouten: controle.fouten };
  }

  const aanvraag = aanvraagVan(config, jaar);
  const totalen = totalenVan(opslagmap, jaar, config);

  return {
    gereed: true,
    jaar: String(jaar),
    periode: aanvraag.periode,
    verklaringnummer: aanvraag.verklaringnummer,
    gerealiseerd: totalen.sao,
    aangevraagd: totalen.aangevraagd,
    afwijking: berekenAfwijking(totalen.sao, totalen.aangevraagd),
    perProject: totalen.perProject,
    perMaand: totalen.perMaand,
    signalen: controle.signalen,
  };
}
