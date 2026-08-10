# configuratie (delta)

## ADDED Requirements

### Requirement: Init vult de configuratie in vier lagen

`/wbso:init` MUST een `config.json` opleveren zonder de gebruiker een lang
formulier voor te leggen. Het MUST precies vier kernwaarden uitvragen
(aanvraagperiode, aangevraagde uren, tarief, forfait of werkelijke kosten), de
S&O-projecten en de afbakening **voorstellen** op basis van de repo, en waarden
die op dat moment nog onbekend zijn leeg laten.

#### Scenario: eerste opzet

- **GIVEN** een project zonder `.wbso/`
- **WHEN** de gebruiker `/wbso:init` draait
- **THEN** worden vier vragen gesteld, worden projecten en afbakening voorgesteld
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

### Requirement: Opslaglocatie wordt vermeld, niet gevraagd

`/wbso:init` MUST `meegecommit` als opslaglocatie gebruiken zonder ernaar te
vragen, en MUST die keuze aan de gebruiker melden met de reden en de manier om
hem te wijzigen. De bestandsindeling MUST identiek zijn ongeacht de keuze; alleen
de opslagmap verschilt.

#### Scenario: standaard zonder vraag

- **GIVEN** een project zonder `.wbso/`
- **WHEN** de gebruiker `/wbso:init` doorloopt
- **THEN** wordt er niet naar de opslaglocatie gevraagd, en meldt init waar de
  registratie komt te staan en hoe dat te wijzigen is

#### Scenario: teamrepo

- **GIVEN** een gebruiker die zijn uren niet met collega's wil delen
- **WHEN** hij daarom vraagt om `lokaal`
- **THEN** komt `.wbso/` in het project met een `.gitignore`-regel, en meldt init
  dat het git-bewijsspoor daarmee vervalt

#### Scenario: aanwijzing dat meelezen onwenselijk is

- **GIVEN** een repo met meerdere auteurs in de git-historie
- **WHEN** init de opslaglocatie meldt
- **THEN** wijst hij er actief op dat collega's de uren zullen zien en biedt hij
  de alternatieven aan
