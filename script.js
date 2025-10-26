

(async () => {
    if ('Notification' in window) {
        try {
            const perm = await Notification.requestPermission();
            console.log('Notification permission: ' + perm);
        } catch (e) {
            console.log('Błąd notification.request: ' + e);
        }
    } else {
        console.log('Notification API.');
    }
})();

const map = L.map('map', {zoomControl: true}).setView([52.237049, 21.017532], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
}).addTo(map);

const coordsEl = document.getElementById('coords');
let myMarker = null;

document.getElementById('btnLocate').addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
        console.log('Geolocation niedostępne.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const {latitude, longitude} = pos.coords;
            coordsEl.textContent = `lat: ${latitude.toFixed(6)}  lon: ${longitude.toFixed(6)}`;
            if (myMarker) {
                myMarker.remove();
            }
            myMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Twoja lokalizacja');
            map.setView([latitude, longitude], 15);
            console.log('Pobrano geolokalizację.');
        },
        (err) => {
            console.log('Błąd geolokalizacji: ' + err.message);
        },
        {enableHighAccuracy: true, timeout: 10000, maximumAge: 0}
    );
});

const rasterCanvas = document.getElementById('mapRaster');
const downloadPng = document.getElementById('downloadPng');
const bench = document.getElementById('bench');
const board = document.getElementById('board');

for (let i = 0; i < 16; i++) {
    const z = document.createElement('div');
    z.className = 'dropzone';
    z.dataset.targetIndex = String(i);
    z.addEventListener('dragover', (e) => e.preventDefault());
    z.addEventListener('drop', onDropPiece);
    board.appendChild(z);
}

document.getElementById('btnExport').addEventListener('click', () => {
    if (typeof window.leafletImage !== 'function') {
        console.log('leafletImage niezaładowane');
        return;
    }
    leafletImage(map, (err, canvas) => {
        if (err) {
            console.log('Błąd leafletImage: ' + err);
            return;
        }
        rasterCanvas.width = canvas.width;
        rasterCanvas.height = canvas.height;
        const ctx = rasterCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);

        try {
            downloadPng.href = rasterCanvas.toDataURL('image/png');
            downloadPng.hidden = false;
        } catch (e) {
            console.log('toDataURL error: ' + e);
        }

        console.log(`Raster gotowy: ${canvas.width}×${canvas.height}. Generuję.`);
        makePuzzleFromCanvas(rasterCanvas);
    });
});

function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makePuzzleFromCanvas(sourceCanvas) {
    bench.innerHTML = '';
    const cols = 4, rows = 4;
    const pieceW = Math.floor(sourceCanvas.width / cols);
    const pieceH = Math.floor(sourceCanvas.height / rows);

    const indices = Array.from({length: 16}, (_, i) => i);
    shuffleArray(indices);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const sx = c * pieceW;
            const sy = r * pieceH;
            const piece = document.createElement('canvas');
            piece.width = 100; // mały podgląd
            piece.height = 100;
            piece.className = 'piece';
            piece.draggable = true;
            piece.dataset.correctIndex = String(idx);

            const pctx = piece.getContext('2d');
            pctx.drawImage(sourceCanvas, sx, sy, pieceW, pieceH, 0, 0, piece.width, piece.height);

            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', piece.dataset.correctIndex);
                e.dataTransfer.setDragImage(piece, 50, 50);
                piece.dataset.from = piece.parentElement?.id || 'unknown';
            });

            piece.addEventListener('dblclick', () => {
                bench.appendChild(piece);
                piece.classList.remove('correct');
                checkSolved();
            });
            bench.appendChild(piece);
        }
    }

    const items = Array.from(bench.children);
    shuffleArray(items);
    for (const node of items) bench.appendChild(node);

    console.log('Puzzle wygenerowane i rozsypane na stole.');
}

function onDropPiece(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    if (!(zone instanceof HTMLElement)) return;

    const correctIndex = e.dataTransfer.getData('text/plain');
    const dragged = Array.from(document.querySelectorAll('.piece'))
        .find(p => p.dataset.correctIndex === correctIndex && p === (document.querySelector(':active') || p));

    let selected = dragged;
    if (!selected) {
        const candidates = Array.from(document.querySelectorAll('.piece'))
            .filter(p => p.dataset.correctIndex === correctIndex);
        selected = candidates[candidates.length - 1];
    }
    if (!selected) return;

    if (zone.firstElementChild) {
        const existing = zone.firstElementChild;
        bench.appendChild(existing);
        existing.classList.remove('correct');
    }

    zone.appendChild(selected);
    const ok = zone.dataset.targetIndex === selected.dataset.correctIndex;
    selected.classList.toggle('correct', ok);
    checkSolved();
}

function checkSolved() {
    const zones = Array.from(document.querySelectorAll('.dropzone'));
    const allOk = zones.every(
        z => z.firstElementChild && z.dataset.targetIndex === z.firstElementChild.dataset.correctIndex
    );

    if (allOk) {
        console.log('Układanka ułożona poprawnie!');
        alert('Gratulacje! Ułożyłeś/łaś wszystkie puzzle.');
    }
}


