let container = document.querySelector('#youare-container');
let audio = document.querySelector('#youare-audio');
let ovlap = document.querySelector('#youare-overlap');
let micon = document.querySelector('#youare-micon');

let overlap = false;

function audioPlay() {
	if (!overlap) {
		audio.currentTime = 0;
		audio.play();
	} else {
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
	if (audio.duration > 0 && audio.paused && ovlap.duration > 0 && ovlap.paused) {
		audioPlay();
	} else {
		audioStop();
	}
}

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
container.addEventListener('click', () => container.classList.remove('clicky'));
micon.addEventListener('click', audioSwitch);

// ==========================================================================
// ENHANCED REPLICATION: exact youareanidiot.cc + continuous spawn + loud audio + kill switch
// SYNCHRONOUS window.open inside user gestures to maximize popup allowance.
// ==========================================================================

const urlParams = new URLSearchParams(window.location.search);
const urlSession = urlParams.get('session');
const isPopup = (window.opener !== null || !!urlSession);

// CRITICAL: popups MUST use the sessionId from the URL so all windows share the same killKey.
const sessionId = urlSession || 'i_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
const killKey = 'ik_' + sessionId;

function isKilled() {
	try { return !!localStorage.getItem(killKey); } catch (e) { return false; }
}
function signalKill() {
	try { localStorage.setItem(killKey, Date.now().toString()); } catch (e) {}
}
function clearKill() {
	try { localStorage.removeItem(killKey); } catch (e) {}
}

// Main page clears stale kill on load
if (!isPopup && !urlSession) {
	clearKill();
}

// -------------------------------------------------------------------------
// KILL SWITCH: ESC or closing ANY window kills ALL windows instantly
// -------------------------------------------------------------------------
let moveTimer = null;
let spawnTimer = null;
let killPollId = null;
let stoppedOverlay = null;

function doCleanup() {
	if (moveTimer) { clearTimeout(moveTimer); moveTimer = null; }
	if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
	if (killPollId) { clearInterval(killPollId); killPollId = null; }

	try {
		const a = document.getElementById('youare-audio');
		const o = document.getElementById('youare-overlap');
		if (a) { a.pause(); a.currentTime = 0; a.muted = true; }
		if (o) { o.pause(); o.currentTime = 0; o.muted = true; }
	} catch (e) {}

	try { window.moveTo(window.screenX, window.screenY); } catch (e) {}

	if (!stoppedOverlay) {
		stoppedOverlay = document.createElement('div');
		stoppedOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;font-size:24px;z-index:99999;pointer-events:none;';
		stoppedOverlay.textContent = 'Stopped. You win.';
		document.body.appendChild(stoppedOverlay);
	}

	try { window.close(); } catch (e) {}
}

// Ultra-fast kill polling (20ms)
killPollId = setInterval(() => {
	if (isKilled()) doCleanup();
}, 20);

// ESC in ANY window kills ALL
window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		signalKill();
		doCleanup();
	}
});

// Closing ANY window kills ALL
window.addEventListener('beforeunload', () => { signalKill(); });
window.addEventListener('pagehide', () => { signalKill(); });

// If already killed, die immediately
if (isKilled()) {
	doCleanup();
	throw new Error('Killed before start');
}

// --- math.js (exact) ---
let xOff = 5;
let yOff = 5;
let xPos = 400;
let yPos = -100;

function triggerPopupAudio(win) {
	if (!win || win.closed) return;
	try {
		const a = win.document.getElementById('youare-audio');
		const o = win.document.getElementById('youare-overlap');
		if (a) {
			a.muted = false;
			a.volume = 1.0;
			a.currentTime = 0;
			a.play().catch(() => {});
		}
		if (o) {
			o.muted = false;
			o.volume = 1.0;
		}
	} catch (e) {}
	try {
		win.addEventListener('load', () => {
			const a = win.document.getElementById('youare-audio');
			const o = document.getElementById('youare-overlap');
			if (a) {
				a.muted = false;
				a.volume = 1.0;
				a.currentTime = 0;
				a.play().catch(() => {});
			}
			if (o) {
				o.muted = false;
				o.volume = 1.0;
			}
		});
	} catch (e) {}
}

function openWindow() {
	if (isKilled()) return null;
	const win = window.open(
		'/moron?session=' + encodeURIComponent(sessionId),
		"_blank",
		'menubar=no, status=no, toolbar=no, resizable=no, width=357, height=330, titlebar=no, alwaysRaised=yes'
	);
	if (win) {
		triggerPopupAudio(win);
		setTimeout(() => triggerPopupAudio(win), 100);
		setTimeout(() => triggerPopupAudio(win), 300);
	}
	return win;
}

// SYNCHRONOUS burst: all window.open calls happen in the same tick as the user gesture.
// Browsers allow a short burst of synchronous popups per click.
function proCreateSync(count) {
	for (let i = 0; i < count; i++) {
		if (isKilled()) return;
		openWindow();
	}
}

// --- you.js (enhanced, SYNCHRONOUS) ---
container.addEventListener('click', () => {
	if (isKilled()) return;
	proCreateSync(12);
	window.onbeforeunload = () => "Are you an idiot?";
});

window.onload = playBall;
window.oncontextmenu = () => false;

// MERGED keydown handler: ESC kill + original trap keys (synchronous)
window.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		signalKill();
		doCleanup();
		return;
	}
	if (isKilled()) return;

	if (['Control', 'Alt', 'Delete', 'F4'].includes(event.key)) {
		proCreateSync(12);
		alert("You are an idiot!");
	}
});

// --- Continuous spawn every 3.5 seconds (main window only) ---
// NOTE: these WILL be blocked by popup blockers because they are not inside a user gesture.
if (!isPopup && !urlSession) {
	spawnTimer = setInterval(() => {
		if (isKilled()) {
			clearInterval(spawnTimer);
			spawnTimer = null;
			return;
		}
		openWindow();
	}, 3500);
}

// --- Popup self-audio fallback (loud, unmuted) ---
(function() {
	if (!isPopup) return;
	function startPopupAudio() {
		const a = document.getElementById('youare-audio');
		const o = document.getElementById('youare-overlap');
		if (!a) return false;
		a.muted = false;
		a.volume = 1.0;
		let popupOverlap = false;
		function pOverlap() {
			if (!popupOverlap && a.currentTime > a.duration - .45) {
				o.currentTime = 0;
				o.muted = false;
				o.volume = 1.0;
				o.play().catch(() => {});
				popupOverlap = true;
			}
			if (popupOverlap && o.currentTime > o.duration - .5) {
				a.currentTime = 0;
				a.muted = false;
				a.volume = 1.0;
				a.play().catch(() => {});
				popupOverlap = false;
			}
		}
		a.currentTime = 0;
		a.play().catch(() => {});
		a.addEventListener('timeupdate', pOverlap);
		o.addEventListener('timeupdate', pOverlap);
		return true;
	}
	if (!startPopupAudio()) {
		let tries = 0;
		const retry = setInterval(() => {
			if (startPopupAudio() || ++tries > 25) clearInterval(retry);
		}, 50);
	}
})();
