# urenregistratie

## Purpose

Het grootboek waarin S&O-uren worden vastgelegd. Append-only, met per boeking zowel
de werkdatum als het registratiemoment — het verschil daartussen is het bewijs voor
de tien-werkdageneis van de WBSO.

Corrigeren gebeurt door toevoegen, nooit door overschrijven: wie regels wijzigt, wist
het bewijs dat hij tijdig heeft geregistreerd.

## Requirements

### Requirement: Grootboek is append-only met werkdatum en registratiemoment

Het grootboek MUST elke boeking wegschrijven als één JSONL-regel met zowel
`datum` (wanneer het werk is verricht) als `geregistreerd_op` (ISO-8601 tijdstip
waarop de boeking is vastgelegd). Bestaande regels MUST NOT worden gewijzigd of
verwijderd. Er MUST één grootboekbestand per kalenderjaar zijn.

#### Scenario: boeking krijgt beide datums

- **GIVEN** een gebruiker die op 3 maart uren boekt voor 2 maart
- **WHEN** de boeking wordt vastgelegd
- **THEN** bevat de regel `datum: "2026-03-02"` en `geregistreerd_op` met het
  werkelijke tijdstip van vastleggen

#### Scenario: jaargrens

- **GIVEN** een boeking met een datum in 2027
- **WHEN** het grootboek van 2026 actief is
- **THEN** wordt de boeking geweigerd met de melding dat een S&O-verklaring nooit
  over de jaargrens loopt

### Requirement: Correcties zijn nieuwe regels

Een correctie op een eerdere boeking MUST worden vastgelegd als een nieuwe regel
die via een `corrigeert`-veld naar de te corrigeren regel verwijst. De
oorspronkelijke regel MUST ongewijzigd blijven staan. Totalen MUST correcties
toepassen in plaats van alle regels bij elkaar op te tellen.

#### Scenario: uren naar beneden bijstellen

- **GIVEN** een boeking van 7 uur op 2 maart
- **WHEN** de gebruiker die corrigeert naar 5 uur
- **THEN** staan beide regels in het grootboek en telt het totaal 5 uur

#### Scenario: boeking intrekken

- **GIVEN** een boeking die achteraf geen S&O blijkt
- **WHEN** de gebruiker hem intrekt
- **THEN** blijft de oorspronkelijke regel staan, verschijnt een correctieregel,
  en telt de boeking niet meer mee in het S&O-totaal

### Requirement: Boekingen zijn herleidbaar naar een S&O-project

Elke boeking met `soort: "sao"` MUST verwijzen naar een `project`-id dat in de
configuratie van het betreffende jaar bestaat, en MUST een niet-lege
`omschrijving` hebben. Boekingen met `soort: "overig"` MUST geen project vereisen.

#### Scenario: onbekend project

- **GIVEN** een boeking die verwijst naar een project-id dat niet in de config staat
- **WHEN** het grootboek wordt gevalideerd
- **THEN** meldt de validatie dit als fout met vermelding van de bekende project-ids

### Requirement: Boekingen vallen binnen de aanvraagperiode

Een boeking MUST een `datum` hebben die binnen de geconfigureerde aanvraagperiode
van dat jaar valt. Valt hij erbuiten, dan MUST de validatie dat als fout melden —
uren buiten de periode van de S&O-verklaring zijn niet verrekenbaar.

#### Scenario: uren van vóór de ingangsdatum

- **GIVEN** een aanvraagperiode die op 1 september start
- **WHEN** een boeking op 15 augustus wordt gevalideerd
- **THEN** meldt de validatie dat de datum buiten de S&O-periode valt
