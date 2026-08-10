import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { maakConfig } from "./hulp.mjs";

const HOOK = fileURLToPath(new URL("../hooks/session.mjs", import.meta.url));
const JAAR = new Date().getFullYear();

function project(configOverschrijf) {
  const map = mkdtempSync(join(tmpdir(), "wbso-hook-"));
  mkdirSync(join(map, ".git"));
  mkdirSync(join(map, ".wbso"));
  writeFileSync(
    join(map, ".wbso", "config.json"),
    JSON.stringify(maakConfig(configOverschrijf)),
    "utf8",
  );
  return { map, opruimen: () => rmSync(map, { recursive: true, force: true }) };
}

function draaiHook(cwd, gebeurtenis = "SessionStart") {
  return execFileSync("node", [HOOK], {
    input: JSON.stringify({ hook_event_name: gebeurtenis, session_id: "s1", cwd }),
    encoding: "utf8",
  });
}

test("hook doet niets als capture uitstaat", (t) => {
  const { map, opruimen } = project();
  t.after(opruimen);

  draaiHook(map);
  assert.equal(existsSync(join(map, ".wbso", `sessies-${JAAR}.jsonl`)), false);
});

test("hook schrijft één regel als capture aanstaat", (t) => {
  const { map, opruimen } = project({ capture: { git: true, sessies: true } });
  t.after(opruimen);

  draaiHook(map, "SessionStart");
  draaiHook(map, "SessionEnd");

  const regels = readFileSync(join(map, ".wbso", `sessies-${JAAR}.jsonl`), "utf8")
    .trimEnd()
    .split("\n")
    .map((r) => JSON.parse(r));

  assert.equal(regels.length, 2);
  assert.equal(regels[0].gebeurtenis, "SessionStart");
  assert.equal(regels[1].gebeurtenis, "SessionEnd");
  assert.equal(regels[0].sessie, "s1");
});

test("hook faalt stil in een project zonder configuratie", (t) => {
  const map = mkdtempSync(join(tmpdir(), "wbso-hook-leeg-"));
  mkdirSync(join(map, ".git"));
  t.after(() => rmSync(map, { recursive: true, force: true }));

  assert.doesNotThrow(() => draaiHook(map));
  assert.equal(existsSync(join(map, ".wbso")), false);
});

test("hook faalt stil bij onleesbare invoer", () => {
  assert.doesNotThrow(() =>
    execFileSync("node", [HOOK], { input: "dit is geen json", encoding: "utf8" }),
  );
});

test("hook raakt het grootboek niet aan", (t) => {
  const { map, opruimen } = project({ capture: { git: true, sessies: true } });
  t.after(opruimen);

  const grootboek = join(map, ".wbso", `uren-${JAAR}.jsonl`);
  writeFileSync(grootboek, "", "utf8");
  draaiHook(map);

  assert.equal(readFileSync(grootboek, "utf8"), "", "het grootboek moet ongewijzigd blijven");
});

test("hook heeft geen enkele verwijzing naar het grootboek in zijn broncode", () => {
  const bron = readFileSync(HOOK, "utf8");
  const code = bron
    .split("\n")
    .filter((regel) => !regel.trimStart().startsWith("//"))
    .join("\n");

  assert.doesNotMatch(code, /grootboek\.mjs/, "de hook mag grootboek.mjs niet importeren");
  assert.doesNotMatch(code, /grootboekpad/, "de hook mag het grootboekpad niet kunnen bepalen");
  assert.doesNotMatch(code, /voegToe/, "de hook mag niet kunnen boeken");
});
