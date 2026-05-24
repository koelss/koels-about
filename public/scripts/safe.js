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

// --- SAFE PAYLOAD: youareanidiot.cc style bouncing windows ---
// This is a harmless prank that creates bouncing mini-windows on click.
// No malicious behavior, no infinite loops, no data collection.

(function() {
    let payloadStarted = false;
    let windows = [];
    const MAX_WINDOWS = 6;
    const WINDOW_SIZE = 240;

    function createIdiotWindow(x, y) {
        const win = document.createElement('div');
        win.className = 'idiot-window';
        win.style.position = 'fixed';
        win.style.width = WINDOW_SIZE + 'px';
        win.style.height = (WINDOW_SIZE * 0.75) + 'px';
        win.style.left = x + 'px';
        win.style.top = y + 'px';
        win.style.zIndex = '9999';
        win.style.border = '2px solid #000';
        win.style.background = '#fff';
        win.style.boxShadow = '4px 4px 0 #000';
        win.style.overflow = 'hidden';
        win.style.cursor = 'move';
        win.style.userSelect = 'none';

        // Header
        const header = document.createElement('div');
        header.style.background = '#000';
        header.style.color = '#fff';
        header.style.padding = '4px 8px';
        header.style.fontSize = '13px';
        header.style.fontFamily = "'Times New Roman', serif";
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.innerHTML = '<span>youareanidiot.cc</span><span style="cursor:pointer;font-weight:bold;">×</span>';
        win.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.style.padding = '16px';
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.alignItems = 'center';
        body.style.justifyContent = 'center';
        body.style.height = 'calc(100% - 28px)';
        body.innerHTML = `
            <div style="font-size:28px;font-weight:bold;text-align:center;margin-bottom:8px;">You are an idiot!</div>
            <div style="font-size:14px;color:#333;text-align:center;">☺ ☺ ☺</div>
        `;
        win.appendChild(body);

        // Close handler
        header.querySelector('span:last-child').addEventListener('click', (e) => {
            e.stopPropagation();
            win.remove();
            windows = windows.filter(w => w.el !== win);
        });

        document.body.appendChild(win);

        // Physics state
        const state = {
            el: win,
            x: x,
            y: y,
            vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
            vy: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2)
        };
        windows.push(state);
        return state;
    }

    function updateWindows() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        windows.forEach(state => {
            state.x += state.vx;
            state.y += state.vy;

            if (state.x <= 0) { state.x = 0; state.vx = Math.abs(state.vx); }
            if (state.y <= 0) { state.y = 0; state.vy = Math.abs(state.vy); }
            if (state.x + WINDOW_SIZE >= w) { state.x = w - WINDOW_SIZE; state.vx = -Math.abs(state.vx); }
            if (state.y + WINDOW_SIZE * 0.75 >= h) { state.y = h - WINDOW_SIZE * 0.75; state.vy = -Math.abs(state.vy); }

            state.el.style.left = state.x + 'px';
            state.el.style.top = state.y + 'px';
        });
        requestAnimationFrame(updateWindows);
    }

    function startPayload() {
        if (payloadStarted) return;
        payloadStarted = true;

        // Create a few initial windows
        for (let i = 0; i < 3; i++) {
            createIdiotWindow(
                Math.random() * (window.innerWidth - WINDOW_SIZE),
                Math.random() * (window.innerHeight - WINDOW_SIZE * 0.75)
            );
        }

        // Spawn more on interval, up to MAX_WINDOWS
        setInterval(() => {
            if (windows.length < MAX_WINDOWS) {
                createIdiotWindow(
                    Math.random() * (window.innerWidth - WINDOW_SIZE),
                    Math.random() * (window.innerHeight - WINDOW_SIZE * 0.75)
                );
            }
        }, 4000);

        updateWindows();
    }

    // Attach to first click on the main container
    container.addEventListener('click', startPayload, { once: true });
})();
