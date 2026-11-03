# Third-party files served with the course

| Path | What | Version | Licence |
| --- | --- | --- | --- |
| `pyodide/` | [Pyodide](https://pyodide.org): CPython compiled to WebAssembly, used by the in-browser code lab. Core files only (no extra packages). Loaded only when a learner first presses Run. | 0.28.3 (npm `pyodide`) | Mozilla Public License 2.0; CPython itself under the PSF License |

The runtime is unmodified, retained from Learning Clustering at the revision in THIRD_PARTY_NOTICES.md. This course uses a native accessible textarea rather than bundling CodeMirror. The optional fetch-vendor.py script verifies the pinned dependency checksums in vendor-manifest.json.
