import { gameState, advanceTurn, saveState } from './state.js';
import { WINNING_SCORE, SET_SCORES, BATTLE_REWARDS, FULL_CHEST_BONUS, DICE_FACES, DICE_EMOJI, DICE_NAMES, FORTUNE_DECK } from './constants.js';
import { $, domRefs } from './dom.js';
import { renderScoreboard, updateTurnIndicator } from './scoreboard.js';
import { showScoreFlash, showWinner } from './ui.js';

let playState = null;

export function openPlayMode() {
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
    domRefs.playModal.classList.add('active');
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
    $('#play-roll-btn').disabled = false;
    $('#play-roll-btn').textContent = '🎲 הטל קוביות';
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

function getPlaySkullCount() {
    return playState.dice.filter(d => d === 'skull').length;
}

function getPlayKeptSwordCount() {
    return playState.dice.reduce((n, face, i) =>
        n + (face === 'sword' && playState.kept[i] ? 1 : 0), 0);
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
        const keptSwords = getPlayKeptSwordCount();
        if (keptSwords >= req) total += BATTLE_REWARDS[card.id];
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

        const isBattleCard = playState.card && playState.card.id.startsWith('battle');
        if (isBattleCard) {
            const req = parseInt(playState.card.id.replace('battle', ''));
            const totalSwords = playState.dice.filter(d => d === 'sword').length;
            const keptSwords = getPlayKeptSwordCount();
            if (totalSwords < req) {
                $('#play-stop-btn').classList.add('hidden');
                if (!canRoll) {
                    $('#play-hint').textContent = `⚔️ כישלון! צריך ${req} חרבות אבל יש רק ${totalSwords} ואין קוביות להטלה`;
                    playState.phase = 'bust';
                    setTimeout(() => showPlayBust(false, skullCount), 600);
                } else {
                    $('#play-hint').textContent = `⚔️ צריך ${req} חרבות! (יש ${totalSwords}) - חייב להמשיך להטיל`;
                }
            } else {
                $('#play-stop-btn').classList.remove('hidden');
                $('#play-stop-btn').disabled = keptSwords < req;
                $('#play-hint').textContent = keptSwords >= req
                    ? `⚔️ נבחרו ${keptSwords} חרבות. לחץ "עצור ושמור ניקוד" לסיום`
                    : `⚔️ בחר חרבות (לחיצה משחררת). נבחרו ${keptSwords}/${req}. לחץ "עצור ושמור ניקוד" לסיום`;
            }
        } else if (!canRoll) {
            $('#play-hint').textContent = 'אין מספיק קוביות חופשיות להטלה נוספת';
        }
    }
}

function rollDice() {
    const isIslandPhase = playState.phase === 'island';
    if (playState.phase !== 'roll' && !isIslandPhase) return;

    const freeCount = playState.dice.filter((d, i) =>
        !playState.kept[i] && d !== 'skull'
    ).length;
    if (freeCount < 2 && playState.rollCount > 0 && !isIslandPhase) return;

    const skullsBeforeRoll = getPlaySkullCount();
    if (isIslandPhase && freeCount < 2) {
        playState.phase = 'bust';
        setTimeout(() => showPlayBust(true, skullsBeforeRoll), 600);
        return;
    }

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
    const isBattle = playState.card.id.startsWith('battle');

    if (isIslandPhase) {
        const newSkullsThisRoll = skullCount - skullsBeforeRoll;
        const diceToRollNext = 8 - skullCount;
        if (newSkullsThisRoll === 0 || diceToRollNext < 2) {
            playState.phase = 'bust';
            setTimeout(() => showPlayBust(true, skullCount), 600);
            return;
        }
        $('#play-roll-btn').textContent = '🎲 הטל שוב (אי הגולגולות)';
        $('#play-roll-btn').disabled = false;
        $('#play-stop-btn').classList.add('hidden');
        $('#play-hint').textContent = '🏝️ צריך גולגולת בהטלה כדי להמשיך! הטל שוב';
        playState.phase = 'island';
        return;
    }

    if (skullCount >= 3) {
        if (skullCount >= islandThreshold && !isBattle && playState.rollCount === 1) {
            playState.phase = 'island';
            $('#play-roll-btn').textContent = '🎲 הטל שוב (אי הגולגולות)';
            $('#play-roll-btn').disabled = false;
            $('#play-stop-btn').classList.add('hidden');
            $('#play-hint').textContent = '🏝️ אי הגולגולות! הטל את הקוביות הנותרות - צריך גולגולת כדי להמשיך';
            return;
        }
        playState.phase = 'bust';
        const isIslandBust = skullCount >= islandThreshold && !isBattle && playState.rollCount === 1;
        setTimeout(() => showPlayBust(isIslandBust, skullCount), 600);
        return;
    }

    $('#play-roll-btn').textContent = '🎲 הטל שוב';
    $('#play-stop-btn').classList.remove('hidden');

    const isBattleCard = playState.card.id.startsWith('battle');
    if (isBattleCard) {
        const req = parseInt(playState.card.id.replace('battle', ''));
        const totalSwords = playState.dice.filter(d => d === 'sword').length;
        if (totalSwords < req) {
            $('#play-stop-btn').classList.add('hidden');
            $('#play-hint').textContent = `⚔️ צריך ${req} חרבות! (יש ${totalSwords}) - חייב להמשיך להטיל`;
        } else {
            $('#play-hint').textContent = `⚔️ לחץ על חרבות לבחירה (לחיצה נוספת משחררת). צריך ${req}. אחר כך "עצור ושמור ניקוד"`;
        }
    } else {
        $('#play-hint').textContent = 'לחץ על קוביה כדי לשמור/לשחרר אותה';
    }

    playState.phase = 'pick';
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

export function confirmPlayBust() {
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

    const isBattleCard = playState.card && playState.card.id.startsWith('battle');
    if (isBattleCard) {
        const req = parseInt(playState.card.id.replace('battle', ''));
        const keptSwords = getPlayKeptSwordCount();
        if (keptSwords < req) return;
    }

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

    domRefs.playModal.classList.remove('active');
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

export function getPlayState() {
    return playState;
}

export function bindPlayModeEvents() {
    $('#play-card').addEventListener('click', drawCard);
    $('#play-roll-btn').addEventListener('click', () => {
        if (playState.phase === 'roll' || playState.phase === 'island') rollDice();
        else if (playState.phase === 'pick') prepareReroll();
    });
    $('#play-stop-btn').addEventListener('click', stopAndScore);
    $('#play-bust-ok').addEventListener('click', confirmPlayBust);
}
