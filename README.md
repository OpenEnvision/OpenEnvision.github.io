# OpenEnvision Official Website

This repository contains the static website for OpenEnvision. It is organized as a lightweight
official site: plain HTML pages, shared CSS, shared JavaScript, and versioned public assets.

## Site Pages

- `index.html` — home page
- `team.html` — team and global partnership network
- `news.html` — latest updates
- `research.html` — research directions
- `publications.html` — publication records
- `code-datasets.html` — code, models, and dataset resources
- `join-us.html` — collaboration and contact information

## Project Structure

```text
.
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── data/
│   │   ├── highlight-countries.js
│   │   └── highlight-united-kingdom.js
│   ├── img/
│   │   ├── backgrounds/
│   │   ├── brand/
│   │   ├── contact/
│   │   └── partners/logos/
│   └── js/
│       └── main.js
├── code-datasets.html
├── index.html
├── join-us.html
├── news.html
├── publications.html
├── research.html
└── team.html
```

## Local Preview

Run a local static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Maintenance Notes

- Shared visual styles live in `assets/css/styles.css`.
- Shared interactions live in `assets/js/main.js`.
- Brand marks live in `assets/img/brand/`.
- Partner and contact logos should stay under `assets/img/` rather than the site root.
- Keep page-level HTML files in the root so GitHub Pages can serve them directly.
