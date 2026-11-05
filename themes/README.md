# Nifti theme gallery

`themes/index.html` loads the real app (demo data) in a frame and lets you switch between 10 visual themes and jump to any of the 22 tabs, on desktop or phone size. Live at `/themes/` on the Pages site.

- `neutral.css` (generated from the app's CSS): swaps hard-coded beige/brown colours for theme tokens.
- `base.css`: the theme engine. Maps every component (sidebar, top bar, cards, tiles, tables, tabs, chips, buttons, pills, fields) to tokens.
- `t01…t10-*.css`: each theme sets fonts, colours, spacing and its own signature details.

Nothing here changes the production app. Themes apply only when `<html data-th="…">` is set, so adopting one later means loading these files and setting that attribute.
