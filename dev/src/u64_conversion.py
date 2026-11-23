# Round 64: conversion-focused marketing refinement; retain existing How It Works.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text']; k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r64_conversion.css')+'\n'+t[k:]
P("function renderSidebarForViewAsRole(){",rd('r64_conversion.js')+"\nfunction renderSidebarForViewAsRole(){")
