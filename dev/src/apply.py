# Rebuilds Nifti_Sept17.html from unify/base.html by applying every patch module in order.
import sys, os, importlib
sys.path.insert(0, os.path.dirname(__file__))
import patchlib
patchlib.S['text'] = open(os.path.join(os.path.dirname(__file__), 'base.html'), encoding='utf-8').read()
mods = sys.argv[1:] or ['u1_data']
for m in mods:
    importlib.import_module(m)
    print('applied', m)
open(os.path.join(os.path.dirname(__file__), '..', '..', 'Nifti_Sept17.html'), 'w', encoding='utf-8').write(patchlib.S['text'])
print('written', len(patchlib.S['text']))
