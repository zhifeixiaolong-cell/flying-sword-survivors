# M2 飞剑物理状态机审查清单

> M5+ 引入新物理特性 (穿透链 / 多剑 / 弹反 / 元素效果) 时, 对照本
> 清单 review 每个状态下飞剑的行为, 避免 M2 时踩过的物理坑
> (例如 orbit dynamic / 出画布消失 / 入鞘点错位)。

## 状态机三分支总览

| 状态 | 进入条件 | 离开条件 | 期间 sword 是否移动 |
|------|---------|---------|-------------------|
| OUTBOUND | 出鞘 | dist_from_launch >= D_max | ✅ 移动 |
| TURNING | OUTBOUND 结束 | dir 与"指向玩家"夹角 < 5° / TURNING > 1.5s | ✅ 移动 |
| RETURNING | TURNING 结束 | 入鞘 (dist_to_player < sheath_radius) / 出画布 | ✅ 移动 |

## 每状态详细 audit

### OUTBOUND

- sword 是否移动? **是**
- speed 公式输入的 d 是什么? **distance(sword, player) 距玩家当前位置**
- 退出条件用的 d 是什么? **distance(sword, launchPoint) 距发射点**
  (注: 两个 d 分工不冲突 — 速度衰减用 d_to_player 涌现物理, 终止
  用 d_from_launch 解耦玩家走位)
- 极端情况:
  - θ=180° 朝下发射, 玩家在画布底部: 飞剑短距离碰画布边缘 → 触发
    TURNING (出画布触发 TURNING 修复, 1b6200a)
  - speed 边界: 远端速度 = V_min = 360 px/s, INV-01 守护

### TURNING

- sword 是否移动? **是 (Pass 4 之前误以为单帧不动 → orbit dynamic bug)**
- speed 公式? **强制 = effectiveMinSpeed (V_min, 切断 d 缩小 → orbit)**
- dir 如何变? **applyHoming(dt, targetDirToPlayer), 180°/s 角速度限制**
- 退出条件? **|atan2(cross, dot)| < 5°**
- 极端情况:
  - θ=180° 极端转向: ~972ms (TURN_RATE 180°/s 物理极限)
  - 断言: TURNING 持续 > 1500ms throw (50% 余量)
  - 关键: speed 强制 V_min 是 Pass 4 的修复, 不能改成 computeSpeed(d)
    (那会引入 orbit dynamic)

### RETURNING

- sword 是否移动? **是**
- speed 公式? **computeSpeed(d_to_player) = V_min + (V_max-V_min)×(1-d/D_max)**
- dir 如何变? **applyHoming(dt, targetDirToPlayer), 180°/s 角速度限制**
- 退出条件?
  - 主路径: dist_to_player < sheath_radius (= PLAYER_SIZE/2 + 5) → 入鞘
  - 兜底: 出画布 → destroy + 池 release
- 极端情况:
  - 玩家高速走位: homing 永远追得上 (V_min > PLAYER_SPEED, INV-01)
  - 入鞘点: 注意是 SwordHover.getPivotPosition() 不是 player 身体中心
    (Pass 6 修复)

## 跨状态的不变量

| 不变量 | 守护方式 | 违反时影响 |
|--------|---------|-----------|
| speed > V_min × 0.99 | dev 断言 in update() | 物理公式 bug, 速度异常下降 |
| \|dir\| == 1 (±1%) | dev 断言 in update() | 旋转矩阵累积误差 |
| position finite | dev 断言 in update() | 除 0 / NaN 污染 |
| 池容量 = flying 数 | SwordPool 内部一致性 | 触发 INV-02, 飞剑数不可控 |
| TURNING <= 1500ms | dev 断言 in update() | homing 不收敛 / orbit dynamic |

## M3+ 引入新功能时的 review 清单

每加一个新物理特性, 回答:

1. 新特性在哪些状态下生效? (OUTBOUND? TURNING? RETURNING? 全部?)
2. 新特性是否改变 sword 的 speed / dir / position 之一?
3. 新特性是否引入新的"参考点"? (例如穿透链可能引入"下一目标位置")
4. 现有不变量在新特性下是否仍成立?
5. 是否需要新的 dev 断言?
6. 是否影响入鞘 / 出鞘点 (Pass 6 的 pivot)?

## M2 已踩过的物理坑 (历史教训)

1. **Orbit dynamic** (6199d5a fix):
   TURNING 期间用 distance-based speed 公式, sword 移动让 d 缩小,
   speed 升高, 角速度跟不上 → 飞剑卡在远端转圈。修复: TURNING 强制
   V_min。

2. **出画布消失** (1b6200a fix):
   朝下发射时飞剑短距离碰画布底部, 触发 Stage 1 留的"出画布兜底"
   destroy, 跳过 TURNING/RETURNING。修复: 出画布 + OUTBOUND →
   触发 TURNING 而非 destroy。

3. **出/入鞘点错位** (Pass 6 fix):
   Stage 1-4 假设 飞剑从玩家身体中心出/入鞘, 但 Stage 5 引入悬浮剑
   在右上方, 视觉断裂。修复: 出/入鞘点 = SwordHover.getPivotPosition()。

## 文件位置

- src/entities/Sword.ts — 状态机实现
- src/entities/SwordPool.ts — 池约束 + 出/入鞘协调
- src/entities/SwordHover.ts — getPivotPosition 提供 pivot
- src/config.ts — 物理常量 (V_max/V_min/D_max/TURN_RATE/SHEATH_RADIUS_PAD)
- docs/design-invariants.md — INV-01/02/03 形式化定义
- docs/m2-sword-system-design.md — 完整设计文档 (§3 物理, §7 悬浮剑)
