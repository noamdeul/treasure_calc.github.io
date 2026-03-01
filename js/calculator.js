import { gameState, advanceTurn, saveState } from './state.js';
import { WINNING_SCORE, diceTypes, chestTypes, SET_SCORES, BATTLE_REWARDS, FULL_CHEST_BONUS } from './constants.js';
import { $, domRefs } from './dom.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';
import { showScoreFlash, showWinner } from './ui.js';
import { openIslandModal } from './island.js';

function getDiceCounts() {
    const counts = {};
    diceTypes.forEach(type => {
        counts[type] = parseInt($(`#count-${type}`).textContent) || 0;
    });
    return counts;
}

function getChestCounts() {
    const counts = {};
    chestTypes.forEach(type => {
        counts[type] = parseInt($(`#count-${type}`).textContent) || 0;
    });
    return counts;
}

function getTotalDice() {
    const counts = getDiceCounts();
    return Object.values(counts).reduce((a, b) => a + b, 0);
}

function getMaxDice() {
    return 8;
}

function updateDiceRemaining() {
    const total = getTotalDice();
    const max = getMaxDice();
    const remaining = max - total;
    const el = $('#dice-remaining span');
    el.textContent = remaining;
    el.parentElement.style.color = remaining < 0 ? 'var(--danger)' : '';
}

export function resetCalculator() {
    $('#fortune-card').value = 'none';
    diceTypes.forEach(type => {
        $(`#count-${type}`).textContent = '0';
        const item = $(`.dice-item[data-type="${type}"]`);
        if (item) item.classList.remove('has-value');
    });
    chestTypes.forEach(type => {
        $(`#count-${type}`).textContent = '0';
    });
    $('#chest-section').classList.add('hidden');
    $('#fortune-card-info').classList.add('hidden');
    $('#bust-warning').classList.add('hidden');
    $('#island-warning').classList.add('hidden');
    updateDiceRemaining();
}

function renderBreakdown(breakdown, totalScore, isBust, isIsland) {
    const container = $('#breakdown-details');
    container.innerHTML = '';

    const card = $('#fortune-card').value;
    const isTreasureChestBust = isBust && !isIsland && card === 'treasure_chest' && breakdown.length > 0;

    if (isBust && !isIsland && !card.startsWith('battle') && !isTreasureChestBust) {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `<span class="breakdown-label">💀 הפסד - 3+ גולגולות</span><span class="breakdown-value">0</span>`;
        container.appendChild(row);
    } else if (isIsland) {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `<span class="breakdown-label">🏝️ אי הגולגולות</span><span class="breakdown-value">לחץ אשר לחישוב</span>`;
        container.appendChild(row);
    } else {
        breakdown.forEach(item => {
            const row = document.createElement('div');
            row.className = 'breakdown-row';
            const isNeg = item.value < 0;
            row.innerHTML = `
                <span class="breakdown-label">${item.label}</span>
                <span class="breakdown-value ${isNeg ? 'negative' : ''}">${item.value >= 0 ? '+' : ''}${item.value.toLocaleString()}</span>
            `;
            container.appendChild(row);
        });
    }

    if (breakdown.length === 0 && !isBust && !isIsland) {
        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `<span class="breakdown-label">הוסף קוביות לחישוב</span><span class="breakdown-value">—</span>`;
        container.appendChild(row);
    }

    const totalEl = $('#total-score');
    totalEl.textContent = isIsland ? '—' : totalScore.toLocaleString();
    totalEl.className = `total-value ${totalScore < 0 ? 'negative' : ''}`;
}

export function recalcScore() {
    const counts = getDiceCounts();
    const card = $('#fortune-card').value;
    const breakdown = [];
    let totalScore = 0;
    let isBust = false;
    let isIsland = false;

    let effectiveCounts = { ...counts };

    if (card === 'gold') effectiveCounts.gold += 1;
    if (card === 'diamond') effectiveCounts.diamond += 1;
    if (card === 'skull1') effectiveCounts.skull += 1;
    if (card === 'skull2') effectiveCounts.skull += 2;

    const totalSkulls = effectiveCounts.skull;
    const isBattle = card.startsWith('battle');
    const isCaptain = card === 'captain';

    const isStorm = card === 'storm';
    const islandThreshold = isStorm ? 3 : 4;

    if (totalSkulls >= 3 && !isBattle) {
        isBust = true;
        if (totalSkulls >= islandThreshold) {
            isIsland = true;
        }
    }

    if (isBattle && totalSkulls >= 3) {
        isBust = true;
    }

    $('#bust-warning').classList.toggle('hidden', !isBust);
    $('#island-warning').classList.toggle('hidden', !isIsland);

    if (isBust && !isIsland) {
        if (isBattle) {
            const penalty = -BATTLE_REWARDS[card];
            breakdown.push({ label: '⚔️ כישלון בקרב ימי', value: penalty });
            totalScore = penalty;
        } else if (card === 'treasure_chest') {
            const chest = getChestCounts();
            const chestDiamonds = chest['chest-diamond'] || 0;
            const chestGold = chest['chest-gold'] || 0;
            const chestTotal = chestDiamonds + chestGold;
            if (chestTotal > 0) {
                const chestDiamondBonus = chestDiamonds * 100;
                const chestGoldBonus = chestGold * 100;
                if (chestDiamondBonus > 0) {
                    breakdown.push({ label: `📦💎 יהלומים בתיבה ×${chestDiamonds}`, value: chestDiamondBonus });
                    totalScore += chestDiamondBonus;
                }
                if (chestGoldBonus > 0) {
                    breakdown.push({ label: `📦💰 זהב בתיבה ×${chestGold}`, value: chestGoldBonus });
                    totalScore += chestGoldBonus;
                }
                breakdown.push({ label: '📦 קוביות שמורות מתיבת האוצר', value: 0 });
            }
        } else {
            totalScore = 0;
        }
    } else if (isIsland) {
        totalScore = 0;
    } else {
        const isMonkeyBusiness = card === 'monkey_business';

        let scoringCounts;
        if (isMonkeyBusiness) {
            scoringCounts = {
                diamond: effectiveCounts.diamond,
                gold: effectiveCounts.gold,
                monkey_parrot: effectiveCounts.monkey + effectiveCounts.parrot,
                sword: effectiveCounts.sword
            };
        } else {
            scoringCounts = {
                diamond: effectiveCounts.diamond,
                gold: effectiveCounts.gold,
                monkey: effectiveCounts.monkey,
                parrot: effectiveCounts.parrot,
                sword: effectiveCounts.sword
            };
        }

        const typeLabels = {
            diamond: '💎 יהלומים',
            gold: '💰 מטבעות זהב',
            monkey: '🐵 קופים',
            parrot: '🦜 תוכים',
            monkey_parrot: '🐵🦜 קופים + תוכים',
            sword: '⚔️ חרבות'
        };

        for (const [type, count] of Object.entries(scoringCounts)) {
            if (count >= 3) {
                const setScore = SET_SCORES[count] || 0;
                if (setScore > 0) {
                    breakdown.push({
                        label: `${typeLabels[type]} ×${count} (סדרה)`,
                        value: setScore
                    });
                    totalScore += setScore;
                }
            }
        }

        const gemValue = isStorm ? 200 : 100;
        const diamondBonus = effectiveCounts.diamond * gemValue;
        if (diamondBonus > 0) {
            const gemLabel = isStorm ? ` (×${gemValue})` : '';
            breakdown.push({ label: `💎 בונוס יהלומים ×${effectiveCounts.diamond}${gemLabel}`, value: diamondBonus });
            totalScore += diamondBonus;
        }

        const goldBonus = effectiveCounts.gold * gemValue;
        if (goldBonus > 0) {
            const gemLabel = isStorm ? ` (×${gemValue})` : '';
            breakdown.push({ label: `💰 בונוס זהב ×${effectiveCounts.gold}${gemLabel}`, value: goldBonus });
            totalScore += goldBonus;
        }

        if (isBattle) {
            const requiredSwords = parseInt(card.replace('battle', ''));
            const hasSwords = effectiveCounts.sword >= requiredSwords;
            if (hasSwords) {
                const battleBonus = BATTLE_REWARDS[card];
                breakdown.push({ label: `⚔️ ניצחון קרב ימי (${requiredSwords} חרבות)`, value: battleBonus });
                totalScore += battleBonus;
            } else {
                const penalty = -BATTLE_REWARDS[card];
                breakdown.push({ label: '⚔️ כישלון בקרב ימי', value: penalty });
                totalScore = penalty;
            }
        }

        if (card === 'seven_weapons' && effectiveCounts.sword >= 7) {
            breakdown.push({ label: '🗡️ שביתת נשק (7+ חרבות)', value: 500 });
            totalScore += 500;
        }

        const physicalSkulls = counts.skull;
        if (physicalSkulls === 0 && getTotalDice() === 8 && !isBattle) {
            breakdown.push({ label: '📦 תיבה מלאה (כל 8 מנקדות)', value: FULL_CHEST_BONUS });
            totalScore += FULL_CHEST_BONUS;
        }
    }

    if (isCaptain && !isBust && !isIsland && totalScore > 0) {
        breakdown.push({ label: '🏴‍☠️ קברניט - ניקוד כפול! ×2', value: totalScore });
        totalScore *= 2;
    }

    renderBreakdown(breakdown, totalScore, isBust, isIsland);
    return { totalScore, isBust, isIsland };
}

function handleCounterClick(e) {
    const btn = e.target.closest('.counter-btn');
    if (!btn) return;

    const type = btn.dataset.type;
    if (!type) return;

    const isPlus = btn.classList.contains('plus');
    const isMinus = btn.classList.contains('minus');
    const counterEl = btn.parentElement.querySelector('.counter-value');
    let value = parseInt(counterEl.textContent) || 0;

    if (isPlus) {
        if (diceTypes.includes(type) && getTotalDice() >= getMaxDice()) return;
        value++;
    } else if (isMinus && value > 0) {
        value--;
    }

    counterEl.textContent = value;

    const diceItem = btn.closest('.dice-item');
    if (diceItem) {
        diceItem.classList.toggle('has-value', value > 0);
    }

    if (diceTypes.includes(type)) {
        updateDiceRemaining();
    }
    recalcScore();
}

function applyScore(score, isBust) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = $('#fortune-card').value;

    player.turns.push({
        round: gameState.round,
        score: score,
        card: card,
        bust: isBust
    });

    player.score += score;

    domRefs.calculatorModal.classList.remove('active');

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

export function openCalculator() {
    if (gameState.isGameOver) return;

    const player = gameState.players[gameState.currentPlayerIndex];
    $('#calc-player-name').textContent = `${player.avatar} ${player.name}`;

    resetCalculator();
    domRefs.calculatorModal.classList.add('active');
    recalcScore();
}

export function submitScore() {
    const result = recalcScore();

    if (result.isIsland) {
        openIslandModal();
        return;
    }

    applyScore(result.totalScore, result.isBust);
}

export function updateFortuneCardInfo() {
    const card = $('#fortune-card').value;
    const infoEl = $('#fortune-card-info');
    const chestSection = $('#chest-section');

    const cardInfo = {
        none: '',
        captain: '🏴‍☠️ קברניט! כל הניקוד של התור הזה מוכפל ×2!',
        gold: '💰 מתחיל עם מטבע זהב אחד נוסף. נספר אוטומטית בחישוב.',
        diamond: '💎 מתחיל עם יהלום אחד נוסף. נספר אוטומטית בחישוב.',
        skull1: '💀 מתחיל עם גולגולת אחת נוספת. נספרת אוטומטית.',
        skull2: '💀💀 מתחיל עם 2 גולגולות נוספות. נספרות אוטומטית.',
        monkey_business: '🐵🦜 קופים ותוכים נספרים כאותו סוג לצורך סדרות!',
        sorceress: '🧙‍♀️ ניתן להחזיר גולגולת אחת. אל תספור אותה בקוביות.',
        treasure_chest: '📦 קוביות שנשמרו בתיבת האוצר מוגנות. סמן למטה אילו קוביות שמרת.',
        storm: '🌊 סופה! יהלומים וזהב שווים 200 כל אחד. 3 גולגולות = אי הגולגולות!',
        seven_weapons: '🗡️ שביתת נשק! אם תשיג 7 חרבות או יותר, תקבל בונוס 500 נקודות!',
        battle2: '⚔️ צריך לפחות 2 חרבות. הצלחה = +200, כישלון = -200.',
        battle3: '⚔️ צריך לפחות 3 חרבות. הצלחה = +500, כישלון = -500.',
        battle4: '⚔️ צריך לפחות 4 חרבות. הצלחה = +1,000, כישלון = -1,000.'
    };

    if (cardInfo[card]) {
        infoEl.textContent = cardInfo[card];
        infoEl.classList.remove('hidden');
    } else {
        infoEl.classList.add('hidden');
    }

    chestSection.classList.toggle('hidden', card !== 'treasure_chest');
    updateDiceRemaining();
    recalcScore();
}

export function skipTurn() {
    if (gameState.isGameOver) return;

    const player = gameState.players[gameState.currentPlayerIndex];
    player.turns.push({
        round: gameState.round,
        score: 0,
        card: 'none',
        bust: false,
        skipped: true
    });

    advanceTurn();
    renderScoreboard();
    updateTurnIndicator();
    saveState();
}

export function bindCalculatorEvents() {
    document.querySelectorAll('.dice-grid').forEach(grid => {
        grid.addEventListener('click', handleCounterClick);
    });
}
