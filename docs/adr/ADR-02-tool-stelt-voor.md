# ADR-02 — De tool stelt voor, de gebruiker verklaart

- **Status:** Geaccepteerd (10 augustus 2026)
- **Beslisser:** Jacky
- **Raakt:** `/wbso:dag`, de sessie-hook, de bestandsindeling

## Context

Het ligt voor de hand om urenregistratie te automatiseren: een Claude
Code-sessie weet wanneer hij begon en eindigde, welke bestanden zijn aangeraakt
en welke commits eruit voortkwamen. Daaruit uren afleiden en wegschrijven is
technisch triviaal.

Het is ook precies het verkeerde product. Sessieduur is geen S&O-tijd:

- hij bevat pauzes, overleg en onderbrekingen;
- hij bevat werk dat niet kwalificeert — CI repareren, een marketingpagina
  bijwerken, een dependency bumpen;
- hij mist het S&O-werk dat buiten de editor gebeurt: nadenken over een
  technisch knelpunt, literatuur lezen, een ontwerp op papier uitwerken.

Een registratie moet een waarheidsgetrouwe vastlegging zijn van tijd die
daadwerkelijk aan S&O is besteed. Een tool die stilzwijgend sessietijd wegschrijft
levert geen registratie op maar een aansprakelijkheidsrisico bij een controle —
en de gebruiker merkt dat pas op het slechtst denkbare moment.

## Beslissing

De tool mag **uitsluitend een concept voorstellen** dat de gebruiker bevestigt
of corrigeert. Er is geen pad waarlangs een boeking in het grootboek komt zonder
menselijke bevestiging.

Dit wordt structureel afgedwongen, niet met een waarschuwing in de documentatie:

1. **Waarnemingen en claims staan in gescheiden bestanden.**
   `sessies-<jaar>.jsonl` bevat wat de tool zag. `uren-<jaar>.jsonl` bevat wat
   de gebruiker heeft verklaard. De hook schrijft nooit in het grootboek.
2. **De hook is opt-in** (`capture.sessies`) en staat standaard uit.
3. **`/wbso:dag` presenteert de voorgestelde uren expliciet als startpunt**, met
   de vermelding dat commits niets zeggen over denkwerk zonder commit.

## Gevolgen

- **+** De registratie blijft van de gebruiker; de tool is geheugensteun, geen
  meetinstrument. Dat is uitlegbaar aan een controleur.
- **+** De scheiding tussen de twee bestanden maakt het onderscheid inspecteerbaar
  in plaats van een belofte.
- **−** Dagelijkse handeling vereist: wie `/wbso:dag` een week laat liggen, moet
  alsnog reconstrueren. De tool kan dat signaleren (ADR-01) maar niet voorkomen.
- **−** De plugin zal minder "magisch" aanvoelen dan een tool die alles vanzelf
  bijhoudt. Dat is de bedoeling, en de README legt uit waarom.
