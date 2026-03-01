import { gameState, setGameState, saveState } from './state.js';
import { PLAYER_AVATARS, RANDOM_NAMES } from './constants.js';
import { $, $$, domRefs } from './dom.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';

export function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function updatePlayerNameFields(count) {
    const container = $('#player-names');
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'name-input';
        div.innerHTML = `
            <label>שחקן ${i}:</label>
            <input type="text" id="player-${i}-name" placeholder="שם שחקן ${i}" maxlength="15">
        `;
        container.appendChild(div);
    }
}

export function fillRandomNames() {
    const count = parseInt($('.count-btn.active').dataset.count);
    const names = shuffleArray(RANDOM_NAMES).slice(0, count);
    for (let i = 1; i <= count; i++) {
        const input = $(`#player-${i}-name`);
        if (input) input.value = names[i - 1];
    }
}

export function startGame() {
    const count = parseInt($('.count-btn.active').dataset.count);
    const players = [];

    for (let i = 1; i <= count; i++) {
        const nameInput = $(`#player-${i}-name`);
        const name = nameInput.value.trim() || `שחקן ${i}`;
        players.push({
            name,
            score: 0,
            turns: [],
            avatar: PLAYER_AVATARS[i - 1]
        });
    }

    setGameState({
        players,
        currentPlayerIndex: 0,
        round: 1,
        isGameOver: false
    });

    domRefs.setupScreen.classList.remove('active');
    domRefs.gameScreen.classList.add('active');
    renderScoreboard();
    updateTurnIndicator();
    saveState();
}

export function initSetup() {
    const countBtns = $$('.count-btn');
    countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            countBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updatePlayerNameFields(parseInt(btn.dataset.count));
        });
    });

    $('#start-game-btn').addEventListener('click', startGame);
    $('#random-names-btn').addEventListener('click', fillRandomNames);
    updatePlayerNameFields(3);
}
