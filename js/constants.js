export const WINNING_SCORE = 8000;
export const PLAYER_AVATARS = ['🏴‍☠️', '⛵', '🗡️', '🦜'];
export const RANDOM_NAMES = ['בוקנר', 'פיראט', 'קברניט', 'שדר', 'זהב', 'יהלום', 'מטמון', 'מפרש', 'עוגן', 'חרב', 'תוכי', 'קוף', 'סופה', 'אי', 'אוצר', 'ספינה', 'מצודה', 'מפה', 'עין', 'כוכב'];
export const SET_SCORES = { 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000, 8: 4000 };
export const BATTLE_REWARDS = { battle2: 200, battle3: 500, battle4: 1000 };
export const FULL_CHEST_BONUS = 500;

export const diceTypes = ['diamond', 'gold', 'monkey', 'parrot', 'sword', 'skull'];
export const chestTypes = ['chest-diamond', 'chest-gold', 'chest-sword'];

export const DICE_FACES = ['diamond', 'gold', 'monkey', 'parrot', 'sword', 'skull'];
export const DICE_EMOJI = { diamond: '💎', gold: '💰', monkey: '🐵', parrot: '🦜', sword: '⚔️', skull: '💀' };
export const DICE_NAMES = { diamond: 'יהלום', gold: 'זהב', monkey: 'קוף', parrot: 'תוכי', sword: 'חרב', skull: 'גולגולת' };

export const FORTUNE_DECK = [
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
