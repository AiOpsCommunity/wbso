# WBSO-urenregistratie als Claude Code-plugin (MVP)

## Why

De WBSO eist dat S&O-uren binnen tien werkdagen worden vastgelegd, herleidbaar
naar een S&O-project en gescheiden van werk dat niet kwalificeert. Dat handmatig
bijhouden is vervelend genoeg dat mensen het uitstellen — en achteraf
reconstrueren is precies wat de regeling uitsluit. Wie zijn registratie niet op
orde heeft, verliest bij een controle uren die hij wél heeft gemaakt.

Ontwikkelaars die met Claude Code werken hebben tegelijk een ongebruikte
geheugensteun liggen: hun commits zijn een gedateerd logboek van wat ze die dag
hebben gedaan. Dat kan het invullen van de registratie terugbrengen tot een korte
dagelijkse bevestiging.

De eerste versie hiervan (een CSV met een telscript) ontstond bij het
voorbereiden van een eigen WBSO-aanvraag en bleek algemeen genoeg om te delen
met de AiOps-community.

## What Changes

- Nieuwe **Claude Code-plugin** `wbso`, gedistribueerd via
  `AiOpsCommunity/wbso` als eigen marketplace (ADR-04). Vier skills:
  `/wbso:init`, `/wbso:dag`, `/wbso:check`, `/wbso:mededeling`.
- **Append-only grootboek** in JSONL waarin elke boeking zowel de werkdatum als
  het registratiemoment draagt (ADR-01). Correcties zijn nieuwe regels die naar
  de oude verwijzen; regels worden nooit overschreven. Eén bestand per
  kalenderjaar, conform de regeling.
- **Configuratie per project** (`config.json`): aanvraagperiode, aangevraagde
  uren, tarief, forfait-keuze, S&O-projecten met knelpunten, en een
  **afbakeningslijst** van werk dat niet kwalificeert. `/wbso:init` vult die in
  vier lagen: vijf gevraagde kernwaarden, voorgestelde projecten uit de repo,
  voorgestelde afbakening uit gedetecteerde mappen, en wat pas later bekend is.
- **Dagboeking met bevestiging** (`/wbso:dag`): stelt boekingen voor op basis van
  de commits van die dag, maar schrijft niets zonder bevestiging (ADR-02).
  Voorstellen die matchen met de afbakening worden aangeboden als `overig`.
- **Optionele sessie-hook** (`SessionStart`/`SessionEnd`) die ruwe waarnemingen
  wegschrijft naar een apart bestand. Staat standaard uit en raakt het grootboek
  nooit aan.
- **Rapportage**: `/wbso:check` valideert en telt (inclusief de
  tien-werkdagengrens); `/wbso:mededeling` levert het maartrapport en een
  CSV-export voor de boekhouder.
- **Opslaglocatie is een keuze bij init** (ADR-03): meegecommit (standaard),
  lokaal-gitignored, of buiten het project.

## Wat expliciet niet in deze change zit

- Hulp bij het schrijven van de aanvraag of de projectomschrijving. `/wbso:init`
  stelt projecten en knelpunten voor als configuratielabels, niet als tekst die
  je bij RVO indient.
- Aggregatie over meerdere medewerkers; de plugin is per persoon.
- Koppeling met Moneybird of andere bestaande urenregistraties.
- Automatisch boeken zonder bevestiging — uitgesloten door ADR-02.
