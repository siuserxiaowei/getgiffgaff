# Privacy-safe original-data protocol

Status: protocol only. No samples were collected in this run.

## Universal rules

- Obtain informed contributor permission before retaining a sample.
- Assign a random sample ID; do not retain names, phone numbers, ICCIDs, order IDs, account identifiers or exact addresses.
- Never collect passwords, OTP contents, cookies, session tokens, complete payment-card data, eSIM activation strings, QR payloads or modified-App artifacts.
- Keep city-level location only. Do not retain GPS coordinates, street addresses or a combination of fields that identifies a person.
- Record successes and failures under the same method. Do not delete inconvenient failures.
- A reviewer must approve a sample before it counts toward a publication threshold.
- A dated result is an observation in its recorded environment, not a nationwide, permanent or platform-wide guarantee.

## Network and ordinary SMS dataset

Required fields:

`sample_id`, `observed_at`, `city`, `device_model`, `market_variant`, `os_version`, `sim_form`, `network_selection` (`automatic` or `manual`), `registered_network`, `voice_result`, `ordinary_sms_inbound_result`, `ordinary_sms_outbound_result`, `data_result`, `attempt_count`, `wait_window_minutes`, `failure_stage`, `review_status`, `reviewed_at`.

Publication gate:

- At least 30 approved observations from the most recent 90 days.
- At least three cities.
- At least three device/OS combinations.
- Both automatic and manual network-selection environments.
- Ordinary SMS baseline present on every included row.

Subgroups below five observations may list records but must not publish a percentage. Report the denominator, failure count, coverage and newest sample date next to any aggregate.

## Exact-device eSIM dataset

Required fields:

`sample_id`, `reviewed_at`, `device_model`, `market_variant`, `os_version`, `carrier_lock_state`, `native_esim_support_source`, `giffgaff_app_version`, `official_path_available`, `result` (`meets-current-prerequisites`, `does-not-meet`, `needs-review`), `source_checked_at`, `expires_at`, `review_status`.

Publication gate:

- At least 20 approved, unexpired records.
- Exact model and market variant required; a family name is insufficient.
- Only native eSIM and the official giffgaff App path are in scope.

Modified APKs, hooks, QR extraction, manual activation strings and third-party write-card workflows are out of scope and must not be stored as samples.

## OTP dataset

Required fields:

`sample_id`, `observed_at`, `platform_category`, `request_type`, `city`, `device_model`, `os_version`, `network_environment`, `ordinary_sms_baseline`, `attempt_count`, `wait_window_minutes`, `result` (`received`, `timeout`, `platform-rejected`, `rate-limited`, `not-tested`), `failure_stage`, `review_status`, `reviewed_at`.

Publication gate:

- At least 50 approved events.
- At least five platform categories.
- At least five events per platform category.
- At least three environment classes.
- Ordinary SMS baseline present for every event.

Even after the gate passes, report only a dated sample ratio. Do not call it permanent compatibility or promise delivery. Do not publish instructions to evade platform risk controls.

## Storage and deletion decision gate

No collection begins until the owner has separately approved:

- private storage location and access list;
- retention and deletion period;
- contributor notice and withdrawal process;
- aggregation and de-identification review;
- public privacy disclosure consistent with the actual dataset.

Until these facts exist, the three data routes remain noindex and only this method may be discussed.
