## Context

Zie `proposal.md` — Why. De architectuurbesluiten zijn vastgelegd in
`docs/adr/ADR-01` t/m `ADR-04`; dit document beschrijft hoe ze samen tot een
werkende plugin leiden.

Randvoorwaarden die de vorm bepalen:

- Een Claude Code-plugin bestaat uit skills (markdown-instructies), optionele
  hooks en optionele executables. Skills zijn geen code: ze sturen het model.
- Alle deterministische logica — parsen, correcties toepassen, valideren,
  optellen, werkdagen tellen — hoort daarom in een script dat de skill aanroept,
  niet in de skilltekst. Een model dat zelf uren optelt is een rekenfout die je
  pas bij de controle ontdekt.
- De plugin draait op de machine van de gebruiker, zonder netwerk en zonder
  server. Geen build-stap: Node's ingebouwde modules volstaan.

## Goals / Non-Goals

**Goals:**

- Deterministische logica strikt gescheiden van modelgestuurde interactie.
- Eén plek waar het grootboek gelezen en geschreven wordt, zodat de append-only
  garantie (ADR-01) op één plek afdwingbaar is.
- De opslagmap (ADR-03) is één keer opgelost; geen enkele skill kent de keuze.

**Non-Goals:**

- Geen abstractielaag voor andere subsidieregelingen. De WBSO is de enige
  doelgroep; generaliseren zonder tweede geval levert de verkeerde abstractie op.
- Geen eigen CLI-distributie los van de plugin.

## Decisions

**Alle logica in `bin/wbso`, skills roepen het aan.**
Eén Node-executable met subcommando's (`resolve-root`, `append`, `validate`,
`totals`, `export`). Skills voeren dat uit en interpreteren de JSON-uitvoer.
Alternatief was logica in de skilltekst laten — verworpen omdat een model geen
betrouwbare optelmachine is en de tien-werkdagenberekening exact moet zijn.
Bijkomend voordeel: de logica is testbaar zonder Claude.

**JSON in, JSON uit.** `bin/wbso` schrijft machineleesbare uitvoer; de skill
maakt er Nederlands proza van. Zo blijft de presentatie aanpasbaar zonder de
logica te raken, en kan hetzelfde script in CI of met de hand draaien.

**Append is de enige schrijfoperatie.** Er is geen `update` of `delete`
subcommando. Corrigeren gebeurt via `append` met een `corrigeert`-veld. Dat maakt
ADR-01 structureel afdwingbaar in plaats van een afspraak.

**Correcties worden bij het lezen toegepast, niet bij het schrijven.**
`totals` en `validate` bouwen eerst een beeld op waarin elke correctie zijn
voorganger vervangt, en rekenen daarna. Alternatief — een momentopname
bijhouden — verworpen: dat introduceert een tweede waarheid die kan afwijken van
het grootboek.

**Werkdagen tellen zonder feestdagenkalender.** De tien-werkdagengrens telt
maandag t/m vrijdag en negeert Nederlandse feestdagen. Een feestdagenkalender
zou de grens hooguit een dag verschuiven, en de tool waarschuwt liever een dag
te vroeg dan een dag te laat. Dit wordt in de uitvoer benoemd.

**De hook is een apart, minimaal script.** `hooks/session.mjs` leest de config,
stopt direct als capture uitstaat, en schrijft één regel. Hij deelt geen code met
`bin/wbso` om te garanderen dat er geen pad bestaat waarlangs hij het grootboek
raakt (ADR-02).

## Risks / Trade-offs

- **Het model schat de uren in het dagvoorstel** → de uren zijn expliciet een
  startpunt, de skill zegt dat erbij, en niets komt in het grootboek zonder
  bevestiging. De correctheid van de *administratie* hangt af van de gebruiker;
  de correctheid van de *berekeningen* is deterministisch getest.
- **Afbakeningsherkenning is heuristisch** → een gemiste match betekent dat werk
  als S&O wordt voorgesteld terwijl het dat niet is. Mitigatie: de skill toont
  altijd de afbakeningslijst bij het voorstel, zodat de gebruiker zelf toetst.
  Bewust geen belofte van volledigheid in de documentatie.
- **Groeiend grootboek wordt elke keer volledig gelezen** → bij enkele duizenden
  regels per jaar is dat verwaarloosbaar. Geen index, geen cache.
- **Drie opslagvarianten** → één `resolve-root` met tests op alle drie; skills
  raken de keuze verder niet aan.

## Migration Plan

Niet van toepassing: nieuw project, geen bestaande gebruikers. Het bestaande
`seed/wbso-uren.mjs` gaat op in `bin/wbso` en wordt daarna verwijderd.

De `.claude-plugin/`-manifesten worden pas toegevoegd als de skills werken
(ADR-04), zodat er nooit een installeerbare maar lege plugin in de marketplace
staat.

## Open Questions

- Of `/wbso:dag` naast commits ook ongecommitte wijzigingen moet meewegen. Raakt
  de specs niet en is later toe te voegen.
- Of de CSV-export een vaste kolomvolgorde moet hebben die aansluit op een
  gangbaar boekhoudpakket. Te bepalen zodra er een boekhouder meekijkt.
