let container = document.querySelector('#youare-container');

let audio = document.querySelector('#youare-audio');
let ovlap = document.querySelector('#youare-overlap');
let micon = document.querySelector('#youare-micon');

// Overlap global. Can probably be done better.
// https://github.com/Endermanch/youareanidiot.cc 🤫
let overlap = false;

function audioPlay() {
	if (!overlap) {
		audio.currentTime = 0;
		audio.play();
	}
	else {
		ovlap.currentTime = 0;
		ovlap.play();
	}
	
	container.removeEventListener('click', audioPlay);
	
	audio.addEventListener('timeupdate', audioOverlap);
	ovlap.addEventListener('timeupdate', audioOverlap);
	
	container.classList.remove('clicky');
	micon.src = "/images/speaker.avif";
}

function audioStop() {
	audio.currentTime = 0;
	audio.pause();
	
	ovlap.currentTime = 0;
	ovlap.pause();
	
	container.addEventListener('click', audioPlay);
	
	audio.removeEventListener('timeupdate', audioOverlap);
	ovlap.removeEventListener('timeupdate', audioOverlap);
	
	container.classList.add('clicky');
	micon.src = "/images/speakerm.avif";
}

function audioSwitch() {	
	if (
		audio.duration > 0 && audio.paused &&
		ovlap.duration > 0 && ovlap.paused
	) {
		audioPlay();
	}
	else {
		audioStop();
	}
}

/* 
 * [Aug 2023] Finally, after 3 years have passed, I made the overlapping mechanism.
 * Audio overlapping is necessary for historic accuracy. The original flash version used to randomly overlap the song over itself.
 * I also think it sounds funnier and less respectful when overlapped.
 * Despite the constants .45 and .5, the JS audio jank at times makes it sound nice and random.
 */
function audioOverlap() {
    if (!overlap && audio.currentTime > audio.duration - .45) {
        ovlap.currentTime = 0;
        ovlap.play();
		
		overlap = true;
    }
	
	if (overlap && ovlap.currentTime > ovlap.duration - .5) {
        audio.currentTime = 0;
        audio.play();
		
		overlap = false;
    }
}

container.addEventListener('click', audioPlay);
container.addEventListener('click', () => {
	container.classList.remove('clicky');
});

micon.addEventListener('click', audioSwitch);

// ==========================================================================
// SAFE PAYLOAD: Real bouncing popup windows (performance-optimized)
// Only the MAIN window spawns and moves popups.
// Popups are passive display windows — no spawn timers, no move loops.
// Press ESC in the main window to kill everything instantly.
// ==========================================================================
(function() {
	const urlParams = new URLSearchParams(window.location.search);
	const urlSession = urlParams.get('session');
	const isPopup = (window.opener !== null || !!urlSession);
	const isMain = !isPopup;

	// Shared session ID so popups can listen for the kill signal
	const sessionId = isMain
		? 'i_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
		: (urlSession || 'orphan');

	// -------------------------------------------------------------------------
	// POPUP MODE: light weight — autoplay audio once, listen for kill, ESC
	// -------------------------------------------------------------------------
	if (isPopup) {
		// Try to autoplay audio (usually allowed since opened via user gesture)
		try {
			if (audio) {
				audio.currentTime = 0;
				audio.play().catch(() => {});
			}
		} catch (e) {}

		// Lightweight kill polling (every 500ms)
		const killKey = 'ik_' + sessionId;
		let pollId = setInterval(() => {
			try {
				if (localStorage.getItem(killKey)) {
					clearInterval(pollId);
					try { window.close(); } catch (e) {}
				}
			} catch (e) { clearInterval(pollId); }
		}, 500);

		// ESC closes this popup
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				clearInterval(pollId);
				try { window.close(); } catch (e) {}
			}
		});

		return; // Popups skip the heavy payload controller below
	}

	// -------------------------------------------------------------------------
	// MAIN WINDOW MODE: single controller for all popups
	// -------------------------------------------------------------------------
	let payloadActive = false;
	let windows = [];         // { win, vx, vy }
	let spawnTimer = null;
	let moveRequestId = null;
	let lastMoveTime = 0;
	const MAX_WINDOWS = 6;
	const WIN_W = 500;
	const WIN_H = 400;
	const SPAWN_INTERVAL = 2000; // ms

	function getKillKey() {
		return 'ik_' + sessionId;
	}

	function signalKill() {
		try { localStorage.setItem(getKillKey(), Date.now().toString()); } catch (e) {}
	}

	function clearKillSignal() {
		try { localStorage.removeItem(getKillKey()); } catch (e) {}
	}

	function createPopup() {
		if (windows.length >= MAX_WINDOWS) return;
		try {
			const x = Math.floor(Math.random() * Math.max(1, screen.availWidth - WIN_W));
			const y = Math.floor(Math.random() * Math.max(1, screen.availHeight - WIN_H));
			const url = '/moron?session=' + encodeURIComponent(sessionId);

			const win = window.open(
				url,
				'_blank',
				`width=${WIN_W},height=${WIN_H},left=${x},top=${y},toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=no`
			);

			if (win) {
				windows.push({
					win: win,
					vx: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3),
					vy: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3)
				});

				// Trigger audio in the popup using the main window's user activation.
				// Browsers allow this because the popup was opened from a click handler.
				function tryPopupAudio(attempts) {
					if (attempts <= 0 || win.closed) return;
					try {
						const popupAudio = win.document.getElementById('youare-audio');
						if (popupAudio) {
							popupAudio.currentTime = 0;
							popupAudio.play().catch(() => {});
						} else {
							// DOM not ready yet, retry shortly
							setTimeout(() => tryPopupAudio(attempts - 1), 100);
						}
					} catch (e) {
						// Cross-origin or not ready
						setTimeout(() => tryPopupAudio(attempts - 1), 100);
					}
				}
				tryPopupAudio(20); // try for up to ~2s
			}
		} catch (e) {}
	}

	function moveWindows() {
		if (!payloadActive) return;

		// Throttle to ~60fps
		const now = performance.now();
		if (now - lastMoveTime < 16) {
			moveRequestId = requestAnimationFrame(moveWindows);
			return;
		}
		lastMoveTime = now;

		windows.forEach(state => {
			try {
				if (state.win.closed) return;

				let sx = state.win.screenX !== undefined ? state.win.screenX : (state.win.screenLeft || 0);
				let sy = state.win.screenY !== undefined ? state.win.screenY : (state.win.screenTop || 0);
				let ww = state.win.outerWidth || WIN_W;
				let wh = state.win.outerHeight || WIN_H;

				sx += state.vx;
				sy += state.vy;

				if (sx <= 0) { sx = 0; state.vx = Math.abs(state.vx); }
				if (sy <= 0) { sy = 0; state.vy = Math.abs(state.vy); }
				if (sx + ww >= screen.availWidth)  { sx = screen.availWidth  - ww; state.vx = -Math.abs(state.vx); }
				if (sy + wh >= screen.availHeight) { sy = screen.availHeight - wh; state.vy = -Math.abs(state.vy); }

				state.win.moveTo(Math.floor(sx), Math.floor(sy));
			} catch (e) {}
		});

		// Prune closed windows so array doesn't bloat
		windows = windows.filter(w => {
			try { return !w.win.closed; } catch (e) { return false; }
		});

		moveRequestId = requestAnimationFrame(moveWindows);
	}

	function startPayload() {
		if (payloadActive) return;
		payloadActive = true;
		clearKillSignal();
		showKillSwitch();

		let spawned = 0;

		const trySpawn = () => {
			if (!payloadActive || spawned >= MAX_WINDOWS) return;
			createPopup();
			spawned++;
		};

		// Spawn one immediately, then every 2 seconds
		trySpawn();
		spawnTimer = setInterval(() => {
			trySpawn();
			if (spawned >= MAX_WINDOWS && spawnTimer) {
				clearInterval(spawnTimer);
				spawnTimer = null;
			}
		}, SPAWN_INTERVAL);

		moveWindows();
	}

	function stopPayload() {
		if (!payloadActive) return;
		payloadActive = false;
		signalKill();

		if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
		if (moveRequestId) { cancelAnimationFrame(moveRequestId); moveRequestId = null; }

		windows.forEach(state => {
			try { if (!state.win.closed) state.win.close(); } catch (e) {}
		});
		windows = [];

		hideKillSwitch();
	}

	// UI: Kill switch hint
	let killSwitchEl = null;
	function showKillSwitch() {
		if (killSwitchEl) return;
		killSwitchEl = document.createElement('div');
		killSwitchEl.style.position = 'fixed';
		killSwitchEl.style.bottom = '14px';
		killSwitchEl.style.left = '50%';
		killSwitchEl.style.transform = 'translateX(-50%)';
		killSwitchEl.style.background = 'rgba(0, 0, 0, 0.9)';
		killSwitchEl.style.color = '#fff';
		killSwitchEl.style.padding = '10px 20px';
		killSwitchEl.style.borderRadius = '8px';
		killSwitchEl.style.fontFamily = "'Times New Roman', serif";
		killSwitchEl.style.fontSize = '15px';
		killSwitchEl.style.zIndex = '99999';
		killSwitchEl.style.pointerEvents = 'none';
		killSwitchEl.style.userSelect = 'none';
		killSwitchEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
		killSwitchEl.textContent = 'Press ESC to stop';
		document.body.appendChild(killSwitchEl);
	}

	function hideKillSwitch() {
		if (killSwitchEl) {
			killSwitchEl.remove();
			killSwitchEl = null;
		}
	}

	// ESC kills everything from the main window
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			stopPayload();
		}
	});

	// Start payload on first click of the main idiot container
	container.addEventListener('click', startPayload, { once: true });
})();
