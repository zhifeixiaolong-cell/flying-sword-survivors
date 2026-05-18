export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// BG_COLOR 用 CSS 字符串因为要传给 Phaser game config;
// 下方绘图常量用 0xRRGGBB 数值因为 Phaser 绘图 API(lineStyle/fillStyle)只认这种格式
export const BG_COLOR = '#000000';

export const WALL_Y = GAME_HEIGHT - 80;
export const WALL_COLOR = 0x888888;
export const WALL_THICKNESS = 3;

export const PLAYER_SIZE = 24;
export const PLAYER_COLOR = 0x88ccff;
export const PLAYER_SPEED = 300; // px/秒,匀速;M2 接发射体验过再决定是否引入加减速
