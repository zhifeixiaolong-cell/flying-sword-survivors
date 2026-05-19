import {
  SWORD_DAMAGE_COEF,
  SWORD_INITIAL_SPEED,
  SWORD_MAX_DISTANCE,
  SWORD_MIN_SPEED,
  SWORD_SHARPNESS,
  SWORD_SPEED_FLOOR,
  SWORD_TURN_RATE,
} from '../config';

// 飞剑基础属性接口. M5+ 多种飞剑武器复用此接口, 通过实例化不同 SwordConfig 实现差异化.
export interface SwordConfig {
  initialSpeed: number;
  minSpeed: number;
  maxDistance: number;
  speedFloor: number;
  sharpness: number;
  damageCoefficient: number;
  turnRate: number; // °/s, 追踪角速度上限
}

// M2 唯一一种基础剑配置. 通过 PlayerStats 倍率与此合并得到飞剑实际属性.
export const DEFAULT_SWORD_CONFIG: SwordConfig = {
  initialSpeed: SWORD_INITIAL_SPEED,
  minSpeed: SWORD_MIN_SPEED,
  maxDistance: SWORD_MAX_DISTANCE,
  speedFloor: SWORD_SPEED_FLOOR,
  sharpness: SWORD_SHARPNESS,
  damageCoefficient: SWORD_DAMAGE_COEF,
  turnRate: SWORD_TURN_RATE,
};
