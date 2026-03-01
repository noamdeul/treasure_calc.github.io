export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export const domRefs = {
    setupScreen: null,
    gameScreen: null,
    calculatorModal: null,
    historyModal: null,
    rulesModal: null,
    winnerModal: null,
    islandModal: null,
    playModal: null,
    manualModal: null
};

export function cacheDOM() {
    domRefs.setupScreen = $('#setup-screen');
    domRefs.gameScreen = $('#game-screen');
    domRefs.calculatorModal = $('#calculator-modal');
    domRefs.historyModal = $('#history-modal');
    domRefs.rulesModal = $('#rules-modal');
    domRefs.winnerModal = $('#winner-modal');
    domRefs.islandModal = $('#island-modal');
    domRefs.playModal = $('#play-modal');
    domRefs.manualModal = $('#manual-modal');
}
