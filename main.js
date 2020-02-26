API_KEY = "56b54ab233380061bbdd39999aedef89";

let usingDOM = true;
let isRendered = false;
var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
var inputEl = document.getElementById("input-username");
var timestampEl = document.getElementById("timestamp");
const setTimestamp = message => {
  timestampEl.innerText = message;
};

window.addEventListener("load", () => inputEl.focus());

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

// let observer = new IntersectionObserver(
//   (entries, observer) => {
//     // console.log(observer);
//     entries.forEach(entry => {
//       console.log(entry.target.getAttribute("data-date"));
//     });
//   },
//   { rootMargin: "100% 0px" }
// );

const statusEl = document.getElementById("status");
const setStatus = message => {
  statusEl.innerText = message;
};

inputEl.addEventListener("keydown", ev => {
  if (ev.keyCode == 13 && ev.target.value !== username) {
    if (ev.target.value == "") {
      clearRender();
      setStatus("");
    } else {
      changeUser(ev.target.value);
    }
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
        if (!track.date) {
          // happens if user is currently listening
          continue;
        }

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
          localStorage.setItem("username", username);
          localStorage.setItem("tracks", JSON.stringify(trackList));
        }

        loadIntoMemory().then(() => render());
      }
    });
};

const loadIntoMemory = () => {
  return loadImages(...trackList.map(t => t.url)).then(imgs => {
    loadedImages = imgs.map(i => i.res);
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
  // const perRow = Math.floor((document.documentElement.clientWidth - 10) / size);

  let div = document.getElementById("viz");
  for (let i = 0; i < loadedImages.length; i++) {
    // loadedImages[i].setAttribute("data-date", trackList[i].date);
    div.appendChild(loadedImages[i]);
    // observer.observe(loadedImages[i]);
  }
  setStatus(`Loaded ${loadedImages.length} tracks.`);
  isRendered = true;
};

const clearRender = () => {
  usingDOM
    ? (document.getElementById("viz").innerHTML = "")
    : ctx.clearRect(0, 0, canvas.width, canvas.height);
  isRendered = false;
};

const render = () => {
  isRendered = false;
  setStatus("Rendering tracks");
  setTimeout(() => (usingDOM ? displayOnDOM() : displayOnCanvas()), 1000);
};

function windowResized() {
  // rerender if resized
  if (isRendered) {
    render();
  }
}

let debouncedResize;
window.addEventListener("resize", () => {
  clearTimeout(debouncedResize);
  debouncedResize = setTimeout(windowResized, 200);
});

window.addEventListener("mousewheel", ev => {
  let perc = getScrollPercent();
  let itemIndex;
  if (perc == 1) {
    itemIndex = trackList.length - 1;
  } else {
    itemIndex = Math.floor(perc * trackList.length);
  }
  // let date = new Date();
  // console.log(date);
  let timestring = moment(trackList[itemIndex].date * 1000).format("MMMM YYYY");
  // console.log(timestring);
  setTimestamp(timestring);
});

const changeUser = newUser => {
  console.log("changing name!");
  username = newUser;
  localStorage.removeItem("tracks");

  loadedImages = [];
  trackList = [];
  newTracksToAdd = [];
  mostRecentSavedTrack = null;
  hasReachedSavedTrack = false;

  clearRender();

  setStatus("");
  fetchNow();
};

function getScrollPercent() {
  var h = document.documentElement,
    b = document.body,
    st = "scrollTop",
    sh = "scrollHeight";
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
}

if (username && trackList.length > 0) {
  console.log("we got username");
  inputEl.value = username;
  fetchNow();
  // loadIntoMemory().then(() => render());
  setStatus("Checking recently played tracks.");
}
