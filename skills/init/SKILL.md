---
description: Zet de WBSO-urenregistratie op in dit project — aanvraagperiode, uren, tarief, S&O-projecten en de afbakening. Gebruik dit als er nog geen .wbso/config.json is, of om een aanvraagblok voor een nieuw kalenderjaar toe te voegen.
---

# WBSO-registratie opzetten

Je zet de configuratie op voor de WBSO-urenregistratie. Argument is optioneel:
`$ARGUMENTS` bevat een kalenderjaar als de gebruiker er een meegaf, anders gaat
het om het huidige jaar.

**Praat Nederlands.** Gebruik RVO-termen letterlijk (S&O-verklaring,
afdrachtvermindering, mededeling, inhoudingsplichtige), zodat de gebruiker ze
herkent in het eLoket.

## Bepaal eerst waar je bent

```
wbso locaties
```

Dit geeft de projectmap en de drie mogelijke opslaglocaties. Bestaat er al een
configuratie (`wbso config` slaagt), dan ga je een **jaar toevoegen** — zie
"Een jaar toevoegen" onderaan. Anders doorloop je de volledige opzet.

## Laag 1 — de vier kernvragen

Stel deze vier, niet meer. Alles daarbuiten stel je voor of vermeld je, in plaats
van te vragen.

1. **Aanvraagperiode.** Begin- en einddatum. De periode loopt altijd door tot en
   met 31 december van dat jaar; een S&O-verklaring gaat nooit over de jaargrens.
2. **Aangevraagde uren** voor die periode.
3. **Tarief.** 36% (eerste schijf), 50% (starter) of 16% (tweede schijf).
4. **Kosten en uitgaven:** kostenforfait of werkelijke kosten. Deze keuze geldt
   voor het hele kalenderjaar en is daarna niet meer te wijzigen.

## Opslaglocatie: vermelden, niet vragen

De registratie komt in `.wbso/` in het project te staan en wordt **meegecommit**.
Dat is de standaard en daar vraag je niet naar — je meldt het, met de reden en de
uitweg, in één zin of twee:

> Je registratie komt in `.wbso/` en gaat mee in git. Dat geeft je een tweede,
> onafhankelijk bewijs dat je binnen tien werkdagen hebt geregistreerd. Wil je dat
> niet — bijvoorbeeld omdat anderen in deze repo je uren dan zien — zeg het, dan
> zet ik hem lokaal of buiten het project.

Vraagt de gebruiker erom, dan zijn de alternatieven:

- `lokaal` — `.wbso/` met een `.gitignore`-regel. Privé, maar je levert dat
  tweede bewijsspoor in en moet zelf back-uppen.
- `buiten` — `~/.wbso/<projectnaam>/`. Voor repo's waar je niets mag toevoegen.
  Let op: hernoem je de projectmap, dan raakt de koppeling kwijt.

Zie je aanwijzingen dat meelezen onwenselijk is — meerdere auteurs in
`git log`, een publieke remote — noem dat dan actief bij je mededeling in plaats
van te wachten tot de gebruiker eraan denkt.

## Laag 2 — projecten voorstellen

Lees de repo en stel een indeling in S&O-projecten voor: ADR's, README, `docs/`,
en `git log` van de afgelopen maanden. Per project een `id` (kebab-case), een
`naam` en de technische knelpunten waar het om draait.

Zeg er expliciet bij: **dit zijn configuratielabels om boekingen aan op te
hangen, geen tekst die je bij RVO indient.** De projectomschrijving voor je
aanvraag is een ander document en een ander soort werk.

Vindt de repo geen aanknopingspunten (geen docs, nauwelijks historie), verzin dan
niets — vraag de gebruiker de indeling zelf te geven.

## Laag 3 — afbakening voorstellen

De afbakening is de lijst met werk dat **niet** als S&O kwalificeert. Kijk wat er
in de repo staat en stel voor wat je vindt, met per vermelding een korte reden:

| Wat je ziet | Voorstel |
| :-- | :-- |
| `website/`, `marketing/`, landingspagina's | marketingsite — geen technisch knelpunt |
| `.github/workflows/`, `Dockerfile`, IaC | CI/CD en infrastructuur — configuratiewerk |
| auth-, login- of 2FA-pakketten | standaard auth-patronen — technisch niet nieuw |
| `*.figma`, design tokens, stylesheets | ontwerp- en stylingwerk |
| dependency-bots, lockfile-commits | onderhoud en upgrades |

Vul aan met wat je verder ziet. Vraag daarna of er nog iets bij moet.

**Een lege afbakening accepteer je niet.** Maakt de gebruiker de lijst helemaal
leeg, leg dan uit dat daarmee al zijn werk als S&O wordt voorgesteld en dat dat
precies is wat een controle problematisch maakt. Vraag om minstens één vermelding.

## Laag 4 — wat nog niet bekend is

Het `verklaringnummer` ken je bij de aanvraag nog niet; dat komt pas met de
beschikking van RVO. Zet `null`. `/wbso:check` herinnert de gebruiker eraan.

## Wegschrijven

Stel de configuratie samen en **valideer hem vóórdat je schrijft**:

```
echo '<config-json>' | wbso valideer-config
```

Slaagt dat, schrijf dan `config.json` naar de gekozen locatie. Bij `lokaal` voeg
je `.wbso/` toe aan `.gitignore`. Bij `meegecommit` doe je dat juist niet.

Vorm van de configuratie:

```jsonc
{
  "administratie": { "naam": "…", "opslag": "meegecommit" },
  "capture": { "git": true, "sessies": false },
  "aanvragen": {
    "2026": {
      "periode": ["2026-01-01", "2026-12-31"],
      "aangevraagde_uren": 1200,
      "tarief": 36,
      "forfait": true,
      "verklaringnummer": null,
      "projecten": [{ "id": "…", "naam": "…", "knelpunten": ["…"] }]
    }
  },
  "afbakening": ["…"]
}
```

`capture.sessies` staat standaard uit. Noem het alleen als de gebruiker ernaar
vraagt: het legt sessietijden vast als geheugensteun, maar sessietijd is geen
S&O-tijd en wordt nooit automatisch geboekt.

## Afsluiten

Vat samen wat er is ingesteld en zeg wat er nu moet gebeuren:

- boek dagelijks met `/wbso:dag`, uiterlijk binnen tien werkdagen
- controleer met `/wbso:check`
- de mededeling aan RVO gaat vóór 31 maart van het jaar erna

## Een jaar toevoegen

Bestaat er al een configuratie en geeft de gebruiker een jaar op, voeg dan alleen
een aanvraagblok voor dat jaar toe. Bestaande jaren laat je ongemoeid — die
bevatten de gegevens waarop een al ingediende of nog te doen mededeling rust.

Bestaat het gevraagde jaar al, vraag dan of het overschreven of aangevuld moet
worden. Overschrijf nooit ongevraagd.

Vraag opnieuw de vier inhoudelijke kernvragen (periode, uren, tarief, forfait) en
of de projectindeling van vorig jaar nog klopt. De opslaglocatie en de afbakening
gelden voor de hele administratie en vraag je niet opnieuw.
