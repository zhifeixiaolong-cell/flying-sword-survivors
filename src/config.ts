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

// 飞剑视觉 (Stage 4): 梭形剑身 + 柔光晕, 全程序化绘制 (Phaser Graphics)
export const SWORD_BLADE_LENGTH = 24; // 梭形长轴
export const SWORD_BLADE_WIDTH = 6; // 梭形短轴
export const SWORD_BLADE_COLOR = 0xff8800;
export const SWORD_HALO_LENGTH = 48; // 柔光晕长轴 (略大于剑身, 实测调参 ×1.5)
export const SWORD_HALO_WIDTH = 18; // 柔光晕短轴 (实测调参 ×1.5)
export const SWORD_HALO_ALPHA = 0.3; // 柔光晕透明度

// 悬浮剑 (Stage 5): 待命状态下显示在玩家身边的虚化剑, 形状复用 SWORD_BLADE/HALO_*.
// 浮游炮语义 (Pass 4 终定): 位置固定在玩家身边 ANCHOR_DIR × DISTANCE 处,
// 朝向跟随光标 — 剑不在玩家周围转圈, 而是悬浮某固定位置 + 炮口跟目标.
export const SWORD_HOVER_DISTANCE = 40; // pivot 距玩家身体中心 (px). 朝上时 pivot ≈ 身体顶端高度.
// 梭形中心相对 graphics 原点 (= pivot) 的 x 偏移. pivot 位于梭形长轴上
// 距剑柄 8px / 距剑尖 16px, 即剑身下 1/3 比例 (from 柄).
export const SWORD_HOVER_PIVOT_OFFSET = 4;
// 单剑固定位置方向向量, 45° 右上 (画布 y 向下, y = -√2/2 表示朝上).
// M5+ 多剑系统时此常量扩展为方向数组, 多剑分布在玩家周围不同角度.
export const SWORD_HOVER_ANCHOR_DIR_X = 0.7071;
export const SWORD_HOVER_ANCHOR_DIR_Y = -0.7071;

// halo 静态 graphics.alpha (Pass 8): halo 不参与流动, 作背景. 0.15 避免稀释
// 剑身流动对比. halo 几何 (48×18) 不变, 仅调 alpha.
export const SWORD_HOVER_HALO_BASE_ALPHA = 0.15;
// 剑身流动呼吸 (Pass 8, 设计文档 §7): 剑分 N 段, 每段 alpha 是 phase + i 的函数,
// 形成"明暗波从剑柄滚到剑尖". 周期 1.5s 线性匀速.
export const SWORD_HOVER_SEGMENT_COUNT = 6; // §7 6~10, 取下界视觉对比更明显
export const SWORD_HOVER_FLOW_PERIOD = 1500; // ms, §7 流动周期
export const SWORD_HOVER_DARK_ALPHA = 0.5; // §7 暗端 alpha
export const SWORD_HOVER_BRIGHT_ALPHA = 1.0; // §7 亮端 alpha
export const SWORD_HOVER_BRIGHT_WINDOW = 0.3; // §7 亮区宽度 (归一化, 剑身 30%)
