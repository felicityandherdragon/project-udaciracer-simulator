// The store will hold all information needed globally
let store = Immutable.Map({
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
  race_length: undefined,
});

const imageMapping = {
  1: 'elf',
  2: 'gnome',
  3: 'kobold',
  4: 'dwarf',
  5: 'ogre',
};

const nameMapping = {
  'Racer 1': '🗡️ Elf',
  'Racer 2': '🗡️ Gnome',
  'Racer 3': '🗡️ Kobold',
  'Racer 4': '🗡️ Dwarf',
  'Racer 5': '🗡️ Ogre',
};

const dungeonNameMapping = {
  'Track 1': {
    name: '🛡️ Budou Pit',
    description: 'Dwarf-style, on the verge of collapsing',
  },
  'Track 2': {
    name: '🛡️ Brud Dungeon Cluster',
    description: 'Dwarf-style, fully captured and made part of the town',
  },
  'Track 3': {
    name: '🛡️ The Island',
    description: 'Compound-style, discovered in 507',
  },
  'Track 4': {
    name: '🛡️ Tower of Night Cries',
    description:
      'Gnome style, captured and being sealed under administration of the gnomes',
  },
  'Track 5': {
    name: '🛡️ Utaya',
    description: 'The dungeon near the village of Utaya',
  },
  'Track 6': {
    name: '🛡️ The Black Forest Quarters',
    description: 'On the verge of collapsing',
  },
};

const updateStore = (state, newState) => {
  store = store.merge(state, newState);
};

document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    await getTracks()
      .then((res) => {
        return res.json();
      })
      .then((tracks) => {
        const html = renderTrackCards(tracks);
        renderAt('#tracks', html);
      });

    await getRacers()
      .then((res) => {
        return res.json();
      })
      .then((racers) => {
        const html = renderRacerCars(racers);
        renderAt('#racers', html);
      });
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;

      // Race track form field
      if (
        target.matches('.card.track') ||
        target.parentNode.matches('.card.track')
      ) {
        const cardToProcess = target.matches('.card.track')
          ? target
          : target.parentNode;
        handleSelectTrack(cardToProcess);
      }

      // Podracer form field
      if (
        target.matches('.card.podracer') ||
        target.parentNode.matches('.card.podracer')
      ) {
        const cardToProcess = target.matches('.card.podracer')
          ? target
          : target.parentNode;
        handleSelectPodRacer(cardToProcess);
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate();
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}

async function handleCreateRace() {
  const playerId = store.get('player_id');
  const trackId = store.get('track_id');

  try {
    const race = await createRace(playerId, trackId);
    renderAt('#race', renderRaceStartView(race.Track, race.Cars));

    //NOTE: For the API to work properly, the race id should be race id - 1
    updateStore(store, {
      race_id: parseInt(race.ID) - 1,
    });

    await runCountdown();
    await startRace(store.get('race_id'));
    await runRace(store.get('race_id'));
  } catch(err) {
    console.log(err);
  }
}

async function runRace(raceID) {
  try {
    const trackLength = store.get('track_length');

    return new Promise((resolve) => {
      const runInterval = setInterval(() => {
        getRace(raceID)
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            const reachedEnd =
              result.positions.find(
                (player) => player.segment * 1 >= trackLength
              ) === undefined
                ? false
                : true;
            if (result.status === 'finished' || reachedEnd) {
              clearInterval(runInterval);
              renderAt('#race', resultsView(result.positions));
            } else {
              renderAt('#leaderBoard', raceProgress(result.positions));
            }

            resolve(result);
          });
      }, 500);
    });
  } catch (error) {
    console.log('error happened when running race', error);
  }
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const countdownInterval = setInterval(() => {
        if (timer <= 0) {
          clearInterval(countdownInterval);
          resolve('done');
          return;
        }
        document.getElementById('big-numbers').innerHTML = --timer;
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  console.log('selected a pod', target.id);
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  target.classList.add('selected');

  updateStore(store, {
    player_id: target.id,
  });
}

function handleSelectTrack(target) {
  console.log('selected a track', target.id);

  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  target.classList.add('selected');

  updateStore(store, {
    track_id: target.id,
    track_length: target.dataset.length,
  });
}

async function handleAccelerate() {
  console.log('accelerate button clicked');
  await accelerate(store.get('race_id'));
}

// HTML VIEWS ------------------------------------------------
function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join('');

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${nameMapping[driver_name]}</h3>
			<div class="racer-description">
				<div>
					<p><b>Top Speed</b> <br /> ${top_speed}</p>
					<p><b>Acceleration</b> <br /> ${acceleration}</p>
					<p><b>Handling</b> <br /> ${handling}</p>
				</div>
			</div>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join('');

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name, segments } = track;

  return `
		<li id="${id}" class="card track" data-length=${segments.length}>
			<h3>${dungeonNameMapping[name].name}</h3>
			<p><b>Length</b> <br />${segments.length}</p>
			<p><b>Description</b> <br />${dungeonNameMapping[name].description}</p>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a class="button" href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  const userPlayer = positions.find((e) => e.id === store.get('player_id') * 1);
  if (!userPlayer) throw 'Failed to find matching user player!';

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions
    .map((p) => {
      return `
			<tr>
				<td>
					<h3>${count++} - ${
        p.driver_name === userPlayer.driver_name
          ? nameMapping[p.driver_name] + ' (you)'
          : nameMapping[p.driver_name]
      }</h3>
				</td>
			</tr>
		`;
    })
    .join('');

  return `
			<h3>Leaderboard</h3>
			${results}
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER,
    },
  };
}

function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  return fetch(`${SERVER}/api/tracks`).catch(err => console.log(err));;
}

function getRacers() {
  // GET request to `${SERVER}/api/cars`
  return fetch(`${SERVER}/api/cars`).catch(err => console.log(err));
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log('Problem with createRace request::', err));
}

function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`).catch(err => console.log(err));;
}

async function startRace(id) {
  return await fetch(`${SERVER}/api/races/${id}/start`, {
    method: 'POST',
    ...defaultFetchOpts(),
  }).catch((err) => {
    console.log('Problem with getRace request::', err.message);
    console.log(err);
  });
}

async function accelerate(id) {
  // POST request to `${SERVER}/api/races/${id}/accelerate`
  // options parameter provided as defaultFetchOpts
  // no body or datatype needed for this request
  return await fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST',
    ...defaultFetchOpts(),
  }).catch((err) => {
    console.log('Problem with accelerate request::', err.message);
    console.log(err);
  });
}
