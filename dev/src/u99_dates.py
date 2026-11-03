# U99 (runs last): calendar days are formatted in the phone's own time zone. toISOString() is UTC,
# which is 8 hours behind Manila, so "add a day" or "first of the month" came out a day early there.
import re
from patchlib import S
t = S['text']
n0 = len(re.findall(r'\.toISOString\(\)\.slice\(0, ?(10|7)\)', t))
t = re.sub(r'\.toISOString\(\)\.slice\(0, ?10\)', '.niftiDay()', t)
t = re.sub(r'\.toISOString\(\)\.slice\(0, ?7\)', '.niftiDay().slice(0, 7)', t)
helper = ("\n// A calendar day (YYYY-MM-DD) in this phone's time zone. Never toISOString() for days: that's UTC.\n"
          "Date.prototype.niftiDay = function(){ return this.getFullYear() + '-' + String(this.getMonth() + 1).padStart(2, '0') + '-' + String(this.getDate()).padStart(2, '0'); };\n")
scripts = [m for m in re.finditer(r'<script(?:\s[^>]*)?>', t)]
# the app's own (largest) inline script
best = max(scripts, key=lambda m: (t.find('</script>', m.end()) - m.end()) if 'src=' not in m.group(0) else -1)
t = t[:best.end()] + helper + t[best.end():]
S['text'] = t
print('day formatting fixed at', n0, 'places')
