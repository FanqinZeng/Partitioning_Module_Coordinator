import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
from checker import check_lab
for lesson in ['02','03','04','05','06','07','08']:
    path=ROOT/'python'/lesson
    ref=check_lab(lesson,(path/'reference.py').read_text())
    assert ref['passed'],(lesson,ref)
    starter=check_lab(lesson,(path/'starter.py').read_text())
    assert not starter['passed'] and starter['incomplete'],(lesson,starter)
    # A plausible but wrong numeric implementation must fail.
    if lesson=='02':
        broken=(path/'reference.py').read_text().replace('return sum(w for u,v,w in edges if assignment[u] != assignment[v])','return 0')
        assert not check_lab(lesson,broken)['passed']
    print(f'Lesson {lesson}: reference {len(ref["checks"])} checks including 120 seeded cases PASS; TODO incomplete PASS')
