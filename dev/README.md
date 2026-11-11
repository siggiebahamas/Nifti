# dev/ — everything needed to keep building Nifti
- `src/`: patch modules and JS/CSS sources that build `../Nifti_Sept17.html`. First run `git show 3bb6f02:Nifti_Sept17.html > dev/src/base.html`, then from `dev/src/`: `python3 apply.py u1_data u2_shell u3_demo_stock u4_books u5_polish u6_i18n u7_more u8_plans u9_books2 u10_site u11_pricelock u12_stockrun u13_mhome u14_polish u15_round6 u16_round7 u17_round8 u18_round9 u19_round10 u20_round11 u21_round12 u22_round13 u23_round14 u24_round15 u25_round16 u99_dates`.
- `tools/`: `check.py` (structure check: `python3 check.py big.js && node --check big.js`), `sql.sh` (runs SQL through the Supabase Management API; needs env `SUPABASE_ACCESS_TOKEN`), `dump.py`.
- `sql/`: migration parts (part0–part4d, already applied live), rollback-only tests (`test_*.sql`), `live/` dumps of every function, table, policy, trigger and cron job, `function_defs_before_changes/`.
- `edge_functions/`: source of the Supabase edge functions.
- `i18n/`: Filipino translation batches (merged into `src/i18n_fil.js`).
- `tests/`: Playwright end-to-end scripts.
See `../NIFTI_HANDOVER_FOR_NEW_CHAT.md` for the full picture.
