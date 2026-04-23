# Azure App Service Deployment Fix — Status & Next Steps

**Goal:** Get the live Next.js app responding at the Azure App Service URL.

**URL:** `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`

**App Service:** `epf-experimental-sandbox-playground` (Linux, Node 22, B1, Southeast Asia)

---

## Current Approach (as of 2026-04-22, commit `05d262e`)

### `web/next.config.js`
```js
const nextConfig = { output: 'standalone' };
```

### `web/server.js` (deployed as entry point)
- Deletes `process.env.HOSTNAME` (Azure sets this to internal container hostname; Next.js binds to it and fails the nginx health check)
- Uses programmatic Next.js API: `next({ dev: false, dir: __dirname })`
- Compatible with standalone output because `next` package and `.next/` are both present in the deploy root

### Packaging step in `web.yml`
1. Copy `.next/standalone/.` → `deploy/`
2. Copy `.next/static` → `deploy/.next/static`
3. Copy `public/` → `deploy/public/`
4. Copy `web/server.js` → `deploy/server.js` (overrides generated standalone entry, guarantees HOSTNAME fix)
5. Zip `deploy/` → `deploy.zip`

### Deploy step
```yaml
- uses: azure/webapps-deploy@v3
  with:
    app-name: epf-experimental-sandbox-playground
    publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
    package: ${{ github.workspace }}/deploy.zip
```
No `startup-command` (not supported with publish-profile auth). Azure auto-detects `server.js`.

---

## History of Attempts

| Commit | Approach | Failure |
|--------|----------|---------|
| `4fa9c6a` | Standalone output, patch package.json start | NODE_PATH issues |
| `012a5ce` | Full web/ dir, `next start` | Oryx re-ran build, overwrote .next/ |
| `c744de7` | Programmatic API + zip full web/ | Oryx re-ran build |
| `754782c` | Added Kudu pre-step to disable Oryx | Kudu URL regex never matched; URLError unhandled |
| `4e81269` | Fixed Kudu URL regex | DNS unreachable from GitHub Actions runners |
| `ee92865` | Caught URLError as non-fatal | Kudu still useless; removed |
| `12198c9` | Standalone + prepend HOSTNAME fix to generated server.js | Generated server.js not at expected path |
| `9c2cd1e` | Copy web/server.js instead of patching generated | `startup-command` param rejected |
| `05d262e` | Remove `startup-command` | **In progress — not yet confirmed** |

---

## If Current Approach Still Fails — Next Diagnostics

1. **Check App Service logs** in Azure Portal → App Service → Log stream or Diagnose and solve problems
2. **Verify `.next/standalone/` structure** — add a `ls -R web/.next/standalone/ | head -30` step after build to confirm what Next.js 16 actually generates
3. **Check Oryx interference** — if the standalone `package.json` has no `build` script, Oryx should be harmless. Verify by checking App Service → Advanced Tools (Kudu) → Environment

## If Deployment Succeeds But App Errors

- Check that App Service application settings include: `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, `AZURE_STORAGE_CONNECTION_STRING`
- These are set in Azure Portal → App Service → Configuration → Application settings

---

## Remaining Work After Deployment Is Confirmed

- [ ] Verify live URL responds with the home page
- [ ] Test template wizard end-to-end (submit a deployment)
- [ ] Test My Stuff page lists resource groups
- [ ] Wire up Microsoft SSO once admin provides App Registration credentials (currently blocked)
