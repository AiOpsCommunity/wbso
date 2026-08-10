# dagboeking (delta)

## ADDED Requirements

### Requirement: Geen boeking zonder bevestiging

De plugin MUST NOT een boeking in het grootboek schrijven zonder expliciete
bevestiging van de gebruiker. Er MUST geen instelling, vlag of modus bestaan die
dat omzeilt.

#### Scenario: gebruiker breekt af

- **GIVEN** `/wbso:dag` heeft boekingen voorgesteld
- **WHEN** de gebruiker de sessie afbreekt zonder te bevestigen
- **THEN** is het grootboek ongewijzigd

### Requirement: Dagvoorstel uit commits van die dag

`/wbso:dag [datum]` MUST de commits van die dag ophalen, groeperen tot
samenhangende brokken werk, en per brok een boeking voorstellen met uren,
project, soort en omschrijving. De skill MUST bij het voorstel vermelden dat de
uren een startpunt zijn en geen meting, omdat commits niets zeggen over denkwerk
zonder commit.

#### Scenario: dag zonder commits

- **GIVEN** een dag waarop wel gewerkt maar niets gecommit is
- **WHEN** de gebruiker `/wbso:dag` draait
- **THEN** meldt de skill dat er geen commits zijn en vraagt de uren rechtstreeks
  uit, zonder een voorstel te verzinnen

#### Scenario: terugboeken op een eerdere dag

- **GIVEN** een gebruiker die twee dagen niet heeft geboekt
- **WHEN** hij `/wbso:dag 2026-03-02` draait
- **THEN** worden de commits van díe dag gebruikt en krijgt de boeking het
  werkelijke registratiemoment als `geregistreerd_op`

### Requirement: Werk dat matcht met de afbakening wordt als overig aangeboden

Herkent de skill in het voorgestelde werk iets dat overeenkomt met een vermelding
op de afbakeningslijst, dan MUST hij die boeking voorstellen als
`soort: "overig"` met vermelding van de reden. De gebruiker MUST dat kunnen
overrulen.

#### Scenario: CI-werk tussen S&O-werk

- **GIVEN** een afbakening die "CI-configuratie" uitsluit
- **WHEN** de dag commits bevat die een workflow-bestand aanpassen
- **THEN** stelt de skill die boeking voor als `overig` met de afbakeningsregel
  erbij als reden

### Requirement: Sessie-capture is opt-in en schrijft nooit in het grootboek

De `SessionStart`/`SessionEnd`-hook MUST de configuratie lezen en niets doen als
`capture.sessies` uitstaat. Staat het aan, dan MUST hij uitsluitend naar
`sessies-<jaar>.jsonl` schrijven. De hook MUST NOT het grootboek benaderen.

#### Scenario: capture staat uit

- **GIVEN** een configuratie met `capture.sessies: false`
- **WHEN** een Claude Code-sessie start en eindigt
- **THEN** wordt er geen sessiebestand aangemaakt of gewijzigd

#### Scenario: geen configuratie aanwezig

- **GIVEN** een project zonder `.wbso/config.json`
- **WHEN** een sessie start
- **THEN** doet de hook niets en faalt hij stil, zonder foutmelding aan de gebruiker
