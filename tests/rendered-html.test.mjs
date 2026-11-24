import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

test("l'esportazione contiene le quattro card, il tastierino e lo stato iniziale", () => {
  const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="it"/);
  assert.match(html, /Fractionator/);
  assert.match(html, /Il tuo calcolo/);
  assert.match(html, /Tastierino/);
  assert.match(html, /Passaggi del calcolo/);
  assert.match(html, /Il grafico compare dopo il calcolo/);
  assert.match(html, /aria-label="Inserisci denominatore"/);
  assert.match(html, /aria-label="Dividi"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /SkeletonPreview|NaN|Infinity/);
  assert.ok(existsSync(new URL("../out/fonts/Play-Regular.ttf", import.meta.url)));
  assert.ok(existsSync(new URL("../out/fonts/Play-Bold.ttf", import.meta.url)));
});

test("la home presenta il design ufficiale con grafico e passaggi in sezioni distinte", () => {
  const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Fractionator · Calcolatrice di frazioni<\/title>/);
  assert.match(html, /class="fractionator min-h-screen"/);
  assert.match(html, /<section[^>]+aria-labelledby="grafico"[^>]*>[\s\S]*?<\/section>\s*<section[^>]+aria-labelledby="steps-title"/);
  assert.doesNotMatch(html, /Versioni del prototipo|Versione [ABC]|href="\/prototipo-/);
});

test("l'esportazione esclude le tre pagine di confronto", () => {
  for (const path of ["prototipo-a", "prototipo-b", "prototipo-C"]) {
    assert.equal(existsSync(new URL(`../out/${path}/`, import.meta.url)), false, path);
  }
});
