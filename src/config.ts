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

// 悬浮剑 (Stage 5): 待命状态下显示在玩家身边的虚化剑, 形状复用 SWORD_BLADE/HALO_*
export const SWORD_HOVER_DISTANCE = 30; // 距玩家身体中心 (px)
// 梭形中心相对 graphics 原点 (= pivot) 的 x 偏移, 让 pivot 落在光晕下 1/3 处.
// 指挥棒语义: 剑柄端贴近玩家几乎钉死, 剑尖大幅甩动追鼠标方向.
// 几何: 剑身覆盖 [-4, +20] (pivot 距柄 4 / 距尖 20), 光晕覆盖 [-16, +32]
// (pivot 距柄 16 / 距尖 32 = 光晕 1/3 from 柄).
export const SWORD_HOVER_PIVOT_OFFSET = 8;
export const SWORD_HOVER_BASE_ALPHA = 0.5; // graphics.alpha 显示基线 (隐藏=0)
export const SWORD_HOVER_BREATH_RANGE = 0.1; // 呼吸 alpha 浮动范围 (Stage 5 Commit 2)
// halo 在 graphics 内的 draw alpha. 实际显示 alpha = 此值 × graphics.alpha (双层相乘).
// M5+ 多剑差异化 halo 时考虑重构 (拆 hover 自己的 halo color/alpha 常量).
export const SWORD_HOVER_HALO_ALPHA = 0.6;
