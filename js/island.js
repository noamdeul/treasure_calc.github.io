import { gameState, advanceTurn, saveState } from './state.js';
import { $, domRefs } from './dom.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';
import { showScoreFlash } from './ui.js';

let islandSkullCount = 4;

export function openIslandModal() {
    islandSkullCount = parseInt($(`#count-skull`).textContent) || 4;
    const card = $('#fortune-card').value;
    if (card === 'skull1') islandSkullCount += 1;
    if (card === 'skull2') islandSkullCount += 2;
    if (islandSkullCount < 4) islandSkullCount = 4;

    $('#island-skulls').textContent = islandSkullCount;
    updateIslandPenalty();
    domRefs.islandModal.classList.add('active');
}

export function updateIslandPenalty() {
    const penalty = islandSkullCount * 100;
    $('#island-penalty-text').innerHTML = `כל שחקן אחר מפסיד: <strong>${penalty.toLocaleString()}</strong> נקודות`;
}

export function submitIsland() {
    const penalty = islandSkullCount * 100;

    gameState.players.forEach((player, idx) => {
        if (idx !== gameState.currentPlayerIndex) {
            player.score -= penalty;
            player.turns.push({
                round: gameState.round,
                score: -penalty,
                card: 'island',
                bust: false,
                islandPenalty: true
            });
        }
    });

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    currentPlayer.turns.push({
        round: gameState.round,
        score: 0,
        card: 'island',
        bust: true,
        island: true,
        islandSkulls: islandSkullCount
    });

    domRefs.islandModal.classList.remove('active');
    domRefs.calculatorModal.classList.remove('active');

    showScoreFlash(0);
    advanceTurn();
    renderScoreboard();
    updateTurnIndicator();
    saveState();
}

export function islandDecrement() {
    if (islandSkullCount > 4) {
        islandSkullCount--;
        $('#island-skulls').textContent = islandSkullCount;
        updateIslandPenalty();
    }
}

export function islandIncrement() {
    if (islandSkullCount < 10) {
        islandSkullCount++;
        $('#island-skulls').textContent = islandSkullCount;
        updateIslandPenalty();
    }
}
