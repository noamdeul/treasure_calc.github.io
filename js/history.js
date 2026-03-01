import { gameState } from './state.js';
import { $, domRefs } from './dom.js';
import { escapeHtml } from './utils.js';

function getCardLabel(card) {
    const labels = {
        none: '',
        captain: '🏴‍☠️',
        gold: '💰',
        diamond: '💎',
        skull1: '💀',
        skull2: '💀💀',
        monkey_business: '🐵',
        sorceress: '🧙‍♀️',
        treasure_chest: '📦',
        storm: '🌊',
        seven_weapons: '🗡️',
        battle2: '⚔️×2',
        battle3: '⚔️×3',
        battle4: '⚔️×4',
        island: '🏝️'
    };
    return labels[card] || '';
}

export function showHistory() {
    const body = $('#history-body');
    body.innerHTML = '';

    gameState.players.forEach((player, idx) => {
        const section = document.createElement('div');
        section.className = 'history-player';

        let turnsHtml = '';
        player.turns.forEach((turn, tIdx) => {
            const scoreClass = turn.score > 0 ? 'positive' : turn.score < 0 ? 'negative' : 'zero';
            const scoreDisplay = turn.score >= 0 ? `+${turn.score.toLocaleString()}` : turn.score.toLocaleString();
            const label = turn.islandPenalty ? `🏝️ עונש אי גולגולות` :
                          turn.island ? `🏝️ אי הגולגולות (${turn.islandSkulls} גולגולות)` :
                          turn.skipped ? '⏭️ דילוג' :
                          turn.bust ? '💀 הפסד' :
                          `תור ${tIdx + 1}`;
            const cardLabel = getCardLabel(turn.card);
            turnsHtml += `
                <div class="history-turn">
                    <span class="history-turn-num">${label}${cardLabel ? ` (${cardLabel})` : ''}</span>
                    <span class="history-turn-score ${scoreClass}">${scoreDisplay}</span>
                </div>
            `;
        });

        section.innerHTML = `
            <h3>${player.avatar} ${escapeHtml(player.name)}</h3>
            <div class="history-turns">${turnsHtml || '<div class="history-turn"><span>אין תורות עדיין</span></div>'}</div>
            <div class="history-total">
                <span>סה"כ:</span>
                <span>${player.score.toLocaleString()}</span>
            </div>
        `;
        body.appendChild(section);
    });

    domRefs.historyModal.classList.add('active');
}
