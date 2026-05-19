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
// INV-01 要求 PLAYER_SPEED < V_min(360), 余量 210 px/s。见 docs/design-invariants.md
export const PLAYER_SPEED = 150;

// ====== Sword (M2) ======
export const SWORD_INITIAL_SPEED = 1200; // V_max, px/s, 出鞘速度. 整体提速 +20%
export const SWORD_MIN_SPEED = 360; // V_min, px/s, 远端转折速度. 整体提速 +20% (200 → 300 → 360)
export const SWORD_MAX_DISTANCE = 600; // D_max, px, 距角色最远距离
export const SWORD_SPEED_FLOOR = 120; // 物理兜底. 整体提速 +20%
export const SWORD_SHARPNESS = 0.7; // 锋利度系数, Stage 3 才用
export const SWORD_DAMAGE_COEF = 0.1; // 伤害系数, Stage 3 才用
export const SWORD_TURN_RATE = 180; // 追踪角速度上限 °/s, Stage 2 才用
export const SWORD_POOL_CAPACITY = 1; // 资源池容量, M5+ 升级才动
// 入鞘碰撞圆半径加成 (= PLAYER_SIZE/2 + 此值). 设计文档 §2.3 风险提示: 避免擦边不算
export const SWORD_SHEATHE_RADIUS_PAD = 5;
// TURNING 状态最长持续时间. 极端 180° 转向理论 972ms (175°/180°/s), 给 50% 余量
export const SWORD_TURNING_MAX_MS = 1500;

// 占位倒十字: Stage 4 替换为梭形 + 柔光晕
export const SWORD_PLACEHOLDER_LENGTH = 16; // 长轴 (沿飞行方向)
export const SWORD_PLACEHOLDER_CROSS = 8; // 横轴 (护手)
export const SWORD_PLACEHOLDER_WIDTH = 2; // 线宽
export const SWORD_PLACEHOLDER_COLOR = 0xff8800;
