"""Audit actual generated paths, anchors, assets and bilingual structure."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
import re
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.path=path;self.ids=set();self.links=[];self.lang=None;self.headings=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id'in a:
            assert a['id'] not in self.ids,('duplicate id',self.path,a['id'])
            self.ids.add(a['id'])
        if tag=='html':self.lang=a.get('lang')
        for key in ['src','href']:
            if key in a:self.links.append(a[key])
pages={}
for f in SITE.rglob('*.html'):
    p=Page(f);p.feed(f.read_text());pages[f.resolve()]=p
assert len(pages)==30,len(pages)
checked=0
for file,p in pages.items():
    assert p.lang in ['zh-CN','en']
    for link in p.links:
        url=urlsplit(link)
        if url.scheme or url.netloc:continue
        target=(file.parent/unquote(url.path)).resolve() if url.path else file
        assert target.is_relative_to(SITE.resolve()),('escaped site root',file,link)
        assert target.exists(),('broken link',file,link)
        if url.fragment and target in pages:assert unquote(url.fragment) in pages[target].ids,('missing anchor',file,link)
        checked+=1
catalog=json.loads((SITE/'data/course.json').read_text())
assert len(catalog)==7
for m in catalog:
    assert len(m['sections'])==7 and len(m['objectives'])==6 and 5<=len(m['terms'])<=9
    for lang in ['zh','en']:
        slides=json.loads((ROOT/f"content/modules/{m['id']}.slides.{lang}.json").read_text())
        assert len(slides)==12 and all(s['transcript'] for s in slides)
    for prefix in ['', 'en/']:
        text=(SITE/f"{prefix}modules/{m['id']}-{m['slug']}/index.html").read_text()
        assert text.count('class="web-slide"')==12
        for anchor in ['goals','terms','reading','slides','lab','challenges','code','mistakes','resources']:assert f'id="{anchor}"'in text
for f in (SITE/'assets').glob('*.js'):
    for spec in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]",f.read_text()):
        if spec.startswith('.'):assert (f.parent/spec).resolve().is_file(),(f,spec)
assert (SITE/'vendor/pyodide/pyodide.asm.wasm').stat().st_size>8000000
print(f'{len(pages)} pages, {checked} local links and anchors, 14 lesson mirrors, 168 web slides, JS imports and Python runtime PASS')
