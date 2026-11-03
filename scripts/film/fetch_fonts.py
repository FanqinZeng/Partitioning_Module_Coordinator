"""Fetch reproducible rendering fonts; the site already ships their OFL notices."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import urllib.request

ROOT=Path(__file__).resolve().parents[2]
PIN='f0b40a2d93283da52813315f1880f263ee3bef0b'
FILES={
 'sans':'fonts/noto-sans-sc/NotoSansSC-Regular.otf',
 'bold':'fonts/noto-sans-sc/NotoSansSC-Bold.otf',
 'serif':'fonts/noto-serif-sc/NotoSerifSC-Regular.ttf',
 'latin':'fonts/newsreader/Newsreader-Regular.ttf',
 'italic':'fonts/newsreader/Newsreader-Italic.ttf',
 'mono':'fonts/jetbrains-mono/JetBrainsMono-Regular.ttf'
}
DEST=ROOT/'.cache/film-fonts'
def fetch(item):
 key,relative=item
 dest=DEST/Path(relative).name
 if not dest.exists():
  request=urllib.request.Request('https://raw.githubusercontent.com/Su3037/learning-clustering/'+PIN+'/'+relative,headers={'User-Agent':'Learning-Partitioning-film'})
  dest.write_bytes(urllib.request.urlopen(request,timeout=90).read())
 actual=hashlib.sha256(dest.read_bytes()).hexdigest()
 manifest=ROOT/'video/home/font-manifest.json'
 if manifest.exists():
  expected=json.loads(manifest.read_text())[key]['sha256']
  if actual!=expected:raise ValueError('Rendering font checksum mismatch: '+dest.name)
 return key,{'file':dest.name,'source':relative,'sha256':actual}
if __name__=='__main__':
 DEST.mkdir(parents=True,exist_ok=True)
 with ThreadPoolExecutor(max_workers=6) as pool:manifest=dict(pool.map(fetch,FILES.items()))
 (DEST/'manifest.json').write_text(json.dumps(manifest,indent=2))
 print('Rendering fonts ready:',', '.join(manifest))
