// @deno-types="npm:@types/leaflet"
import leaflet, { LatLng } from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

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

/*class playerInventory {
  constructor(itemIn: number) {
    this.item = itemIn;
  }
  item: number;
}

//let playerPocket = new playerInventory(0);
playerPocket.item = 2;
console.log(playerPocket.item);*/
// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const origin = CLASSROOM_LATLNG;
  //const playerLat = playerMarker.getLatLng().lat;
  //const playerLng = playerMarker.getLatLng().lng;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);
  let latDist = Math.abs(bounds.getCenter().lat - playerMarker.getLatLng().lat);
  let lngDist = Math.abs(bounds.getCenter().lng - playerMarker.getLatLng().lng);
  console.log(latDist);
  // Handle interactions with the cache
  rect.bindPopup(() => {
    // Each cache has a random point value, mutable by the player
    let pointValue = Math.floor(luck([i, j, "initialValue"].toString()) * 5);

    // The popup offers a description and button
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a cache here at "${i},${j}". It has value <span id="value">${pointValue}</span>.</div>
                <button id="poke">poke</button>`;

    // Clicking the button decrements the cache's value and increments the player's points
    popupDiv
      .querySelector<HTMLButtonElement>("#poke")!
      .addEventListener("click", () => {
        latDist = Math.abs(
          bounds.getCenter().lat - playerMarker.getLatLng().lat,
        );
        lngDist = Math.abs(
          bounds.getCenter().lng - playerMarker.getLatLng().lng,
        );
        if (
          (latDist <= 3 * TILE_DEGREES) && (lngDist <= 3 * TILE_DEGREES) &&
          (playerPoints == 0)
        ) {
          playerPoints += pointValue;
          pointValue -= pointValue;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanelDiv.innerHTML = `${playerPoints} points accumulated`;
        } else if (playerPoints == pointValue) {
          playerPoints = playerPoints * 2;
          pointValue -= pointValue;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanelDiv.innerHTML = `${playerPoints} points accumulated`;
          if (playerPoints == 8) {
            statusPanelDiv.innerHTML = `You win you have achieved 8 Points!`;
          }
        } else {
          console.log("too far");
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
