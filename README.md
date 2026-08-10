# wbso

Een Claude Code-plugin voor het bijhouden van S&O-uren voor de **WBSO** (Wet
Bevordering Speur- en Ontwikkelingswerk).

> **Status: ontwerpfase.** Het ontwerp ligt vast, de plugin is nog niet gebouwd
> en dus nog niet te installeren. Zie
> [de change](openspec/changes/wbso-plugin-mvp/proposal.md) en de
> [architectuurbesluiten](docs/adr/).

## Wat het gaat doen

De WBSO eist dat je S&O-uren **binnen tien werkdagen** vastlegt, herleidbaar naar
een S&O-project en gescheiden van werk dat niet kwalificeert. Dat handmatig
bijhouden is vervelend genoeg dat mensen het uitstellen — en achteraf
reconstrueren is precies wat de regeling uitsluit. Wie zijn registratie niet op
orde heeft, verliest bij een controle uren die hij wél heeft gemaakt.

Als je met Claude Code werkt heb je tegelijk een ongebruikte geheugensteun
liggen: je commits zijn een gedateerd logboek van wat je die dag hebt gedaan. Dat
maakt het invullen van je registratie een korte dagelijkse bevestiging in plaats
van een klus.

| Commando | Waarvoor |
| :-- | :-- |
| `/wbso:init` | Project opzetten: periode, aangevraagde uren, tarief, S&O-projecten en de afbakeningslijst |
| `/wbso:dag` | Dagboeking — stelt boekingen voor uit je commits, jij bevestigt |
| `/wbso:check` | Validatie en totalen, inclusief de tien-werkdagenregel |
| `/wbso:mededeling` | Het maartrapport voor RVO, plus een CSV-export voor je boekhouder |

## Het ontwerpprincipe

**De machine stelt voor, jij verklaart.**

Uren worden nooit automatisch geboekt. Sessieduur is geen S&O-tijd: hij bevat
pauzes, bevat werk dat niet kwalificeert, en mist het denkwerk dat buiten de
editor gebeurt. Een tool die stilzwijgend sessietijd wegschrijft als S&O-uren
levert geen registratie op maar een aansprakelijkheidsrisico bij een controle.

De plugin doet daarom nooit meer dan een concept voorstellen dat jij bevestigt of
corrigeert. Waarnemingen (wat de machine zag) en claims (wat jij hebt verklaard)
staan in gescheiden bestanden, en het grootboek is append-only: een correctie is
een nieuwe regel die naar de oude verwijst, nooit een bewerking. Regels
overschrijven zou juist het bewijs wissen dat de regeling van je vraagt.

Zie [ADR-01](docs/adr/ADR-01-registratie-integriteit.md) en
[ADR-02](docs/adr/ADR-02-machine-stelt-voor.md).

## Taal

Alles in het Nederlands: documentatie, code, commando's en commit-berichten. De
WBSO is een Nederlandse regeling en het publiek is dat dus ook. RVO-terminologie
wordt letterlijk gebruikt, zodat de begrippen aansluiten op het eLoket-formulier.
Zie [ADR-04](docs/adr/ADR-04-distributie-en-taal.md).

## Disclaimer

Dit is gereedschap voor je eigen administratie. Het is **geen fiscaal advies**.
Wat je bij RVO indient, en of de uren die je registreert waarheidsgetrouw zijn en
als S&O kwalificeren, blijft volledig je eigen verantwoordelijkheid. Twijfel je,
raadpleeg dan je boekhouder of een WBSO-adviseur.

## Licentie

MIT
