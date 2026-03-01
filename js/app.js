import { cacheDOM, $, domRefs } from './dom.js';
import { initSetup } from './setup.js';
import { gameState, loadState } from './state.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';
import { showWinner, openManualScore, submitManualScore, undoLastTurn, newGame } from './ui.js';
import { openCalculator, submitScore, updateFortuneCardInfo, skipTurn, bindCalculatorEvents } from './calculator.js';
import { showHistory } from './history.js';
import { openIslandModal, submitIsland, islandDecrement, islandIncrement } from './island.js';
import { openPlayMode, confirmPlayBust, getPlayState, bindPlayModeEvents } from './play-mode.js';

function bindEvents() {
    $('#calc-score-btn').addEventListener('click', openCalculator);
    $('#skip-turn-btn').addEventListener('click', skipTurn);
    $('#close-calc').addEventListener('click', () => domRefs.calculatorModal.classList.remove('active'));
    $('#submit-score').addEventListener('click', submitScore);

    $('#fortune-card').addEventListener('change', updateFortuneCardInfo);

    bindCalculatorEvents();

    $('#history-btn').addEventListener('click', showHistory);
    $('#close-history').addEventListener('click', () => domRefs.historyModal.classList.remove('active'));

    $('#rules-btn').addEventListener('click', () => domRefs.rulesModal.classList.add('active'));
    $('#close-rules').addEventListener('click', () => domRefs.rulesModal.classList.remove('active'));

    $('#manual-score-btn').addEventListener('click', openManualScore);
    $('#submit-manual').addEventListener('click', submitManualScore);
    $('#cancel-manual').addEventListener('click', () => domRefs.manualModal.classList.remove('active'));
    $('#close-manual').addEventListener('click', () => domRefs.manualModal.classList.remove('active'));
    $('#manual-score-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitManualScore();
    });

    $('#undo-btn').addEventListener('click', undoLastTurn);

    $('#play-turn-btn').addEventListener('click', openPlayMode);
    $('#close-play').addEventListener('click', () => {
        const playState = getPlayState();
        if (playState && playState.phase !== 'card') {
            if (!confirm('לצאת מהתור?')) return;
        }
        domRefs.playModal.classList.remove('active');
    });
    bindPlayModeEvents();

    $('#new-game-btn').addEventListener('click', newGame);
    $('#new-game-from-winner').addEventListener('click', () => {
        localStorage.removeItem('otzarot_game');
        domRefs.winnerModal.classList.remove('active');
        domRefs.gameScreen.classList.remove('active');
        domRefs.setupScreen.classList.add('active');
    });

    $('#island-minus').addEventListener('click', islandDecrement);
    $('#island-plus').addEventListener('click', islandIncrement);

    $('#submit-island').addEventListener('click', submitIsland);
    $('#cancel-island').addEventListener('click', () => {
        domRefs.islandModal.classList.remove('active');
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function init() {
    cacheDOM();
    initSetup();
    bindEvents();

    if (loadState()) {
        domRefs.setupScreen.classList.remove('active');
        domRefs.gameScreen.classList.add('active');
        renderScoreboard();
        updateTurnIndicator();
        if (gameState.isGameOver) {
            const winner = gameState.players.reduce((a, b) => (a.score > b.score ? a : b));
            showWinner(winner);
        }
    } else {
        domRefs.setupScreen.classList.add('active');
    }
}

// Expose for onclick in HTML: onclick="window._playTurn && window._playTurn()"
window._playTurn = openPlayMode;

document.addEventListener('DOMContentLoaded', init);
