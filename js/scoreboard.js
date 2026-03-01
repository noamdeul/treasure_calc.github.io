import { gameState } from './state.js';
import { WINNING_SCORE } from './constants.js';
import { $ } from './dom.js';
import { escapeHtml } from './utils.js';

export function renderScoreboard() {
    const board = $('#scoreboard');
    board.innerHTML = '';

    gameState.players.forEach((player, idx) => {
        const isActive = idx === gameState.currentPlayerIndex && !gameState.isGameOver;
        const pct = Math.max(0, Math.min((player.score / WINNING_SCORE) * 100, 100));

        const card = document.createElement('div');
        card.className = `player-card slide-in ${isActive ? 'active-turn' : ''}`;
        card.innerHTML = `
            <div class="player-info">
                <div class="player-avatar player-color-${idx}">${player.avatar}</div>
                <div class="player-details">
                    <div class="player-card-name">${escapeHtml(player.name)}</div>
                    <div class="player-turns">${player.turns.length} תורות</div>
                    <div class="score-bar-container">
                        <div class="score-bar" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
            <div class="player-score ${player.score < 0 ? 'score-negative' : ''}">${player.score.toLocaleString()}</div>
        `;
        board.appendChild(card);
    });
}

export function updateTurnIndicator() {
    const player = gameState.players[gameState.currentPlayerIndex];
    $('#current-player-name').textContent = `תור של: ${player.name}`;
    $('#round-number').textContent = `סיבוב: ${gameState.round}`;
}
