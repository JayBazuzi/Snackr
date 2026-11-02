Habit-hooks runs smell sensors over the code. Config: `.habit-hooks/config.toml`.
Source: [github.com/habit-hooks/habit-hooks](https://github.com/habit-hooks/habit-hooks)

Install (once per machine): `uv tool install --force habit-hooks --with habit-hooks-<language>`, plus
`brew install jscpd` (and `brew install pmd` for Java). Then `habit-hooks init` writes the config and
reports anything still missing.

Run `tools/run-habit-hooks.sh` from anywhere; it checks the tools are installed (never
reinstalls) and runs from the repo root.

- `tools/run-habit-hooks.sh src/file.ts` — check one file
- `tools/run-habit-hooks.sh --branch main` — check files changed vs. main
- `tools/run-habit-hooks.sh --all` — check the whole repo

The language plugin finds structural smells: long methods, complexity, too many parameters,
deep nesting, unused code, empty catches. The generic plugin adds file length and duplication (jscpd).

Local adjustments to make for each repo:

- Exclude files the parser cannot process in `config.toml`; one failure aborts the whole run.
- Add a root `.jscpd.json` in `weak` mode, so license headers don't count as duplication.
- Override the jscpd sensor in `.habit-hooks/generic/sensors/` to report only clones touching a file
  in scope; the stock sensor reports the whole repo's duplication on every run.
- If the comment sensor flags license headers or API doc comments, filter those out.
- Write down which smells the language plugin can't see.

## After fixing a smell

Run `./build-and-test.sh` after each refactoring step, so a fix that
breaks behavior is caught right away.
