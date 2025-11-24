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
const sixteenSprite =
  "https://png.pngtree.com/png-vector/20210216/ourmid/pngtree-black-gradient-3d-number-16-png-image_2923782.jpg";
const placeHolderSprite =
  "https://webstockreview.net/images/square-clipart-transparent-6.png";

const spritesByTokenValueLogarithm = [
  oneSprite,
  twoSprite,
  fourSprite,
  eightSprite,
  sixteenSprite,
];
// ----Create basic UI elements----
interface playerButton {
  element: HTMLButtonElement;
  id: string;
  message: string;
}
const playerButtonList: playerButton[] = [{
  element: document.createElement("button"),
  id: "UP",
  message: "UP",
}, {
  element: document.createElement("button"),
  id: "LEFT",
  message: "LEFT",
}, {
  element: document.createElement("button"),
  id: "DOWN",
  message: "DOWN",
}, {
  element: document.createElement("button"),
  id: "RIGHT",
  message: "RIGHT",
}, {
  element: document.createElement("button"),
  id: "START",
  message: "START",
}, {
  element: document.createElement("button"),
  id: "BUTTON CONTROLS",
  message: "BUTTON CONTROLS",
}, {
  element: document.createElement("button"),
  id: "LOCATION CONTROLS",
  message: "LOCATION CONTROLS",
}];

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
statusPanelDiv.innerHTML = `Current Token: ${
  Number(localStorage.getItem(`playerPoints`))
}`;
document.body.append(statusPanelDiv);

//----Cache Arrays----
const cacheArr: cache[] = [];
const newCacheArr: cache[] = [];
//this is the caretaker for the mementos since it stores all of the token values for only the modified cells

// ----Tunable gameplay parameters----
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const CACHE_SPAWN_PROBABILITY = 0.1;
const NEIGHBORHOOD_SIZE = 20;

// ----Key locations----
const CLASSROOM_LATLNG = leaflet.latLng(
  36.9979,
  -122.0570,
);
const NULL_ISLAND = leaflet.latLng(0, 0);

let irlLocation = leaflet.latLng(0, 0);

// ----Map Setup (element with id "map" is defined in index.html)----
const map = leaflet.map(mapDiv, {
  center: irlLocation,
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

// Add Marker & Center it for each cell
const playerMarker = leaflet.marker(leaflet.latLng(
  CLASSROOM_LATLNG.lat + 0.5 * TILE_DEGREES,
  CLASSROOM_LATLNG.lng + 0.5 * TILE_DEGREES,
));
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let curWatch: number;
const playerLocation = navigator.geolocation as Geolocation;
curWatch = playerLocation.watchPosition(success, error);

//----Moving Player with Buttons----
for (const button of playerButtonList) {
  button.element.innerHTML = `${button.message}`;
  controlPanelDiv.appendChild(button.element);
  button.element.addEventListener("click", () => {
    let newMarkerLocation: LatLng;
    const movementMapping: Record<string, [number, number]> = {
      "UP": [1, 0],
      "LEFT": [0, -1],
      "DOWN": [-1, 0],
      "RIGHT": [0, 1],
    };
    if (button.message in movementMapping) {
      const [dx, dy] = movementMapping[button.message];
      newMarkerLocation = leaflet.latLng(
        playerMarker.getLatLng().lat + dx * TILE_DEGREES,
        playerMarker.getLatLng().lng + dy * TILE_DEGREES,
      );
      playerMarker.setLatLng(newMarkerLocation);
      map.setView(newMarkerLocation);
    }
    if (button.message === "START") {
      startGame();
    }
    if (button.message === "BUTTON CONTROLS") {
      playerLocation.clearWatch(curWatch);
    }
    if (button.message === "LOCATION CONTROLS") {
      for (const elements of playerButtonList) {
        if (
          elements.message == "LEFT" || (elements.message == "RIGHT") ||
          elements.message == "UP" || elements.message == "DOWN"
        ) {
          elements.element.remove();
        }
      }
    }
  });
}

// ----cache class----
class cache {
  constructor(i: number, j: number) {
    this.i = i;
    this.j = j;
    this.latDistToPlayer = 0;
    this.lngDistToPlayer = 0;
    this.origin = NULL_ISLAND;
    this.initialPointValue = this.ranValue(i, j);

    this.bounds = leaflet.latLngBounds([
      [
        this.origin.lat + i * TILE_DEGREES,
        this.origin.lng + j * TILE_DEGREES,
      ],
      [
        this.origin.lat + (i + 1) * TILE_DEGREES,
        this.origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    //bounds for token sprites
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

    //create rectangle & cache sprite

    this.rect = leaflet.rectangle(this.bounds);
    this.rect.addTo(map);
    //Another example of the  Flyweight pattern in addition to the spawnAll() function since
    // the cache class is utilizing the token values which are stored within gridMap
    this.cacheSprite = numberToSprite(
      Number(localStorage.getItem(`${this.i}` + `${this.j}`)),
    );
    this.curSprite = leaflet.imageOverlay(
      this.cacheSprite,
      this.spriteBounds,
    );
    this.curSprite.addTo(map);

    // Handle interactions with the cache
    this.rect.bindPopup(() => this.createPopUp(i, j));
  }

  //Class properties
  latDistToPlayer: number;
  lngDistToPlayer: number;
  initialPointValue: number;
  origin: LatLng;
  bounds: LatLngBounds;
  spriteBounds: LatLngBounds;
  cacheSprite;
  curSprite;
  rect;
  i: number;
  j: number;

  //Class Methods
  ranValue(i: number, j: number) {
    let ranNum = Math.floor(
      luck([i, j, "initialValue"].toString()) * 4,
    );
    if (ranNum == 3) {
      ranNum = 4;
    }
    return ranNum;
  }
  createPopUp(i: number, j: number) {
    // The popup offers a description and button
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>There is a token here at "${i},${j}". It has value <span id="value">${
      Number(localStorage.getItem(`${this.i}` + `${this.j}`))
    }</span>.</div>
                <button id="take">take</button>
                <button id="place">place</button>`;

    // Clicking the button decrements the cache's value and increments the player's points
    popupDiv
      .querySelector<HTMLButtonElement>("#take")!
      .addEventListener("click", () => this.take(popupDiv));

    //if player is holding token, places token into empty cache, or combines with similar token within cache
    popupDiv
      .querySelector<HTMLButtonElement>("#place")!
      .addEventListener("click", () => this.place(popupDiv));

    return popupDiv;
  }

  take(popup: HTMLDivElement) {
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
      (Number(localStorage.getItem(`playerPoints`)) == 0)
    ) {
      localStorage.setItem(
        `playerPoints`,
        localStorage.getItem(`${this.i}` + `${this.j}`)!,
      );
      localStorage.setItem(`${this.i}` + `${this.j}`, String(0));
      popup.querySelector<HTMLSpanElement>("#value")!.innerHTML = localStorage
        .getItem(
          `${this.i}` + `${this.j}`,
        )!;
      statusPanelDiv.innerHTML = `Current Token: ${
        Number(localStorage.getItem(`playerPoints`))
      }`;
      if (this.curSprite) this.curSprite.remove();
      this.cacheSprite = numberToSprite(
        Number(localStorage.getItem(`${this.i}` + `${this.j}`)),
      );
      this.curSprite = leaflet.imageOverlay(
        this.cacheSprite,
        this.spriteBounds,
      ).addTo(
        map,
      ).bringToFront();
      //Checks for Win condition
      if (Number(localStorage.getItem(`playerPoints`)) == 16) {
        statusPanelDiv.innerHTML = `You win you have created an 16 Token!`;
      }
    } else if (Number(localStorage.getItem(`playerPoints`)) != 0) {
      statusPanelDiv.innerHTML = `Current Token: ${
        Number(localStorage.getItem(`playerPoints`))
      }<br> Already Holding Token`;
    } else {
      statusPanelDiv.innerHTML = `Current Token: ${
        Number(localStorage.getItem(`playerPoints`))
      }<br> Too far to access cache`;
    }
  }

  place(popup: HTMLDivElement) {
    if (Number(localStorage.getItem(`playerPoints`)) == 0) {
      statusPanelDiv.innerHTML = `Current Token: ${
        Number(localStorage.getItem(`playerPoints`))
      } <br> No Token Available to Place`;
    } else if (Number(localStorage.getItem(`${this.i}` + `${this.j}`)) == 0) {
      localStorage.setItem(
        `${this.i}` + `${this.j}`,
        String(
          Number(localStorage.getItem(`${this.i}` + `${this.j}`)) +
            Number(localStorage.getItem(`playerPoints`)),
        ),
      );
      localStorage.setItem(`playerPoints`, String(0));
      popup.querySelector<HTMLSpanElement>("#value")!.innerHTML = localStorage
        .getItem(
          `${this.i}` + `${this.j}`,
        )!;
      statusPanelDiv.innerHTML = `Current Token: None`;
      if (this.curSprite) this.curSprite.remove();

      this.cacheSprite = numberToSprite(
        Number(localStorage.getItem(`${this.i}` + `${this.j}`)),
      );
      leaflet.imageOverlay(this.cacheSprite, this.spriteBounds).addTo(
        map,
      );
    } else if (
      Number(localStorage.getItem(`playerPoints`)) ==
        Number(localStorage.getItem(`${this.i}` + `${this.j}`))
    ) {
      localStorage.setItem(`playerPoints`, String(0));
      localStorage.setItem(
        `${this.i}` + `${this.j}`,
        String(Number(localStorage.getItem(`${this.i}` + `${this.j}`)) * 2),
      );
      popup.querySelector<HTMLSpanElement>("#value")!.innerHTML = localStorage
        .getItem(
          `${this.i}` + `${this.j}`,
        )!;
      statusPanelDiv.innerHTML =
        `Current Token: None <br> You Have Combined Similar Tokens!!!`;
      this.changeSprite();
    }
  }

  changeSprite() {
    if (this.curSprite) this.curSprite.remove();
    this.cacheSprite = numberToSprite(
      Number(localStorage.getItem(`${this.i}` + `${this.j}`)),
    );
    this.curSprite = leaflet.imageOverlay(
      this.cacheSprite,
      this.spriteBounds,
    ).addTo(
      map,
    );
  }
  destroyCell() {
    this.rect?.remove();
    this.curSprite?.remove();
    //Memento Variant: when the cell is destroyed and if it's current token value is not the same as the original
    //token, then it's contents are stored within the map. Therefore, this object is the orginator since
    //it's state is being saved
    if (
      Number(Number(localStorage.getItem(`${this.i}` + `${this.j}`))) ==
        this.initialPointValue
    ) {
      localStorage.removeItem(`${this.i}` + `${this.j}`);
    }
  }
  createCell() {
    this.rect = leaflet.rectangle(this.bounds);
    this.rect.addTo(map);

    this.cacheSprite = numberToSprite(
      Number(Number(localStorage.getItem(`${this.i}` + `${this.j}`))),
    );
    this.curSprite = leaflet.imageOverlay(this.cacheSprite, this.spriteBounds);
    this.curSprite.addTo(map);
  }

  getI() {
    return this.i;
  }
  getJ() {
    return this.j;
  }

  isSeen() {
    return isCellVisible(this.bounds);
  }

  setPointValue(val: number) {
    localStorage.setItem(`${this.i}` + `${this.j}`, String(val));
  }
  setInitialPointValue(val: number) {
    this.initialPointValue = val;
  }
}

//destroys calls destroyCell method for each cache which removes rectangle and coin sprite
function deleteAll() {
  //--clear newCache
  newCacheArr.splice(0, newCacheArr.length);
  //--iterate through cacheArr and delete visual rectangles & sprites of cells out of view and only
  //--push the cells in view to newCacheArr
  for (const elements of cacheArr) {
    elements.destroyCell();
    if (elements.isSeen()) {
      newCacheArr.push(elements);
    }
  }
  //--clear cacheArr
  cacheArr.splice(0, cacheArr.length);
  //--push all objects in newCacheArr into cacheArr
  for (const elements of newCacheArr) {
    cacheArr.push(elements);
  }
}

// spawns caches in NEIGHBORHOOD_SIZE radius around this.origin in each cache
function spawnAll() {
  //--gets NorthWest point of the center cell
  const centerLatLng = getCenterCell().getNorthWest();
  //--Bounds for each direction that cells can spawn
  const radiusDown = Math.ceil(
    -NEIGHBORHOOD_SIZE + centerLatLng.lat / TILE_DEGREES,
  );
  const radiusUp = Math.ceil(
    NEIGHBORHOOD_SIZE + centerLatLng.lat / TILE_DEGREES,
  );
  const radiusLeft = Math.ceil(
    -NEIGHBORHOOD_SIZE + centerLatLng.lng / TILE_DEGREES,
  );
  const radiusRight = Math.ceil(
    NEIGHBORHOOD_SIZE + centerLatLng.lng / TILE_DEGREES,
  );

  //--loop through each possible cell in view
  for (let i = radiusDown; i < radiusUp; i++) {
    for (let j = radiusLeft; j < radiusRight; j++) {
      //--Check If location i,j is lucky enough to spawn a cache
      const isCache: boolean =
        luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY;
      const newCacheBounds = leaflet.latLngBounds([
        [
          NULL_ISLAND.lat + i * TILE_DEGREES,
          NULL_ISLAND.lng + j * TILE_DEGREES,
        ],
        [
          NULL_ISLAND.lat + (i + 1) * TILE_DEGREES,
          NULL_ISLAND.lng + (j + 1) * TILE_DEGREES,
        ],
      ]);
      //-- if location is lucky enough to get cache
      //  --if cache already exists in this location within CacheArr then spot is taken
      if (isCache) {
        //-- if spot not taken and cell can be seen, then push to cacheArr
        if (isCellVisible(newCacheBounds)) {
          const newCache = new cache(i, j);

          //Flyweight Pattern Variant: Since the token values are one the extrinsic properties of cells, it is stored
          //in a map called gridMap rather than being stored in each individual cache object.
          if (localStorage.getItem(`${i}` + `${j}`)) {
            newCache.setPointValue(
              Number(localStorage.getItem(`${i}` + `${j}`)),
            );
            newCache.changeSprite();
          } else {
            localStorage.setItem(
              `${i}` + `${j}`,
              String(newCache.ranValue(i, j)),
            );
            //TODO CHANGE TYPES FROM STRING TO NUM THEN NUM TO STRING CUZ LOCAL STORAGR ONLY TAKES STRINGS

            newCache.changeSprite();
          }
          cacheArr.push(newCache);
        }
      }
    }
  }
}

//take in number and outputs corresponding string to sprite
function numberToSprite(value: number) {
  const index = Math.log2(value);
  if (value == 0) {
    return zeroSprite;
  } else if (index >= spritesByTokenValueLogarithm.length) {
    return placeHolderSprite;
  } else {
    return spritesByTokenValueLogarithm[index];
  }
}
//checks if Cell is visible to current map view
function isCellVisible(cell: LatLngBounds) {
  const currentView: LatLngBounds = map.getBounds();
  return currentView.overlaps(cell);
}

//get cell bounds in center of screen
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

  return centerBounds;
}

function success(loc: GeolocationPosition) {
  console.log("success");
  irlLocation = leaflet.latLng(loc.coords.latitude, loc.coords.longitude);
  map.setView(irlLocation);
  playerMarker.setLatLng(irlLocation);
}
function error(loc: GeolocationPositionError) {
  console.log("Error Code: " + loc.code);
}

function startGame() {
  deleteAll();
  localStorage.clear();
  spawnAll();
  playerLocation.clearWatch(curWatch);
  curWatch = playerLocation.watchPosition(success);

  localStorage.setItem(`playerPoints`, String(0));
  statusPanelDiv.innerHTML = `Current Token: ${
    Number(localStorage.getItem(`playerPoints`))
  }`;
}

//emobodies facade pattern through this event listener since code is not dependent on controls and just calls these two functions
//whenever the player moves whether it be through buttons or geolocation
spawnAll();
map.addEventListener("moveend", () => {
  deleteAll();
  spawnAll();
});
