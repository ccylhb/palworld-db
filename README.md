# PalworldDB

**Live site: <https://palworld.lootseer.com>**

Data sourced from the public palworld.wiki.gg wiki and restructured for lookup.

## What this is

A fast, ad-light game database built as a fully static Astro site:
every page is pre-rendered HTML with structured data (JSON-LD), readable
in well under a second. Data is kept in plain JSON under `src/data/`,
scraped and cleaned from public wiki sources by the scripts in
`scripts/`, then compiled at build time.

## Why answer-first

Players search for concrete numbers, not wiki walls of text. Pages lead
with the answer (stats, drops, recipes) and link related items both ways,
including reverse-lookup and calculator tools where available.

## Data source

- [palworld.wiki.gg](https://palworld.wiki.gg) — public wiki, parsed and restructured
