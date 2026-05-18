// ビリヤードテーブル・ボール物理定数 (WPA規格)
export const TABLE_W = 2.54       // テーブル幅 (m)
export const TABLE_H = 1.27       // テーブル高さ (m)
export const BALL_RADIUS = 0.028575 // ボール半径 (m) - 直径57.15mm
export const FOOT_SPOT_Z = 0.25   // フットスポット Z 座標

// 物理エンジン定数
export const PHYSICS_HZ = 120
export const FIXED_DT = 1 / PHYSICS_HZ
export const MAX_CATCHUP = 0.25   // タブ復帰後の最大補完秒数
export const SOLVER_ITER = 8      // 多体衝突反復回数
export const E_BALL = 0.95        // ボール間反発係数
export const E_WALL = 0.80        // クッション反発係数
export const MU_ROLL = 0.012      // 転がり摩擦係数
export const DECEL = MU_ROLL * 9.81 // 減速加速度 ≈ 0.118 m/s²
export const REST_THRESH = 0.005  // スナップ停止閾値 (m/s)
export const MAX_SPEED = 8.0      // 最大速度 (m/s) - トンネリング防止
export const SLOP = 0.001         // 位置補正の浸透許容値 (m)
export const POCKET_RADIUS = 0.057 // ポケット判定半径 (m)

// 入力定数 (実装時に調整)
export const MIN_DRAG_DISTANCE = 0.01  // 最小ドラッグ距離 (m) ≈ 10px相当
export const DRAG_SCALE = 4.0          // ドラッグ距離→速度スケール (m/s per m)

// ポケット座標 (テーブル中心が原点)
export const POCKET_POSITIONS = [
  { x: -1.22, z: -0.59 }, // 左上コーナー
  { x:  0.00, z: -0.59 }, // 上サイド
  { x:  1.22, z: -0.59 }, // 右上コーナー
  { x: -1.22, z:  0.59 }, // 左下コーナー
  { x:  0.00, z:  0.59 }, // 下サイド
  { x:  1.22, z:  0.59 }, // 右下コーナー
]

// ボール色マップ (ballId → hex color)
export const BALL_COLORS = {
  0: 0xffffff, // 手玉 (白)
  1: 0xf5d020, // 1番 (黄)
  2: 0x1a5fab, // 2番 (青)
  3: 0xd42b2b, // 3番 (赤)
  4: 0x7b2d8b, // 4番 (紫)
  5: 0xe87510, // 5番 (橙)
  6: 0x1a7c3e, // 6番 (緑)
  7: 0x8b3a1c, // 7番 (茶)
  8: 0x111111, // 8番 (黒)
  9: 0xf5d020, // 9番 (黄縞)
}

// 壁の境界 (ボール中心が超えてはいけない座標)
export const WALL_XMIN = -(TABLE_W / 2) + BALL_RADIUS
export const WALL_XMAX =  (TABLE_W / 2) - BALL_RADIUS
export const WALL_ZMIN = -(TABLE_H / 2) + BALL_RADIUS
export const WALL_ZMAX =  (TABLE_H / 2) - BALL_RADIUS

// 座標変換ユーティリティ (インライン関数)
export const physicsToThree = (x, z) => ({ x, y: BALL_RADIUS, z })
export const threeToPhysics = (x, z) => ({ x, z })
