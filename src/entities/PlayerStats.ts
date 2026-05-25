// 御剑能力倍率. M2 全 1.0, M5+ 由角色等级/技能/buff 写入.
// INV-03 (docs/design-invariants.md): 所有飞剑成长唯一汇聚到此, 不开装备/科技树通道.
export class PlayerStats {
  initialSpeedMul = 1.0;
  maxDistanceMul = 1.0;
  minSpeedMul = 1.0;
  sharpnessMul = 1.0;
  damageCoefficientMul = 1.0;
  turnRateMul = 1.0;
}
