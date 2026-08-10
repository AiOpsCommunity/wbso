# Het grootboek

De urenregistratie staat in `uren-<jaar>.jsonl`: één regel per boeking, één
bestand per kalenderjaar. Je leest en bewerkt dit bestand normaal gesproken niet
zelf — `/wbso:dag` schrijft erin, `/wbso:check` en `/wbso:mededeling` lezen eruit.

Deze pagina legt uit wat er staat en waarom het zo werkt, zodat je bij een
controle kunt uitleggen wat je administratie waard is.

## De tien-werkdagenregel

De WBSO eist dat je S&O-uren **binnen tien werkdagen** vastlegt. Achteraf
reconstrueren mag niet. Bij een controle is dat niet een detail maar de
kernvraag: niet alleen *wat* je hebt geboekt, maar of je het *tijdig* hebt
vastgelegd.

Een gewone urentabel kan die vraag principieel niet beantwoorden. Als een regel
overschreven kan worden, bewijst de inhoud ervan niets over het moment van
vastleggen.

Daarom draagt elke boeking twee datums:

```jsonc
{
  "id": "b3f1…",
  "datum": "2026-09-02",                    // wanneer je werkte
  "geregistreerd_op": "2026-09-03T18:22:04Z", // wanneer je het vastlegde
  "uren": 7,
  "soort": "sao",
  "project": "verifieerbaarheid",
  "omschrijving": "Formaatnormalisatie van bedragen en datums",
  "ref": "knelpunt 1"
}
```

Het verschil tussen die twee ís het bewijs. `geregistreerd_op` wordt door de
tool gezet en kan niet worden meegegeven — anders zou het geen bewijs meer
zijn, maar een invoerveld.

`/wbso:check` rekent per boeking het aantal werkdagen uit en meldt overschrijding.
De telling houdt geen rekening met Nederlandse feestdagen; daardoor waarschuwt de
tool eerder een dag te vroeg dan een dag te laat.

## Corrigeren zonder te overschrijven

Het grootboek is **append-only**. Er is geen wijzig- of verwijderfunctie, ook niet
intern. Corrigeren gebeurt door een regel toe te voegen die naar de oude verwijst:

```jsonc
// oorspronkelijk
{"id":"b1","datum":"2026-09-02","uren":7,"soort":"sao","project":"alfa","omschrijving":"Werk", …}

// bijgesteld naar 5 uur — b1 telt niet meer mee, b2 wel
{"id":"b2","corrigeert":"b1","datum":"2026-09-02","uren":5,"soort":"sao","project":"alfa", …}

// of ingetrokken, bijvoorbeeld omdat het achteraf routinewerk bleek
{"id":"b3","corrigeert":"b2","datum":"2026-09-02","ingetrokken":true,"omschrijving":"Bleek routinewerk", …}
```

Een correctie **vervangt de hele boeking**: velden die je niet meegeeft, zijn
daarna weg. Een al gecorrigeerde regel kun je niet nog eens corrigeren; je
corrigeert de meest recente versie.

Bij het optellen worden correcties eerst toegepast en pas daarna geteld. Alle
regels bij elkaar optellen zou gecorrigeerde uren dubbel tellen.

Kies je bij init voor `meegecommit`, dan levert je git-historie hier een tweede,
onafhankelijk gedateerd spoor bovenop.

## Waarnemingen zijn geen boekingen

Staat `capture.sessies` aan, dan schrijft de sessie-hook naar een **apart**
bestand: `sessies-<jaar>.jsonl`. Daar staat wanneer je aan het werk was — niet
hoeveel S&O-uren je hebt gemaakt.

Die scheiding is opzettelijk. Sessieduur is geen S&O-tijd: hij bevat pauzes,
bevat werk dat niet kwalificeert, en mist het denkwerk dat buiten de editor
gebeurt. De hook kan het grootboek niet bereiken, en dat is met een test
vastgelegd.

Zie [ADR-01](adr/ADR-01-registratie-integriteit.md) en
[ADR-02](adr/ADR-02-tool-stelt-voor.md) voor de volledige afweging.
