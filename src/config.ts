// ====== Canvas ======
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// BG_COLOR 用 CSS 字符串因为要传给 Phaser game config;
// 下方绘图常量用 0xRRGGBB 数值因为 Phaser 绘图 API(lineStyle/fillStyle)只认这种格式
export const BG_COLOR = '#000000';

// ====== Wall ======
export const WALL_Y = GAME_HEIGHT - 80;
export const WALL_COLOR = 0x888888;
export const WALL_THICKNESS = 3;

// ====== Player ======
export const PLAYER_SIZE = 24;
export const PLAYER_COLOR = 0x88ccff;
// INV-01 要求 PLAYER_SPEED < V_min(200), 留 50 px/s 余量。见 docs/design-invariants.md
export const PLAYER_SPEED = 150;

// ====== Sword (M2) ======
export const SWORD_INITIAL_SPEED = 1000; // V_max, px/s, 出鞘速度
export const SWORD_MIN_SPEED = 200; // V_min, px/s, 远端转折速度
export const SWORD_MAX_DISTANCE = 600; // D_max, px, 距角色最远距离
export const SWORD_SPEED_FLOOR = 100; // 物理兜底, Stage 2 才用
export const SWORD_SHARPNESS = 0.7; // 锋利度系数, Stage 3 才用
export const SWORD_DAMAGE_COEF = 0.1; // 伤害系数, Stage 3 才用
export const SWORD_TURN_RATE = 180; // 追踪角速度上限 °/s, Stage 2 才用
export const SWORD_POOL_CAPACITY = 1; // 资源池容量, M5+ 升级才动

// 占位倒十字: Stage 4 替换为梭形 + 柔光晕
export const SWORD_PLACEHOLDER_LENGTH = 16; // 长轴 (沿飞行方向)
export const SWORD_PLACEHOLDER_CROSS = 8; // 横轴 (护手)
export const SWORD_PLACEHOLDER_WIDTH = 2; // 线宽
export const SWORD_PLACEHOLDER_COLOR = 0xff8800;
