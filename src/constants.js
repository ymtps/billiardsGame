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

// 入力定数
export const MIN_DRAG_PIXELS = 10      // 最小ドラッグ距離 (px) — 誤クリック除外
export const MAX_DRAG_PIXELS = 200     // パワーMAXに必要なドラッグ距離 (px)
export const PLAYER_SHOT_POWER_SCALE = 0.72 // プレイヤーショット入力の全体倍率

// ポケット座標 (テーブル中心が原点) — WPA規格: クッション面端に配置
const _hw = TABLE_W / 2  // 1.27m
const _hh = TABLE_H / 2  // 0.635m
export const POCKET_POSITIONS = [
  { x: -_hw, z: -_hh }, // 左上コーナー
  { x:  0.00, z: -_hh }, // 上サイド
  { x:  _hw, z: -_hh }, // 右上コーナー
  { x: -_hw, z:  _hh }, // 左下コーナー
  { x:  0.00, z:  _hh }, // 下サイド
  { x:  _hw, z:  _hh }, // 右下コーナー
]

// ボール色マップ (ballId → hex color)
export const BALL_COLORS = {
  0:  0xffffff, // 手玉 (白)
  1:  0xf5d020, // 1番 (黄)
  2:  0x1a5fab, // 2番 (青)
  3:  0xd42b2b, // 3番 (赤)
  4:  0x7b2d8b, // 4番 (紫)
  5:  0xe87510, // 5番 (橙)
  6:  0x1a7c3e, // 6番 (緑)
  7:  0x8b3a1c, // 7番 (茶)
  8:  0x111111, // 8番 (黒)
  9:  0xf5d020, // 9番 (黄縞)
  10: 0x1a5fab, // 10番 (青縞)
  11: 0xd42b2b, // 11番 (赤縞)
  12: 0x7b2d8b, // 12番 (紫縞)
  13: 0xe87510, // 13番 (橙縞)
  14: 0x1a7c3e, // 14番 (緑縞)
  15: 0x8b3a1c, // 15番 (茶縞)
}

// 壁の境界 (ボール中心が超えてはいけない座標)
export const WALL_XMIN = -(TABLE_W / 2) + BALL_RADIUS
export const WALL_XMAX =  (TABLE_W / 2) - BALL_RADIUS
export const WALL_ZMIN = -(TABLE_H / 2) + BALL_RADIUS
export const WALL_ZMAX =  (TABLE_H / 2) - BALL_RADIUS

// 座標変換ユーティリティ (インライン関数)
export const physicsToThree = (x, z) => ({ x, y: BALL_RADIUS, z })
export const threeToPhysics = (x, z) => ({ x, z })
