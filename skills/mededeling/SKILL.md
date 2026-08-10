---
description: Maak de WBSO-mededeling op — het jaaroverzicht van gerealiseerde S&O-uren dat vóór 31 maart naar RVO moet, met een CSV-export voor de boekhouder.
---

# Mededeling opmaken

Je stelt het jaaroverzicht samen dat de gebruiker bij RVO moet melden.
`$ARGUMENTS` bevat het kalenderjaar; ontbreekt het, vraag dan om welk jaar het
gaat — dit is meestal het vórige jaar, niet het huidige.

**Praat Nederlands** en gebruik RVO-termen letterlijk.

## Haal het rapport op

```
wbso mededeling --jaar <jaar>
```

Exitcode 1 met `gereed: false` betekent dat er nog validatiefouten openstaan.

## Als het rapport niet gereed is

Toon de fouten en **weiger het overzicht op te maken**. Verwijs naar
`/wbso:check` om ze te herstellen.

Dit is geen formaliteit: een mededeling doen op een grootboek dat niet klopt is
erger dan hem een dag uitstellen. Wat je meldt is de basis voor de definitieve
afdrachtvermindering.

## Als het rapport gereed is

Toon in deze volgorde:

**1. De kern.** Gerealiseerde S&O-uren over het jaar, tegenover de aangevraagde
uren, met de periode en het verklaringnummer erbij.

**2. De afwijking, met het gevolg.** Het rapport levert dit als
`afwijking.richting` en `afwijking.gevolg`. Geef het onverbloemd door:

- **minder gerealiseerd** — het verschil wordt teruggevorderd
- **meer gerealiseerd** — het meerdere wordt niet vergoed; de S&O-verklaring is
  een maximum
- **gelijk** — geen bijzonderheden

**3. Verdeling per project**, zodat de gebruiker ziet waar de uren zijn gemaakt.

**4. De CSV-export** voor de boekhouder:

```
wbso export --jaar <jaar> > wbso-<jaar>.csv
```

Zeg waar het bestand staat en wat erin zit: de effectieve boekingen, dus ná
verwerking van correcties.

## Wat er in het eLoket moet

Vat samen wat de gebruiker daadwerkelijk moet invullen bij RVO:

- het verklaringnummer
- het totaal aantal gerealiseerde S&O-uren over het kalenderjaar
- bij werkelijke kosten in plaats van het forfait: ook de gerealiseerde kosten
  en uitgaven

Noem de deadline: **uiterlijk 31 maart** van het jaar volgend op de
S&O-verklaring. Dat is een harde termijn.

## Sluit af met de disclaimer

Dit overzicht komt uit de eigen administratie van de gebruiker. Het is geen
fiscaal advies, en of de geregistreerde uren waarheidsgetrouw zijn en als S&O
kwalificeren blijft zijn verantwoordelijkheid. Bij twijfel: boekhouder of
WBSO-adviseur.
