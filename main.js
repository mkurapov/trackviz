const state = {
  username: '',
  tracks: [],
  isFetching: false,
};

const initalMessageHTML = `Welcome.<br /><br />I wanted to have the experience of looking back at old photos, but for music.<br />This visualizes up to 75k of your most recent Last.fm tracks.<br />I hope you enjoy.`;
let newTracksToAdd = [];
let hasReachedSavedTrack = false;

function loadFromLocalStorage() {
  state.username = localStorage.getItem('username') || '';
  inputEl.value = state.username;
  state.tracks = JSON.parse(localStorage.getItem('tracks')) || [];
  mostRecentSavedTrack = state.tracks.length > 0 ? state.tracks[0] : null;
}

function resetData() {
  state.tracks = [];
  state.username = '';
  state.isFetching = false;

  localStorage.removeItem('tracks');
  localStorage.removeItem('username');
  localStorage.removeItem('visited');
  timestampEl.classList = '';
  setTimestamp('');
  setStatus('');
}

function calculateTimestamp() {
  const perc = getScrollPercent() || 0;
  const itemIndex = perc >= 1 ? state.tracks.length - 1 : Math.floor(perc * state.tracks.length);
  const timestring = moment.unix(state.tracks[itemIndex].date).format('MMMM YYYY');
  return timestring;
}

let oldScroll = 0;
window.addEventListener('scroll', async () => {
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
  setTimestamp(calculateTimestamp(state.tracks));

  const perc = getScrollPercent() || 0;

  if (perc > 0.75) {
    await loadTracksAndDisplay(5);
  }
});

window.addEventListener('load', () => inputEl.focus());

inputEl.addEventListener('keydown', async (ev) => {
  if (ev.keyCode == 13 && ev.target.value !== state.username) {
    resetData();
    clearRender();

    if (ev.target.value === '') {
      setStatus(initalMessageHTML);
      return;
    }

    state.username = ev.target.value.trim();
    inputEl.value = state.username;
    localStorage.setItem('username', state.username);
    await loadTracksAndDisplay();
  }
});

function updateTimestamp() {
  const dateFormat = 'MMMM Do YYYY';
  const mostRecentTrackTime = moment.unix(state.tracks[0].date).format(dateFormat);
  const oldestTrackTime = moment.unix(state.tracks[state.tracks.length - 1].date).format(dateFormat);

  if (mostRecentTrackTime && oldestTrackTime) {
    setStatus(`Showing ${state.tracks.length} tracks from ${mostRecentTrackTime} to ${oldestTrackTime}`);
    setTimestampVisible();
    setTimestamp(calculateTimestamp(state.tracks));
  }
}

async function loadTracksAndDisplay(totalPages = 10) {
  if (state.isFetching) {
    return;
  }

  console.log('Getting new tracks...');

  state.isFetching = true;

  const oldestTrackDate = state.tracks.length > 0 ? state.tracks[state.tracks.length - 1].date : undefined;
  let newTracks;
  try {
    newTracks = await fetchTracks(state.username, totalPages, oldestTrackDate);
  } catch (error) {
    console.log(error);
    setStatus(error.message);
    return;
  } finally {
    state.isFetching = false;
  }

  state.tracks = state.tracks.concat(newTracks);

  localStorage.setItem('tracks', JSON.stringify(state.tracks));

  await displayImages(newTracks);
  updateTimestamp();
}

(async () => {
  if (localStorage.getItem('version') !== '2') {
    await loadTracksAndDisplay();
    localStorage.setItem('version', '2');
    return;
  }

  if (localStorage.getItem('username')) {
    loadFromLocalStorage();

    if (state.tracks.length > 0) {
      await displayImages();
      updateTimestamp();
    } else {
      await loadTracksAndDisplay();
    }
  }
})();
