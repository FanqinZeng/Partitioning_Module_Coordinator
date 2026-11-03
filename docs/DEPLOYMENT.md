# Build and deployment

The GitHub Pages workflow builds `site/`, runs the engine and independent Python checks, audits local links, and uploads the generated artifact including offline downloads. Pull requests validate without deploying.

In repository Settings → Pages, select GitHub Actions as the build source. Production URL:

https://fanqinzeng.github.io/Partitioning_Module_Coordinator/

Local preview uses the same subpath:

```sh
python3 scripts/build.py
python3 scripts/serve.py
```

All application links and runtime assets use relative paths. Films and original decks remain author-hosted external resources. Copying `site/` to another static host preserves the course; the included local server also serves the project at the expected path.
