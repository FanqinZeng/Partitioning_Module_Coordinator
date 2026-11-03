#!/usr/bin/env python3
"""Serve under the same project subpath as GitHub Pages, including from an offline bundle."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os
import re
import sys
ROOT=Path(__file__).resolve().parent
if ROOT.name=='scripts':ROOT=ROOT.parent
PREFIX='/Partitioning_Module_Coordinator'
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm'}
    def send_head(self):
        self.byte_range=None
        path=Path(self.translate_path(self.path))
        if path.suffix.lower()!='.mp4' or not path.is_file():
            return super().send_head()
        size=path.stat().st_size
        start,end=0,size-1
        requested=self.headers.get('Range')
        if requested:
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',requested.strip())
            valid=bool(match and any(match.groups()))
            if valid:
                first,last=match.groups()
                if first:
                    start=int(first)
                    end=min(int(last),size-1) if last else size-1
                else:
                    start=max(0,size-int(last))
                valid=start<size and start<=end
            if not valid:
                self.send_response(416)
                self.send_header('Content-Range',f'bytes */{size}')
                self.send_header('Content-Length','0')
                self.end_headers()
                return None
        stream=path.open('rb')
        stream.seek(start)
        self.byte_range=(start,end)
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type','video/mp4')
        self.send_header('Accept-Ranges','bytes')
        self.send_header('Content-Length',str(end-start+1))
        self.send_header('Last-Modified',self.date_time_string(path.stat().st_mtime))
        if requested:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.end_headers()
        return stream
    def copyfile(self,source,outputfile):
        if self.byte_range is None:return super().copyfile(source,outputfile)
        remaining=self.byte_range[1]-self.byte_range[0]+1
        while remaining:
            block=source.read(min(65536,remaining))
            if not block:break
            outputfile.write(block)
            remaining-=len(block)
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
