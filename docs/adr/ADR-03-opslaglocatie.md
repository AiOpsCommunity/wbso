# ADR-03 — Opslaglocatie is een vermelde standaard, geen vraag

- **Status:** Geaccepteerd (10 augustus 2026) — *diezelfde dag herzien na de
  eerste praktijktest, zie Herziening onderaan*
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

`/wbso:init` **vermeldt** de opslaglocatie en vraagt er niet naar. De standaard is
`meegecommit`; de gebruiker hoort waar zijn registratie komt te staan, waarom, en
hoe hij het anders kan krijgen — maar het kost hem geen vraag om te beantwoorden:

| Keuze | Opslagmap | Gevolg |
|---|---|---|
| `meegecommit` (standaard) | `.wbso/` in het project | Git-historie als tweede bewijsspoor |
| `lokaal` | `.wbso/` + `.gitignore`-regel | Privé; geen git-spoor, eigen back-up nodig |
| `buiten` | `~/.wbso/<projectnaam>/` | Werkt in repo's waar niets toegevoegd mag worden |

De **indeling binnen die opslagmap is identiek** in alle drie de gevallen. Skills
lossen de opslagmap één keer op en werken daarna met dezelfde relatieve paden; geen
enkele skill kent de keuze verder.

Ziet init aanwijzingen dat meelezen onwenselijk is — meerdere auteurs in de
git-historie, een publieke remote — dan noemt hij dat actief, in plaats van te
wachten tot de gebruiker eraan denkt. Dat vangt het geval af waarin de standaard
schadelijk uitpakt, zonder iedereen een vraag op te leggen.

## Gevolgen

- **+** Bruikbaar in solo-, team- en publieke repo's zonder de gebruiker te
  dwingen zijn uren te delen.
- **+** Eén abstractie (de opslagmap) in plaats van drie codepaden.
- **−** Drie varianten om te documenteren en te testen.
- **−** Bij `buiten` raakt de registratie los van de code waarover hij gaat; een
  hernoemde projectmap breekt de koppeling. `/wbso:check` moet daarop wijzen.

## Herziening (10 augustus 2026)

Oorspronkelijk vroeg `/wbso:init` de opslaglocatie als vijfde kernvraag. Bij de
eerste praktijktest bleek die vraag in het gesprek niet naar voren te komen — de
opzet voelde als vier vragen — en Jacky's oordeel was dat vier ook het maximum
moet zijn.

Dat is een goede uitkomst met een slechte oorzaak: als een gestelde vraag stil
kan wegvallen, is de instructie niet dwingend genoeg. In plaats van hem
dwingender te maken is de vraag geschrapt. Waar een verstandige standaard
bestaat, is vermelden beter dan vragen: de gebruiker houdt zijn keuze, maar
betaalt er geen aandacht voor.

De opzet is daarmee bewust asymmetrisch. De vier overgebleven vragen hebben geen
verdedigbare standaard — periode, uren, tarief en de forfaitkeuze kan niemand
voor je invullen. De opslaglocatie wel.
