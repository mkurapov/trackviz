var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");

let songs = (API_KEY = "56b54ab233380061bbdd39999aedef89");

username = "MaxKrus";
URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=200`;

// ALBUM_IMG_BASE_URL = "https://lastfm.freetls.fastly.net/i/u/174s/";

let loadedImages = [];
let totalPages = 0;

let trackList = JSON.parse(localStorage.getItem("tracks")) || [];

console.log(`${trackList.length} tracks loaded from localstorage.`);

let newTracksToAdd = [];
let mostRecentSavedTrack = trackList.length > 0 ? trackList[0] : null;
let hasReachedSavedTrack = false;

const fetchNow = page => {
  fetch(`${URL}&page=${page}`)
    .then(res => res.json())
    .then(data => {
      totalPages = data.recenttracks["@attr"].totalPages;
      console.log(`got page ${page} of ${totalPages}`);

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

      if (page < 50 && !hasReachedSavedTrack) {
        fetchNow(++page);
      } else {
        console.log(`done. adding ${newTracksToAdd.length} new tracks`);
        if (newTracksToAdd.length > 0) {
          trackList = newTracksToAdd.concat(trackList);
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

fetchNow(1);

const displayOnCanvas = () => {
  const size = 64;
  const perRow = Math.floor(document.documentElement.clientWidth / size); // clientwidth is accounting scrollbar width
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
};

function windowResized() {
  displayOnCanvas();
}

let debouncedResize;
window.addEventListener("resize", () => {
  clearTimeout(debouncedResize);
  debouncedResize = setTimeout(windowResized, 200);
});
