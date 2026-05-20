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

// 飞剑视觉 (Stage 5 Commit A 重做): M2 素剑 — 白银朴素剑形, 包含
// 剑尖 / 剑刃 / 护手 / 剑柄 / 剑柄首 5 个解剖结构, 体现"初心".
// 程序化绘制在 src/entities/SwordRenderer.ts, 实战飞剑 + 悬浮剑共享.
// 剑沿 +x 方向 (剑尖朝右, 剑柄朝左), pivot 在护手中心 (graphics 原点).

// 几何 (单位: px)
export const SWORD_BLADE_LENGTH_NEW = 15; // 剑刃主体长度
export const SWORD_BLADE_WIDTH_NEW = 4; // 剑刃宽度
export const SWORD_TIP_LENGTH = 3; // 剑尖长度 (三角形)
export const SWORD_GUARD_LENGTH = 2; // 护手长度 (沿剑长轴)
export const SWORD_GUARD_WIDTH = 7; // 护手宽度 (横向, 比剑刃宽)
export const SWORD_HANDLE_LENGTH = 3; // 剑柄长度
export const SWORD_HANDLE_WIDTH = 2.5; // 剑柄宽度
export const SWORD_POMMEL_RADIUS = 1.5; // 剑柄首半径

// 色彩 (M2 素剑: 白银 + 深灰 + 黑色)
export const SWORD_COLOR_BLADE = 0xe8e8f0; // 剑刃主色 (白银)
export const SWORD_COLOR_BLADE_HIGHLIGHT = 0xffffff; // 剑刃中央高光 (纯白)
export const SWORD_COLOR_BLADE_GLOW = 0xc0c8e0; // 剑刃外圈光晕 (淡蓝白)
export const SWORD_COLOR_GUARD = 0x4a4a52; // 护手 / 剑柄首 (深灰金属)
export const SWORD_COLOR_HANDLE = 0x1a1a1f; // 剑柄 (黑色, 缠绳风格)

// 悬浮剑 (Stage 5): 浮游炮语义 — 位置固定在玩家身边 ANCHOR_DIR × DISTANCE 处,
// 朝向跟随光标.
export const SWORD_HOVER_DISTANCE = 40; // pivot 距玩家身体中心 (px)
export const SWORD_HOVER_ANCHOR_DIR_X = 0.7071; // 45° 右上 cos(-45°)
export const SWORD_HOVER_ANCHOR_DIR_Y = -0.7071; // 45° 右上 sin(-45°) (y 向下)
export const SWORD_HOVER_BASE_ALPHA = 0.7; // 悬浮剑显示 alpha (比实战剑略低, 体现"待机")
