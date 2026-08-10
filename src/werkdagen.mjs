// Werkdagen tellen voor de tien-werkdageneis.
//
// Bewust zonder feestdagenkalender (zie design.md): Nederlandse feestdagen
// zouden de grens hooguit een dag verschuiven, en dit gereedschap waarschuwt
// liever een dag te vroeg dan een dag te laat. De uitvoer benoemt dat.

const DAG_MS = 24 * 60 * 60 * 1000;

/** Dagdeel van een ISO-tijdstip of datum: "2026-03-02T18:22:04Z" -> "2026-03-02". */
export function alsDatum(waarde) {
  return String(waarde).slice(0, 10);
}

function naarUtc(datum) {
  const [jaar, maand, dag] = datum.split("-").map(Number);
  return Date.UTC(jaar, maand - 1, dag);
}

/** Is deze datum een werkdag (maandag t/m vrijdag)? */
export function isWerkdag(datum) {
  const dag = new Date(naarUtc(datum)).getUTCDay();
  return dag !== 0 && dag !== 6;
}

/**
 * Aantal werkdagen tussen twee datums: exclusief `van`, inclusief `tot`.
 *
 * Zelfde dag geeft 0. Vrijdag naar maandag geeft 1. Ligt `tot` vóór `van`, dan
 * is het resultaat negatief volgens dezelfde telling.
 */
export function werkdagenTussen(van, tot) {
  const vanaf = naarUtc(alsDatum(van));
  const tm = naarUtc(alsDatum(tot));
  if (vanaf === tm) return 0;

  const richting = tm > vanaf ? 1 : -1;
  let aantal = 0;
  for (let t = vanaf; t !== tm; ) {
    t += richting * DAG_MS;
    const dag = new Date(t).getUTCDay();
    if (dag !== 0 && dag !== 6) aantal += richting;
  }
  return aantal;
}

/** Alle werkdagen in een gesloten interval, als jjjj-mm-dd. */
export function werkdagenIn(van, tot) {
  const dagen = [];
  const eind = naarUtc(alsDatum(tot));
  for (let t = naarUtc(alsDatum(van)); t <= eind; t += DAG_MS) {
    const dag = new Date(t).getUTCDay();
    if (dag !== 0 && dag !== 6) dagen.push(new Date(t).toISOString().slice(0, 10));
  }
  return dagen;
}
