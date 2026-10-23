# Vehicle showroom review

The vehicle browsing and detail experience is ready for review. Do not publish or merge into the production branch until publication is approved.

## Preview locally

Run `npm ci`, then `npm run build` and `npm start`. A database is not required for the explicit demo routes; real inventory and authenticated workflows require the existing private environment configuration. Never commit environment files.

- `/vehicles?demo=1`: three fictional, clearly labeled demo vehicles.
- `/vehicles/demo-city`: compact city EV detail and practice request.
- `/vehicles/demo-touring`: crossover detail and practice request.
- `/vehicles/demo-family`: seven-seat SUV detail and practice request.
- `/vehicles`: approved live inventory, or a labeled demo showroom when no eligible inventory exists. A separate notice appears if the inventory query fails.

## Walkthrough

1. Choose an area and dates, then filter by budget, range, or trip style. Date selection calculates an estimate; it does not promise availability.
2. Save a vehicle using its heart button. Favorites stay in this browser, without an account.
3. Select two or three comparison boxes and open the comparison table.
4. Open a vehicle, enlarge its illustration, inspect its seats and range, and adjust the daily mileage guide.
5. Select pickup and return dates, then try a demo request. The result explains the real fleet review process. Demo actions save no request and collect no payment; the server also rejects direct demo booking attempts.
6. For a real vehicle, sign in or register to request it. The return path retains the vehicle and selected dates; final rental pricing is calculated on the server.

## Research and design decisions

- SIXT's premium presentation and electric-vehicle guidance informed the clean imagery and clear EV details: https://www.sixt.com/ and https://www.sixt.com/help-center/articles/can-i-rent-an-electric-or-hybrid-car-with-sixt/
- Turo's electric rental browsing informed the vehicle-first cards and date/location selection: https://turo.com/us/en/electric-vehicle-rental/united-states
- EV Access adds a side-by-side comparison, an estimated range planning guide, transparent rental-only estimates, and an account-free walkthrough. These are design hypotheses to validate with users, not proven profit improvements.
- No claim is made that any benchmark is the most profitable rental app. Original brand logo design is unchanged; the established navy/teal palette is retained.

## Validation and remaining needs

34 automated tests pass, including date calculation, invalid dates, internal-only authentication redirects, and preventing demo bookings. The production build passes. HTTP smoke checks pass for catalog, detail, image, authentication return path, and missing demo IDs.

Before production launch, replace fictional inventory with approved fleets and actual vehicle photos; agree accurate range, charging, mileage, insurance, deposit, tax and cancellation terms. The current schema supports one photo per vehicle; multi-angle/interior galleries require extending that schema and upload controls. Saved favorites currently belong to a browser, not a user account. Catalog filtering currently applies to up to 60 retrieved listings and will need server pagination as inventory grows. Real authenticated customer/partner/admin workflows must be tested with the configured database before launch. No payment integration or confirmed instant-booking capability is introduced here.
