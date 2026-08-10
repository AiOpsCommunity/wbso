---
description: Boek je S&O-uren van vandaag of van een eerdere dag, op basis van je commits. Gebruik dit voor de dagelijkse WBSO-urenregistratie, of om een eerdere boeking te corrigeren.
---

# Dagboeking

Je helpt de gebruiker zijn S&O-uren van één dag vastleggen. `$ARGUMENTS` bevat
een datum (jjjj-mm-dd) als de gebruiker er een meegaf, anders gaat het om vandaag.

**Praat Nederlands.**

## De regel die alles stuurt

Jij stelt voor, de gebruiker verklaart. Er komt **niets** in het grootboek zonder
dat de gebruiker het heeft bevestigd. Je vult geen uren in "omdat het aannemelijk
is", je rondt niet stilzwijgend af, en je boekt niet door als de gebruiker niet
duidelijk ja zegt.

Dat is geen beleefdheidsvorm. Een urenregistratie moet een waarheidsgetrouwe
vastlegging zijn van tijd die daadwerkelijk aan S&O is besteed; wat jij uit
commits afleidt is een geheugensteun, geen meting.

## 1. Haal de context op

```
wbso config
git log --since="<datum> 00:00" --until="<datum> 23:59" --author="$(git config user.email)" --pretty=format:"%h %s" --stat
```

Kijk ook of er al geboekt is voor die dag (`wbso totalen --jaar <jaar>` en zo
nodig het grootboek zelf), zodat je niet dubbel boekt.

## 2. Groepeer het werk

Trek de commits samen tot samenhangende brokken werk, niet één boeking per
commit. Vijf commits aan hetzelfde knelpunt zijn één boeking.

Koppel elk brok aan een `project`-id uit de configuratie, of aan `overig`.

## 3. Toets tegen de afbakening

Toon **altijd** de afbakeningslijst uit de configuratie bij je voorstel. Herken je
werk dat daaronder valt, stel het dan voor als `soort: "overig"` met de
afbakeningsregel als reden erbij.

De gebruiker mag dat overrulen — het is zijn administratie en hij kent de context
die jij niet ziet. Maar je stelt het niet uit jezelf als S&O voor.

## 4. Presenteer het voorstel

Geef per brok: uren, project, soort, omschrijving en ref (knelpunt, ADR of
issue). Toon het als een tabel of lijst die in één blik te overzien is.

Zeg er expliciet bij dat **de uren een startpunt zijn en geen meting**: commits
zeggen niets over de tijd die in nadenken, lezen of vastlopen is gaan zitten, en
evenmin over pauzes. Vraag de gebruiker ze bij te stellen naar wat hij werkelijk
heeft besteed.

Vraag daarna in één keer om bevestiging of correctie.

## 5. Schrijf pas na bevestiging

Per bevestigde boeking:

```
echo '{"datum":"…","uren":…,"soort":"sao","project":"…","omschrijving":"…","ref":"…"}' \
  | wbso toevoegen --jaar <jaar>
```

`geregistreerd_op` wordt door het grootboek gezet — dat veld is het bewijs voor
de tien-werkdageneis en mag je niet meegeven. De opdracht faalt als je het toch
probeert.

Weigert het grootboek een boeking (buiten de periode, onbekend project, lege
omschrijving), leg de melding dan uit in gewone taal en vraag om een correctie.
Verzin er niets omheen.

Breekt de gebruiker af, dan schrijf je niets. Zeg dat dan ook.

## Als er geen commits zijn

Verzin geen voorstel. Zeg dat er die dag niets is gecommit en vraag rechtstreeks
wat er is gedaan en hoeveel uur. Werk zonder commits is heel gewoon in S&O — een
dag nadenken over een knelpunt levert geen enkele regel code op en telt gewoon mee.

## Een eerdere boeking corrigeren

Corrigeren gebeurt door een regel toe te voegen die naar de oude verwijst, nooit
door het bestand te bewerken. Zoek het `id` van de te corrigeren boeking op in
het grootboek, en:

**Uren of omschrijving bijstellen** — een correctie **vervangt de hele boeking**,
dus neem alle velden over die moeten blijven staan, ook `ref`. Laat je er een weg,
dan is die na de correctie verdwenen:

```
echo '{"datum":"…","uren":5,"soort":"sao","project":"…","omschrijving":"…","ref":"…","corrigeert":"<id>"}' \
  | wbso toevoegen --jaar <jaar>
```

**Een boeking intrekken** — bijvoorbeeld omdat het achteraf routinewerk blijkt:

```
echo '{"datum":"…","ingetrokken":true,"omschrijving":"<reden>","corrigeert":"<id>"}' \
  | wbso toevoegen --jaar <jaar>
```

Een al gecorrigeerde boeking kun je niet nog eens corrigeren; verwijs dan naar de
meest recente versie ervan. Het grootboek zegt dat ook als je het toch probeert.

## Afsluiten

Toon kort wat er is geboekt en de stand van het jaar (`wbso totalen`). Loopt de
gebruiker tegen de tien-werkdagengrens aan voor eerdere dagen, wijs daar dan op
en stel voor die dagen alsnog te boeken.
