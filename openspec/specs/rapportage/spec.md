# rapportage

## Purpose

Terugkijken op de registratie: valideren of hij klopt en bij is, en aan het eind van
het jaar de mededeling opmaken die vóór 31 maart naar RVO gaat.

Onderscheidt fouten (de registratie klopt niet) van signalen (het klopt formeel, maar
er is iets om naar te kijken). Een werkdag zonder boeking is altijd een signaal — de
tool weet niet of er die dag gewerkt is.

## Requirements

### Requirement: Check valideert het grootboek en toont totalen

`/wbso:check` MUST het grootboek valideren en totalen tonen per maand en per
S&O-project, met het S&O-aandeel ten opzichte van het totaal geboekte werk.
Validatiefouten MUST met regelverwijzing worden gemeld en MUST een
niet-nul exitcode opleveren wanneer de onderliggende controle als script draait.

#### Scenario: schoon grootboek

- **GIVEN** een grootboek zonder fouten
- **WHEN** de gebruiker `/wbso:check` draait
- **THEN** verschijnen totalen per maand en per project, en het resterende aantal
  uren tot het aangevraagde aantal

### Requirement: Check bewaakt de tien-werkdagengrens

`/wbso:check` MUST per boeking het verschil tussen `datum` en `geregistreerd_op`
in werkdagen berekenen en boekingen melden die de grens van tien werkdagen
overschrijden. Het MUST ook waarschuwen voor dagen binnen de aanvraagperiode
waarop nog niets is geboekt en die de grens naderen.

#### Scenario: te laat geregistreerd

- **GIVEN** een boeking voor 2 maart die pas op 20 maart is vastgelegd
- **WHEN** de validatie draait
- **THEN** wordt die boeking gemeld als buiten de tien-werkdagentermijn

#### Scenario: dag nadert de grens

- **GIVEN** een werkdag van negen werkdagen geleden zonder boeking
- **WHEN** de gebruiker `/wbso:check` draait
- **THEN** waarschuwt de skill dat die dag bijna niet meer geregistreerd kan worden

### Requirement: Check signaleert overschrijding van de aanvraag

`/wbso:check` MUST melden wanneer het S&O-totaal het aangevraagde aantal uren
overschrijdt, met de toelichting dat meeruren niet verrekenbaar zijn.

#### Scenario: boven de aanvraag

- **GIVEN** een aanvraag van 440 uur en een grootboek met 460 S&O-uren
- **WHEN** de validatie draait
- **THEN** meldt hij de overschrijding van 20 uur en dat die niet verrekenbaar is

### Requirement: Mededeling levert het jaarrapport en een CSV-export

`/wbso:mededeling <jaar>` MUST de gerealiseerde S&O-uren over dat kalenderjaar
totaliseren per project, tonen wat er in het eLoket moet worden ingevuld, en een
CSV-export wegschrijven die aan een boekhouder te geven is. Het MUST waarschuwen
wanneer de gerealiseerde uren afwijken van de aangevraagde, met de toelichting dat
minder uren terugbetaling betekent en meer uren niet worden vergoed.

#### Scenario: minder gerealiseerd dan aangevraagd

- **GIVEN** een aanvraag van 440 uur en 390 gerealiseerde S&O-uren
- **WHEN** de gebruiker `/wbso:mededeling 2026` draait
- **THEN** toont het rapport 390 uur, meldt het het verschil van 50 uur, en
  vermeldt dat dat verschil terugbetaald wordt

#### Scenario: openstaande validatiefouten

- **GIVEN** een grootboek met validatiefouten
- **WHEN** de gebruiker de mededeling wil opmaken
- **THEN** weigert de skill het rapport en verwijst hij eerst naar `/wbso:check`
