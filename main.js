API_KEY = "56b54ab233380061bbdd39999aedef89";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const inputEl = document.getElementById("input-username");
const navEl = document.querySelector("nav");
const timestampEl = document.getElementById("timestamp");
const setTimestamp = message => {
  timestampEl.innerText = message;
};

const statusEl = document.getElementById("status");
const setStatus = message => {
  statusEl.innerText = message;
};

// #region EVENT LISTENERS

window.addEventListener("load", () => inputEl.focus());

inputEl.addEventListener("keydown", ev => {
  if (ev.keyCode == 13 && ev.target.value !== username) {
    stopDataFetch();
    resetData();
    clearRender();

    if (ev.target.value == "") {
      setStatus("Welcome");
    } else {
      username = ev.target.value;
      fetchTracks();
    }
  }
});

let debouncedResize;
window.addEventListener("resize", () => {
  clearTimeout(debouncedResize);
  debouncedResize = setTimeout(onWindowResize, 200);
});

window.addEventListener("mousewheel", ev => {
  if (ev.deltaY > 0) {
    if (!navEl.classList.contains("hidden")) {
      navEl.classList += "hidden";
    }
  } else {
    if (navEl.classList.contains("hidden")) {
      navEl.classList = "";
    }
  }
  calculateTimestamp();
});

// #endregion

// #region GETTING DATA

let username = "";
let trackList = [];
let mostRecentSavedTrack = null;

const loadFromLocalStorage = () => {
  username = localStorage.getItem("username") || "";
  inputEl.value = username;
  trackList = JSON.parse(localStorage.getItem("tracks")) || [];
  mostRecentSavedTrack = trackList.length > 0 ? trackList[0] : null;
};

let loadedImages = [];
let totalPages = 0;
const MAX_PAGES = 125;

let newTracksToAdd = [];
let hasReachedSavedTrack = false;
// ALBUM_IMG_BASE_URL = "https://lastfm.freetls.fastly.net/i/u/174s/";

let fetchController = new AbortController();
let signal = fetchController.signal;

const fetchTracks = (page = 1) => {
  URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=200`;
  fetch(`${URL}&page=${page}`, {
    method: "GET",
    signal: signal
  })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        setStatus("Could not find user, or hit API limit :(");
        throw new Error("Something went wrong");
      }
    })
    .then(data => {
      if (!totalPages) {
        totalPages = Math.min(data.recenttracks["@attr"].totalPages, MAX_PAGES);
      }
      setStatus(
        `Getting page ${page} of ${totalPages}. ` +
          getCheekyComment(page / totalPages)
      );

      for (let i = 0; i < data.recenttracks.track.length; i++) {
        let track = data.recenttracks.track[i];
        if (!track.date) continue; // if the track is currently playing, there is no date

        if (
          mostRecentSavedTrack &&
          mostRecentSavedTrack.date == track.date.uts
        ) {
          hasReachedSavedTrack = true;
          break;
        }

        newTracksToAdd.push({
          date: track.date.uts,
          url: track.image[2]["#text"]
        });
      }

      if (page < totalPages && !hasReachedSavedTrack) {
        fetchTracks(++page);
      } else {
        onFinishedGatheringData();
      }
    });
};

const onFinishedGatheringData = () => {
  setStatus(`Found ${newTracksToAdd.length} new tracks`);
  if (newTracksToAdd.length > 0) {
    trackList = [...newTracksToAdd, ...trackList];
    localStorage.setItem("username", username);
    localStorage.setItem("tracks", JSON.stringify(trackList));
  }

  let prom = new Promise(resolve => {
    setTimeout(() => {
      setStatus(`Loading ${trackList.length} tracks`);
      resolve();
    }, 500);
  })
    .then(() =>
      loadImages(...trackList.map(t => t.url)).then(imgs => {
        loadedImages = imgs.map(i => i.res);
      })
    )
    .then(() => render());
};

const loadImages = (...paths) => Promise.all(paths.map(checkImage));

const checkImage = path =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ res: img, status: "ok" });
    img.onerror = () => resolve({ res: img, status: "error" });

    img.src = path;
  });

const stopDataFetch = () => {
  if (!fetchController.signal.aborted) {
    fetchController.abort();
    console.log("stopped fetch");
  }
  fetchController = new AbortController();
  signal = fetchController.signal;
};

const resetData = () => {
  localStorage.removeItem("tracks");
  localStorage.removeItem("username");
  loadedImages = [];
  trackList = [];
  newTracksToAdd = [];
  mostRecentSavedTrack = null;
  hasReachedSavedTrack = false;
  timestampEl.classList = "";
  setTimestamp("");
  setStatus("");
};

//#endregion

//#region RENDERING

let isUsingDOM = true;
let isRendered = false;

const displayOnCanvas = () => {
  setStatus(`rendering images`);
  const size = 64;
  const perRow = Math.floor((document.documentElement.clientWidth - 10) / size); // clientwidth is accounting scrollbar width
  const totalRows = Math.ceil(loadedImages.length / perRow);

  ctx.canvas.width = perRow * size;
  ctx.canvas.height = totalRows * size;

  let row = 0;

  for (let i = 0; i < loadedImages.length; i++) {
    ctx.drawImage(loadedImages[i], size * (i % perRow), row * size, size, size);
    if (i > 0 && i % perRow == 0) {
      row++;
    }
    // console.log(`track ${i} of ${loadedImages.length} loaded.`);
  }

  setStatus(`${loadedImages.length} tracks loaded`);
};

const displayOnDOM = () => {
  let div = document.getElementById("viz");
  for (let i = 0; i < loadedImages.length; i++) {
    div.appendChild(loadedImages[i]);
  }
  setStatus(`Loaded ${loadedImages.length} tracks`);
  if (!timestampEl.classList.contains("visible")) {
    timestampEl.classList += "visible";
  }
  calculateTimestamp();
  isRendered = true;
};

const displayOnDOM2 = () => {
  let div = document.getElementById("viz");
  for (let i = 0; i < trackList.length; i++) {
    let img = new Image();
    img.src = trackList[i].url;
    div.appendChild(img);
  }
  // setStatus(`Loaded ${loadedImages.length} tracks`);
  isRendered = true;
  if (!timestampEl.classList.contains("visible")) {
    timestampEl.classList += "visible";
  }
  calculateTimestamp();
};

const render = () => {
  isRendered = false;
  setStatus("Rendering tracks");
  isUsingDOM ? displayOnDOM() : displayOnCanvas();
};

const clearRender = () => {
  isUsingDOM
    ? (document.getElementById("viz").innerHTML = "")
    : ctx.clearRect(0, 0, canvas.width, canvas.height);
  isRendered = false;
};

const onWindowResize = () => {
  // rerender if resized
  if (isRendered) {
    render();
  }
};

const calculateTimestamp = () => {
  let perc = getScrollPercent() || 0;
  let itemIndex;
  if (perc == 1) {
    itemIndex = trackList.length - 1;
  } else {
    itemIndex = Math.floor(perc * trackList.length);
  }
  let timestring = moment(trackList[itemIndex].date * 1000).format("MMMM YYYY");
  setTimestamp(timestring);
};

const cheekyComments = [
  "Make some tea in the meantime.",
  "Pet your dog in the meantime.",
  "Save the world in the meantime.",
  "Almost there :)"
];
const getCheekyComment = progress => {
  return cheekyComments[Math.floor(progress * cheekyComments.length)];
};

// #endregion

//#region HELPERS

const getScrollPercent = () => {
  var h = document.documentElement,
    b = document.body,
    st = "scrollTop",
    sh = "scrollHeight";
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
};

//#endregion

(() => {
  loadFromLocalStorage();
  if (username && trackList.length > 0) {
    inputEl.value = username;
    fetchTracks();
    // loadIntoMemory().then(() => render());
    setStatus("Checking for any recently played tracks");
  }
})();
