// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = Immutable.Map({
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	racer_id: undefined //TODO: no need for racer id, just need player id.
});

const updateStore = (state, newState) => {
	store = store.merge(state, newState);
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		await getTracks()
			.then((res) => {
				return res.json();
			})
			.then(tracks => {
				//NOTE: remove later
				console.log('tracks', tracks);
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		await getRacers()
			.then((res) => {
				return res.json();
			})
			.then((racers) => {
				//NOTE: remove later
				console.log('racers', racers)
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event
		console.log('target', target, target.parentNode);

		if (target.matches('#start-race')) {
			updateStore(store, {
				player_id: 1
			})
		}

		// Race track form field
		if (target.matches('.card.track') || target.parentNode.matches('.card.track')) {
			const cardToProcess = target.matches('.card.track') ? target : target.parentNode;
			handleSelectTrack(cardToProcess)
		}

		// Podracer form field
		if (target.matches('.card.podracer') || target.parentNode.matches('.card.podracer')) {
			const cardToProcess = target.matches('.card.podracer') ? target : target.parentNode;
			handleSelectPodRacer(cardToProcess)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI

	// TODO - Get player_id and track_id from the store
	const playerId = store.get('player_id');
	const trackId = store.get('track_id');

	// const race = TODO - invoke the API call to create the race, then save the result
	const race = await createRace(playerId, trackId)
	console.log('created race', race);
	renderAt('#race', renderRaceStartView(race.Track, race.Cars));

	// TODO - update the store with the race id
	// For the API to work properly, the race id should be race id - 1
	updateStore(store, {
		race_id: parseInt(race.ID)-1
	})

	// The race has been created, now start the countdown
	// TODO - call the async function runCountdown
	await runCountdown();

	console.log('race id', store.get('race_id'))
	// TODO - call the async function startRace
	await startRace(store.get('race_id'));

	// TODO - call the async function runRace
	await runRace(store.get('race_id'));
}

async function runRace(raceID) {
	try {
		let timer = 10;

		return new Promise(resolve => {
		// TODO - use Javascript's built in setInterval method to get race info every 500ms
			const runInterval = setInterval(() => {
				getRace(store.get('race_id'))
					.then((response) => {
						return response.json();
					})
					.then((result) => {
						console.log('result', result);
						if (result.status === 'finished' || timer <= 0) {
							clearInterval(runInterval);
							renderAt('#race', resultsView(result.positions));
						}

						timer--;
						renderAt('#leaderBoard', raceProgress(result.positions));
						resolve([]);
					})
			}, 500)
		/*
			TODO - if the race info status property is "in-progress", update the leaderboard by calling:

			renderAt('#leaderBoard', raceProgress(res.positions))

			TODO - if the race info status property is "finished", run the following:

			clearInterval(raceInterval) // to stop the interval from repeating
			renderAt('#race', resultsView(res.positions)) // to render the results view
			reslove(res) // resolve the promise
		*/
		})
	} catch(error) {
		// remember to add error handling for the Promise
		console.log(error);
	}
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			// TODO - use Javascript's built in setInterval method to count down once per second
			const countdownInterval = setInterval(() => {
				if (timer <= 0) {
					clearInterval(countdownInterval);
					resolve("done");
					return
				}
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = --timer
			}, 1000)

			// TODO - if the countdown is done, clear the interval, resolve the promise, and return

		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected racer to the store
	updateStore(store, {
		racer_id: target.id
	})
	console.log('racer_id', store.get('racer_id'))
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	updateStore(store, {
		track_id: target.id
	})
	console.log('track_id', store.get('track_id'))
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// TODO - Invoke the API call to accelerate
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const imageMapping = {
		1:'elf',
		2:'gnome',
		3:'kobold',
		4:'dwarf',
		5:'ogre'
	}

	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<div class="racer-description">
				<div>
					<p>${top_speed}</p>
					<p>${acceleration}</p>
					<p>${handling}</p>
				</div>
				<img class="racer-image" src='../../assets/images/${imageMapping[id]}.png' />
			</div>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
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
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	console.log('positions', positions, 'player_id', store.get('player_id'), 'type of player id', typeof(store.get('player_id')));
	let userPlayer = positions.find(e => e.id === store.get('player_id'))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// NOTE - Make a fetch call (with error handling!) to each of the following API endpoints (done)

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`);
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`);
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`);
}

async function startRace(id) {
	return await fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	// .then(res => {
	// 	return res.json()
	// })
	.catch((err) => {
		console.log("Problem with getRace request::", err.message);
		console.log(err);
	})
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
}
