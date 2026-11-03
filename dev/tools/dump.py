import json, os, sys, urllib.request
names = sys.argv[1:]
q = "select json_agg(json_build_object('fn',p.proname,'def',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname = any(%s)" % ("array[" + ",".join("'%s'" % x for x in names) + "]")
req = urllib.request.Request("https://api.supabase.com/v1/projects/ctryvcloavfpecbrbzxy/database/query", data=json.dumps({"query": q}).encode(), method="POST", headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
r = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
for x in r[0]['json_agg'] or []:
    open('fdefs/%s.sql' % x['fn'], 'a').write(x['def'] + '\n\n')
    print(x['fn'], len(x['def']))
