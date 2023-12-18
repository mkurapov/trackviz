const API_KEY = '56b54ab233380061bbdd39999aedef89';
const TRACKS_PER_PAGE = 50;
const MAX_PAGES = 375;
const DEFAULT_IMG = '2a96cbd8b46e442fc41c2b86b821562f.png';
const ALBUM_IMG_BASE_URL = 'https://lastfm.freetls.fastly.net/i/u/174s/';

const MAX_RETRIES = 5;
let retryCount = 0;

const getUrl = (username, page, toDate, tracksPerPage = TRACKS_PER_PAGE) =>
  `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=${tracksPerPage}&page=${page}&to=${toDate}`;

const parseTrack = (track) => {
  const patt = new RegExp('[^/]*$');
  const fileName = patt.exec(track.image[2]['#text'])[0] ?? DEFAULT_IMG;

  return {
    date: track.date.uts,
    cover: fileName,
  };
};

const parsePage = (page) => {
  const tracks = page.track;

  return tracks.filter((track) => !!track.date).map(parseTrack);
};

async function fetchTracks(username, totalPages, toDate) {
  const promises = [];

  let i = 1;

  while (i <= totalPages) {
    promises.push(
      fetch(getUrl(username, i, toDate), {
        method: 'GET',
      })
    );

    i++;
  }

  const results = await Promise.all(promises);
  const pages = await Promise.all(
    results.map(async (res) => {
      const page = await res.json();
      return page.recenttracks;
    })
  );
  const tracks = pages.map(parsePage).flat();

  return tracks;
}

const checkImage = (path) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      img.src = `${ALBUM_IMG_BASE_URL}${DEFAULT_IMG}`;
      resolve(img);
    };

    img.src = path;
  });

const loadImages = async (paths) => Promise.all(paths.map(checkImage));
