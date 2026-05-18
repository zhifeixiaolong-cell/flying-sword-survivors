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

**M0(项目初始化)已完成,进入 M1**。当前仓库里只有空的 `MainScene` 显示一行 "Hello Phaser" 文字,还没有玩家、城墙、飞剑或敌人。

里程碑路线:
- M0 ✓ 项目骨架(空 Phaser 画布)
- M1 玩家角色 + 城墙视觉 + 左右移动 ← 现在在这
- M2 飞剑系统(键盘发射 + 鼠标瞄准 + 准星)
- M3 敌人系统(从上方生成 + 向下移动 + 资源预加载,此时引入 `BootScene` 作加载器)
- M4 碰撞 + 城墙血量 + 失败状态 + 正式接入质量门(build 链 typecheck/lint)
- M5 多种飞剑武器
- M6 v0.1.0 发布到 GitHub Pages
- M7 Bug 修复 + Hotfix
- M8 复盘 + v0.2.0 规划

**不要预先实现下一里程碑及以后的功能,除非用户明确要求**。

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
