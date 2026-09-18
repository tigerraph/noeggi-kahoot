#!/usr/bin/env bash
# One Supabase project, two apps, never crossed (Rafa, 18.09.2026).
# The wedding quiz lives in the schema «noeggi» of the dm-quiz project; the DM app lives in
# «public» (tables dm_*). This fails if the quiz's code reaches for anything of DM's:
#   - a dm_* table or function, or DM's schema (public.…, or a dm schema later),
#   - a request profile other than noeggi, or a REST call without the noeggi headers.
set -u
cd "$(dirname "$0")/.."
code=(src scripts)
bad=0
hit(){ echo "✗ $1"; echo "$2" | sed 's/^/    /'; bad=1; }

out=$(grep -rnE '\bdm_[a-z_]+|\bpublic\.[a-z_]+|["'"'"']dm["'"'"']' "${code[@]}" --exclude=check-schema.sh || true)
[ -n "$out" ] && hit "references the DM app's schema or tables" "$out"

out=$(grep -rnE 'Profile"?[[:space:]]*:[[:space:]]*"[a-z_]+"' "${code[@]}" --exclude=check-schema.sh | grep -v '"noeggi"' || true)
[ -n "$out" ] && hit "a request profile other than noeggi" "$out"

# every REST call in the client goes out with SUPA_H (which carries the noeggi profile)
out=$(grep -nE 'fetch\(SUPA_URL\+"/rest/v1/' -A3 src/template.html | grep -E 'headers' | grep -v 'SUPA_H' || true)
[ -n "$out" ] && hit "a REST call without SUPA_H (the noeggi schema headers)" "$out"
grep -q 'SUPA_SCHEMA = "noeggi"' src/template.html || hit "src/template.html does not set SUPA_SCHEMA = \"noeggi\"" ""

[ $bad = 0 ] && echo "✓ schema check: the quiz only uses its own schema «noeggi»"
exit $bad
