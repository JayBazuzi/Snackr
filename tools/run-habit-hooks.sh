#!/bin/bash
# Run the habit-hooks smell sensors over the code.
#
# Usage:
#   run-habit-hooks.sh                    # default scope from config
#   run-habit-hooks.sh --all
#   run-habit-hooks.sh --branch main
#   run-habit-hooks.sh src/file.ts  # a single file (any path that exists)
#
# Any other arguments are passed straight through to habit-hooks.
# It never (re)installs habit-hooks: a forced install replaces every plugin, which
# would remove plugins other repos rely on.
#
# Set PLUGIN to this repo's language plugin (java, csharp, typescript, ...).
set -euo pipefail

PLUGIN=typescript

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

missing() {
    echo "run-habit-hooks.sh: $1 is missing; install it with: $2" >&2
    exit 1
}

plugin_source="habit-hooks-$PLUGIN"

command -v habit-hooks >/dev/null || missing habit-hooks "uv tool install habit-hooks --with $plugin_source"
uv tool list --show-with 2>/dev/null | grep -q "habit-hooks-$PLUGIN" ||
    missing "habit-hooks-$PLUGIN" "uv tool install --force habit-hooks --with $plugin_source (plus a --with for each plugin you already use)"
command -v jscpd >/dev/null || missing jscpd "brew install jscpd"
if [ "$PLUGIN" = java ]; then
    command -v pmd >/dev/null || missing pmd "brew install pmd"
fi

# If the only argument is an existing file, turn it into a repo-relative `--file`.
if [ "$#" -eq 1 ] && [ -f "$1" ]; then
    ABS_FILE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
    set -- --file "${ABS_FILE#"$REPO_ROOT/"}"
fi

cd "$REPO_ROOT"
# eslint and knip are dev dependencies of this repo.
export PATH="$REPO_ROOT/node_modules/.bin:$PATH"
exec habit-hooks "$@"
