(function () {
    'use strict';

    const WINNING_SCORE = 8000;
    const PLAYER_AVATARS = ['🏴‍☠️', '⛵', '🗡️', '🦜'];
    const SET_SCORES = { 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000, 8: 4000 };
    const BATTLE_REWARDS = { battle2: 200, battle3: 500, battle4: 1000 };
    const FULL_CHEST_BONUS = 500;

    let gameState = {
        players: [],
        currentPlayerIndex: 0,
        round: 1,
        isGameOver: false
    };

    // ── DOM References ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    let setupScreen, gameScreen, calculatorModal, historyModal, rulesModal, winnerModal, islandModal;

    function cacheDOM() {
        setupScreen = $('#setup-screen');
        gameScreen = $('#game-screen');
        calculatorModal = $('#calculator-modal');
        historyModal = $('#history-modal');
        rulesModal = $('#rules-modal');
        winnerModal = $('#winner-modal');
        islandModal = $('#island-modal');
    }

    // ── Setup Screen ──
    function initSetup() {
        const countBtns = $$('.count-btn');
        countBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                countBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updatePlayerNameFields(parseInt(btn.dataset.count));
            });
        });

        $('#start-game-btn').addEventListener('click', startGame);
        updatePlayerNameFields(3);
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

    function startGame() {
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

        gameState = {
            players,
            currentPlayerIndex: 0,
            round: 1,
            isGameOver: false
        };

        setupScreen.classList.remove('active');
        gameScreen.classList.add('active');
        renderScoreboard();
        updateTurnIndicator();
        saveState();
    }

    // ── Scoreboard ──
    function renderScoreboard() {
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

    function updateTurnIndicator() {
        const player = gameState.players[gameState.currentPlayerIndex];
        $('#current-player-name').textContent = `תור של: ${player.name}`;
        $('#round-number').textContent = `סיבוב: ${gameState.round}`;
    }

    // ── Score Calculator ──
    const diceTypes = ['diamond', 'gold', 'monkey', 'parrot', 'sword', 'skull'];
    const chestTypes = ['chest-diamond', 'chest-gold', 'chest-sword'];

    function openCalculator() {
        if (gameState.isGameOver) return;

        const player = gameState.players[gameState.currentPlayerIndex];
        $('#calc-player-name').textContent = `${player.avatar} ${player.name}`;

        resetCalculator();
        calculatorModal.classList.add('active');
        recalcScore();
    }

    function resetCalculator() {
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

    function recalcScore() {
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

    function submitScore() {
        const result = recalcScore();

        if (result.isIsland) {
            openIslandModal();
            return;
        }

        applyScore(result.totalScore, result.isBust);
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

        calculatorModal.classList.remove('active');

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

    function advanceTurn() {
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex >= gameState.players.length) {
            gameState.currentPlayerIndex = 0;
            gameState.round++;
        }
    }

    function skipTurn() {
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

    // ── Island of Skulls ──
    let islandSkullCount = 4;

    function openIslandModal() {
        islandSkullCount = parseInt($(`#count-skull`).textContent) || 4;
        const card = $('#fortune-card').value;
        if (card === 'skull1') islandSkullCount += 1;
        if (card === 'skull2') islandSkullCount += 2;
        if (islandSkullCount < 4) islandSkullCount = 4;

        $('#island-skulls').textContent = islandSkullCount;
        updateIslandPenalty();
        islandModal.classList.add('active');
    }

    function updateIslandPenalty() {
        const penalty = islandSkullCount * 100;
        $('#island-penalty-text').innerHTML = `כל שחקן אחר מפסיד: <strong>${penalty.toLocaleString()}</strong> נקודות`;
    }

    function submitIsland() {
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

        islandModal.classList.remove('active');
        calculatorModal.classList.remove('active');

        showScoreFlash(0);
        advanceTurn();
        renderScoreboard();
        updateTurnIndicator();
        saveState();
    }

    // ── Fortune Card Info ──
    function updateFortuneCardInfo() {
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

    // ── UI Feedback ──
    function showScoreFlash(score) {
        const flash = document.createElement('div');
        flash.className = `score-flash ${score < 0 ? 'negative' : ''}`;
        flash.textContent = score === 0 ? '💀 0' : (score > 0 ? `+${score.toLocaleString()}` : score.toLocaleString());
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1300);
    }

    function showWinner(player) {
        $('#winner-name').textContent = `🎉 ${player.name} מנצח! 🎉`;
        $('#winner-score').textContent = `${player.score.toLocaleString()} נקודות`;
        winnerModal.classList.add('active');
    }

    // ── History ──
    function showHistory() {
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

        historyModal.classList.add('active');
    }

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

    // ── Save / Load ──
    function saveState() {
        try {
            localStorage.setItem('otzarot_game', JSON.stringify(gameState));
        } catch (e) { /* noop */ }
    }

    function loadState() {
        try {
            const saved = localStorage.getItem('otzarot_game');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.players && state.players.length > 0) {
                    gameState = state;
                    setupScreen.classList.remove('active');
                    gameScreen.classList.add('active');
                    renderScoreboard();
                    updateTurnIndicator();

                    if (gameState.isGameOver) {
                        const winner = gameState.players.reduce((a, b) => a.score > b.score ? a : b);
                        showWinner(winner);
                    }
                    return true;
                }
            }
        } catch (e) { /* noop */ }
        return false;
    }

    // ── Manual Score Entry ──
    function openManualScore() {
        if (gameState.isGameOver) return;
        const player = gameState.players[gameState.currentPlayerIndex];
        $('#manual-player-label').textContent = `${player.avatar} ${player.name}`;
        $('#manual-score-input').value = '';
        $('#manual-modal').classList.add('active');
        setTimeout(() => $('#manual-score-input').focus(), 100);
    }

    function submitManualScore() {
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

    // ── Undo ──
    function undoLastTurn() {
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

    function newGame() {
        if (!confirm('להתחיל משחק חדש?')) return;
        localStorage.removeItem('otzarot_game');
        gameScreen.classList.remove('active');
        winnerModal.classList.remove('active');
        setupScreen.classList.add('active');
    }

    // ── Utilities ──
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Play Mode ──
    const DICE_FACES = ['diamond', 'gold', 'monkey', 'parrot', 'sword', 'skull'];
    const DICE_EMOJI = { diamond: '💎', gold: '💰', monkey: '🐵', parrot: '🦜', sword: '⚔️', skull: '💀' };
    const DICE_NAMES = { diamond: 'יהלום', gold: 'זהב', monkey: 'קוף', parrot: 'תוכי', sword: 'חרב', skull: 'גולגולת' };

    const FORTUNE_DECK = [
        { id: 'captain', icon: '🏴‍☠️', name: 'קברניט', desc: 'ניקוד כפול ×2!' },
        { id: 'captain', icon: '🏴‍☠️', name: 'קברניט', desc: 'ניקוד כפול ×2!' },
        { id: 'captain', icon: '🏴‍☠️', name: 'קברניט', desc: 'ניקוד כפול ×2!' },
        { id: 'captain', icon: '🏴‍☠️', name: 'קברניט', desc: 'ניקוד כפול ×2!' },
        { id: 'gold', icon: '💰', name: 'מטבע זהב', desc: 'מתחיל עם מטבע זהב נוסף' },
        { id: 'gold', icon: '💰', name: 'מטבע זהב', desc: 'מתחיל עם מטבע זהב נוסף' },
        { id: 'gold', icon: '💰', name: 'מטבע זהב', desc: 'מתחיל עם מטבע זהב נוסף' },
        { id: 'gold', icon: '💰', name: 'מטבע זהב', desc: 'מתחיל עם מטבע זהב נוסף' },
        { id: 'diamond', icon: '💎', name: 'יהלום', desc: 'מתחיל עם יהלום נוסף' },
        { id: 'diamond', icon: '💎', name: 'יהלום', desc: 'מתחיל עם יהלום נוסף' },
        { id: 'diamond', icon: '💎', name: 'יהלום', desc: 'מתחיל עם יהלום נוסף' },
        { id: 'diamond', icon: '💎', name: 'יהלום', desc: 'מתחיל עם יהלום נוסף' },
        { id: 'skull1', icon: '💀', name: 'גולגולת', desc: 'מתחיל עם גולגולת אחת' },
        { id: 'skull1', icon: '💀', name: 'גולגולת', desc: 'מתחיל עם גולגולת אחת' },
        { id: 'skull1', icon: '💀', name: 'גולגולת', desc: 'מתחיל עם גולגולת אחת' },
        { id: 'skull2', icon: '💀💀', name: 'גולגולת ×2', desc: 'מתחיל עם 2 גולגולות' },
        { id: 'skull2', icon: '💀💀', name: 'גולגולת ×2', desc: 'מתחיל עם 2 גולגולות' },
        { id: 'monkey_business', icon: '🐵🦜', name: 'מאנקי ביזנס', desc: 'קופים ותוכים = סוג אחד' },
        { id: 'monkey_business', icon: '🐵🦜', name: 'מאנקי ביזנס', desc: 'קופים ותוכים = סוג אחד' },
        { id: 'monkey_business', icon: '🐵🦜', name: 'מאנקי ביזנס', desc: 'קופים ותוכים = סוג אחד' },
        { id: 'monkey_business', icon: '🐵🦜', name: 'מאנקי ביזנס', desc: 'קופים ותוכים = סוג אחד' },
        { id: 'sorceress', icon: '🧙‍♀️', name: 'קוסמת', desc: 'אפשר להחזיר גולגולת אחת' },
        { id: 'sorceress', icon: '🧙‍♀️', name: 'קוסמת', desc: 'אפשר להחזיר גולגולת אחת' },
        { id: 'sorceress', icon: '🧙‍♀️', name: 'קוסמת', desc: 'אפשר להחזיר גולגולת אחת' },
        { id: 'sorceress', icon: '🧙‍♀️', name: 'קוסמת', desc: 'אפשר להחזיר גולגולת אחת' },
        { id: 'treasure_chest', icon: '📦', name: 'תיבת אוצר', desc: 'שמור קוביות בתיבה - מוגנות!' },
        { id: 'treasure_chest', icon: '📦', name: 'תיבת אוצר', desc: 'שמור קוביות בתיבה - מוגנות!' },
        { id: 'treasure_chest', icon: '📦', name: 'תיבת אוצר', desc: 'שמור קוביות בתיבה - מוגנות!' },
        { id: 'treasure_chest', icon: '📦', name: 'תיבת אוצר', desc: 'שמור קוביות בתיבה - מוגנות!' },
        { id: 'storm', icon: '🌊', name: 'סופה', desc: 'יהלומים וזהב ×200, אי ב-3 גולגולות' },
        { id: 'battle2', icon: '⚔️', name: 'קרב ימי ×2', desc: '2 חרבות = +200, כישלון = -200' },
        { id: 'battle2', icon: '⚔️', name: 'קרב ימי ×2', desc: '2 חרבות = +200, כישלון = -200' },
        { id: 'battle3', icon: '⚔️⚔️', name: 'קרב ימי ×3', desc: '3 חרבות = +500, כישלון = -500' },
        { id: 'battle3', icon: '⚔️⚔️', name: 'קרב ימי ×3', desc: '3 חרבות = +500, כישלון = -500' },
        { id: 'battle4', icon: '⚔️⚔️⚔️', name: 'קרב ימי ×4', desc: '4 חרבות = +1,000, כישלון = -1,000' },
    ];

    let playState = null;

    function openPlayMode() {
        if (gameState.isGameOver) return;
        const player = gameState.players[gameState.currentPlayerIndex];
        $('#play-player-name').textContent = player.name;

        playState = {
            card: null,
            dice: [],
            kept: new Array(8).fill(false),
            chest: new Array(8).fill(false),
            rollCount: 0,
            sorceressUsed: false,
            phase: 'card'
        };

        $('#play-card-back').classList.remove('hidden');
        $('#play-card-front').classList.add('hidden');
        $('#play-dice-area').classList.add('hidden');
        $('#play-bust-overlay').classList.add('hidden');
        $('#play-modal').classList.add('active');
    }

    function drawCard() {
        if (playState.phase !== 'card') return;
        const card = FORTUNE_DECK[Math.floor(Math.random() * FORTUNE_DECK.length)];
        playState.card = card;
        playState.phase = 'roll';

        $('#play-card-back').classList.add('hidden');
        $('#play-card-front').classList.remove('hidden');
        $('#play-card-icon').textContent = card.icon;
        $('#play-card-name').textContent = card.name;
        $('#play-card-desc').textContent = card.desc;

        $('#play-dice-area').classList.remove('hidden');
        $('#play-roll-btn').classList.remove('hidden');
        $('#play-stop-btn').classList.add('hidden');
        $('#play-hint').textContent = 'לחץ "הטל קוביות" להתחיל';

        $('#play-chest-area').classList.toggle('hidden', card.id !== 'treasure_chest');

        initPlayDice();
    }

    function initPlayDice() {
        playState.dice = new Array(8).fill(null);
        playState.kept = new Array(8).fill(false);
        playState.chest = new Array(8).fill(false);

        if (playState.card.id === 'skull1') {
            playState.dice[0] = 'skull';
            playState.kept[0] = true;
        } else if (playState.card.id === 'skull2') {
            playState.dice[0] = 'skull';
            playState.dice[1] = 'skull';
            playState.kept[0] = true;
            playState.kept[1] = true;
        }

        renderPlayDice(false);
        updatePlayInfo();
    }

    function rollDice() {
        if (playState.phase !== 'roll') return;

        const freeCount = playState.dice.filter((d, i) =>
            !playState.kept[i] && d !== 'skull'
        ).length;
        if (freeCount < 2 && playState.rollCount > 0) return;

        playState.rollCount++;

        for (let i = 0; i < 8; i++) {
            if (playState.kept[i]) continue;
            if (playState.dice[i] === 'skull') continue;
            playState.dice[i] = DICE_FACES[Math.floor(Math.random() * 6)];
        }

        for (let i = 0; i < 8; i++) {
            if (playState.dice[i] === 'skull') {
                playState.kept[i] = true;
            }
        }

        renderPlayDice(true);
        updatePlayInfo();

        const skullCount = getPlaySkullCount();
        const isStorm = playState.card.id === 'storm';
        const islandThreshold = isStorm ? 3 : 4;

        if (skullCount >= 3) {
            playState.phase = 'bust';
            const isBattle = playState.card.id.startsWith('battle');

            if (skullCount >= islandThreshold && !isBattle) {
                setTimeout(() => showPlayBust(true, skullCount), 600);
            } else {
                setTimeout(() => showPlayBust(false, skullCount), 600);
            }
            return;
        }

        $('#play-roll-btn').textContent = '🎲 הטל שוב';
        $('#play-stop-btn').classList.remove('hidden');

        const isBattleCard = playState.card.id.startsWith('battle');
        if (isBattleCard) {
            const req = parseInt(playState.card.id.replace('battle', ''));
            const swordCount = playState.dice.filter(d => d === 'sword').length;
            if (swordCount < req) {
                $('#play-stop-btn').classList.add('hidden');
                $('#play-hint').textContent = `⚔️ צריך ${req} חרבות! (יש ${swordCount}) - חייב להמשיך להטיל`;
            } else {
                $('#play-hint').textContent = 'לחץ על קוביה כדי לשמור/לשחרר אותה';
            }
        } else {
            $('#play-hint').textContent = 'לחץ על קוביה כדי לשמור/לשחרר אותה';
        }

        playState.phase = 'pick';
    }

    function getPlaySkullCount() {
        let count = playState.dice.filter(d => d === 'skull').length;
        return count;
    }

    function toggleKeep(idx) {
        if (playState.phase !== 'pick') return;
        if (playState.dice[idx] === 'skull') {
            if (playState.card.id === 'sorceress' && !playState.sorceressUsed) {
                playState.sorceressUsed = true;
                playState.dice[idx] = null;
                playState.kept[idx] = false;
                renderPlayDice(false);
                updatePlayInfo();
            }
            return;
        }

        if (playState.card.id === 'treasure_chest' && playState.chest[idx]) {
            playState.chest[idx] = false;
            renderPlayDice(false);
            updatePlayInfo();
            return;
        }

        playState.kept[idx] = !playState.kept[idx];
        renderPlayDice(false);
        updatePlayInfo();
    }

    function toggleChest(idx) {
        if (playState.phase !== 'pick') return;
        if (playState.dice[idx] === 'skull' || playState.dice[idx] === null) return;
        if (!playState.kept[idx] && !playState.chest[idx]) {
            playState.kept[idx] = true;
        }
        playState.chest[idx] = !playState.chest[idx];
        if (!playState.chest[idx]) {
            playState.kept[idx] = false;
        }
        renderPlayDice(false);
        updatePlayInfo();
    }

    function renderPlayDice(animate) {
        const grid = $('#play-dice-grid');
        grid.innerHTML = '';

        playState.dice.forEach((face, i) => {
            const die = document.createElement('div');
            const isSkull = face === 'skull';
            const isKept = playState.kept[i];
            const inChest = playState.chest[i];

            let classes = 'play-die';
            if (isSkull) classes += ' skull-die';
            else if (inChest) classes += ' in-chest';
            else if (isKept) classes += ' kept';
            if (animate && !isKept && face !== null) classes += ' rolling';
            if (animate && face === 'skull' && !playState.kept[i]) classes += ' new-skull';

            die.className = classes;
            die.innerHTML = face ? `<span>${DICE_EMOJI[face]}</span><span class="play-die-label">${DICE_NAMES[face]}</span>` : '';
            die.addEventListener('click', () => toggleKeep(i));

            if (playState.card.id === 'treasure_chest' && face && face !== 'skull' && playState.phase === 'pick') {
                die.addEventListener('dblclick', (e) => { e.preventDefault(); toggleChest(i); });
                die.addEventListener('long-press', () => toggleChest(i));
            }

            grid.appendChild(die);
        });

        if (playState.card.id === 'treasure_chest') {
            renderChestArea();
        }
    }

    function renderChestArea() {
        const chestGrid = $('#play-chest-grid');
        chestGrid.innerHTML = '';
        let hasChest = false;

        playState.dice.forEach((face, i) => {
            if (playState.chest[i] && face && face !== 'skull') {
                hasChest = true;
                const el = document.createElement('div');
                el.className = 'play-chest-die';
                el.textContent = DICE_EMOJI[face];
                el.addEventListener('click', () => toggleChest(i));
                chestGrid.appendChild(el);
            }
        });

        if (!hasChest) {
            chestGrid.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;padding:8px;">לחץ פעמיים על קוביה שמורה להכניס לתיבה</span>';
        }
    }

    function updatePlayInfo() {
        const skullCount = getPlaySkullCount();
        $('#play-roll-num').textContent = `הטלה: ${playState.rollCount || '—'}`;
        $('#play-skulls-count').textContent = `💀 ${skullCount}`;

        const score = calcPlayScore();
        const totalEl = $('#play-live-total');
        totalEl.textContent = score.toLocaleString();
        totalEl.className = `play-total ${score < 0 ? 'negative' : ''}`;

        const freeCount = playState.dice.filter((d, i) =>
            d !== null && d !== 'skull' && !playState.kept[i]
        ).length;
        const nullCount = playState.dice.filter(d => d === null).length;
        const canRoll = (freeCount + nullCount) >= 2;

        if (playState.phase === 'pick') {
            $('#play-roll-btn').disabled = !canRoll;
            if (!canRoll) {
                $('#play-hint').textContent = 'אין מספיק קוביות חופשיות להטלה נוספת';
            }
        }
    }

    function calcPlayScore() {
        const card = playState.card;
        if (!card) return 0;

        const counts = { diamond: 0, gold: 0, monkey: 0, parrot: 0, sword: 0, skull: 0 };
        playState.dice.forEach(face => { if (face) counts[face]++; });

        if (card.id === 'gold') counts.gold++;
        if (card.id === 'diamond') counts.diamond++;

        const isBattle = card.id.startsWith('battle');
        const isCaptain = card.id === 'captain';
        const isStorm = card.id === 'storm';
        const isMonkey = card.id === 'monkey_business';

        let scoringCounts;
        if (isMonkey) {
            scoringCounts = {
                diamond: counts.diamond, gold: counts.gold,
                monkey_parrot: counts.monkey + counts.parrot,
                sword: counts.sword
            };
        } else {
            scoringCounts = {
                diamond: counts.diamond, gold: counts.gold,
                monkey: counts.monkey, parrot: counts.parrot,
                sword: counts.sword
            };
        }

        let total = 0;
        for (const [, c] of Object.entries(scoringCounts)) {
            if (c >= 3) total += SET_SCORES[c] || 0;
        }

        const gemValue = isStorm ? 200 : 100;
        total += counts.diamond * gemValue;
        total += counts.gold * gemValue;

        if (isBattle) {
            const req = parseInt(card.id.replace('battle', ''));
            if (counts.sword >= req) total += BATTLE_REWARDS[card.id];
            else total = -BATTLE_REWARDS[card.id];
        }

        if (card.id === 'seven_weapons' && counts.sword >= 7) total += 500;

        const allDiceUsed = playState.dice.filter(d => d !== null).length === 8;
        if (counts.skull === 0 && allDiceUsed && !isBattle) {
            total += FULL_CHEST_BONUS;
        }

        if (isCaptain && total > 0) total *= 2;

        return total;
    }

    function showPlayBust(isIsland, skullCount) {
        const overlay = $('#play-bust-overlay');
        overlay.classList.remove('hidden');

        const isBattle = playState.card.id.startsWith('battle');

        if (isIsland && !isBattle) {
            $('#play-bust-icon').textContent = '🏝️';
            $('#play-bust-text').textContent = 'אי הגולגולות!';
            const penalty = skullCount * 100;
            $('#play-bust-score').textContent = `כל שחקן אחר מפסיד ${penalty} נקודות`;
        } else if (isBattle) {
            const penalty = BATTLE_REWARDS[playState.card.id];
            $('#play-bust-icon').textContent = '💀⚔️';
            $('#play-bust-text').textContent = 'הפסד בקרב ימי!';
            $('#play-bust-score').textContent = `${(-penalty).toLocaleString()} נקודות`;
        } else {
            $('#play-bust-icon').textContent = '💀💀💀';
            $('#play-bust-text').textContent = 'הפסד!';

            if (playState.card.id === 'treasure_chest') {
                const chestScore = calcChestOnlyScore();
                $('#play-bust-score').textContent = chestScore > 0
                    ? `קוביות בתיבה: +${chestScore.toLocaleString()} נקודות`
                    : '0 נקודות';
            } else {
                $('#play-bust-score').textContent = '0 נקודות';
            }
        }
    }

    function calcChestOnlyScore() {
        let diamonds = 0, golds = 0;
        playState.dice.forEach((face, i) => {
            if (playState.chest[i]) {
                if (face === 'diamond') diamonds++;
                if (face === 'gold') golds++;
            }
        });
        return diamonds * 100 + golds * 100;
    }

    function confirmPlayBust() {
        const skullCount = getPlaySkullCount();
        const isBattle = playState.card.id.startsWith('battle');
        const isStorm = playState.card.id === 'storm';
        const islandThreshold = isStorm ? 3 : 4;
        const isIsland = skullCount >= islandThreshold && !isBattle;

        let turnScore = 0;

        if (isIsland) {
            const penalty = skullCount * 100;
            gameState.players.forEach((player, idx) => {
                if (idx !== gameState.currentPlayerIndex) {
                    player.score -= penalty;
                    player.turns.push({
                        round: gameState.round, score: -penalty,
                        card: 'island', bust: false, islandPenalty: true
                    });
                }
            });
            turnScore = 0;
        } else if (isBattle) {
            turnScore = -BATTLE_REWARDS[playState.card.id];
        } else if (playState.card.id === 'treasure_chest') {
            turnScore = calcChestOnlyScore();
        }

        finishPlayTurn(turnScore, true, isIsland);
    }

    function stopAndScore() {
        if (playState.phase !== 'pick') return;
        const score = calcPlayScore();
        finishPlayTurn(score, false, false);
    }

    function prepareReroll() {
        if (playState.phase !== 'pick') return;

        const freeCount = playState.dice.filter((d, i) =>
            d !== null && d !== 'skull' && !playState.kept[i]
        ).length;
        if (freeCount < 2) return;

        playState.phase = 'roll';
        rollDice();
    }

    function finishPlayTurn(score, isBust, isIsland) {
        const player = gameState.players[gameState.currentPlayerIndex];
        const cardId = playState.card ? playState.card.id : 'none';

        player.turns.push({
            round: gameState.round, score: score,
            card: cardId, bust: isBust,
            island: isIsland
        });
        player.score += score;

        $('#play-modal').classList.remove('active');
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

    // ── Event Listeners ──
    function bindEvents() {
        $('#calc-score-btn').addEventListener('click', openCalculator);
        $('#skip-turn-btn').addEventListener('click', skipTurn);
        $('#close-calc').addEventListener('click', () => calculatorModal.classList.remove('active'));
        $('#submit-score').addEventListener('click', submitScore);

        $('#fortune-card').addEventListener('change', updateFortuneCardInfo);

        document.querySelectorAll('.dice-grid').forEach(grid => {
            grid.addEventListener('click', handleCounterClick);
        });

        $('#history-btn').addEventListener('click', showHistory);
        $('#close-history').addEventListener('click', () => historyModal.classList.remove('active'));

        $('#rules-btn').addEventListener('click', () => rulesModal.classList.add('active'));
        $('#close-rules').addEventListener('click', () => rulesModal.classList.remove('active'));

        $('#manual-score-btn').addEventListener('click', openManualScore);
        $('#submit-manual').addEventListener('click', submitManualScore);
        $('#cancel-manual').addEventListener('click', () => $('#manual-modal').classList.remove('active'));
        $('#close-manual').addEventListener('click', () => $('#manual-modal').classList.remove('active'));
        $('#manual-score-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitManualScore();
        });

        $('#undo-btn').addEventListener('click', undoLastTurn);

        $('#play-turn-btn').addEventListener('click', openPlayMode);
        $('#close-play').addEventListener('click', () => {
            if (playState && playState.phase !== 'card') {
                if (!confirm('לצאת מהתור?')) return;
            }
            $('#play-modal').classList.remove('active');
        });
        $('#play-card').addEventListener('click', drawCard);
        $('#play-roll-btn').addEventListener('click', () => {
            if (playState.phase === 'roll') rollDice();
            else if (playState.phase === 'pick') prepareReroll();
        });
        $('#play-stop-btn').addEventListener('click', stopAndScore);
        $('#play-bust-ok').addEventListener('click', confirmPlayBust);

        $('#new-game-btn').addEventListener('click', newGame);
        $('#new-game-from-winner').addEventListener('click', () => {
            localStorage.removeItem('otzarot_game');
            winnerModal.classList.remove('active');
            gameScreen.classList.remove('active');
            setupScreen.classList.add('active');
        });

        $('#island-minus').addEventListener('click', () => {
            if (islandSkullCount > 4) {
                islandSkullCount--;
                $('#island-skulls').textContent = islandSkullCount;
                updateIslandPenalty();
            }
        });

        $('#island-plus').addEventListener('click', () => {
            if (islandSkullCount < 10) {
                islandSkullCount++;
                $('#island-skulls').textContent = islandSkullCount;
                updateIslandPenalty();
            }
        });

        $('#submit-island').addEventListener('click', submitIsland);
        $('#cancel-island').addEventListener('click', () => {
            islandModal.classList.remove('active');
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // ── Init ──
    function init() {
        cacheDOM();
        initSetup();
        bindEvents();
        if (!loadState()) {
            setupScreen.classList.add('active');
        }
    }

    window._playTurn = openPlayMode;

    document.addEventListener('DOMContentLoaded', init);
})();
