# configuratie (delta)

## ADDED Requirements

### Requirement: Init vult de configuratie in vier lagen

`/wbso:init` MUST een `config.json` opleveren zonder de gebruiker een lang
formulier voor te leggen. Het MUST precies vijf kernwaarden uitvragen
(aanvraagperiode, aangevraagde uren, tarief, forfait of werkelijke kosten,
opslaglocatie), de S&O-projecten en de afbakening **voorstellen** op basis van de
repo, en waarden die op dat moment nog onbekend zijn leeg laten.

#### Scenario: eerste opzet

- **GIVEN** een project zonder `.wbso/`
- **WHEN** de gebruiker `/wbso:init` draait
- **THEN** worden vijf vragen gesteld, worden projecten en afbakening voorgesteld
  ter correctie, en staat er daarna een geldige `config.json`

#### Scenario: verklaringnummer nog onbekend

- **GIVEN** een aanvraag die nog niet is toegekend
- **WHEN** init de configuratie schrijft
- **THEN** blijft `verklaringnummer` leeg en meldt `/wbso:check` dat het nog moet
  worden ingevuld

### Requirement: Init stelt projecten voor uit de repo

`/wbso:init` MUST de repo lezen (ADR's, README, `docs/`, recente commits) en
daaruit een projectindeling met technische knelpunten voorstellen. Die
voorstellen MUST bedoeld zijn als configuratielabels waaraan boekingen worden
opgehangen, en de skill MUST expliciet vermelden dat het geen tekst is die bij
RVO wordt ingediend.

#### Scenario: repo zonder documentatie

- **GIVEN** een project zonder ADR's of docs
- **WHEN** init projecten voorstelt
- **THEN** valt het terug op recente commits en vraagt het de gebruiker de
  projectindeling zelf op te geven

### Requirement: Afbakening mag niet leeg zijn

De configuratie MUST een `afbakening` bevatten met ten minste één vermelding.
`/wbso:init` MUST een voorstel doen op basis van gedetecteerde mappen
(marketingsite, CI-configuratie, auth-pakketten, infrastructuur) met per
vermelding een korte reden, en MUST een lege afbakening weigeren.

#### Scenario: gebruiker slaat de afbakening over

- **GIVEN** een gebruiker die de voorgestelde afbakening helemaal leegmaakt
- **WHEN** init de configuratie wil wegschrijven
- **THEN** weigert init en legt uit dat een lege afbakening betekent dat álles als
  S&O wordt aangeboden

### Requirement: Init is her-uitvoerbaar per kalenderjaar

`/wbso:init <jaar>` MUST een aanvraagblok voor dat jaar toevoegen zonder
bestaande jaren te wijzigen. Bestaat het jaar al, dan MUST de skill vragen of het
overschreven of aangevuld moet worden.

#### Scenario: nieuwe aanvraag voor volgend jaar

- **GIVEN** een configuratie met een aanvraag voor 2026
- **WHEN** de gebruiker `/wbso:init 2027` draait
- **THEN** komt er een aanvraagblok voor 2027 bij en blijft 2026 ongewijzigd

### Requirement: Opslaglocatie is een bewuste keuze

`/wbso:init` MUST de opslaglocatie vragen met `meegecommit` als standaard, en
MUST bij de vraag toelichten wat `lokaal` en `buiten` opgeven aan bewijskracht.
De bestandsindeling MUST identiek zijn ongeacht de keuze; alleen de wortel
verschilt.

#### Scenario: teamrepo

- **GIVEN** een gebruiker die zijn uren niet met collega's wil delen
- **WHEN** hij `lokaal` kiest
- **THEN** komt `.wbso/` in het project met een `.gitignore`-regel, en meldt init
  dat het git-bewijsspoor daarmee vervalt
