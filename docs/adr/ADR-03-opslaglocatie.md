# ADR-03 — Opslaglocatie is een keuze bij init

- **Status:** Geaccepteerd (10 augustus 2026)
- **Beslisser:** Jacky
- **Raakt:** `/wbso:init`, de bestandsindeling

## Context

Het grootboek meecommitten naar git levert een onafhankelijk gedateerd spoor op
bovenop `geregistreerd_op` (ADR-01): niet alleen de tool zegt wanneer je hebt
geregistreerd, ook de repo-historie. Voor een controle is dat aanzienlijk sterker
bewijs dan een bestand dat op één machine staat.

Maar dezelfde eigenschap is in andere situaties onwenselijk. In een teamrepo zien
collega's je uren; in een publieke repo ziet iedereen ze. En er zijn repo's waar
een gebruiker simpelweg niets mag toevoegen.

Er is geen keuze die voor alle gebruikers goed is, en de tool kan niet raden in
welke situatie hij draait.

## Beslissing

`/wbso:init` vraagt de opslaglocatie, met **meegecommit als standaard**:

| Keuze | Wortel | Gevolg |
|---|---|---|
| `meegecommit` (standaard) | `.wbso/` in het project | Git-historie als tweede bewijsspoor |
| `lokaal` | `.wbso/` + `.gitignore`-regel | Privé; geen git-spoor, eigen back-up nodig |
| `buiten` | `~/.wbso/<projectnaam>/` | Werkt in repo's waar niets toegevoegd mag worden |

De **indeling binnen die wortel is identiek** in alle drie de gevallen. Skills
lossen de wortel één keer op en werken daarna met dezelfde relatieve paden; geen
enkele skill kent de keuze verder.

`/wbso:init` legt bij de vraag uit wat je met `lokaal` en `buiten` opgeeft, zodat
de keuze bewust is en niet per ongeluk het sterkste bewijsmiddel weggooit.

## Gevolgen

- **+** Bruikbaar in solo-, team- en publieke repo's zonder de gebruiker te
  dwingen zijn uren te delen.
- **+** Eén abstractie (de wortel) in plaats van drie codepaden.
- **−** Drie varianten om te documenteren en te testen.
- **−** Bij `buiten` raakt de registratie los van de code waarover hij gaat; een
  hernoemde projectmap breekt de koppeling. `/wbso:check` moet daarop wijzen.
