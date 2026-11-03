# U6: English / Filipino for the whole dashboard.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
P("""  const btn = document.getElementById('langToggle');
  if(btn){
    btn.textContent = currentLanguage === 'EN' ? 'EN / FIL' : 'FIL / EN';
    btn.title = currentLanguage === 'EN' ? 'Switch to Filipino' : 'Switch to English';
  }""", """  if(typeof i18nSyncSwitch === 'function') i18nSyncSwitch();""")
dict_js = rd('i18n_fil.js') if os.path.exists(os.path.join(HERE, 'i18n_fil.js')) else ''
P("\nfunction renderSidebarForViewAsRole(){", "\n" + rd('i18n.js') + dict_js + "\nfunction renderSidebarForViewAsRole(){")
