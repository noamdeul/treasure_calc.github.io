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

    const setupScreen = $('#setup-screen');
    const gameScreen = $('#game-screen');
    const calculatorModal = $('#calculator-modal');
    const historyModal = $('#history-modal');
    const rulesModal = $('#rules-modal');
    const winnerModal = $('#winner-modal');
    const islandModal = $('#island-modal');

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
            const pct = Math.min((player.score / WINNING_SCORE) * 100, 100);

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
                <div class="player-score">${player.score.toLocaleString()}</div>
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

        if (totalSkulls >= 3 && !isBattle) {
            isBust = true;

            if (totalSkulls >= 4) {
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
                const chestSwords = chest['chest-sword'] || 0;
                const chestTotal = chestDiamonds + chestGold + chestSwords;
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

            const diamondBonus = effectiveCounts.diamond * 100;
            if (diamondBonus > 0) {
                breakdown.push({ label: `💎 בונוס יהלומים ×${effectiveCounts.diamond}`, value: diamondBonus });
                totalScore += diamondBonus;
            }

            const goldBonus = effectiveCounts.gold * 100;
            if (goldBonus > 0) {
                breakdown.push({ label: `💰 בונוס זהב ×${effectiveCounts.gold}`, value: goldBonus });
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
                    breakdown.push({ label: `⚔️ כישלון בקרב ימי`, value: penalty });
                    totalScore = penalty;
                }
            }

            const physicalSkulls = counts.skull;
            const physicalScoring = 8 - physicalSkulls;
            if (physicalSkulls === 0 && getTotalDice() === 8 && !isBattle) {
                breakdown.push({ label: '📦 תיבה מלאה (כל 8 מנקדות)', value: FULL_CHEST_BONUS });
                totalScore += FULL_CHEST_BONUS;
            }
        }

        renderBreakdown(breakdown, totalScore, isBust, isIsland);
        return { totalScore, isBust, isIsland };
    }

    function renderBreakdown(breakdown, totalScore, isBust, isIsland) {
        const container = $('#breakdown-details');
        container.innerHTML = '';

        if (isBust && !isIsland && !$('#fortune-card').value.startsWith('battle')) {
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
        if (player.score < 0) player.score = 0;

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
                player.score = Math.max(0, player.score - penalty);
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
            gold: '💰 מתחיל עם מטבע זהב אחד נוסף. נספר אוטומטית בחישוב.',
            diamond: '💎 מתחיל עם יהלום אחד נוסף. נספר אוטומטית בחישוב.',
            skull1: '💀 מתחיל עם גולגולת אחת נוספת. נספרת אוטומטית.',
            skull2: '💀💀 מתחיל עם 2 גולגולות נוספות. נספרות אוטומטית.',
            monkey_business: '🐵🦜 קופים ותוכים נספרים כאותו סוג לצורך סדרות!',
            sorceress: '🧙‍♀️ ניתן להחזיר גולגולת אחת. אל תספור אותה בקוביות.',
            treasure_chest: '📦 קוביות שנשמרו בתיבת האוצר מוגנות. סמן למטה אילו קוביות שמרת.',
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
                const label = turn.islandPenalty ? `🏝️ עונש אי גולגולות` :
                              turn.island ? `🏝️ אי הגולגולות (${turn.islandSkulls} גולגולות)` :
                              turn.skipped ? '⏭️ דילוג' :
                              turn.bust ? '💀 הפסד' :
                              `תור ${tIdx + 1}`;
                const cardLabel = getCardLabel(turn.card);
                turnsHtml += `
                    <div class="history-turn">
                        <span class="history-turn-num">${label}${cardLabel ? ` (${cardLabel})` : ''}</span>
                        <span class="history-turn-score ${scoreClass}">${turn.score >= 0 ? '+' : ''}${turn.score.toLocaleString()}</span>
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
            gold: '💰',
            diamond: '💎',
            skull1: '💀',
            skull2: '💀💀',
            monkey_business: '🐵',
            sorceress: '🧙‍♀️',
            treasure_chest: '📦',
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
            bust: score <= 0,
            manual: true
        });

        player.score += score;
        if (player.score < 0) player.score = 0;

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
        if (prevPlayer.score < 0) prevPlayer.score = 0;

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
        initSetup();
        bindEvents();
        if (!loadState()) {
            setupScreen.classList.add('active');
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
