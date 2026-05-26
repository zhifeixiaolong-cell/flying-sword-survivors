# Flying Sword Survivors

这是一个 Phaser 3 + TypeScript 学做的 2D 「塔防 + 飞剑修真」题材游戏:玩家角色在画布下方的城墙上左右移动,用飞剑攻击从上方持续推进的敌人,阻止它们攻破城墙。

## 核心玩法

- **战场布局**:玩家角色在画布下方的城墙上活动,只能左右移动;敌人从画布上方生成,持续向下方城墙推进
- **胜负条件**:城墙被攻破即失败(血量系统在 M4 实现)
- **操作方案(M2+ 实现)**:
  - 移动:WASD 的 `A` / `D` 键控制左右(简化操作,刻意不上 W/S)
  - 瞄准:鼠标在画布上的位置决定飞剑飞行方向,画面上画准星
  - 发射:键盘空格键(或其他键)按下发射飞剑
  - 设计意图:「左手走位 + 右手瞄准 + 左手发射」三线操作,上手简单但深度足够

## 当前阶段

**M2 已 ship(PR #3, `3bd87d6`),进入 M3 设计阶段**。当前游戏可玩:A/D 移动 + 鼠标瞄准 + 空格发射飞剑,飞剑物理(出鞘→距离衰减→远端弧形掉头→Homing C 弧追踪→入鞘),浮游炮悬浮剑朝向跟光标,自定义准星 ready/cooldown 两态,深蓝夜空 #0A1428 背景,反引号 toggle Debug HUD。

里程碑路线:
- M0 ✓ 项目骨架(空 Phaser 画布)
- M1 ✓ 玩家角色 + 城墙视觉 + 左右移动
- M2 ✓ 飞剑系统(单剑池 + 双程轨迹 + 物理涌现伤害 + 写意视觉) — PR #3 merged, 31 commits
- M3 敌人系统(从上方生成 + 向下移动 + 资源预加载,此时引入 `BootScene` 作加载器) — **设计文档待产出 ← 现在在这**
- M4 碰撞 + 城墙血量 + 失败状态 + 正式接入质量门(build 链 typecheck/lint)
- M5 多种飞剑武器(Stage 5 流动呼吸债务在此还)
- M6 v0.1.0 发布到 GitHub Pages
- M7 Bug 修复 + Hotfix
- M8 复盘 + v0.2.0 规划

**不要预先实现下一里程碑及以后的功能,除非用户明确要求**。

## M2 飞剑系统(已交付)

飞剑系统不是武器系统,而是「修真御剑」的资源管理 + 物理涌现系统。PR #3 merged at `3bd87d6`, 31 commits, Stage 1-6 全部完成。

**机制三件套**:
- 单剑模型:容量 = 1,池空时按空格无反应(张力时刻)
- 双程轨迹:直线穿透去程 → 远端转折 → 中等追踪(180°/s)回程
- 伤害涌现:瞬时伤害 = 当前速度 × 伤害系数;速度按距离线性衰减

**实际数值**(完整推导见设计文档 §8):
- V_max=1200 px/s, V_min=360 px/s, D_max=600 px
- 锋利度=0.7, 伤害系数=0.1, 追踪角速度上限=180°/s
- PLAYER_SPEED=150 < SWORD_MIN_SPEED=360(INV-01 余量 210 px/s)

**设计不变量**(强约束,详见 `docs/design-invariants.md`):
- **INV-01** 飞剑速度恒 > 角色速度
- **INV-02** 飞剑数量 = 资源池容量
- **INV-03** 机制成长 = 修为成长

**已知债务**:
- Stage 5 流动呼吸视觉(剑柄 → 剑尖 1.5s 流动光晕)推迟到 M5 美术资产阶段,`drawSwordFlow` 函数保留作起点;Phaser Graphics 在 15px 剑刃上的视觉极限是推迟原因

**详细文档**:
- `docs/m2-sword-system-design.md` — 完整设计(设计哲学 / 推导 / 决策追溯)
- `docs/m2-sword-implementation-guide.md` — 实施必读(执行视角)
- `docs/m2-physics-checklist.md` — 物理状态机审查清单
- `docs/design-invariants.md` — 三大不变量正式定义

## 技术栈与版本基线

- Vite + TypeScript(strict)
- Phaser `^3.90.0`
- ESLint flat config(ESLint 9+) + Prettier
- 包管理:npm

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 起开发服务(端口 5173,自动打开浏览器) |
| `npm run build` | 出生产产物到 `dist/` |
| `npm run build:gh` | 给 GitHub Pages 用的构建变体(base 注入仓库路径) |
| `npm run preview` | 本地预览生产产物 |
| `npm run typecheck` | `tsc --noEmit`,**M0 不强制** |
| `npm run lint` | ESLint,**M0 不强制** |
| `npm run format` | Prettier 写盘,**M0 不强制** |

**M0 阶段 `build` 不链 `typecheck` / `lint`**,质量门留到 M4 引入,届时 `build` 会先跑类型检查与 lint。

## 为什么有两个 tsconfig 文件

- `tsconfig.json` 服务 `src/` 浏览器侧代码;`lib` 包含 DOM,`types` 引 `vite/client`
- `tsconfig.node.json` 服务 `vite.config.ts` Node 侧代码;`types` 引 `node`
- 隔离的目的:浏览器代码不应该出现 Node 全局(`process`、`__dirname`),Node 配置代码也不应该看见 DOM 全局(`window`、`document`);两份配置避免互相污染,IDE 在不同文件的上下文里类型提示也更准
- 顶层 `tsconfig.json` 通过 `references` 引用 `tsconfig.node.json`

## 代码风格约定

- 使用 ES Modules(`type: module`)
- 一律 TypeScript,不写裸 `.js`(`eslint.config.js` 是例外,因为它需要被 Node 直接 import)
- 场景类放在 `src/scenes/`,**一个文件一个 Scene class,文件名与类名一致**(`MainScene.ts` ↔ `class MainScene`)
- 游戏常量集中在 `src/config.ts`(画布大小、世界大小、颜色等)
- **场景命名约定**:`MainScene` 是当前主场景。只有当需要真正预加载资源时才引入 `BootScene` 作为加载器——不要因为"看到别人都叫 BootScene"就照抄

## 部署

- 生产部署到 GitHub Pages 用 `npm run build:gh`
- `vite.config.ts` 通过 `process.env.VITE_BASE` 读取 base 路径,**不要把仓库名硬编码到 `vite.config.ts` 里**
- `build:gh` 的 npm script 负责注入 `VITE_BASE=/flying-sword-survivors/`

## 资源目录约定

- `public/` — 不被 Vite 处理、原样输出的资源(favicon、不需要 hash 的大文件)
- `src/assets/`(未来添加)— 需要被 Vite import 处理、参与构建优化的资源(图片、音频)
