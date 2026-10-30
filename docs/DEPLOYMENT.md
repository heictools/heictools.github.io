# Deploy a dedicated GitHub Pages site

## Account and security

The current deployment uses **heictools**, already authenticated in gh. For a new
identity, create a GitHub account with an available, descriptive username and a
project-specific email address. Verify email. Follow GitHub's account policies;
do not create identities to evade limits. Use a unique password or passkey, enable
two-factor authentication under Settings → Password and authentication, and store
recovery codes safely offline. Account security must be configured by the owner;
the repository setup does not prove 2FA is enabled.

Authenticate the dedicated account:

```sh
gh auth login --hostname github.com --git-protocol https --web
gh auth switch --user heictools
gh auth status
```

Git commit identity is separate from gh authentication. In this checkout use the
dedicated account's public noreply email, rather than your personal identity:

```sh
git config user.name heictools
git config user.email 350096644+heictools@users.noreply.github.com
```

For another account, obtain its ID from `gh api user --jq .id` and substitute both
ID and username. Do not commit personal tokens. GitHub Actions uses GITHUB_TOKEN.

## Repository and configuration

1. Create a **public** repository named exactly `USERNAME.github.io`. For this
   account: `heictools/heictools.github.io`. Public Pages is available on GitHub Free.
2. Set `site.config.mjs` to your actual origin and repository/contact URLs. Leave
   donationUrl empty until you have a real support account. Update the social card
   and README links if rebranding.
3. Add the project files, including package-lock.json, third-party sources, and
   `.github/workflows/pages.yml`. Do not commit node_modules, dist, or credentials.
4. Set the default branch to `main` and push. For a new empty remote:

```sh
git init -b main
git add .
git commit -m "Build private HEIC to JPG converter"
gh repo create heictools/heictools.github.io --public --source=. --remote=origin
git push -u origin main
```

Do not run `repo create` again when the repository already exists; clone it instead.

## Pages and deployment

1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. In **Actions**, enable workflows if needed. Run **Test and deploy GitHub Pages**
   manually, or push to main. Tests must pass before the deploy job runs.
4. Open the `github-pages` environment/deployment URL. The expected address is
   **https://heictools.github.io/**. The site requires no server or secret API key.
5. In Pages settings ensure **Enforce HTTPS** is enabled. Default github.io domains
   use HTTPS; a custom domain requires its own DNS validation/certificate setup.
6. If initial deployment failed before Pages was enabled, rerun the workflow.

The workflow gives build only read access. The deploy job has pages:write and
id-token:write, uses the protected github-pages environment, and runs only for main.
Pull-request code cannot deploy via this workflow. Consider branch protection and
review requirements as the contributor team grows.

### Optional branch deployment

The recommended route is Actions. If you require branch deployment, run `npm ci`
and `npm run build`, publish the **contents of dist** to a separate `gh-pages`
branch, and set Pages to deploy from that branch's root. Do not point Pages at the
source root: it contains the source generator, not the built index.html. Disable
the included Actions deploy workflow to avoid two publishing systems competing.
Preserve `.nojekyll` and all vendor/license files.

## Verify the live site

- Open every landing page and `/privacy/` from an incognito window.
- Select a real HEIC photo, convert, inspect orientation/color, and download it.
- Test several photos with a corrupt item and duplicate names; open the ZIP.
- Confirm resize dimensions and ensure the interface is usable on your phone.
- In DevTools → Network, inspect a conversion. Requests should fetch same-origin
  static code only. No photo POST/PUT requests, external decoder services, or pixels.
- Check `/robots.txt`, `/sitemap.xml`, canonical URLs, and view-source page content.
- Check no mixed-content or JavaScript errors, and that HTTPS redirects work.
- Run the browser suite against BASE_URL for automated deployment verification.

## Updates, costs, and policy

Edit source, test/build locally, commit, and push to main. The workflow tests and
publishes a new artifact. Watch the Actions run and verify the deployment URL.
Use `git revert` for a faulty commit and push to restore the preceding behavior.

[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
include a 1 GB published-site limit, a soft 100 GB/month bandwidth limit, and
restrictions on commercial use. This build is far below the size limit. A roughly
3 MB decoder makes repeat caching useful, but substantial traffic still consumes
host bandwidth. Public-repository standard hosted Actions and public Pages can be
used without paid hosting; review current plan terms before changing visibility,
runner type, or usage. Do not claim unlimited hosting or bandwidth.

The project is a free open-source utility with no paid features or commerce. This
appears consistent with project hosting, but it is not an individual approval from
GitHub. Keep support voluntary and external. Move to appropriate hosting if the
project becomes a business/commercial SaaS or GitHub requests it.
