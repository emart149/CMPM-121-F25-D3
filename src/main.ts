// @deno-types="npm:@types/leaflet"
import leaflet, { LatLng, LatLngBounds } from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

//Sprite Images
const zeroSprite =
  "https://img1.pnghut.com/18/23/20/hhcaQFccK2/data-mask-black-template-patch.jpg";
const oneSprite = "https://www.pngmart.com/files/14/1-Number-PNG-Picture.png";
const twoSprite =
  "https://pngimg.com/uploads/number2/Number%202%20PNG%20images%20free%20download_PNG14925.png";
const threeSprite =
  "https://www.pngarts.com/files/3/Number-3-PNG-High-Quality-Image.png";
const fourSprite =
  "https://th.bing.com/th/id/R.f68318b63bdee362f09bfee30cc8f903?rik=wy9sjYJEdNaNOQ&pid=ImgRaw&r=0";
const eightSprite =
  "https://th.bing.com/th/id/R.da97a298bc11e9768e3da740988f5881?rik=e%2bvWni5fTqeKvw&pid=ImgRaw&r=0";
const placeHolderSprite =
  "https://webstockreview.net/images/square-clipart-transparent-6.png";

// Create basic UI elements
interface playerButton {
  element: HTMLButtonElement;
  id: string;
  message: string;
}

const playerButtonList: playerButton[] = [{
  element: document.createElement("button") as HTMLButtonElement,
  id: "UP",
  message: "UP",
}, {
  element: document.createElement("button") as HTMLButtonElement,
  id: "LEFT",
  message: "LEFT",
}, {
  element: document.createElement("button") as HTMLButtonElement,
  id: "DOWN",
  message: "DOWN",
}, {
  element: document.createElement("button") as HTMLButtonElement,
  id: "RIGHT",
  message: "RIGHT",
}];

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);
const cacheArr: cache[] = [];

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 16;
const TILE_DEGREES = 1e-4;
const CACHE_SPAWN_PROBABILITY = 0.1;
const NEIGHBORHOOD_SIZE = 20;

// Our classroom location
const _CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);
//if origin at NULL Island there should be top left point of cell at (36.9980,-122.0571)
const NULL_ISLAND = leaflet.latLng(0, 0);

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: NULL_ISLAND,
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
const playerMarker = leaflet.marker(NULL_ISLAND);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Display the player's points
let playerPoints = 0;
statusPanelDiv.innerHTML = `Current Token: None`;

//allows support to move player with buttons
for (const button of playerButtonList) {
  button.element.innerHTML = `${button.message}`;
  controlPanelDiv.appendChild(button.element);
  button.element.addEventListener("click", () => {
    let newMarkerLocation: LatLng;
    if (button.message === "UP") {
      newMarkerLocation = leaflet.latLng(
        playerMarker.getLatLng().lat + 1 * TILE_DEGREES,
        playerMarker.getLatLng().lng,
      );
      playerMarker.setLatLng(newMarkerLocation);
      console.log(
        "current LatLng: (" + playerMarker.getLatLng().lng + ", " +
          playerMarker.getLatLng().lng + ")",
      );
      map.setView(newMarkerLocation);
    }
    if (button.message === "LEFT") {
      newMarkerLocation = leaflet.latLng(
        playerMarker.getLatLng().lat,
        playerMarker.getLatLng().lng - 1 * TILE_DEGREES,
      );
      playerMarker.setLatLng(newMarkerLocation);
      console.log(
        "current LatLng: (" + playerMarker.getLatLng().lng + ", " +
          playerMarker.getLatLng().lng + ")",
      );
      map.setView(newMarkerLocation);
    }
    if (button.message === "DOWN") {
      newMarkerLocation = leaflet.latLng(
        playerMarker.getLatLng().lat - 1 * TILE_DEGREES,
        playerMarker.getLatLng().lng,
      );
      playerMarker.setLatLng(newMarkerLocation);
      console.log(
        "current LatLng: (" + playerMarker.getLatLng().lng + ", " +
          playerMarker.getLatLng().lng + ")",
      );
      map.setView(newMarkerLocation);
    }
    if (button.message === "RIGHT") {
      newMarkerLocation = leaflet.latLng(
        playerMarker.getLatLng().lat,
        playerMarker.getLatLng().lng + 1 * TILE_DEGREES,
      );
      playerMarker.setLatLng(newMarkerLocation);
      console.log(
        "current LatLng: (" + playerMarker.getLatLng().lng + ", " +
          playerMarker.getLatLng().lng + ")",
      );
      map.setView(newMarkerLocation);
    }
  });
}

// ----cache clas----
class cache {
  constructor(i: number, j: number) {
    this.latDistToPlayer = 0;
    this.lngDistToPlayer = 0;
    this.pointValue = Math.floor(
      luck([i, j, "initialValue"].toString()) * 4,
    );
    if (this.pointValue == 3) {
      this.pointValue = 4;
    }
    this.origin = NULL_ISLAND;
    this.bounds = leaflet.latLngBounds([
      [this.origin.lat + i * TILE_DEGREES, this.origin.lng + j * TILE_DEGREES],
      [
        this.origin.lat + (i + 1) * TILE_DEGREES,
        this.origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    //bounds for token sprites for future commit
    this.spriteBounds = leaflet.latLngBounds([
      [
        this.origin.lat + (i + .5) * TILE_DEGREES,
        this.origin.lng + (j + .5) * TILE_DEGREES,
      ],
      [
        this.origin.lat + (i + 1) * TILE_DEGREES,
        this.origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    //only create rectangle & cache sprite is visible
    if (isCellVisible(this.bounds) == false) {
      return;
    } else {
      this.rect = leaflet.rectangle(this.bounds);
      this.rect.addTo(map);

      this.cacheSprite = numberToSprite(this.pointValue);
      this.curSprite = leaflet.imageOverlay(
        this.cacheSprite,
        this.spriteBounds,
      );
      this.curSprite.addTo(map);
      numCaches++;
    }

    if (this.bounds.equals(getPlayerCell())) {
      console.log("center Bounds:" + getCenterCell());
      this.rect = leaflet.rectangle(getPlayerCell(), {
        fillColor: `#000000`,
        fillOpacity: 1,
      });
      this.rect.addTo(map);
    }

    if (this.bounds.contains(getPlayerLatLng())) {
      console.log("this cell contains player latLng");
    }

    // Handle interactions with the cache
    this.rect.bindPopup(() => {
      // The popup offers a description and button
      const popupDiv = document.createElement("div");
      popupDiv.innerHTML = `
                <div>There is a token here at "${i},${j}". It has value <span id="value">${this.pointValue}</span>.</div>
                <button id="take">take</button>
                <button id="place">place</button>`;

      // Clicking the button decrements the cache's value and increments the player's points
      popupDiv
        .querySelector<HTMLButtonElement>("#take")!
        .addEventListener("click", () => {
          //updates distance variable to player when take button is clicked
          this.latDistToPlayer = Math.abs(
            this.bounds.getCenter().lat - playerMarker.getLatLng().lat,
          );
          this.lngDistToPlayer = Math.abs(
            this.bounds.getCenter().lng - playerMarker.getLatLng().lng,
          );

          //checks if player is close enough to cache and has room in inventory to take token
          if (
            (this.latDistToPlayer <= 3 * TILE_DEGREES) &&
            (this.lngDistToPlayer <= 3 * TILE_DEGREES) &&
            (playerPoints == 0)
          ) {
            playerPoints += this.pointValue;
            this.pointValue -= this.pointValue;
            popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = this
              .pointValue.toString();
            statusPanelDiv.innerHTML = `Current Token: ${playerPoints}`;
            if (this.curSprite) this.curSprite.remove();
            this.cacheSprite = numberToSprite(this.pointValue);
            this.curSprite = leaflet.imageOverlay(
              this.cacheSprite,
              this.spriteBounds,
            ).addTo(
              map,
            ).bringToFront();
            //Checks for Win condition
            if (playerPoints == 8) {
              statusPanelDiv.innerHTML = `You win you have created an 8 Token!`;
            }
          } else if (playerPoints != 0) {
            statusPanelDiv.innerHTML =
              `Current Token: ${playerPoints}<br> Already Holding Token`;
          } else {
            statusPanelDiv.innerHTML =
              `Current Token: ${playerPoints}<br> Too far to access cache`;
          }
        });

      //if player is holding token, places token into empty cache, or combines with similar token within cache
      popupDiv
        .querySelector<HTMLButtonElement>("#place")!
        .addEventListener("click", () => {
          if (playerPoints == 0) {
            statusPanelDiv.innerHTML =
              `Current Token: ${playerPoints} <br> No Token Available to Place`;
          } else if (this.pointValue == 0) {
            this.pointValue += playerPoints;
            playerPoints -= playerPoints;
            popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = this
              .pointValue.toString();
            statusPanelDiv.innerHTML = `Current Token: None`;
            if (this.curSprite) this.curSprite.remove();

            this.cacheSprite = numberToSprite(this.pointValue);
            leaflet.imageOverlay(this.cacheSprite, this.spriteBounds).addTo(
              map,
            );
          } else if (playerPoints == this.pointValue) {
            playerPoints -= playerPoints;
            this.pointValue = this.pointValue * 2;
            popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML = this
              .pointValue.toString();
            statusPanelDiv.innerHTML =
              `Current Token: None <br> You Have Combined Similar Tokens!!!`;
            if (this.curSprite) this.curSprite.remove();
            this.cacheSprite = numberToSprite(this.pointValue);
            this.curSprite = leaflet.imageOverlay(
              this.cacheSprite,
              this.spriteBounds,
            ).addTo(
              map,
            );
          }
        });

      return popupDiv;
    });
  }

  latDistToPlayer: number;
  lngDistToPlayer: number;
  // Each cache has a random point value, mutable by the player
  pointValue: number;
  origin: LatLng;
  // Convert cell numbers into lat/lng bounds
  bounds: LatLngBounds;

  //bounds for token sprites for future commit
  spriteBounds: LatLngBounds;

  cacheSprite;
  curSprite;

  // Add a rectangle to the map to represent the cache
  rect;

  destroyCell() {
    this.rect?.remove();
    this.curSprite?.remove();
  }
  createCell() {
    this.rect = leaflet.rectangle(this.bounds);
    this.rect.addTo(map);

    this.cacheSprite = numberToSprite(this.pointValue);
    this.curSprite = leaflet.imageOverlay(this.cacheSprite, this.spriteBounds);
    this.curSprite.addTo(map);
  }
}

//take in number and outputs corresponding string to sprite
function numberToSprite(value: number) {
  if (value == 0) {
    return zeroSprite;
  } else if (value == 1) {
    return oneSprite;
  } else if (value == 2) {
    return twoSprite;
  } else if (value == 3) {
    return threeSprite;
  } else if (value == 4) {
    return fourSprite;
  } else if (value == 8) {
    return eightSprite;
  } else {
    return placeHolderSprite;
  }
}

//checks if Cell is visible to current map view
function isCellVisible(cell: LatLngBounds) {
  const currentView: LatLngBounds = map.getBounds();
  return currentView.overlaps(cell);
}

// spawns caches in NEIGHBORHOOD_SIZE radius around this.origin in each cache
let numCaches = 0;
function spawnAll() {
  const centerLatLng = getCenterCell().getNorthWest();
  const radiusDown = -NEIGHBORHOOD_SIZE + centerLatLng.lat / TILE_DEGREES;
  const radiusUp = NEIGHBORHOOD_SIZE + centerLatLng.lat / TILE_DEGREES;
  const radiusLeft = -NEIGHBORHOOD_SIZE + centerLatLng.lng / TILE_DEGREES;
  const radiusRight = NEIGHBORHOOD_SIZE + centerLatLng.lng / TILE_DEGREES;
  for (let i = radiusDown; i < radiusUp; i++) {
    for (let j = radiusLeft; j < radiusRight; j++) {
      // If location i,j is lucky enough, spawn a cache!
      const isCache: boolean =
        luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY;
      if (isCache) {
        cacheArr.push(new cache(i, j));
      }
    }
  }
}

//destroys calls destroyCell method for each cache which removes rectangle and coin sprite
function deleteAll() {
  for (const elements of cacheArr) {
    elements.destroyCell();
  }
}

//gets player's latlng
function getPlayerLatLng() {
  const markerLat = playerMarker.getLatLng().lat;
  const markerLng = playerMarker.getLatLng().lng;
  //console.log("current LatLng: (" + markerLat + ", " + markerLng + ")");
  return leaflet.latLng(markerLat, markerLng);
}

//gets cell bounds that playerMarker is in
function getPlayerCell() {
  const playerCellNW = leaflet.latLng(
    playerMarker.getLatLng().lat + 0.5 * TILE_DEGREES,
    playerMarker.getLatLng().lng - 0.5 * TILE_DEGREES,
  );
  const playerCellSE = leaflet.latLng(
    playerMarker.getLatLng().lat - 0.5 * TILE_DEGREES,
    playerMarker.getLatLng().lng + 0.5 * TILE_DEGREES,
  );
  const playerCellBounds: LatLngBounds = leaflet.latLngBounds(
    playerCellNW,
    playerCellSE,
  );
  return playerCellBounds;
  //use coordinates in top left and iterate through area and check
}

//get cell in center of screen
function getCenterCell() {
  const centerLatLng = map.getCenter();
  const topLeft = leaflet.latLng(
    Math.ceil(centerLatLng.lat * 10000) / 10000,
    Math.ceil(centerLatLng.lng * 10000) / 10000,
  );
  const bottomRight = leaflet.latLng(
    Math.floor(centerLatLng.lat * 10000) / 10000,
    Math.floor(centerLatLng.lng * 10000) / 10000,
  );
  const centerBounds = leaflet.latLngBounds(topLeft, bottomRight);

  const centerRect = leaflet.rectangle(centerBounds, {
    fillColor: `#FF0000`,
    fillOpacity: 1,
  });
  centerRect.addTo(map);
  console.log("center: (" + topLeft.lat + ", " + topLeft.lng + ")");
  return centerBounds;
}

spawnAll();
console.log("Num caches: " + numCaches);
//--CurrentMethod--
/*
1. creates caches in specific area
2. deletes all caches
3. checks if each cache is in view(even checks caches out of view)
4. spawns cache if in view

---New Method idea---
1.delete all caches
2.find bounds of the cell in center of view
  2.a create bounds for new view
3.start looping from top left cell to bottom right cell in view to check if they contain caches
4.only spawn cache if in view

*/
map.addEventListener("moveend", () => {
  numCaches = 0;
  console.log("done moving");
  deleteAll();
  spawnAll();
  console.log("Num caches: " + numCaches);
});

//changes location of player marker so that centered in each rectangle
const newMarkerLocation = leaflet.latLng(
  NULL_ISLAND.lat + 0.5 * TILE_DEGREES,
  NULL_ISLAND.lng + 0.5 * TILE_DEGREES,
);
playerMarker.setLatLng(newMarkerLocation);
