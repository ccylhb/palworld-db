// Answer-first meta description builders for palworld-db.
// Goal: put concrete numbers in the first ~120 chars, never print "?" placeholders,
// guarantee >=60 chars and keep every page unique (title always leads).
const LIMIT = 158;

function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/\[[^\]]*\]/g, "") // strip wiki bracketed asides like [25 seconds?]
    .replace(/\s+/g, " ")
    .trim();
}

const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Drop a trailing fragment gracefully when we hit the length budget.
function cohere(s: string, limit = LIMIT): string {
  s = clean(s);
  if (s.length <= limit) return s;
  let cut = s.slice(0, limit);
  const i = cut.lastIndexOf(" ");
  if (i > 40) cut = cut.slice(0, i);
  cut = cut.replace(/[\s,;:.\-]+$/, "");
  return cut + ".";
}

// Join sentence-ish parts while respecting the budget (first part always kept).
function joinBounded(parts: string[], limit = LIMIT): string {
  const out: string[] = [];
  for (const p of parts) {
    const piece = clean(p);
    if (!piece) continue;
    const cand = out.length ? out.join(" ") + " " + piece : piece;
    if (cand.length <= limit) out.push(piece);
    else break;
  }
  let s = out.join(" ").trim();
  if (!s) return "";
  if (s.length > limit) s = cohere(s, limit);
  return s;
}

// Pick the most useful sentence out of a wiki intro / in-game description.
// Prefers a sentence carrying numbers (e.g. "It grants 1,800 Shield …"),
// and always discards re-statement clauses, maintenance notices and meta noise.
function leadText(raw: unknown): string {
  let t = clean(raw);
  if (!t) return "";
  t = t.replace(/\s*\(Japanese:[^)]*\)/i, ""); // "Aegidron (Japanese: …) is a …" -> keep the real clause
  const bad = /(please move over|migrat|this (?:article|page) is|wiki\.gg|stub|under construction|edit)/i;
  const sentences = t
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter((s) => s.length >= 25 && !bad.test(s));
  for (const s of sentences) if (/\d/.test(s)) return s; // numeric clause wins
  for (const s of sentences) if (s.length >= 40) return s;
  return "";
}

function ingredients(list: unknown, max = 3): string {
  return (Array.isArray(list) ? list : [])
    .filter((i: any) => i && i.name)
    .slice(0, max)
    .map((i: any) => {
      // data ships a few lower-case material names ("stone"); capitalise for prose
      const name = String(i.name).replace(/^[a-z]/, (c) => c.toUpperCase());
      return i.count ? `${i.count} ${name}` : name;
    })
    .join(", ");
}

// Scan every quality for an equip effect, preferring the base (Common) tier —
// never depend on JSON key order.
function equipEffect(item: any): string {
  const q = item?.qualities || {};
  const order = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  const keys = [...order.filter((k) => q[k]), ...Object.keys(q).filter((k) => !order.includes(k))];
  for (const k of keys) {
    const e = clean(q[k]?.equip_effect);
    if (e) return e;
  }
  return "";
}

function maybeAppendLead(base: string, lead: string): string {
  if (!lead || base.includes(lead)) return base;
  return cohere(`${base} ${lead}`);
}

/* ---------------------------------- Pals ---------------------------------- */

export function palDesc(p: any): string {
  const el = (p.elements || []).join("/") || "Pal";
  const head = `${p.title} — ${el} Pal #${p.no} in Palworld.`;

  const nums: string[] = [];
  if (p.hp) nums.push(`HP ${p.hp}`);
  if (p.attack) nums.push(`Attack ${p.attack}`);
  if (p.defense) nums.push(`Defense ${p.defense}`);
  const statLine = nums.length ? nums.join(", ") + "." : "";

  const work = (p.work_suitability || [])
    .filter((w: any) => w && w.name)
    .slice(0, 3)
    .map((w: any) => `${w.name} ${w.level}`)
    .join(", ");

  const drops = (p.drops?.normal || [])
    .filter((d: any) => d && d.name)
    .slice(0, 3)
    .map((d: any) => d.name)
    .join(", ");

  const parts = [head, statLine];
  if (work) parts.push(`Work: ${work}.`);
  if (drops) parts.push(`Drops: ${drops}.`);
  if (p.breeding?.rank) parts.push(`Breeding rank ${p.breeding.rank}.`);

  let s = joinBounded(parts);
  if (s.length < 60) s = maybeAppendLead(s, leadText(p.intro || p.flavor));
  return s;
}

/* -------------------------------- Weapons -------------------------------- */

export function weaponDesc(w: any): string {
  const sub = clean(w.subtype);
  const kind = !sub ? "Weapon" : ["Ranged", "Melee", "Grenade"].includes(sub) ? `${sub} weapon` : sub;
  const head = `${w.title} — ${kind} in Palworld.`;

  const nums: string[] = [];
  if (w.top_attack) nums.push(`attack up to ${w.top_attack}`);
  if (w.top_durability) nums.push(`durability ${w.top_durability}`);
  if (w.weight) nums.push(`weight ${w.weight}`);
  const statLine = nums.length ? cap(nums.join(", ")) + "." : "";

  const parts = [head, statLine];
  // Tools with no combat stats (grappling guns, decal guns) read better with their
  // in-game description right after the head.
  if (!w.top_attack) parts.push(leadText(w.description || w.intro));
  if (w.ammo?.length) parts.push(`Uses ${w.ammo[0]}.`);
  const ing = ingredients(w.ingredients);
  if (ing) parts.push(`Craft: ${ing}.`);

  let s = joinBounded(parts);
  if (s.length < 60) s = maybeAppendLead(s, leadText(w.description || w.intro));
  return s;
}

/* --------------------------------- Armor --------------------------------- */

export function armorDesc(a: any): string {
  const sub = clean(a.subtype);
  const head = `${a.title} — ${sub || "Armor"} in Palworld.`;

  const nums: string[] = [];
  if (a.top_defense) nums.push(`defense ${a.top_defense}`);
  if (a.top_durability) nums.push(`durability ${a.top_durability}`);
  if (a.weight) nums.push(`weight ${a.weight}`);
  const statLine = nums.length ? cap(nums.join(", ")) + "." : "";

  const parts = [head, statLine];
  // Shields carry no defense value — their worth is the Shield amount in the intro.
  if (!a.top_defense) parts.push(leadText(a.intro || a.description));
  const eff = equipEffect(a);
  if (eff) parts.push(`Equip effect: ${eff}.`);
  const ing = ingredients(a.ingredients);
  if (ing) parts.push(`Craft: ${ing}.`);

  let s = joinBounded(parts);
  if (s.length < 60) s = maybeAppendLead(s, leadText(a.description || a.intro));
  return s;
}
