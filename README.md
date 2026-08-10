# wbso

A Claude Code plugin for tracking S&O hours for the Dutch **WBSO** tax credit
(*Wet Bevordering Speur- en Ontwikkelingswerk*).

> **Status: design phase.** The design is settled and committed; the plugin is
> not implemented yet and is not installable. See
> [the design document](docs/superpowers/specs/2026-08-10-wbso-plugin-design.md)
> (in Dutch).

## What it will do

The WBSO requires you to record R&D hours **within ten working days**, traceable
to a specific S&O project, and clearly separated from work that doesn't qualify.
Doing that by hand is tedious enough that people postpone it — and reconstructing
hours afterwards is exactly what the scheme does not allow.

The plugin turns that into a short daily conversation:

| Command | Purpose |
| :-- | :-- |
| `/wbso:init` | Set up a project: period, hours applied for, rate, S&O projects, and the exclusion list |
| `/wbso:dag` | Daily entry — proposes bookings from your commits, you confirm |
| `/wbso:check` | Validation and totals, including the ten-working-day rule |
| `/wbso:mededeling` | The March report to RVO, plus a CSV export for your accountant |

## The design principle

**The machine proposes, you declare.**

Hours are never booked automatically. Session duration is not R&D time: it
includes breaks, includes non-qualifying work, and misses the thinking that
happens away from the editor. A tool that silently records session time as S&O
hours doesn't produce a record — it produces a liability during an RVO audit.

So the plugin only ever drafts, and you confirm or correct. Observations (what
the machine saw) and claims (what you declared) are kept in separate files, and
the ledger is append-only: a correction is a new entry referencing the old one,
never an edit. Overwriting entries would erase the very evidence the scheme asks
you to keep.

## Language

Code, docs and plugin metadata are in English. The commands themselves speak
Dutch and use RVO terminology verbatim (*mededeling*, *S&O-verklaring*,
*afdrachtvermindering*), because those terms have no good English equivalents and
you need them to match the eLoket form.

## Disclaimer

This is a tool for keeping your own records. It is **not tax advice**. What you
submit to RVO, and whether the hours you record are truthful and qualify as S&O,
remains entirely your responsibility. Consult your accountant or an RVO adviser
if you are unsure.

## License

MIT
