# Fleet imports and vehicle photo uploads

Entry points: `/partners` → **Upload your fleet**, and the approved partner dashboard → **Upload fleet CSV**. `/partner/fleet` explains the process publicly and unlocks the importer for an approved account with current insurance. `/partner/add-vehicle` supports direct cover-photo uploads as well as existing HTTPS photo links.

## Partner flow

1. Download `/fleet-import-template.csv` and replace the example row with actual vehicle information.
2. Choose a CSV with 1–50 vehicles, up to 256 KB. Required columns are make, model, year, vin, plate, vehicleType, seats, rangeMiles, dailyRate, city, insuranceExpires and registrationExpires. Optional columns are imageUrl, description, tlcEligible and tlcPlate. Dates use YYYY-MM-DD; dailyRate is in dollars without currency symbols.
3. Review the parsed listings and optionally upload one cover photo for each. JPEG, PNG and WebP are supported up to 3 MB. HEIC must be converted first.
4. Run server checks, confirm authorization and accuracy, then submit. A transaction saves all vehicles as PENDING, or none. Existing VINs/plates and duplicates within the file block the import.
5. Review submitted vehicles in the dashboard. Admins see the cover photos in vehicle reviews. Approved, current listings and their photos become customer-visible.

## Storage and access

Photo bytes use Netlify Blobs. The existing PostgreSQL imageUrl field stores the serving route, so this change needs no schema migration. Credentials remain in the platform runtime. Build-time EV_PHOTO_SCOPE separates production from each preview deploy; no database content or account data is stored in Blobs.

Photo uploads require the existing authenticated partner session, approved status, current insurance and a same-origin request. Files are decoded and re-encoded as WebP, stripping uploaded metadata, with a 25-megapixel input limit and maximum output dimensions of 1600 × 1200. Each photo has a random key under its owning partner. Pending and unattached photos are available only to that owner and admins. Anonymous access requires a matching approved listing and current fleet/vehicle documents.

Only vehicle cover photos belong in this workflow. Insurance policies, IDs and private documents must not be uploaded as cover photos. Removing a selection does not delete its stored object; abandoned uploads need a retention/cleanup policy as usage grows. Current upload controls do not provide multi-angle galleries, listing edits or bulk updates to existing vehicles.

## Validation

54 tests pass, including CSV edge cases, import authorization, duplicate detection, transactional failure handling, pending status enforcement, image decoding, oversized/disguised file rejection, private photo reads and preview storage scope. The production build passes. Local HTTP checks verify the public entry points, template, sign-in gate and rejection of anonymous upload/import POSTs. Dependency audit reports are checked separately.

A real authenticated upload/import against Netlify Blobs and PostgreSQL still requires an approved test partner account. No fictional partner, vehicle or booking was added to production for verification.
