# PLAN.md to keep track of tasks and for agentic coding tools

# D3: {game title goes here}

# Game Design Vision

{a few-sentence description of the game mechanics}

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics

- Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
- Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### STEPS

- [x] Spawn Cells across whole map
- [x] Player can Move
- [x] Ability to Track distance between player and cells
- [x] Player can only interact with cells within range of 3
- [x] Player can pick up 1 token at a time
- [x] PLayer can combine in hand with another token of equal value in cell
- [x] Player can place down token in empty cell
- [x] Correctly Display what the player is currently holding
- [x] Implement win condition for point goal
- [x] either spawn grid so that start of marker is in center of each rectangle or after instantiating map, shift location of marker to the middle of center rectangle
- [] fix issue with initial point values only being limited to 1,2,4. Related to pointValue being update later on
- [] Add Token Visibility Without Clicking Cache
