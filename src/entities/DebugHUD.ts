import Phaser from 'phaser';

// Debug HUD (Stage 6 Commit 2): 反引号 ` 键 toggle 显示运行时关键信息.
// 默认 OFF, 玩家正常体验时看不到. 开发时一按就开.
//
// 显示内容 (M2 最小 set):
// - FPS
// - 飞剑池: used/capacity
// - 飞剑当前状态 (OUTBOUND / TURNING / RETURNING) + 距 pivot 距离 + 当前速度
// - 玩家位置 + 当前移动速度
//
// 不显示: alpha / 渲染细节 / 复杂状态 (M3+ 加).

export interface DebugHUDData {
  fps: number;
  poolUsed: number;
  poolCapacity: number;
  swordState: string | null; // null = 池空, 无飞剑在外
  swordDistance: number | null;
  swordSpeed: number | null;
  playerX: number;
  playerY: number;
  playerSpeed: number;
}

export class DebugHUD {
  private readonly text: Phaser.GameObjects.Text;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(10, 10, '', {
      font: '14px monospace',
      color: '#E8E8F0',
      backgroundColor: '#000000A0',
      padding: { x: 6, y: 4 },
    });
    this.text.setScrollFactor(0); // 固定屏幕, 不跟 camera 移动
    this.text.setDepth(2000); // 在准星 (1000) 之上, HUD 永远在最顶
    this.text.setVisible(false);

    // 反引号键 toggle. 注: Phaser.Input.Keyboard.KeyCodes.BACKTICK 不存在,
    // 用字符串事件名 keydown-BACKTICK 监听.
    scene.input.keyboard!.on('keydown-BACKTICK', () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    });
  }

  update(data: DebugHUDData): void {
    if (!this.visible) return;

    const lines = [
      `FPS: ${data.fps.toFixed(1)}`,
      `Pool: ${data.poolUsed}/${data.poolCapacity}`,
      `Sword: ${data.swordState ?? 'none'}`,
    ];

    if (data.swordState !== null) {
      lines.push(`  dist: ${data.swordDistance?.toFixed(0)}px`);
      lines.push(`  speed: ${data.swordSpeed?.toFixed(0)} px/s`);
    }

    lines.push(
      `Player: (${data.playerX.toFixed(0)}, ${data.playerY.toFixed(0)})`,
    );
    lines.push(`  speed: ${data.playerSpeed.toFixed(0)} px/s`);

    this.text.setText(lines.join('\n'));
  }

  destroy(): void {
    this.text.destroy();
  }
}
