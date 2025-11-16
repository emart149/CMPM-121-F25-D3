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

### D3.a STEPS

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
- [x] fix issue with initial point values only being limited to 1,2,4. Related to pointValue being update later on
- [x] Add Token Visibility Without Clicking Cache

## D3.b: Globe-spanning gameplay

- Key technical challenge: Can you set up your implementation to support gameplay anywhere in the real world, not just locations near our classroom?
- Key gameplay challenge: Can players craft an even higher value token by moving to other locations to get access to additional crafting materials?

### D3.b STEPS

- [x] Create Data driven buttons to move player
- [] track which cells contain caches using array of arrays(grid)
  - [x] whenever map is moved it spawns more rectangles each time based of nearest center cell
  - [x] Deletes all cells out of view(create function that wipes old cells, then draws new ones)
    - [X]maybe create class for each cell that has destroy function?
  - [x] remembers which cells contain tokens or not
- [X]always despawn/spawn cells
- [X]only check possible cells in view if they have caches, not all possible caches in the world
- [x] get center coordinate and just get bounds of center cell at least, then for example go up 20 cels and left 10 cells to get the coordinates of the top left cell then iterate through all possible cells in view
- []maybe get center coordinate and find way to narrow down search for boundry
  ex: if coordinates are (150,20) only check positive lat, positive lng
- [] have the map only move when player moves so just add 0.0001 to everything one at a time
  ex: player moves up so origin still same but add 0.0001 to anything related to lat coordinates?
- [X]Anchored at Null Island
- [X]Only cells near player are accessible
- [X]cells forget memory when out of view and respawn with new values
- [X]spawn new cells with dragging map
- []
- []
- []
- []
