var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");

var req = new XMLHttpRequest();

const checkImage = path =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ res: img, status: "ok" });
    img.onerror = () => resolve({ res: img, status: "error" });

    img.src = path;
  });

const loadImages = (...paths) => Promise.all(paths.map(checkImage));

req.addEventListener("load", d => {
  let data = req.responseText;
  let tracks = JSON.parse(data).tracks.reverse();
  let albumUrls = tracks.map(t => t.url);

  loadImages(...albumUrls).then(imgs => {
    displayOnCanvas(imgs.map(i => i.res));
  });
});

req.open("GET", "./MaxKrus.json");
req.send();

const displayOnCanvas = imgs => {
  console.log(imgs.length);
  const perRow = 29;
  const size = 64;

  const totalRows = Math.ceil(imgs.length / perRow);

  ctx.canvas.width = perRow * size;
  ctx.canvas.height = totalRows * size;

  const countPerRow = ctx.canvas.width / size;
  let row = 0;

  for (let i = 0; i < imgs.length; i++) {
    ctx.drawImage(imgs[i], size * (i % countPerRow), row * size, size, size);
    if (i > 0 && i % countPerRow == 0) {
      row++;
    }
  }
};
