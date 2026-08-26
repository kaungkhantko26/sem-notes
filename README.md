# Note Lab

Kindle-style note reader for 2nd semester modules. Plain HTML/CSS/JS — no build step, no dependencies.

## Modules

| Module | Code | Status |
| --- | --- | --- |
| Fundamentals of Artificial Intelligence | AI | 6 units |
| Programming Fundamentals | PRG | scaffold (add notes) |
| Database Management Systems | DB | scaffold (add notes) |
| Computer Networking | NET | scaffold (add notes) |

## Features

- Light / Sepia / Dark themes
- Adjustable font size and serif/sans font
- Progress bar + per-unit reading position memory
- Swipe left/right between units (mobile)
- Table of contents drawer with search
- Fully responsive, phone-first

## Reading notes

Open `https://kaungkhantko26.github.io/sem-notes/` (after enabling GitHub Pages) or run locally:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Adding notes to a module

1. Open the module's data file, e.g. `data/database.js`
2. Add a unit object:

```js
{
  id: 'u02',
  num: 2,
  title: 'Unit 2 - Your Title',
  md: '## Heading\n\nYour **markdown** here...'
}
```

Markdown supported: headings, bold, italic, code, lists, tables, quotes.
