---
description: Controleer de WBSO-urenregistratie en toon de stand van zaken — validatiefouten, de tien-werkdagengrens, totalen per maand en per project. Gebruik dit om te zien of de registratie klopt en bij is.
---

# Registratie controleren

Je toont de gebruiker of zijn urenregistratie klopt en bij is. `$ARGUMENTS` bevat
een kalenderjaar als de gebruiker er een meegaf, anders het huidige jaar.

**Praat Nederlands.**

## Haal de gegevens op

```
wbso valideer --jaar <jaar>
wbso totalen --jaar <jaar>
```

`valideer` geeft exitcode 1 als er fouten zijn. Beide leveren JSON; jij maakt er
leesbaar Nederlands van. Reken zelf niets uit — de totalen en de
werkdagenberekening komen uit het commando.

## Presenteer in deze volgorde

**1. Fouten eerst, als die er zijn.** Dit zijn dingen die gerepareerd moeten
worden voordat de mededeling gedaan kan worden. Noem per fout het regelnummer en
wat eraan mankeert, en leg uit hoe het te herstellen is:

- boeking buiten de S&O-periode of het kalenderjaar → die uren zijn niet
  verrekenbaar; corrigeer de datum of trek de boeking in
- onbekend project → controleer het project-id in de configuratie
- te laat geregistreerd → dit is niet meer te repareren; wijs erop dat het bij
  een controle een probleem kan zijn en dat het vooral zaak is dat het niet weer
  gebeurt

**2. Signalen.** Werkdagen zonder boeking die de tien-werkdagengrens naderen zijn
het belangrijkst — daar kan de gebruiker nu nog iets aan doen. Stel voor die
dagen alsnog te boeken met `/wbso:dag <datum>`.

Een werkdag zonder boeking is nadrukkelijk geen fout: de tool weet niet of er die
dag gewerkt is. Presenteer het als een herinnering, niet als een verwijt.

Staat er een signaal over een ontbrekend `verklaringnummer`, meld dan dat het
ingevuld moet worden zodra de beschikking van RVO binnen is.

**3. De stand.** Totalen per maand en per project, het S&O-aandeel, en hoeveel
uren er nog resteren tot het aangevraagde aantal. Bij overschrijding: meld dat
het meerdere niet verrekenbaar is, want de S&O-verklaring is een maximum.

## Wat je erbij vertelt

De werkdagentelling houdt geen rekening met Nederlandse feestdagen. Dat betekent
dat de tool eerder een dag te vroeg waarschuwt dan een dag te laat. Noem dat als
een boeking vlak tegen de grens aan zit.

## Als er niets aan de hand is

Houd het kort. Een schone registratie verdient drie regels: geen fouten, de stand
van het jaar, en wanneer de mededeling moet.
