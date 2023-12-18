const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const inputEl = document.getElementById('input-username');
const navEl = document.querySelector('nav');
const timestampEl = document.getElementById('timestamp');
const setTimestamp = (message) => {
  timestampEl.innerHTML = message;
};

const statusEl = document.getElementById('status');
const setStatus = (message) => {
  statusEl.innerHTML = message;
};

const loadFromLocalStorage = () => {
  username = localStorage.getItem('username') || '';
  inputEl.value = username;
  tracks = JSON.parse(localStorage.getItem('tracks')) || [];
  mostRecentSavedTrack = tracks.length > 0 ? tracks[0] : null;
};

let isFetching = false;

const initalMessageHTML = `Welcome.<br /><br />I wanted to have the experience of looking back at old photos, but for music.<br />This visualizes up to 75k of your most recent Last.fm tracks.<br />I hope you enjoy.`;

window.addEventListener('load', () => inputEl.focus());

inputEl.addEventListener('keydown', async (ev) => {
  if (ev.keyCode == 13 && ev.target.value !== username) {
    resetData();
    clearRender();

    if (ev.target.value == '') {
      setStatus(initalMessageHTML);
    } else {
      username = ev.target.value.trim();
      inputEl.value = ev.target.value.trim();
      localStorage.setItem('username', username);
      await loadTracksAndDisplay();
    }
  }
});

let debouncedResize;
window.addEventListener('resize', () => {
  clearTimeout(debouncedResize);
  debouncedResize = setTimeout(onWindowResize, 200);
});

let oldScroll = 0;

let username = '';
let tracks = [];
let mostRecentSavedTrack = null;

let totalPages = 0;
let totalTracks = 0;

let newTracksToAdd = [];
let hasReachedSavedTrack = false;

const onHandleError = (res, page) => {
  console.log(res);
  if (res.statusText == 'Forbidden') {
    inputEl.value = '';
    username = '';
    setStatus('Please turn on your hidden your recent track visibility in Profile > Privacy & try again.');
    return;
  } else if (res.statusText == 'Not Found') {
    if (page == 1) {
      setStatus('Could not find user with that name. Please check the spelling.');
      return;
    }
  }

  retryCount++;

  if (retryCount < MAX_RETRIES) {
    new Promise((resolve) => {
      console.log('retrying');
      setTimeout(() => {
        resolve();
      }, 1000);
    }).then(() => fetchTracks(page));
    return;
  }

  // if a strange error slips, but we already got some tracks.
  if (newTracksToAdd.length > 0) {
    new Promise((resolve) => {
      setStatus(
        `There was an error getting all ${totalTracks} of your tracks. I'm a sorry Canadian. But we got ${newTracksToAdd.length} of them.`
      );
      setTimeout(() => {
        resolve();
      }, 3000);
    }).then(() => onFinishedGatheringData());
  } else {
    setStatus("There was an error getting your tracks. I'm a sorry Canadian. Please try again later.");
  }
};

const resetData = () => {
  username = '';
  localStorage.removeItem('tracks');
  localStorage.removeItem('username');
  localStorage.removeItem('visited');
  loadedImages = [];
  totalTracks = 0;
  totalPages = 0;
  retryCount = 0;
  newTracksToAdd = [];
  mostRecentSavedTrack = null;
  hasReachedSavedTrack = false;
  timestampEl.classList = '';
  setTimestamp('');
  setStatus('');
};

let isRendered = false;

async function displayImages(newTracks = tracks) {
  const images = await loadImages(newTracks.map((track) => `${ALBUM_IMG_BASE_URL}/${track.cover}`));

  const div = document.getElementById('viz');
  const sw = document.body.scrollWidth;
  const isMobile = sw < 768;
  const mobileImgsPerRow = 10;
  const mobileImgWidth = sw / mobileImgsPerRow;

  for (let i = 0; i < images.length; i++) {
    // let img = ;
    if (isMobile) {
      images[i].style.width = mobileImgWidth + 'px';
    }
    div.appendChild(images[i]);
  }

  isRendered = true;
}

const render = () => {
  isRendered = false;
  setStatus('Rendering tracks');
  isUsingDOM ? displayOnDOM() : displayOnCanvas();
};

const clearRender = () => {
  document.getElementById('viz').innerHTML = '';
  isRendered = false;
};

const onWindowResize = () => {
  displayImages();
};

const calculateTimestamp = () => {
  const perc = getScrollPercent() || 0;
  const itemIndex = perc >= 1 ? tracks.length - 1 : Math.floor(perc * tracks.length);
  const timestring = moment.unix(tracks[itemIndex].date).format('MMMM YYYY');
  setTimestamp(timestring);
};

const getScrollPercent = () => {
  const h = document.documentElement,
    b = document.body,
    st = 'scrollTop',
    sh = 'scrollHeight';
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);
};

window.addEventListener('scroll', async (ev) => {
  if (oldScroll < window.scrollY) {
    if (!navEl.classList.contains('hidden')) {
      navEl.classList += 'hidden';
    }
  } else {
    if (navEl.classList.contains('hidden')) {
      navEl.classList = '';
    }
  }
  oldScroll = window.scrollY;
  calculateTimestamp(tracks);

  const perc = getScrollPercent() || 0;

  if (perc > 0.75) {
    console.log('fetching new tracks');
    await loadTracksAndDisplay(5);
  }
});

function updateTimestamp() {
  const dateFormat = 'MMMM Do YYYY';
  const mostRecentTrackTime = moment.unix(tracks[0].date).format(dateFormat);
  const oldestTrackTime = moment.unix(tracks[tracks.length - 1].date).format(dateFormat);

  if (mostRecentTrackTime && oldestTrackTime) {
    setStatus(`Showing ${tracks.length} tracks from ${mostRecentTrackTime} to ${oldestTrackTime}`);
    if (!timestampEl.classList.contains('visible')) {
      timestampEl.classList += 'visible';
    }
    calculateTimestamp();
  } else {
    console.log('COULD NOT GET TRACK TIMES');
  }
}

async function loadTracksAndDisplay(totalPages = 10) {
  if (isFetching) {
    console.log('already fetching');
    return;
  }

  isFetching = true;
  const oldestTrackDate = tracks.length > 0 ? tracks[tracks.length - 1].date : undefined;
  console.log({ oldestTrackDate });

  const newTracks = await fetchTracks(username, totalPages, oldestTrackDate);
  tracks = tracks.concat(newTracks);

  localStorage.setItem('tracks', JSON.stringify(tracks));

  await displayImages(newTracks);
  updateTimestamp();
  isFetching = false;
}

(async () => {
  if (localStorage.getItem('username')) {
    loadFromLocalStorage();

    if (tracks.length > 0) {
      await displayImages();
      updateTimestamp();
    } else {
      await loadTracksAndDisplay();
    }
  }
})();
