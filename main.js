API_KEY = "56b54ab233380061bbdd39999aedef89";

var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
var inputEl = document.getElementById("input-username");
const statusEl = document.getElementById("status");

const setStatus = message => {
  statusEl.innerText = message;
};

inputEl.addEventListener("keydown", ev => {
  if (ev.keyCode == 13 && ev.target.value !== username) {
    changeUser(ev.target.value);
  }
});

let username = localStorage.getItem("username") || "";
inputEl.value = username;
let trackList = JSON.parse(localStorage.getItem("tracks")) || [];

// if (trackList.length > 0) {
//   setStatus(`${trackList.length} tracks loaded.`);
// }

let loadedImages = [];
let totalPages = 0;
const MAX_PAGES = 30;

let newTracksToAdd = [];
let mostRecentSavedTrack = trackList.length > 0 ? trackList[0] : null;
let hasReachedSavedTrack = false;
// ALBUM_IMG_BASE_URL = "https://lastfm.freetls.fastly.net/i/u/174s/";

const fetchNow = (page = 1) => {
  URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=200`;
  fetch(`${URL}&page=${page}`)
    .then(res => res.json())
    .then(data => {
      totalPages = Math.min(data.recenttracks["@attr"].totalPages, MAX_PAGES);
      setStatus(`Getting page ${page} of ${totalPages}`);

      for (let i = 0; i < data.recenttracks.track.length; i++) {
        let track = data.recenttracks.track[i];
        if (
          mostRecentSavedTrack &&
          mostRecentSavedTrack.date == track.date.uts
        ) {
          hasReachedSavedTrack = true;
          break;
        } else {
          newTracksToAdd.push({
            date: track.date.uts,
            url: track.image[2]["#text"]
          });
        }
      }

      if (page < totalPages && !hasReachedSavedTrack) {
        fetchNow(++page);
      } else {
        setStatus(`Added ${newTracksToAdd.length} new tracks`);
        if (newTracksToAdd.length > 0) {
          trackList = [...newTracksToAdd, ...trackList];
          localStorage.setItem("tracks", JSON.stringify(trackList));
        }

        let albumUrls = trackList.map(t => t.url);

        loadImages(...albumUrls).then(imgs => {
          loadedImages = imgs.map(i => i.res);
          displayOnCanvas();
        });
      }
    });
};

const checkImage = path =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ res: img, status: "ok" });
    img.onerror = () => resolve({ res: img, status: "error" });

    img.src = path;
  });

const loadImages = (...paths) => Promise.all(paths.map(checkImage));

const displayOnCanvas = () => {
  const size = 32;
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
  }

  setStatus(`${loadedImages.length} tracks loaded`);
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

function windowResized() {
  displayOnCanvas();
}

let debouncedResize;
window.addEventListener("resize", () => {
  clearTimeout(debouncedResize);
  debouncedResize = setTimeout(windowResized, 200);
});

const changeUser = newUser => {
  console.log("changing name!");
  username = newUser;
  localStorage.removeItem("tracks");
  localStorage.setItem("username", username);
  loadedImages = [];
  trackList = [];
  newTracksToAdd = [];
  mostRecentSavedTrack = null;
  hasReachedSavedTrack = false;

  clearCanvas();
  setStatus("");
  fetchNow();
};

if (username && trackList.length > 0) {
  console.log("we got username");
  inputEl.value = username;
  fetchNow();
  setStatus("Checking recently played tracks.");
}
