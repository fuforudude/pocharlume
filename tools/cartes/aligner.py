# Accroche les chemins des cartes à la grille des cases : coordonnées de tuile impaires (centre d'une case de 2x2 tuiles).
import re,glob,sys
fichiers=sorted(glob.glob('src/data/niveaux/cartes*.ts'))
def snap(c,sens):
    return c if c%2!=0 else c+sens
def imgs(t,v):
    if v in t: return t[v]
    ks=sorted(t)
    k0=max([k for k in ks if k<v],default=ks[0]); k1=min([k for k in ks if k>v],default=ks[-1])
    if k0==k1: return t[k0]
    val=t[k0]+(v-k0)*(t[k1]-t[k0])/(k1-k0)
    r=2*int(val//2)+1
    return min(max(r,t[k0]),t[k1])
def resoudre(vals):
    # images impaires strictement croissantes, déplacement minimal
    best=[None,10**9]
    def rec(i,prec,cout,cur):
        if cout>=best[1]: return
        if i==len(vals):
            best[0]=list(cur); best[1]=cout; return
        v=vals[i]
        opts=[v] if v%2 else [v+1,v-1]
        for o in opts:
            if o>prec:
                cur.append(o); rec(i+1,o,cout+abs(o-v),cur); cur.pop()
    rec(0,-10**9,0,[])
    return dict(zip(vals,best[0]))
for f in fichiers:
    if 'cartes-toutes' in f: continue
    s=open(f,encoding='utf-8').read()
    blocs=re.split(r'(?=^export const )',s,flags=re.M)
    out=[]
    for b in blocs:
        m=re.match(r'export const (\w+): CarteModele',b)
        if not m: out.append(b); continue
        pts=[]
        for cm in re.finditer(r'chemin\(((?:\[[^\]]*\],?\s*)+)\)',b):
            for p in re.finditer(r'\[(-?\d+),\s*(-?\d+)\]',cm.group(1)):
                pts.append((int(p.group(1)),int(p.group(2))))
        tables=[]
        for axe in (0,1):
            vals=sorted(set(p[axe] for p in pts))
            tables.append(resoudre(vals))
        def rep_chemin(cm):
            def rp(p):
                return '[%d, %d]'%(tables[0][int(p.group(1))],tables[1][int(p.group(2))])
            return re.sub(r'\[(-?\d+),\s*(-?\d+)\]',rp,cm.group(0))
        b=re.sub(r'chemin\(((?:\[[^\]]*\],?\s*)+)\)',rep_chemin,b)
        b=re.sub(r'departHeros: \{ x: (\d+), y: (\d+) \}',lambda h:'departHeros: { x: %d, y: %d }'%(imgs(tables[0],int(h.group(1))),imgs(tables[1],int(h.group(2)))),b)
        out.append(b)
    open(f,'w',encoding='utf-8').write(''.join(out))
