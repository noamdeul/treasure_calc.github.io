import { gameState, saveState, advanceTurn } from './state.js';
import { WINNING_SCORE } from './constants.js';
import { $, domRefs } from './dom.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';

export function showScoreFlash(score) {
    const flash = document.createElement('div');
    flash.className = `score-flash ${score < 0 ? 'negative' : ''}`;
    flash.textContent = score === 0 ? '💀 0' : (score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString());
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1300);
}

export function showWinner(player) {
    $('#winner-name').textContent = `🎉 ${player.name} מנצח! 🎉`;
    $('#winner-score').textContent = `${player.score.toLocaleString()} נקודות`;
    domRefs.winnerModal.classList.add('active');
}

export function openManualScore() {
    if (gameState.isGameOver) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    $('#manual-player-label').textContent = `${player.avatar} ${player.name}`;
    $('#manual-score-input').value = '';
    $('#manual-modal').classList.add('active');
    setTimeout(() => $('#manual-score-input').focus(), 100);
}

export function submitManualScore() {
    const input = $('#manual-score-input');
    const score = parseInt(input.value);
    if (isNaN(score)) return;

    const player = gameState.players[gameState.currentPlayerIndex];
    player.turns.push({
        round: gameState.round,
        score: score,
        card: 'none',
        bust: false,
        manual: true
    });

    player.score += score;

    $('#manual-modal').classList.remove('active');
    showScoreFlash(score);

    if (player.score >= WINNING_SCORE) {
        gameState.isGameOver = true;
        renderScoreboard();
        setTimeout(() => showWinner(player), 800);
        saveState();
        return;
    }

    advanceTurn();
    renderScoreboard();
    updateTurnIndicator();
    saveState();
}

export function undoLastTurn() {
    if (gameState.isGameOver) return;

    let prevIndex = gameState.currentPlayerIndex - 1;
    let prevRound = gameState.round;
    if (prevIndex < 0) {
        prevIndex = gameState.players.length - 1;
        prevRound--;
    }
    if (prevRound < 1) return;

    const prevPlayer = gameState.players[prevIndex];
    if (prevPlayer.turns.length === 0) return;

    if (!confirm(`לבטל את התור האחרון של ${prevPlayer.name}?`)) return;

    const lastTurn = prevPlayer.turns.pop();

    if (lastTurn.islandPenalty) {
        gameState.players.forEach((p, idx) => {
            if (idx !== prevIndex) {
                const islandTurn = p.turns.findIndex(t => t.round === lastTurn.round && t.island);
                if (islandTurn >= 0) {
                    p.turns.splice(islandTurn, 1);
                }
            }
        });
    }

    prevPlayer.score = prevPlayer.turns.reduce((sum, t) => sum + t.score, 0);

    gameState.currentPlayerIndex = prevIndex;
    gameState.round = prevRound;

    renderScoreboard();
    updateTurnIndicator();
    saveState();
}

export function newGame() {
    if (!confirm('להתחיל משחק חדש?')) return;
    localStorage.removeItem('otzarot_game');
    domRefs.gameScreen.classList.remove('active');
    domRefs.winnerModal.classList.remove('active');
    domRefs.setupScreen.classList.add('active');
}
