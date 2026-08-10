# Voorbeeldconfiguratie

`/wbso:init` schrijft dit bestand voor je. Deze pagina is om te begrijpen wat er
staat, en om het met de hand bij te werken als dat sneller is.

Locatie: `.wbso/config.json` in je project, of `~/.wbso/<projectnaam>/config.json`
als je bij init voor `buiten` hebt gekozen.

```jsonc
{
  "administratie": {
    "naam": "Voorbeeld BV",
    // meegecommit | lokaal | buiten — zie ADR-03
    "opslag": "meegecommit"
  },

  "capture": {
    "git": true,      // /wbso:dag leest je commits als geheugensteun
    "sessies": false  // sessie-hook; standaard uit
  },

  "aanvragen": {
    // Eén blok per kalenderjaar. Een S&O-verklaring loopt nooit over de
    // jaargrens, dus 2027 wordt een nieuw blok via /wbso:init 2027.
    "2026": {
      "periode": ["2026-09-01", "2026-12-31"],
      "aangevraagde_uren": 440,
      "tarief": 50,              // 36 = eerste schijf, 50 = starter, 16 = tweede schijf
      "forfait": true,           // kostenforfait; false = werkelijke kosten
      "verklaringnummer": null,  // invullen zodra de beschikking van RVO binnen is

      "projecten": [
        {
          "id": "verifieerbaarheid",
          "naam": "Verifieerbare feitelijkheid van AI-antwoorden",
          "knelpunten": [
            "Beweringen toetsen aan bronnen zonder correcte antwoorden te blokkeren",
            "Kwaliteit meten zonder bestaande benchmark"
          ]
        }
      ]
    }
  },

  // Werk dat NIET als S&O kwalificeert. /wbso:dag waarschuwt hiermee.
  // Mag niet leeg zijn — zie hieronder.
  "afbakening": [
    "marketingsite",
    "CI/CD en infrastructuur",
    "standaard auth-patronen",
    "ontwerp- en stylingwerk",
    "dependency-upgrades"
  ]
}
```

## Waarom de afbakening niet leeg mag zijn

Zonder afbakening stelt `/wbso:dag` al je werk voor als S&O. Dat is precies wat
een controle problematisch maakt: RVO subsidieert technisch nieuw
ontwikkelwerk, niet het bouwen van schermen, het configureren van een pipeline of
het koppelen van een API volgens de documentatie.

De configuratie weigert daarom een lege lijst. Dat is geen bevoogding maar de
enige plek waar de tool je kan behoeden voor een te ruime claim.

## Wat de projecten zijn — en wat niet

De `projecten` zijn **configuratielabels** om boekingen aan op te hangen, plus de
knelpunten als geheugensteun bij het schrijven van je omschrijvingen. Ze zijn
nadrukkelijk **niet** de projectomschrijving die je bij RVO indient. Dat is een
ander document, en een ander soort werk.
