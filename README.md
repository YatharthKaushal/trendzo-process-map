# Trendzo · Process map

Pannable, zoomable map of how Trendzo (internally closetx) works, split in two halves on one canvas:

- **Top: built today.** Every automatic step and every step a person must do (retailer accepts, admin desks, COD cash, KYC, refunds, payouts, GST).
- **Bottom: proposed.** What to add, automate, modify or remove, with a big block on **GST and tax compliance for retailers**.

Time runs left to right in 8 stages. Rows are who or what does the step. Click any node or arrow for its role, purpose,
responsibility, gaps and, on the bottom half, what changes compared with today. The Glossary button explains every abbreviation.

Static page, no build: `index.html` + `style.css` + `data.js` + `app.js` + `fonts/`. All content is in `data.js`.

## Run locally
    python -m http.server 8080      # open http://localhost:8080
(or double-click `index.html`)

## Deploy
Vercel: import the repo, Framework Preset *Other*, leave build and output empty (`vercel.json` sets them).
Render: New > Static Site (or Blueprint with `render.yaml`), Publish Directory `.`.

## Notes
Built from a read-only review of the closetx repo. Items inferred rather than seen in code are marked **Assumed**.
Internally the top half uses `section: 'manual'` and the bottom half `section: 'auto'`; labels come from `meta` in `data.js`.

## Document page
`doc.html` is a read-only rendering of the GST build-vs-buy note (the markdown source is kept outside this repo).
Rebuild from the project folder with `python trendzo-docs/build_doc_page.py`.
