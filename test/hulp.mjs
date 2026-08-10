// Gedeelde hulpmiddelen voor de tests: een tijdelijke opslagmap met configuratie,
// en een teller-id zodat boekingen in tests voorspelbare ids krijgen.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function maakConfig(overschrijf = {}) {
  return {
    administratie: { naam: "Testadministratie", opslag: "meegecommit" },
    capture: { git: true, sessies: false },
    aanvragen: {
      2026: {
        periode: ["2026-01-01", "2026-12-31"],
        aangevraagde_uren: 100,
        tarief: 36,
        forfait: true,
        verklaringnummer: "R123456",
        projecten: [
          { id: "alfa", naam: "Project Alfa", knelpunten: ["knelpunt 1"] },
          { id: "beta", naam: "Project Beta", knelpunten: [] },
        ],
      },
    },
    afbakening: ["marketingsite"],
    ...overschrijf,
  };
}

/** Maak een tijdelijke opslagmap met config.json. Geeft {opslagmap, config, opruimen}. */
export function maakOpslagmap(configOverschrijf = {}) {
  const opslagmap = mkdtempSync(join(tmpdir(), "wbso-test-"));
  const config = maakConfig(configOverschrijf);
  writeFileSync(join(opslagmap, "config.json"), JSON.stringify(config), "utf8");
  return { opslagmap, config, opruimen: () => rmSync(opslagmap, { recursive: true, force: true }) };
}

/** Oplopende ids, zodat tests naar een boeking kunnen verwijzen zonder UUID's. */
export function tellerId(prefix = "b") {
  let n = 0;
  return () => `${prefix}${++n}`;
}
