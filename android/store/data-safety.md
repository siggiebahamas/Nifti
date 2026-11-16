# Data safety form (Play Console → App content → Data safety)

Answer exactly like this.

**Does your app collect or share any of the required user data types?** Yes
**Is all of the user data collected by your app encrypted in transit?** Yes
**Do you provide a way for users to request that their data is deleted?** Yes (in the app: Settings → Your data → Delete my business account; or email)
**Account deletion URL:** https://siggiebahamas.github.io/Nifti/privacy.html (section "Your rights")

**Shared with third parties?** No for every type below. (Supabase is our service provider that stores the data for us; Google counts that as "collected", not "shared".)

| Data type (Play's name) | Collected | Required or optional | Why (Play's purposes) |
|---|---|---|---|
| Personal info → Name | Yes | Required | Account management, App functionality |
| Personal info → Email address | Yes | Required | Account management, App functionality |
| Personal info → Phone number | Yes | Optional | App functionality (customer and supplier numbers, Viber senders) |
| Financial info → Purchase history | Yes | Optional | App functionality (orders and payments the business records) |
| Financial info → Other financial info | Yes | Optional | App functionality (amounts owed, expenses, bank deposits the business records) |
| Messages → Other in-app messages | Yes | Optional | App functionality (Viber messages from business chats, team chat) |
| Photos and videos → Photos | Yes | Optional | App functionality (receipts, delivery proof, Viber photos) |
| Files and docs | Yes | Optional | App functionality (invoices and files sent on Viber) |
| Contacts | Yes | Optional | App functionality (only the saved number of a person who messaged on Viber, to know which customer it is; the contact list itself never leaves the phone) |
| App activity → Other actions | Yes | Required | App functionality (activity log: who changed what) |
| App info and performance → Crash logs / Diagnostics | Yes | Required | App functionality |
| Device or other IDs | Yes | Required | App functionality (a device key made for that phone, to connect it to the business) |

**Not collected:** location, health, web browsing, calendar, audio, SMS/call logs, advertising ID. No ads, no analytics SDKs.

**Is data processed ephemerally?** No (it's stored for the business).
