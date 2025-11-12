// @deno-types="npm:@types/leaflet"
import leaflet, { LatLng } from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

/*Sprite Images for future commit
let testSprite =
  "https://img1.pnghut.com/18/23/20/hhcaQFccK2/data-mask-black-template-patch.jpg";
let oneSprite = "https://www.pngmart.com/files/14/1-Number-PNG-Picture.png";
let twoSprite =
  "https://pngimg.com/uploads/number2/Number%202%20PNG%20images%20free%20download_PNG14925.png";
let threeSprite =
  "https://www.pngarts.com/files/3/Number-3-PNG-High-Quality-Image.png";
let fourSprite =
  "https://th.bing.com/th/id/R.f68318b63bdee362f09bfee30cc8f903?rik=wy9sjYJEdNaNOQ&pid=ImgRaw&r=0";
let eightSprite =
  "https://th.bing.com/th/id/R.da97a298bc11e9768e3da740988f5881?rik=e%2bvWni5fTqeKvw&pid=ImgRaw&r=0";
  */
// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 18;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 50;
const CACHE_SPAWN_PROBABILITY = 0.1;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add a marker to represent the player
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Display the player's points
let playerPoints = 0;
statusPanelDiv.innerHTML = "Holding Nothing...";

//Adds support for WASD Controls
globalThis.addEventListener("keydown", (e: KeyboardEvent) => {
  const oldMarkerLocation = playerMarker.getLatLng();
  const oldMarkerLat = oldMarkerLocation.lat;
  const oldMarkerLng = oldMarkerLocation.lng;
  let newMarkerLocation: LatLng;
  if (e.key === "w") {
    newMarkerLocation = leaflet.latLng(
      oldMarkerLat + 1 * TILE_DEGREES,
      oldMarkerLng,
    );
    playerMarker.setLatLng(newMarkerLocation);
  }
  if (e.key === "a") {
    newMarkerLocation = leaflet.latLng(
      oldMarkerLocation.lat,
      oldMarkerLocation.lng - 1 * TILE_DEGREES,
    );
    playerMarker.setLatLng(newMarkerLocation);
  }
  if (e.key === "s") {
    newMarkerLocation = leaflet.latLng(
      oldMarkerLocation.lat - 1 * TILE_DEGREES,
      oldMarkerLocation.lng,
    );
    playerMarker.setLatLng(newMarkerLocation);
  }
  if (e.key === "d") {
    newMarkerLocation = leaflet.latLng(
      oldMarkerLocation.lat,
      oldMarkerLocation.lng + 1 * TILE_DEGREES,
    );
    playerMarker.setLatLng(newMarkerLocation);
    console.log(oldMarkerLocation.lng + 1 * TILE_DEGREES);
  }
});

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  //variables for storing cache's distance to player
  let latDistToPlayer: number;
  let lngDistToPlayer: number;
  // Each cache has a random point value, mutable by the player
  let pointValue: number = Math.floor(
    luck([i, j, "initialValue"].toString()) * 5,
  );
  const origin = CLASSROOM_LATLNG;

  // Convert cell numbers into lat/lng bounds
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  /*bounds for token sprites for future commit
  let spriteBounds = leaflet.latLngBounds([
    [
      origin.lat + (i + .5) * TILE_DEGREES,
      origin.lng + (j + .5) * TILE_DEGREES,
    ],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);*/

  //leaflet.imageOverlay(testSprite, spriteBounds).addTo(map);

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Handle interactions with the cache
  rect.bindPopup(() => {
    // The popup offers a description and button
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${i},${j}". It has value <span id="value">${pointValue}</span>.</div>
                <button id="take">take</button>
                <button id="place">place</button>`;

    // Clicking the button decrements the cache's value and increments the player's points
    popupDiv
      .querySelector<HTMLButtonElement>("#take")!
      .addEventListener("click", () => {
        //updates distance variable to player when take button is clicked
        latDistToPlayer = Math.abs(
          bounds.getCenter().lat - playerMarker.getLatLng().lat,
        );
        lngDistToPlayer = Math.abs(
          bounds.getCenter().lng - playerMarker.getLatLng().lng,
        );

        //checks if player is close enough to cache and has room in inventory to take token
        if (
          (latDistToPlayer <= 3 * TILE_DEGREES) &&
          (lngDistToPlayer <= 3 * TILE_DEGREES) &&
          (playerPoints == 0)
        ) {
          playerPoints += pointValue;
          pointValue -= pointValue;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanelDiv.innerHTML = `${playerPoints} points accumulated `;
          //Checks for Win condition
          if (playerPoints == 8) {
            statusPanelDiv.innerHTML = `You win you have achieved 8 Points!`;
          }
        } else if (playerPoints != 0) {
          statusPanelDiv.innerHTML =
            `${playerPoints} points accumulated <br> Already Holding Token`;
        } else {
          statusPanelDiv.innerHTML =
            `${playerPoints} points accumulated <br> Too far to access cache`;
        }
      });

    //if player is holding token, places token into empty cache, or combines with similar token within cache
    popupDiv
      .querySelector<HTMLButtonElement>("#place")!
      .addEventListener("click", () => {
        if (playerPoints == 0) {
          statusPanelDiv.innerHTML =
            `${playerPoints} points accumulated <br> No Token Available to Place`;
        } else if (pointValue == 0) {
          pointValue += playerPoints;
          playerPoints -= playerPoints;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanelDiv.innerHTML = `${playerPoints} points accumulated`;
        } else if (playerPoints == pointValue) {
          playerPoints -= playerPoints;
          pointValue = pointValue * 2;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanelDiv.innerHTML =
            `${playerPoints} points accumulated <br> You Have Combined Similar Tokens!!!`;
        }
      });

    return popupDiv;
  });
}

// Look around the player's neighborhood for caches to spawn
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // If location i,j is lucky enough, spawn a cache!
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(i, j);
    }
  }
}

//changes location of player marker so that centered in each rectangle
const newMarkerLocation = leaflet.latLng(
  CLASSROOM_LATLNG.lat - 0.5 * TILE_DEGREES,
  CLASSROOM_LATLNG.lng - 0.5 * TILE_DEGREES,
);
playerMarker.setLatLng(newMarkerLocation);
