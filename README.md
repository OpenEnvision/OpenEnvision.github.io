# OpenEnvision Official Website

OpenEnvision is a dependency-free static website built with HTML, CSS, and JavaScript. It can be published directly with GitHub Pages without an npm build step.

## Publish with GitHub Pages

This repository includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which automatically deploys the complete site whenever the `main` branch is updated.

1. Create a GitHub repository and upload this folder to its `main` branch.
2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push a commit to `main`, or open **Actions → Deploy OpenEnvision to GitHub Pages → Run workflow**.

The workflow verifies the required entry files, uploads the static site, and publishes it to the `github-pages` environment.

### First push from this folder

After creating an empty repository on GitHub, replace the placeholders below and run:

```bash
git init
git add .
git commit -m "Deploy OpenEnvision website"
git branch -M main
git remote add origin https://github.com/<owner>/<repository>.git
git push -u origin main
```

If the folder is already connected to a Git repository, skip `git init` and `git remote add origin`.

### Site address

- Repository named `<owner>.github.io`: `https://<owner>.github.io/`
- Any other repository: `https://<owner>.github.io/<repository>/`

All internal website links use relative paths, so both address formats are supported.

## Local preview

From the repository root, run:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Optional custom domain

Configure the domain under **Settings → Pages → Custom domain**. If GitHub asks for a `CNAME` file, add it at the repository root with only the domain name as its content.

## Alternative branch deployment

The root-level `.nojekyll` file also supports **Deploy from a branch → main → /(root)**. Use either branch deployment or the included Actions workflow as the Pages source, not both.
