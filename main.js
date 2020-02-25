var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");

let loadedImages = [];
let songs = (API_KEY = "56b54ab233380061bbdd39999aedef89");
username = "MaxKrus";
URL = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=200`;

let trackList = [];

const fetchNow = page => {
  console.log(`getting page ${page}`);
  fetch(`${URL}&page=${page}`)
    .then(res => res.json())
    .then(data => {
      trackList = trackList.concat(data.recenttracks.track);

      if (trackList.length != 400) {
        fetchNow(++page);
      } else {
        console.log("got it all yo");
        prepAndDisplay();
      }
    });
};

fetchNow(1);

const prepAndDisplay = () => {
  let albumUrls = trackList.map(t => t.image[2]["#text"]);
  loadImages(...albumUrls).then(imgs => {
    loadedImages = imgs.map(i => i.res);
    displayOnCanvas();
  });
};

// let data = req.responseText;
// let tracks = JSON.parse(data).tracks.reverse();
// let albumUrls = tracks.map(t => t.url);

const checkImage = path =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ res: img, status: "ok" });
    img.onerror = () => resolve({ res: img, status: "error" });

    img.src = path;
  });

const loadImages = (...paths) => Promise.all(paths.map(checkImage));

const displayOnCanvas = () => {
  const size = 100;
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
