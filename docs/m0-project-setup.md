# Flying Sword Survivors — M0 项目初始化规划

## Context

这是一个新的 2D 游戏学习项目,长期目标是做一个类吸血鬼幸存者的飞剑题材游戏(俯视视角,自动攻击,刷怪升级)。当前阶段是 M0(项目初始化),目标极小:在浏览器里能跑起来一个空白的 Phaser 画面,确认整条工具链(Vite + TS + Phaser + 编辑器/Lint)是通的。M0 完成后,M1 才会开始进入"显示玩家角色"等真正的游戏逻辑。

技术栈与已确认的选择:
- 构建工具:**Vite**
- 语言:**TypeScript**(strict 模式)
- 游戏引擎:**Phaser 3**(`^3.90.0`,允许补丁/小版本升级)
- 画布:**1280×720**(16:9)
- 包管理:**npm**
- License:**MIT**(Copyright: Zhifei Cai)
- 代码规范:**ESLint(flat config) + Prettier** 配置与脚本在 M0 就准备好,但**不挂到 build 关卡**(详见第 2 节脚本说明、第 5 节验收策略)
- 文档语言:**README.md 英文**(GitHub 习惯)、**CLAUDE.md 中文**(与用户协作一致)
- 部署:静态托管(后续 GitHub Pages),通过 **`VITE_BASE` 环境变量**注入 base 路径

---

## 1. 目录结构

```
flying-sword-survivors/
├── .gitignore
├── .editorconfig                # 跨编辑器的基础格式约束(缩进/换行/字符集)
├── .prettierrc.json             # Prettier 配置
├── .prettierignore
├── .vscode/
│   ├── extensions.json          # 推荐扩展(ESLint / Prettier / Phaser Snippets)
│   └── settings.json            # 保存时自动 format,默认 formatter 用 Prettier
├── eslint.config.js             # ESLint flat config(ESLint 9+ 新格式)
├── LICENSE                      # MIT,Copyright: Zhifei Cai
├── README.md                    # 给人看的项目说明(英文)
├── CLAUDE.md                    # 给 Claude Code 看的项目记忆(中文)
├── package.json
├── package-lock.json            # 提交,锁定依赖版本
├── tsconfig.json                # TS 编译配置(浏览器侧,src/)
├── tsconfig.node.json           # TS 编译配置(Node 侧,vite.config.ts)
├── vite.config.ts
├── index.html                   # Vite 入口 HTML
├── public/                      # 原样拷贝的静态资源(favicon 等),M0 可以为空
└── src/
    ├── main.ts                  # 入口:创建 Phaser.Game,装配场景
    ├── config.ts                # 游戏全局常量(画布宽高、背景色等)
    ├── scenes/
    │   └── MainScene.ts         # 第一个场景;M0 里只画背景 + "Hello Phaser" 文字
    └── vite-env.d.ts            # Vite 注入的 import.meta.env 类型补全
```

**关于场景命名 `MainScene` 而不是 `BootScene`**:
Phaser 社区里 `BootScene` 通常约定为"启动加载器"——预加载资源、显示进度条,然后再切到 `PlayScene`。M0 还没有任何资源需要加载,叫 `BootScene` 名实不符。`MainScene` 是中性的"当前主场景"语义,等到 M3+ 真有资源需要预加载时,再引入 `BootScene` 做加载器、把 `MainScene` 改名为 `PlayScene`。

**关于 `src/scenes/` 是否 M0 就引入**:
推荐保留。Phaser 引擎本身要求一个 `Phaser.Game` 至少注册一个 Scene,把 Scene 独立成文件可以让 `main.ts` 始终保持"只做引导"的角色,后续增加场景时不用做结构性重构。

**关于 `public/` vs `src/assets/`(后续会用到)**:
M0 不需要资源,但先约定好:
- `public/` — 不被 Vite 处理、原样输出的资源(favicon、不需要 hash 的大文件)
- `src/assets/`(未来添加)— 需要被 Vite import 处理、参与构建优化的资源(图片、音频)

---

## 2. 配置文件核心内容

### `package.json`

```jsonc
{
  "name": "flying-sword-survivors",
  "private": true,                // 防止误发布到 npm
  "version": "0.0.0",
  "type": "module",               // ESM,Vite 需要
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:gh": "VITE_BASE=/flying-sword-survivors/ vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "vite": "^7.0.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",     // 给 vite.config.ts 用 process.env
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "@eslint/js": "^9.0.0",
    "globals": "^15.0.0",
    "prettier": "^3.3.0",
    "eslint-config-prettier": "^9.1.0"  // 关掉与 Prettier 冲突的 ESLint 规则
  }
}
```

说明:
- **M0 故意不在 `build` 里链 `tsc --noEmit` / `eslint`**。质量门(typecheck / lint / format 强制通过才能 build)留到 M4 项目复杂度起来之后再引入。当前 M0 阶段优先保住"从无到有"的体验,`typecheck` / `lint` / `format` 作为独立脚本随时可手动跑,但不会拦截 build。
- `build:gh` 是给 GitHub Pages 部署用的变体;`base` 通过环境变量注入。本地开发 `dev` 用默认 `/`。

### `tsconfig.json`(主)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",   // Vite 推荐
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,

    "isolatedModules": true,         // 每个文件能独立编译,Vite 要求
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,

    "noEmit": true                   // Vite 负责输出
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.node.json`(给 Vite 配置文件用)

```jsonc
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
```

要点:`base` 通过 `VITE_BASE` 注入。`dev` / 默认 `build` 都用 `/`;`build:gh` 才注入 `/flying-sword-survivors/`。

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flying Sword Survivors</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0b0b14; }
      body { display: flex; align-items: center; justify-content: center; }
      #app canvas { display: block; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `eslint.config.js`(ESLint 9 flat config)

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    rules: {
      // M0 先用默认推荐规则,实际撞到再调
    },
  },
  prettier  // 必须放最后,关闭与 Prettier 冲突的格式规则
);
```

### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### `.prettierignore`

```
dist
node_modules
package-lock.json
```

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false   # Markdown 行尾两个空格表示换行,不能 trim
```

### `.vscode/extensions.json`

```jsonc
{
  "recommendations": [
    "dbaeumer.vscode-eslint",          // ESLint 集成
    "esbenp.prettier-vscode",          // Prettier formatter
    "EditorConfig.EditorConfig",       // .editorconfig 支持
    "ourcade.phaser-snippets",         // Phaser 3 代码片段
    "ourcade.phaser3-snippets"         // 备选(社区维护版本)
  ]
}
```

### `.vscode/settings.json`

```jsonc
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",   // 用项目本地 TS 而不是 VS Code 自带
  "files.eol": "\n"
}
```

---

## 3. 文档与许可文件

### `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/

# Editor / OS
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/

# Logs
*.log
npm-debug.log*

# Env
.env
.env.local
.env.*.local
```

### `README.md`(英文,给人看)

应包含以下章节:
- **Project intro** — 一段话:Phaser 3 + TypeScript + Vite 学做的类吸血鬼幸存者游戏(玩法概念简述)
- **Tech stack** — Vite / TypeScript / Phaser 3
- **Getting started** — `npm install` / `npm run dev`(默认浏览器打开 http://localhost:5173)
- **Scripts** — dev / build / preview / typecheck / lint / format 各一行说明,注明 typecheck/lint/format 在 M0 是可选检查、不在 build 关卡上
- **Project layout** — 简化版的目录树 + 每个目录一句话
- **Roadmap** — 列出里程碑(M0 项目骨架 / M1 玩家角色 / M2 飞剑 / M3 敌人 / M4 经验升级 & 引入质量门 / ...),M1+ 先写占位
- **License** — MIT

### `CLAUDE.md`(中文,给 Claude Code 看的项目记忆)

应包含以下信息(写法上是"指令式 / 事实陈述",不是营销文案):
- **项目目标** — 一句话点出这是 Phaser 3 + TS 学做的飞剑生存游戏
- **技术栈与版本基线** — Vite / TS strict / Phaser `^3.90.0` / ESLint flat config
- **当前阶段** — 现在在 M0,只有空场景;不要预先实现 M1+ 的功能除非用户明确要求
- **常用命令** — 必跑的命令清单(`npm run dev` 起开发服务 / `npm run build` 出生产产物 / `npm run typecheck` / `npm run lint` / `npm run format`),并注明 **M0 阶段 build 不链 typecheck/lint,质量门留到 M4**
- **为什么有两个 tsconfig 文件**:
  - `tsconfig.json` 服务 `src/` 浏览器侧代码,`lib` 包含 DOM,types 引入 `vite/client`
  - `tsconfig.node.json` 服务 `vite.config.ts` Node 侧代码,types 引入 `node`
  - 隔离的原因:浏览器代码不应该有 Node 全局(`process`、`__dirname`),Node 配置代码不应该有 DOM 全局(`window`、`document`);两份配置避免互相污染,也让 IDE 在不同文件上下文里类型提示正确
  - 顶层 `tsconfig.json` 用 `references` 引到 `tsconfig.node.json`
- **代码风格约定**:
  - 使用 ES Modules(`type: module`)
  - 一律 TypeScript,不写裸 `.js`
  - 场景类放在 `src/scenes/`,每个文件一个 Scene class,文件名与类名一致(`MainScene.ts` ↔ `class MainScene`)
  - 游戏常量集中在 `src/config.ts`(画布大小、世界大小等)
  - **场景命名约定**:`MainScene` 是当前主场景;只有当需要真正预加载资源时才引入 `BootScene` 作为加载器(不要因为"看到别人都叫 BootScene"就照抄)
- **部署相关** — 生产部署用 `npm run build:gh`,base 通过 `VITE_BASE` 注入;不要把仓库名硬编码到 `vite.config.ts` 里

注意:**不要**在 CLAUDE.md 里复制完整目录树或 package.json 内容 —— 这些信息直接读文件更准。CLAUDE.md 只放"读代码读不出来"的约定与意图。

### `LICENSE`

标准 MIT 全文,Copyright 行:`Copyright (c) 2026 Zhifei Cai`(根据 git config 的用户名)。可以直接用 GitHub 的 `choosealicense.com` 模板。

---

## 4. 第一个能跑起来的"Hello Phaser"最小代码

### `src/config.ts`

```ts
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const BG_COLOR = '#0b0b14';
```

### `src/scenes/MainScene.ts`

```ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Hello Phaser', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#e6e6f0',
      })
      .setOrigin(0.5);
  }
}
```

### `src/main.ts`

```ts
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,            // 优先 WebGL,降级 Canvas
  parent: 'app',                // 挂到 index.html 的 <div id="app">
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,     // 等比缩放适配窗口
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

new Phaser.Game(config);
```

### `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

> 严格上说 M0 的"空白画面"甚至不需要 `add.text(...)`,但建一个文字证明 Phaser 真的启动了、字体渲染走通了,比纯黑屏更能验收。下一步 M1 会把这行文字删掉换成玩家精灵。

---

## 5. 验收步骤(M0 完成的判定)

M0 阶段刻意收窄验收面,只验证"从无到有"两条核心路径(dev / build),让用户尽快看到运行画面;`typecheck` / `lint` / `format` 的脚本已经准备好但**不作为 M0 的验收项**,留到 M4 项目复杂度起来后再正式接入构建关卡。

**M0 必须通过(严卡)**:
1. `npm install` — 依赖安装无报错。
2. `npm run dev` — 浏览器自动打开 http://localhost:5173,页面中央可见 `Hello Phaser` 文字,背景为深紫黑色(#0b0b14),浏览器 console 无报错。
3. `npm run build` — 在 `dist/` 生成产物。
4. `npm run preview` — 起本地静态服务,效果与 dev 一致。
5. `VITE_BASE=/flying-sword-survivors/ npm run build:gh && npm run preview` — base 注入也正常(主要看产物里资源路径前缀变成 `/flying-sword-survivors/...`)。

**M0 不强制(可选,跑通更好但失败不阻塞)**:
- `npm run typecheck` — 仅作为开发体感参考。
- `npm run lint` — 仅作为开发体感参考。
- `npm run format:check` — 仅作为开发体感参考。

---

## 6. 不属于 M0、有意延后的事项

明确不在 M0 做,避免提前优化:
- 玩家角色 / 输入控制 / 摄像机跟随 → **M1**
- 飞剑实体 / 自动攻击 → **M2**
- 敌人生成 / 碰撞 → **M3**
- 经验 / 升级 UI、以及**正式接入质量门(build 链 typecheck/lint,CI 上拦截)** → **M4**
- 资源加载与 `BootScene`(加载器场景) → 等真有资源时再拆
- 单元测试 / vitest → 等出现"值得测"的纯函数再加
- GitHub Actions 自动部署 → 等本地手动 `build:gh` 跑通后再做
- HUD / DOM UI 与 Phaser 通信架构 → 等 UI 真出现再选型

---

## 7. 已确认的选择(归档,执行时按此落地)

- **Phaser 版本** `^3.90.0`(允许补丁/小版本升级)
- **画布尺寸** 1280×720(16:9)
- **README.md** 英文撰写;**CLAUDE.md** 中文撰写
- **LICENSE Copyright** `Copyright (c) 2026 Zhifei Cai`
- **包管理器** npm
- **质量门策略** ESLint / Prettier 配置就位,脚本就位,**不挂到 build 关卡**,留到 M4 引入
- **首场景** `MainScene`(不是 `BootScene`)
- **Vite base** 通过 `VITE_BASE` 环境变量注入(默认 `/`,`build:gh` 注入 `/flying-sword-survivors/`)
