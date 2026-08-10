# ADR-01 — Append-only grootboek met dubbele datum

- **Status:** Geaccepteerd (10 augustus 2026)
- **Beslisser:** Jacky
- **Raakt:** het grootboek, `/wbso:dag`, `/wbso:check`

## Context

De WBSO eist dat S&O-uren **binnen tien werkdagen** worden vastgelegd. Bij een
controle door RVO is dat geen bijzaak maar de kernvraag: niet alleen *wat* je
hebt geboekt, maar of je het *tijdig* hebt vastgelegd. Achteraf reconstrueren is
precies wat de regeling uitsluit.

Een gewone urenregistratie — een tabel die je bijwerkt — kan die vraag principieel
niet beantwoorden. Als een regel overschreven kan worden, bewijst de inhoud ervan
niets over het moment van vastleggen.

## Beslissing

Het grootboek is **append-only** en elke boeking draagt **twee datums**:

```jsonc
{"datum":"2026-03-02","geregistreerd_op":"2026-03-03T18:22:04Z", …}
```

- `datum` — wanneer het werk is verricht
- `geregistreerd_op` — wanneer de boeking is vastgelegd

Het verschil tussen die twee ís het bewijs voor de tien-werkdageneis.

Een correctie is daarom **een nieuwe regel die naar de oude verwijst**, nooit een
bewerking van de oude. Wie regels overschrijft wist zijn eigen bewijs.

Formaat: JSONL, één regel per boeking, één bestand per kalenderjaar. Dat laatste
volgt de regeling — een S&O-verklaring loopt nooit over de jaargrens.

## Afgewogen alternatieven

- **CSV die je bijwerkt** (de eerste versie van deze tool). Leesbaar en
  bewerkbaar in een spreadsheet, maar biedt geen enkele waarborg over het moment
  van vastleggen. Afgewezen op de kernvraag.
- **SQLite.** Betere queries, maar een binair bestand diff't niet in git en is
  daarmee ongeschikt voor het tweede bewijsspoor (zie Gevolgen).
- **Alleen `datum`, geen registratiemoment.** Simpeler, maar dan kan de tool de
  tien-werkdagenregel niet bewaken en de gebruiker hem niet aantonen.

## Gevolgen

- **+** De tien-werkdagenvraag is beantwoordbaar uit de data zelf.
- **+** Wordt het grootboek meegecommit, dan levert de git-historie een tweede,
  onafhankelijk gedateerd spoor bovenop `geregistreerd_op`.
- **−** Niemand leest JSONL rauw. `/wbso:check` en `/wbso:mededeling` moeten het
  renderen, en er moet een CSV-export zijn voor de boekhouder.
- **−** Correctieregels maken het optellen ingewikkelder dan een simpele som:
  de teller moet correcties toepassen in plaats van alle regels bij elkaar op te
  tellen. Dit is de belangrijkste plek om te testen.
