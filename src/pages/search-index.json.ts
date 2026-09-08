import type { APIRoute } from "astro";
import pals from "../data/palworld_pals.json";
import weapons from "../data/palworld_weapons.json";
import armor from "../data/palworld_armor.json";

interface Entry {
  t: string;
  u: string;
  k: string;
  i?: string;
}

export const GET: APIRoute = () => {
  const tools: Entry[] = [
    { t: "Breeding Calculator", u: "/breeding-calculator/", k: "Tool" },
    { t: "Strongest Pals (by attack)", u: "/rankings/#pals", k: "Tool" },
    { t: "Highest HP Pals", u: "/rankings/#hp", k: "Tool" },
    { t: "Best work pals", u: "/rankings/#work", k: "Tool" },
    { t: "Weapon attack rankings", u: "/rankings/#weapons", k: "Tool" },
    { t: "Armor defense rankings", u: "/rankings/#armor", k: "Tool" },
    { t: "All pages A–Z", u: "/search/", k: "Tool" },
  ];
  const items: Entry[] = [
    ...pals.map((p: any) => ({ t: p.title, u: `/pals/${p.slug}/`, k: "Pal", i: p.icon || "" })),
    ...weapons.map((w: any) => ({ t: w.title, u: `/weapons/${w.slug}/`, k: "Weapon", i: w.icon || "" })),
    ...armor.map((a: any) => ({ t: a.title, u: `/armor/${a.slug}/`, k: "Armor", i: a.icon || "" })),
  ];
  return new Response(JSON.stringify({ tools, items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
