# ADR-04 — Distributie als plugin, alles in het Nederlands

- **Status:** Geaccepteerd (10 augustus 2026) — *taalkeuze diezelfde dag herzien,
  zie Herziening onderaan*
- **Beslisser:** Jacky
- **Raakt:** repo-indeling, `.claude-plugin/`, README, alle skillteksten

## Context

De WBSO is per definitie Nederlands: alleen Nederlandse inhoudingsplichtigen
kunnen hem aanvragen. Het publiek is dus honderd procent Nederlandstalig. Daar
staat tegenover dat marketplaces, README's en broncode in de Claude
Code-wereld doorgaans Engelstalig zijn.

Daarnaast: een gebruiker kan per marketplace-naam maar één marketplace
registreren. De naamkeuze is lastig terug te draaien zodra anderen hem hebben
toegevoegd.

## Beslissing

**Distributie.** Repo `AiOpsCommunity/wbso`, met `.claude-plugin/marketplace.json`
en de plugin zelf beide in de root. Installeren:

```
/plugin marketplace add AiOpsCommunity/wbso
/plugin install wbso@wbso
```

De manifesten worden pas toegevoegd zodra er iets installeerbaars staat. Een
marketplace die naar een lege plugin wijst levert alleen teleurgestelde
gebruikers op.

**Taal: alles Nederlands.** README, documentatie, ADR's, skillteksten,
plugin-metadata, commit-berichten en code-commentaar. RVO-terminologie wordt
uiteraard letterlijk gebruikt — *mededeling*, *S&O-verklaring*,
*afdrachtvermindering*, *inhoudingsplichtige* — zodat de gebruiker de begrippen
herkent in het eLoket-formulier.

Bezwaren die zijn afgewogen en geaccepteerd: de repo valt taalkundig uit de toon
in een Engelstalige marketplace, en de drempel voor niet-Nederlandstalige
bijdragers wordt hoger. Beide wegen niet op tegen consistentie voor een publiek
dat volledig Nederlandstalig is — een niet-Nederlandstalige bijdrager kan de
regeling zelf niet gebruiken, en het product ook niet.

## Afgewogen alternatieven

- **Code en docs Engels, interactie Nederlands.** Aanvankelijk gekozen, dezelfde
  dag herzien. In de praktijk levert dat een repo op waarin de grens tussen beide
  talen voortdurend bewaakt moet worden, terwijl er niemand is die baat heeft bij
  de Engelse helft.
- **Alles Engels.** Dwingt vertalingen af voor begrippen die geen equivalent
  hebben, precies waar precisie telt.
- **Community-brede marketplace** (`AiOpsCommunity/claude-plugins`, marketplace
  `aiops`, WBSO als eerste van meerdere plugins). Beter schaalbaar als de
  community later meer uitbrengt, maar minder vindbaar op naam. Afgewezen ten
  gunste van een herkenbare, op zichzelf staande repo.

## Gevolgen

- **+** Vindbaar op naam; installatie is twee regels.
- **+** Eén taal, geen grens om te bewaken, geen vertaalverlies op RVO-begrippen.
- **−** Elke volgende community-plugin in een eigen repo wordt een aparte
  marketplace die gebruikers los moeten toevoegen. Wordt dat bezwaarlijk, dan is
  de uitweg een overkoepelende marketplace die via een `github`-source naar deze
  repo verwijst; bestaande installaties blijven dan werken.
- **−** Minder vindbaar voor wie in het Engels zoekt. Aanvaard: wie in het Engels
  naar dit onderwerp zoekt, is vrijwel zeker niet WBSO-plichtig.

## Herziening (10 augustus 2026)

De oorspronkelijke beslissing was een taalsplitsing: code, README en
plugin-metadata in het Engels, skillteksten in het Nederlands. Jacky heeft dat
diezelfde dag herzien ten gunste van volledig Nederlands, vóór er iets was
geïmplementeerd. Vastgelegd omdat de afweging terugkomt zodra iemand voorstelt
de repo "internationaal toegankelijk" te maken: dat is overwogen en bewust niet
gedaan.
