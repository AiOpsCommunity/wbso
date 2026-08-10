# WBSO-urenregistratie als Claude Code-plugin — ontwerp

- **Datum:** 10 augustus 2026
- **Status:** ontwerp goedgekeurd, nog niet gepland
- **Herkomst:** de eerste versie (een CSV met een telscript) ontstond bij het
  voorbereiden van een eigen WBSO-aanvraag, en bleek algemeen genoeg om te delen

## Doel

Een installeerbare Claude Code-plugin waarmee Nederlandse ondernemers hun
S&O-uren voor de WBSO bijhouden, met dezelfde discipline die de regeling eist:
registratie binnen tien werkdagen, herleidbaar naar een S&O-project, en scherp
afgebakend tegen werk dat niet kwalificeert.

Publiek: de AI-ops community — solo-ondernemers en kleine teams die met Claude
Code ontwikkelen en WBSO aanvragen of dat overwegen.

## Uitgangspunt: de machine stelt voor, de mens verklaart

De harde ontwerpregel van dit project. Uren worden nooit stilzwijgend machinaal
geboekt.

Sessieduur is geen S&O-tijd: hij bevat pauzes, bevat niet-kwalificerend werk, en
mist het denkwerk dat buiten de editor gebeurt. Een tool die sessietijd
wegschrijft als S&O-uren produceert geen registratie maar een
aansprakelijkheidsrisico bij een RVO-controle.

De machine mag daarom hooguit een **concept** voorstellen dat de gebruiker
bevestigt of corrigeert. Alles in dit ontwerp volgt uit die regel — met name de
scheiding tussen waarnemingen en claims (zie Bestandsindeling).

## Vastgestelde besluiten

| Besluit | Keuze | Waarom |
|---|---|---|
| Scope | Registratie + mededeling | De aanvraag zelf is jaarlijks en is waar slecht AI-werk het meeste schade doet; registratie is de dagelijkse pijn |
| Opslag | Standalone, eigen bestanden | Een koppeling met een bestaande urenregistratie zou de installatiedrempel te hoog maken |
| Bewijsbron dagvoorstel | Git-log, optioneel sessie-hook | Configureerbaar bij init |
| Locatie registratie | Keuze bij init, standaard meegecommit | Git-historie is een onafhankelijk gedateerd spoor |
| Taal | Code/docs Engels, interactie Nederlands | Vindbaarheid en bijdragen versus RVO-termen die niet vertalen |

## Architectuur

### Het grootboek is append-only

Elke boeking draagt twee datums:

```jsonc
{"datum":"2026-03-02","geregistreerd_op":"2026-03-03T18:22:04Z",
 "uren":7,"soort":"sao","project":"voorbeeldproject",
 "omschrijving":"Formaatnormalisatie bedragen/datums","ref":"knelpunt 1"}
```

`datum` is wanneer gewerkt is, `geregistreerd_op` wanneer vastgelegd. Het verschil
tussen die twee is het bewijs voor de tien-werkdageneis — precies de vraag die
RVO bij een controle stelt.

Een correctie is daarom een **nieuwe regel die naar de oude verwijst**, nooit een
bewerking van de oude. Wie regels overschrijft wist zijn eigen bewijs. Gecommit
naar git komt daar een tweede, onafhankelijk spoor bovenop.

Formaat is JSONL: één regel per boeking, diff't per boeking in git, verdraagt
extra velden bij latere uitbreiding. Niemand leest het rauw — `/wbso:check` en
`/wbso:mededeling` renderen het en exporteren naar CSV voor de boekhouder.

### Bestandsindeling

```
.wbso/
├── config.json           aanvraag, projecten, afbakening, capture-instellingen
├── uren-2026.jsonl       het grootboek, één bestand per kalenderjaar
└── sessies-2026.jsonl    ruwe sessiefeiten (alleen als capture aan staat)
```

Eén bestand per kalenderjaar volgt de regeling: een S&O-verklaring loopt nooit
over de jaargrens.

De indeling is identiek ongeacht de keuze bij init; alleen de wortel verschilt.
Bij `meegecommit` en `lokaal` is dat `.wbso/` in het project (bij `lokaal`
aangevuld met een `.gitignore`-regel), bij `buiten` is het
`~/.wbso/<projectnaam>/`. Skills lossen die wortel één keer op en werken daarna
met dezelfde paden.

**De scheiding tussen de twee JSONL-bestanden is principieel.** `sessies-*.jsonl`
bevat waarnemingen — wanneer er gewerkt is, welke bestanden zijn aangeraakt.
`uren-*.jsonl` bevat claims die de gebruiker heeft bevestigd. De hook schrijft
nooit in het grootboek. Die grens bewaakt het verschil tussen "de machine zag
iets" en "ik verklaar dit".

### Configuratie

```jsonc
{
  "administratie": { "naam": "…", "opslag": "meegecommit" },
  "capture": { "git": true, "sessies": false },
  "aanvragen": {
    "2026": {
      "periode": ["2026-01-01", "2026-12-31"],
      "aangevraagde_uren": 1200,
      "tarief": 36,
      "forfait": true,
      "verklaringnummer": null,
      "projecten": [
        { "id": "voorbeeldproject", "naam": "…", "knelpunten": ["…"] }
      ]
    }
  },
  "afbakening": ["marketingsite", "deploy/IaC", "standaard auth-patronen"]
}
```

`afbakening` is functioneel, geen documentatie: `/wbso:dag` waarschuwt ermee als
een voorgestelde boeking op uitgesloten werk lijkt. Dit is de belangrijkste plek
waar de plugin een te ruime claim voorkomt.

Meerdere S&O-projecten worden ondersteund; elke boeking verwijst naar een
`project`-id.

## Skills

### `/wbso:init`

Vult de volledige `config.json`, in vier lagen in plaats van één lang formulier.

1. **Gevraagd (5 vragen):** periode, aangevraagde uren, tarief, forfait of
   werkelijke kosten, opslaglocatie.
2. **Voorgesteld — projecten:** leest ADR's, README, `docs/` en recente commits
   en stelt een projectindeling met technische knelpunten voor. Gebruiker
   corrigeert.
3. **Voorgesteld — afbakening:** detecteert een `website/`-map, marketing-app,
   CI-workflows of auth-package en zet die op de uitsluitingslijst met reden.
   Een lege afbakening wordt niet geaccepteerd; dat is de gevaarlijkste
   standaardwaarde die deze tool kan hebben.
4. **Leeg gelaten:** `verklaringnummer` is bij init nog onbekend. Blijft `null`;
   `/wbso:check` herinnert eraan.

Her-uitvoerbaar per jaar: `/wbso:init 2027` voegt een aanvraagblok toe en laat
bestaande jaren ongemoeid. Ook de jaarlijkse decemberronde loopt hierdoorheen.

### `/wbso:dag [datum]`

De dagelijkse routine. Haalt commits van die dag op (plus sessiefeiten als
capture aanstaat), groepeert ze, en stelt boekingen voor met uren, project, soort
en omschrijving. Schrijft pas naar het grootboek na bevestiging. Werk dat matcht
met de afbakening wordt voorgesteld als `overig`, met vermelding waarom.

De voorgestelde uren zijn een startpunt, geen meting — commits zeggen niets over
denkwerk zonder commit. De skill zegt dat erbij, zodat de gebruiker het niet
klakkeloos overneemt.

### `/wbso:check`

Validatie en totalen: totalen per maand en per project, S&O-aandeel, dagen boven
het aangevraagde tempo, boekingen die de tien-werkdagengrens naderen of
overschrijden, ontbrekend verklaringnummer, en overschrijding van de aangevraagde
uren.

### `/wbso:mededeling`

Het maartrapport. Totalen per project over het jaar, CSV-export voor de
boekhouder, en een overzicht van wat in het eLoket moet. Waarschuwt bij afwijking
tussen gerealiseerde en aangevraagde uren, omdat dat terugbetaling betekent.

## Hook

`SessionStart` en `SessionEnd` schrijven tijdstip, duur en werkdirectory naar
`sessies-<jaar>.jsonl`. De hook leest eerst `config.json` en doet niets als
`capture.sessies` uitstaat — zo blijft hij optioneel zonder dat de gebruiker
plugin-configuratie hoeft aan te raken. Hij raakt het grootboek nooit aan.

## Distributie

Repo `AiOpsCommunity/wbso` met `.claude-plugin/marketplace.json` in de root en de
plugin zelf eveneens in de root. Installeren komt daarmee neer op:

```
/plugin marketplace add AiOpsCommunity/wbso
/plugin install wbso@wbso
```

Eventueel later indienen bij `claude-community`.

De manifesten worden pas toegevoegd zodra er iets installeerbaars staat — een
marketplace die naar een lege plugin wijst levert alleen teleurgestelde
gebruikers op.

De README krijgt een expliciete disclaimer: hulpmiddel voor de eigen
administratie, geen fiscaal advies, en wat bij RVO wordt ingediend blijft de
verantwoordelijkheid van de gebruiker. Voor een tool die meeschrijft aan een
belastingaangifte is dat geen formaliteit.

## Testen

Getest wordt de logica, niet de skills: parsen van het grootboek,
correctieregels, totalen per project en per jaar, de tien-werkdagencontrole, en
de grenswaarden rond periode en aangevraagde uren. Node's ingebouwde testrunner,
geen framework. De skills zelf worden handmatig getest tegen een testproject.

## Niet in scope

- Hulp bij het schrijven van de aanvraag of de projectomschrijving. `/wbso:init`
  stelt weliswaar projecten en knelpunten voor, maar uitsluitend als
  configuratie-invulling: korte labels waaraan boekingen worden opgehangen. Het
  levert nadrukkelijk geen tekst die je bij RVO indient.
- Aggregatie van uren over meerdere medewerkers; de plugin is per persoon
- Koppeling met Moneybird of andere bestaande urenregistraties
- Meerdere administraties in één project
- Automatisch boeken zonder bevestiging — uitgesloten door het uitgangspunt

## Openstaand

- Definitieve pluginnaam en repo-naam op GitHub (nu `wbso-uren`)
- `seed/wbso-uren.mjs` is het vertrekpunt voor de validatielogica en gaat op in
  de nieuwe structuur; het bestand zelf verdwijnt daarna
