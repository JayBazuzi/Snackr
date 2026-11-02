# Snackr

## What it is

Snackr answers one question: "I'm hungry but don't know what I want. What's nearby?"

It takes your current location and gives you a short list of 5 to 10 snacks you can walk to right now. The list is deliberately varied, because you often don't know what you want until you see it. It's meant to be quick to glance at on a phone.

## How it should feel

- It's useful the moment it opens. You see ideas before you make any choices.
- A snack comes first, and the place second: "a slice of pizza" at a named place, not just a list of restaurants.
- Tapping a place starts walking directions.
- Only places that could be open right now appear.

## The controls

The choices you make most easily are the most visible, and the rest take a deliberate tap.

- **First line, always visible:** Surprise me, Sweet, Savory, Salty, Fresh and Cold.
- **Second line, one sentence:** "For any price, closest first." Price and sort order are dropdowns inside that sentence.

"Surprise me" mixes cravings so the list stays varied. Each item shows its walking time, price level, craving and hours.

If location isn't available, you can type a place instead.

## Decisions

- **It runs entirely in the browser.** There's no backend and nothing to keep running.
- **It's hosted on GitHub Pages.** That's free, and its HTTPS is what lets a phone browser share location.
- **It needs no keys or accounts.** This keeps it free and means there are no secrets to protect.
- **Place data comes from OpenStreetMap.** It has real places and hours, but no ratings and no dependable prices. Its public servers can be busy, so the app tries several.
- **Snack ideas come from simple rules, not AI.** The type of place decides the snack, craving and price level, so ice cream becomes Cold. This is free and instant, but the ideas are generic. We chose it over calling Claude. A place no rule understands is left out, so the app doesn't make up an idea.
- **Prices and walking times are estimates.** Prices are guessed from the type of place. Walking times come from straight-line distance plus an allowance for streets. The app says so.
- **Places with unknown hours stay in.** Places known to be closed are left out. Missing hours are common enough that hiding them would empty the list.

## Tools

- TypeScript, built with Vite.
- Vitest for tests.
- Prettier for formatting. A GitHub Action formats the code and pushes the result.
- GitHub Actions also build and test every push, and publish `main` to GitHub Pages.
- Habit Hooks checks code quality.

## If we change direction

- **Better data or sharper ideas:** Google Places would add ratings and price levels but needs a key and costs money. Claude could write better suggestions, but a shared version needs a small backend to hide the key, and without menu data its ideas are still guesses.
