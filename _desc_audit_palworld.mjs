// Offline audit: current meta description formula vs new src/lib/seo.ts builders.
// Run: node _desc_audit_palworld.mjs
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const arr = (x) => (Array.isArray(x) ? x : (x.items || x.data || Object.values(x)));
const P = arr(JSON.parse(fs.readFileSync("src/data/palworld_pals.json", "utf8")));
const W = arr(JSON.parse(fs.readFileSync("src/data/palworld_weapons.json", "utf8")));
const A = arr(JSON.parse(fs.readFileSync("src/data/palworld_armor.json", "utf8")));

const seo = await import(pathToFileURL("./src/lib/seo.ts").href);

// ---- current (shipping) formulas, copied verbatim from the .astro pages ----
const curPal = (p) =>
  `${p.title} (${(p.elements || []).join("/")}) in Palworld: base HP ${p.hp}, attack ${p.attack}, defense ${p.defense}, work suitability, drops and breeding rank.`;
const curWeapon = (w) =>
  `${w.title} in Palworld: ${w.subtype || "weapon"}, best attack ${w.top_attack ?? "?"}, durability ${w.top_durability ?? "?"}${w.ingredients?.length ? ", crafting ingredients" : ""}.`;
const curArmor = (a) =>
  `${a.title} in Palworld: ${a.subtype || "armour"}, best defense ${a.top_defense ?? "?"}, durability ${a.top_durability ?? "?"}${a.qualities?.[Object.keys(a.qualities || {})[0]]?.equip_effect ? ", equip effect" : ""}.`;

function stat(label, list, fn) {
  const out = list.map(fn);
  const len = out.map((s) => s.length);
  const q = out.filter((s) => s.includes("?")).length;
  const short = out.filter((s) => s.length < 60).length;
  const long = out.filter((s) => s.length > 158).length;
  const dirty = out.filter((s) => /undefined|null|\[object|&#|&amp;|<|>/.test(s)).length;
  const uniq = new Set(out).size;
  const avg = (len.reduce((a, b) => a + b, 0) / len.length).toFixed(0);
  console.log(
    `${label.padEnd(26)} n=${String(out.length).padStart(3)} avg=${String(avg).padStart(3)} ` +
      `"?"=${String(q).padStart(3)} <60=${String(short).padStart(3)} >158=${String(long).padStart(3)} ` +
      `dirty=${String(dirty).padStart(3)} uniq=${uniq}/${out.length}`
  );
  return out;
}

console.log("=== PALS ===");
const palOld = stat("current", P, curPal);
const palNew = stat("seo.palDesc", P, (p) => seo.palDesc(p));

console.log("\n=== WEAPONS ===");
const wOld = stat("current", W, curWeapon);
const wNew = stat("seo.weaponDesc", W, (w) => seo.weaponDesc(w));

console.log("\n=== ARMOR ===");
const aOld = stat("current", A, curArmor);
const aNew = stat("seo.armorDesc", A, (a) => seo.armorDesc(a));

console.log("\n--- sample: pals (old -> new) ---");
[0, 1, 40, 120].forEach((i) => {
  if (!P[i]) return;
  console.log(`\n[${P[i].title}]\n  OLD: ${palOld[i]}\n  NEW: ${palNew[i]}`);
});

console.log("\n--- sample: weapons including the 15 that printed '?' ---");
const wBad = W.map((w, i) => [w, i]).filter(([w]) => !w.top_attack).slice(0, 4);
W.slice(0, 2).forEach((w) => {
  const i = W.indexOf(w);
  console.log(`\n[${w.title}]\n  OLD: ${wOld[i]}\n  NEW: ${wNew[i]}`);
});
wBad.forEach(([w, i]) => {
  console.log(`\n[${w.title} — null attack]\n  OLD: ${wOld[i]}\n  NEW: ${wNew[i]}`);
});

console.log("\n--- sample: armor including shields (null defense) ---");
[0, 1].forEach((i) => {
  console.log(`\n[${A[i].title}]\n  OLD: ${aOld[i]}\n  NEW: ${aNew[i]}`);
});
A.map((a, i) => [a, i])
  .filter(([a]) => !a.top_defense)
  .slice(0, 2)
  .forEach(([a, i]) => {
    console.log(`\n[${a.title} — shield]\n  OLD: ${aOld[i]}\n  NEW: ${aNew[i]}`);
  });

// equip-effect key-order bug check on the shipping armor formula
const effMissed = A.filter((a) => {
  const anyEff = Object.values(a.qualities || {}).some((v) => v && v.equip_effect);
  const firstKey = Object.keys(a.qualities || {})[0];
  const firstEff = a.qualities?.[firstKey]?.equip_effect;
  return anyEff && !firstEff;
}).length;
console.log(`\nArmor pages where equip effect EXISTS but the old formula missed it (key-order bug): ${effMissed}/${A.length}`);
