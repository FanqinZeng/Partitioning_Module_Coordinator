#!/usr/bin/env python3
"""Serve under the same project subpath as GitHub Pages, including from an offline bundle."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os
import sys
ROOT=Path(__file__).resolve().parent
if ROOT.name=='scripts':ROOT=ROOT.parent
PREFIX='/Partitioning_Module_Coordinator'
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm'}
    def translate_path(self,path):
        from urllib.parse import unquote,urlsplit
        decoded=unquote(urlsplit(path).path)
        if decoded==PREFIX:decoded='/'
        elif decoded.startswith(PREFIX+'/'):decoded=decoded[len(PREFIX):]
        self.path=decoded
        return super().translate_path(decoded)
if __name__=='__main__':
    os.chdir(ROOT/'site')
    port=int(sys.argv[1]) if len(sys.argv)>1 else 8790
    print(f'http://127.0.0.1:{port}{PREFIX}/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
