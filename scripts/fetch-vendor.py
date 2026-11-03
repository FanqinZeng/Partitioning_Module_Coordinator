"""Reproduce the small, pinned, offline runtime and typography dependencies.
Only these licensed files are redistributed; student submissions are linked.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import json
import hashlib

ROOT = Path(__file__).resolve().parents[1]
PIN = 'f0b40a2d93283da52813315f1880f263ee3bef0b'
BASE = 'https://raw.githubusercontent.com/Su3037/learning-clustering/' + PIN + '/'

def fetch(pair):
    source, target = pair
    req = urllib.request.Request(BASE + source, headers={'User-Agent': 'Learning-Partitioning-build'})
    data = urllib.request.urlopen(req, timeout=60).read()
    dest = ROOT / target
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return target, len(data)

if __name__ == '__main__':
    manifest=json.loads((ROOT/'scripts/vendor-manifest.json').read_text())
    pairs=[(item['source'],item['target']) for item in manifest]
    expected={item['target']:item['sha256'] for item in manifest}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for target, size in pool.map(fetch, pairs):
            actual=hashlib.sha256((ROOT/target).read_bytes()).hexdigest()
            if actual!=expected[target]:raise ValueError('Checksum mismatch: '+target)
            print(target, size)
