export let gameState = {
    players: [],
    currentPlayerIndex: 0,
    round: 1,
    isGameOver: false
};

export function setGameState(state) {
    gameState = state;
}

export function saveState() {
    try {
        localStorage.setItem('otzarot_game', JSON.stringify(gameState));
    } catch (e) { /* noop */ }
}

export function loadState() {
    try {
        const saved = localStorage.getItem('otzarot_game');
        if (saved) {
            const state = JSON.parse(saved);
            if (state.players && state.players.length > 0) {
                gameState = state;
                return true;
            }
        }
    } catch (e) { /* noop */ }
    return false;
}

export function advanceTurn() {
    gameState.currentPlayerIndex++;
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        gameState.currentPlayerIndex = 0;
        gameState.round++;
    }
}
