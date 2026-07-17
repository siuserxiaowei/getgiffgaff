# GSC read-only handoff

Status: prepared but not executed. This run did not create a Google Cloud project, service account, credential, Search Console user or API request.

## Important permission clarification

Google documents a **Full user** as having view rights to all data **and the ability to take some actions**, including sitemap submission and several other Search Console actions. Therefore the UI role is not intrinsically read-only.

The approved safety model is two layers:

1. Grant the dedicated service account `Full user`, not `Owner`, because URL Inspection access is required.
2. Enforce application read-only behavior by requesting only `https://www.googleapis.com/auth/webmasters.readonly` and allowlisting only read endpoints.

Do not call sitemap submit/delete, URL removals, Indexing API, fix validation, property settings or user-management endpoints. A later operator must review the endpoint log after every run.

## Future authorization sequence

Only after a new explicit execution authorization:

1. Create a dedicated Google Cloud project and service account for this site.
2. Enable only the Google Search Console API. Do not enable or configure the Indexing API for this workflow.
3. Store the downloaded JSON credential at:
   `/Users/siuserxiaowei/.config/getgiffgaff/gsc/service-account.json`
4. Set directory/file permissions to owner-only (`0700` directory, `0600` credential). Never print the private key or commit the file.
5. In Search Console, add the service-account email as a **Full user**, not Owner.
6. Confirm the visible property list. Prefer `sc-domain:getgiffgaff.com`; if absent, use `https://getgiffgaff.com/`. If neither exists, stop without creating or verifying a property.
7. Run one site-list request and confirm the returned permission. Do not proceed if the property is wrong.
8. Execute only the read matrix below.

## Allowed endpoint matrix

| Purpose | Endpoint/method | Scope |
|---|---|---|
| List accessible properties | Search Console `sites.list` | `webmasters.readonly` |
| Read performance rows | Search Analytics `searchanalytics.query` | `webmasters.readonly` |
| Read sitemap status | `sitemaps.list` only | `webmasters.readonly` |
| Inspect indexed version | URL Inspection `urlInspection.index.inspect` | `webmasters.readonly` |

The URL Inspection API reports the version in Google's index; it does not perform a live indexability test and must not be described as such.

## Forbidden endpoints and actions

- `sitemaps.submit` or `sitemaps.delete`;
- Indexing API publish/delete calls;
- URL removal, change of address, disavow, fix validation or user administration;
- property verification, ownership-token placement or DNS modification;
- Search Console UI changes of any kind;
- sitemap, canonical, robots or site-file changes triggered by the readback.

## Export definition

Use final data only and record the maximum final data date visible at run time. For both windows, make the end date the same and derive inclusive start dates:

- 28-day window: end date plus the preceding 27 days.
- 90-day window: end date plus the preceding 89 days.

Export each window with `type=web`, no country/device filter, and these dimensions:

1. `query`
2. `page`
3. `query,page`

Retain request metadata: property, start/end dates, `dataState=final`, dimensions, type, filters, pagination count, row count and collection timestamp.

Use `site:getgiffgaff.com` and public SERPs only as separate observations; never merge them into GSC totals.

## Non-brand definition

Preserve the raw export first. For the derived non-brand view, case-fold and exclude queries containing any of:

- `getgiffgaff`
- `get giffgaff`
- `get-giffgaff`
- `小玉`
- the exact domain `getgiffgaff.com`

Do **not** exclude `giffgaff` by itself: users searching for the operator plus a task are a core discovery audience for this independent site. Record the exclusion rule with every derived table.

## Derived metrics

- Non-brand clicks, impressions and weighted CTR.
- Average position exactly as returned by GSC; label it an average, not a rank guarantee.
- Top 10 query count: distinct query rows with impressions > 0 and position <= 10.
- Top 20 query count: distinct query rows with impressions > 0 and position <= 20.
- Owner-page CTR and average position for the seven provisional owner URLs.
- Same-query multi-URL count from `query,page`: distinct queries with impressions on more than one canonical site URL. This is an overlap signal, not automatic cannibalization.

## URL Inspection batch

Inspect exactly the 39 canonical URLs from the dated production sitemap. Retain:

- inspection URL and property;
- verdict and coverage state;
- robots, indexing and page-fetch states;
- user canonical and Google canonical;
- last crawl time and crawled-as value;
- API error, if any.

Do not request indexing. An inspection result is not proof that Google reread a just-changed production page.

## Private storage

Credential:

`/Users/siuserxiaowei/.config/getgiffgaff/gsc/service-account.json`

Raw and derived exports:

`/Users/siuserxiaowei/.local/share/getgiffgaff/seo/gsc/YYYY-MM-DD/`

Required files for a completed run:

- `run-manifest.json`
- `sites.json`
- `search-28-query.json`, `search-28-page.json`, `search-28-query-page.json`
- `search-90-query.json`, `search-90-page.json`, `search-90-query-page.json`
- `url-inspection-39.json`
- `derived-summary.json`
- `endpoint-audit.log`

The credential and raw exports stay outside Git. Only an aggregated, privacy-reviewed summary may later be copied into repository research documentation.

## Tooling caveat discovered in this review

The existing SEO helper scripts already request `webmasters.readonly`, but two details require review before use:

- `gsc_query.py` labels a default end date as a fixed three-day lag; the authorized run should instead record the current final-data date explicitly.
- `gsc_inspect.py` has a 403 error message that tells the user to add the service account as Owner. Google permission documentation shows Full user can use URL Inspection, so that message must not drive an Owner escalation. Prefer Full user and verify actual API access.

These observations are a future tooling brief only; the shared skill scripts were not modified in this project run.

## Acceptance gate

A GSC baseline is complete only when:

- the property and permission are recorded;
- all six 28/90-day exports exist with request metadata;
- 39/39 URL Inspection rows have a result or explicit API error;
- the endpoint audit contains only allowlisted read methods;
- no credential or raw export appears in Git;
- no sitemap/URL submission, Indexing API or backend setting change occurred.
