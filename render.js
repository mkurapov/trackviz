const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const inputEl = document.getElementById('input-username');
const navEl = document.querySelector('nav');
const timestampEl = document.getElementById('timestamp');
const statusEl = document.getElementById('status');

function setStatus(message) {
  statusEl.innerHTML = message;
}

function setTimestamp(message) {
  timestampEl.innerHTML = message;
}

function setTimestampVisible() {
  if (!timestampEl.classList.contains('visible')) {
    timestampEl.classList += 'visible';
  }
}

function clearRender() {
  document.getElementById('viz').innerHTML = '';
}

function getScrollPercent() {
  const h = document.documentElement,
    b = document.body,
    st = 'scrollTop',
    sh = 'scrollHeight';
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
}

function createImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      img.src = `${ALBUM_IMG_BASE_URL}${DEFAULT_IMG}`;
      resolve(img);
    };

    img.src = path;
  });
}

async function displayImages(newTracks = state.tracks) {
  const images = await Promise.all(newTracks.map((track) => `${ALBUM_IMG_BASE_URL}/${track.cover}`).map(createImage));

  const div = document.getElementById('viz');

  for (let i = 0; i < images.length; i++) {
    div.appendChild(images[i]);
  }
}
