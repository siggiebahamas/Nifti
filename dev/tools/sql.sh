#!/bin/bash
# usage: sql.sh file.sql   (runs against the Nifti project via the Supabase Management API)
python3 - "$1" <<'PY'
import json, os, sys, urllib.request, urllib.error
q = open(sys.argv[1]).read()
req = urllib.request.Request("https://api.supabase.com/v1/projects/ctryvcloavfpecbrbzxy/database/query",
    data=json.dumps({"query": q}).encode(), method="POST",
    headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=120) as r: print(r.read().decode())
except urllib.error.HTTPError as e: print("HTTP", e.code, e.read().decode()[:3000])
PY
