# Taken — wbso-plugin-mvp

> Volgorde: eerst de deterministische kern (`bin/wbso`) met tests, dan pas de
> skills die hem aanroepen. De skills zijn zonder werkende kern niet te testen.

## 1. Fundament

- [x] 1.1 `package.json` met `type: module`, testscript op `node --test`, geen runtime-dependencies
- [x] 1.2 `bin/wbso` als uitvoerbare Node-entry met subcommando-router en `--json`-uitvoer
- [x] 1.3 `resolve-root`: bepaal de opslagwortel uit de config (`meegecommit` / `lokaal` / `buiten`), met tests op alle drie de varianten
- [x] 1.4 Config lezen en valideren tegen een schema; duidelijke fout bij ontbrekende of onbekende velden

## 2. Grootboek

- [x] 2.1 `append`: schrijf één JSONL-regel met `geregistreerd_op` gezet door het script, nooit door de aanroeper
- [x] 2.2 Weiger boekingen buiten de aanvraagperiode en buiten het kalenderjaar van het grootboek
- [x] 2.3 Weiger `sao`-boekingen met onbekend project-id of lege omschrijving
- [x] 2.4 Correctieregels: `corrigeert`-veld, verwijzing naar een bestaande regel, weiger een correctie op een al gecorrigeerde regel
- [x] 2.5 Lezer die correcties toepast en de effectieve boekingen teruggeeft; tests op bijstellen, intrekken en een keten van twee correcties
- [x] 2.6 Test dat geen enkel codepad een bestaande regel wijzigt of verwijdert

## 3. Validatie en totalen

- [x] 3.1 `validate`: datumformaat, uren positief, soort, project-verwijzing, periode, jaargrens — met regelnummer per bevinding
- [x] 3.2 Werkdagenberekening (ma–vr, geen feestdagen) met tests op weekendgrenzen en jaarwisseling
- [x] 3.3 Tien-werkdagencontrole: te laat geregistreerde boekingen, plus werkdagen zonder boeking die de grens naderen
- [x] 3.4 `totals`: per maand, per project, S&O-aandeel, resterend tot het aangevraagde aantal, en signaal bij overschrijding
- [x] 3.5 Niet-nul exitcode bij validatiefouten
- [x] 3.6 `export`: CSV met de effectieve boekingen van een jaar
- [x] 3.7 `seed/wbso-uren.mjs` verwijderen zodra de logica hier volledig gedekt is

## 4. Skill `/wbso:init`

- [x] 4.1 Skillstructuur `skills/init/SKILL.md`, Nederlandstalige interactie
- [x] 4.2 De vijf kernvragen; opslaglocatie met uitleg wat `lokaal` en `buiten` aan bewijskracht opgeven
- [x] 4.3 Projecten voorstellen uit ADR's, README, `docs/` en recente commits, met terugval als die ontbreken
- [x] 4.4 Afbakening voorstellen uit gedetecteerde mappen, met reden per vermelding; lege afbakening weigeren
- [x] 4.5 `verklaringnummer` leeg laten; `/wbso:init <jaar>` voegt een aanvraagblok toe zonder bestaande jaren te raken
- [x] 4.6 Bij `lokaal`: `.gitignore`-regel toevoegen

## 5. Skill `/wbso:dag`

- [x] 5.1 Skillstructuur, optionele datum als argument
- [x] 5.2 Commits van de dag ophalen en groeperen tot samenhangende brokken werk
- [x] 5.3 Boekingen voorstellen met uren, project, soort en omschrijving; uren expliciet benoemen als startpunt, niet als meting
- [x] 5.4 Afbakeningslijst tonen bij het voorstel; matchend werk aanbieden als `overig` met reden, overrulebaar
- [x] 5.5 Terugval zonder commits: rechtstreeks uitvragen, niets verzinnen
- [x] 5.6 Pas na expliciete bevestiging `append` aanroepen; afbreken laat het grootboek ongemoeid
- [x] 5.7 Corrigeren van een eerdere boeking vanuit dezelfde skill

## 6. Skills `/wbso:check` en `/wbso:mededeling`

- [x] 6.1 `/wbso:check`: `validate` en `totals` aanroepen en in Nederlands proza presenteren
- [x] 6.2 Herinnering aan een ontbrekend `verklaringnummer`
- [x] 6.3 `/wbso:mededeling <jaar>`: jaartotalen per project, overzicht van wat in het eLoket moet, CSV-export
- [x] 6.4 Waarschuwing bij afwijking tussen gerealiseerde en aangevraagde uren, met het gevolg erbij
- [x] 6.5 Rapport weigeren zolang er validatiefouten openstaan

## 7. Sessie-hook

- [x] 7.1 `hooks/session.mjs`: config lezen, direct stoppen als `capture.sessies` uitstaat of config ontbreekt
- [x] 7.2 `hooks/hooks.json` met `SessionStart` en `SessionEnd`
- [x] 7.3 Eén regel per gebeurtenis naar `sessies-<jaar>.jsonl`
- [x] 7.4 Test dat de hook geen enkele verwijzing naar het grootboek bevat

## 8. Plugin-manifest en publicatie

- [x] 8.1 `.claude-plugin/plugin.json` (naam `wbso`, Nederlandstalige metadata)
- [x] 8.2 `.claude-plugin/marketplace.json` met de plugin in de repo-root
- [ ] 8.3 Lokaal testen met `claude --plugin-dir .` tegen een testproject *(door Jacky — vraagt een eigen sessie)*
- [x] 8.4 `claude plugin validate .` schoon
- [x] 8.5 README bijwerken: status van "design phase" naar installatie-instructies

## 9. Documentatie

- [x] 9.1 Voorbeeldconfiguratie en een geannoteerd voorbeeldgrootboek in `docs/`
- [x] 9.2 Korte uitleg van de tien-werkdagenregel en waarom de tool zo werkt, met verwijzing naar ADR-01 en ADR-02
- [x] 9.3 Disclaimer prominent in README en in de uitvoer van `/wbso:mededeling`
