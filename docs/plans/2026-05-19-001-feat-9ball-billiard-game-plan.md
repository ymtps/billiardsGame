---
title: "feat: Web 9-ball Billiard Game (Three.js + Custom 2D Physics)"
type: feat
status: active
date: 2026-05-19
origin: docs/brainstorms/web-9ball-billiard-requirements.md
---

# feat: Web 9-ball Billiard Game (Three.js + Custom 2D Physics)

## Overview

ゼロからWebブラウザ上で遊べる9ボールビリヤードゲームを構築する。Three.js (r152+) で3D描画を行い、カスタム2D物理エンジンでボール衝突・転がりを処理する。AIと1対1で対戦でき、ドラッグ＆リリース操作でショットを打てる完結したゲームを、Vite + Vanilla JS で実装する。

## Problem Frame

空のリポジトリからゼロ構築。既存コードなし。要件ドキュメント (`docs/brainstorms/web-9ball-billiard-requirements.md`) が全要件・設計決定の源泉。(see origin: docs/brainstorms/web-9ball-billiard-requirements.md)

技術的主要課題:
1. Three.js描画と2D物理のデータ橋渡し（座標マッピングコントラクト）
2. 衝突イベントログ（R2/R4ファウル判定でボール先当たり順序を記録）
3. AIショット計算（直接線・バンクショット探索 + 有効ショット保証）

## Requirements Trace

- R1-R4. 9ボールルール → `RulesEngine` + `CollisionLog`
- R5. ラック配置 → `RackSetup`
- R6-R7. ゲームフロー・勝敗 → `Game` + `GameState` + `GameOverScreen`
- R8-R10. プレイヤー操作 → `DragShot` + `BallInHand` + `AimLine`
- R11-R13. 状態管理・HUD → `GameState` + `HUD` + `FoulNotification`
- R14-R17. 3Dビジュアル → `SceneManager` + `TableMesh` + `BallMesh`
- R18-R20. AI → `AIPlayer` + `ShotCalculator`

## Scope Boundaries

- オンライン対戦・マルチプレイなし
- スコア保存・ランキングなし
- AI難易度は1段階のみ
- モバイル/タッチ操作なし（PCブラウザ専用）
- エイムラインのクッション反射表示なし（直線のみ）
- カメラ操作なし（固定斜め上視点）
- パワーゲージなし（ドラッグ距離で直感的に判断）

## Context & Research

### Relevant Code and Patterns

- 既存コードなし（グリーンフィールドプロジェクト）

### External References

- Three.js r152+ addons: `three/addons/` (旧 `three/examples/jsm/` は非推奨)
- `PMREMGenerator` + `RoomEnvironment`: 外部HDRアセット不要で環境マップ生成
- `MeshStandardMaterial`: roughness=0.05, metalness=0.0, envMapIntensity=1.5 でビリヤードボールの光沢を表現
- `Raycaster` + `THREE.Plane(Vector3(0,1,0), 0)`: マウス→テーブル平面 (y=0) の交点計算
- `BufferGeometry` + `position.needsUpdate = true`: エイムラインの毎フレーム更新
- `linewidth > 1` はWebGLブラウザで無効 → デフォルト1px使用
- 物理: 弾性衝突インパルス計算 (j = -(1+e)*dvn/2)、アキュムレータパターン (Glenn Fiedler式)
- WPA規格: ボール直径 57.15mm、テーブル寸法 2540 × 1270mm

## Key Technical Decisions

- **カスタム2D物理エンジン（ライブラリ不使用）**: 衝突イベントの順序ログ (`CollisionLog`) を完全制御するため。Matter.js はファウル判定に必要な「手玉が最初に接触したボールのID（順序付き）」をネイティブに提供しない。学習目的とも一致 (see origin)
- **物理座標系 = Three.js xz平面を直接使用**: `physics(x, z) → THREE.js(x, BALL_RADIUS, z)`。スケール1:1で座標変換が不要。テーブル中央を原点とする
- **固定タイムステップ120Hz + アキュムレータ**: フレームレート非依存の物理演算。タブ非アクティブ復帰後の暴走を MAX_CATCHUP=0.25s でクランプ
- **CollisionLog（リアルタイム衝突イベント記録）**: 物理ステップごとに手玉–ボール接触を記録。先頭エントリがファウル判定の「最初に当たったボール」。ポスト判定（シミュレーション後）では先当たり順序を復元できないため、このアーキテクチャが唯一の実装可能方式 (see origin: Resolve Before Planning 確定済み)
- **速度キャップ MAX_SPEED=8 m/s**: トンネリング防止。8 m/s × (1/120 s) = 0.067m < ボール直径 0.057m × 2 = 0.114m で完全防止
- **反復インパルスソルバー（8回反復）**: ラック配置の多体同時衝突を安定解決
- **PMREMGenerator + RoomEnvironment**: 外部アセット不要でボールのリアルな光沢反射を実現。`scene.environment` 設定で全 MeshStandardMaterial に自動適用
- **Vite + Vanilla JS**: TypeScriptなし。シンプルで学習コストが低い

## Open Questions

### Resolved During Planning

- **物理ライブラリ選択**: カスタム実装採用。CollisionLog制御、学習目的、~200行で完結するため
- **2D-3D座標マッピング**: `physics(x,z) = THREE(x, BALL_RADIUS, z)`。スケール1:1、テーブル中央が原点
- **テーブル・ボールサイズ**: TABLE_W=2.54m、TABLE_H=1.27m、BALL_RADIUS=0.028575m
- **物理定数**: E_BALL=0.95、E_WALL=0.80、MU_ROLL=0.012、DECEL≈0.118 m/s²、REST_THRESH=0.005 m/s
- **AIバンクショット探索**: シングルレール反射のみ（4レール × 360方向/1°スイープ）、同期実行後に演出タイマー
- **AI誤差モデル**: 許容幅 = `atan2(BALL_RADIUS, distance)` の50%以内でランダム誤差

### Deferred to Implementation

- 物理「全ボール停止」判定閾値（REST_THRESH=0.005 m/s を出発点に調整）
- ドラッグ距離→ショット速度のスケール関数（DRAG_SCALE、50px≈2 m/s を仮の出発点）
- Three.js ライティング詳細（AmbientLight + DirectionalLight の強度・角度はプレイテストで調整）
- ショットのキュースティック（コック）アニメーション（スコープ外だが後から追加しやすい設計）
- `MIN_DRAG_DISTANCE`（ドラッグ最小閾値、出発点: 10px相当のメートル換算値）
- `DRAG_SCALE`（ドラッグ距離→速度スケール、出発点: 50px ≈ 2 m/s）

## Output Structure

    /
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── constants.js
        ├── utils/
        │   └── Vector2D.js
        ├── physics/
        │   ├── PhysicsEngine.js
        │   ├── Collision.js
        │   ├── CollisionLog.js
        │   └── PocketDetector.js
        ├── scene/
        │   ├── CoordinateSystem.js
        │   ├── SceneManager.js
        │   ├── TableMesh.js
        │   ├── BallMesh.js
        │   └── AimLine.js
        ├── game/
        │   ├── Game.js
        │   ├── GameState.js
        │   ├── BallManager.js
        │   ├── RulesEngine.js
        │   └── RackSetup.js
        ├── input/
        │   ├── InputHandler.js
        │   ├── DragShot.js
        │   └── BallInHand.js
        ├── ai/
        │   ├── AIPlayer.js
        │   └── ShotCalculator.js
        └── ui/
            ├── HUD.js
            ├── FoulNotification.js
            └── GameOverScreen.js

## High-Level Technical Design

> *以下は意図したアーキテクチャの方向性を示す指示的ガイダンスです。実装仕様ではありません。実装エージェントはコンテキストとして参照し、そのまま複製しないでください。*

### ゲーム状態機械

```
IDLE
 └→ RACK               新ゲーム開始時にラック配置
     └→ PLAYER_AIMING  プレイヤーターン：ドラッグでショット準備
         ├→ PLAYER_BIH ボール・イン・ハンドモード：クリックで手玉配置
         └→ SIMULATING  ショット実行後（入力ロック）
             └→ RESULT_CHECK
                 ├→ GAME_OVER (winner: player)  有効9番ポケット
                 ├→ GAME_OVER (winner: ai)       AI有効9番ポケット
                 ├→ PLAYER_AIMING  プレイヤー: ポケット成功で連続ターン
                 ├→ AI_THINKING   プレイヤーファウル or ノーポケット → AIターン
                 └→ PLAYER_AIMING  AIファウル → プレイヤーBIH取得 → PLAYER_BIH
     └→ AI_THINKING    AIターン：0.5-1s演出後にショット計算・実行
         └→ SIMULATING  (→ RESULT_CHECK 同上)
GAME_OVER
 └→ IDLE               リスタート
```

### データフロー

```
MouseEvents
  │ NDC座標 → Raycaster → tablePlane(y=0) 交点
  ▼
InputHandler
  │ drag vector / click position
  ├→ DragShot.endDrag()     → velocity (Vector2D)
  └→ BallInHand.confirm()   → position (Vector2D)
         │
         ▼
    Game.executeShot / executeBIH
         │
         ▼
    PhysicsEngine (120Hz fixed step)
    ├─ step(): Collision.resolveCircleCircle()
    │          → CollisionLog.record(ballId) [手玉接触のみ]
    ├─ step(): Collision.resolveCircleWall()
    └─ step(): PocketDetector.check() → BallManager.pocket(id)
         │
         │ physicsState[].pos
         ▼
    CoordinateSystem.physicsToThree(x, z)
         │ { x, y: BALL_RADIUS, z }
         ▼
    BallMesh[].position.set(...)  →  renderer.render(scene, camera)
         │
         │ (after isSettled())
         ▼
    RulesEngine.evaluateShot(collisionLog, pocketedBalls)
         │ { foul, foulType, winner, respotNine }
         ▼
    GameState.transition() → HUD / FoulNotification / GameOverScreen
```

### 主要物理定数

| 定数 | 値 | 備考 |
|---|---|---|
| TABLE_W | 2.54 m | WPA規格 |
| TABLE_H | 1.27 m | WPA規格 |
| BALL_RADIUS | 0.028575 m | 直径57.15mm |
| PHYSICS_HZ | 120 | dt = 1/120 ≈ 0.00833s |
| E_BALL | 0.95 | ボール–ボール反発係数 |
| E_WALL | 0.80 | ボール–クッション反発係数 |
| DECEL | 0.118 m/s² | MU_ROLL(0.012) × g(9.81) |
| REST_THRESH | 0.005 m/s | スナップ停止閾値 |
| MAX_SPEED | 8.0 m/s | トンネリング防止キャップ |
| POCKET_RADIUS | 0.057 m | 実寸~57mm |
| SOLVER_ITER | 8 | 多体衝突反復回数 |
| SLOP | 0.001 m | 位置補正の浸透許容値（depenetration slop） |

ポケット座標（テーブル中心が原点）:
- コーナー: (±1.22, ±0.59)
- サイド: (0, ±0.59)

ラックフットスポット: z = +0.25

### AIショット計算スケッチ

```
findDirectShot(cueBall, target, activeBalls):
  direction = target.pos - cueBall.pos
  baseAngle = atan2(direction.z, direction.x)
  hits = raycast(cueBall.pos, baseAngle, activeBalls)
  return { valid: hits[0].id === target.id, angle: baseAngle }

findBankShot(cueBall, target, activeBalls):
  for rail in [TOP, BOTTOM, LEFT, RIGHT]:
    virtualTarget = mirror(target.pos, rail)
    bankAngle = atan2(virtualTarget.z - cueBall.z, virtualTarget.x - cueBall.x)
    if raycast(cueBall.pos, bankAngle, activeBalls).hits(target):
      return { valid: true, angle: bankAngle }

addError(baseAngle, cueBall, target):
  tolerance = atan2(BALL_RADIUS, distance(cueBall, target))
  errorRange = tolerance * 0.5
  return baseAngle + (Math.random() * 2 - 1) * errorRange
```

## Implementation Units

---

- [ ] **Unit 1: プロジェクト初期化・定数・座標系**

**Goal:** Vite + Three.js 環境を構築し、ゲーム全体が依存する定数と 2D–3D 座標マッピングを確立する

**Requirements:** R14（Three.js 基盤）、R11（物理-レンダー連携）

**Dependencies:** なし

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.js`（エントリポイント、後のユニットで拡張）
- Create: `src/constants.js`
- Create: `src/utils/Vector2D.js`
- Create: `src/scene/CoordinateSystem.js`
- Test: `src/utils/Vector2D.test.js`
- Test: `src/scene/CoordinateSystem.test.js`

**Approach:**
- `npm create vite@latest . -- --template vanilla` 後に `npm install three` と `npm install -D vitest jsdom`
- `vite.config.js`: `test: { environment: 'jsdom' }` のみ追加
- `constants.js`: 物理定数（TABLE_W/H, BALL_RADIUS, E_BALL, E_WALL, DECEL, REST_THRESH, MAX_SPEED, POCKET_RADIUS, SOLVER_ITER, PHYSICS_HZ, FIXED_DT）、ポケット座標配列、ラックフットスポット、ボール色マップをまとめる。他モジュールは全てここから import
- `Vector2D.js`: `x`, `z` プロパティを持つクラス（y 軸なし）。`add`, `sub`, `scale`, `dot`, `normalize`, `length`, `distanceTo`, `clone` を実装。ゼロベクトルの normalize は (0,0) を返す（NaN 防止）
- `CoordinateSystem.js`: `physicsToThree(x, z)` → `{ x, y: BALL_RADIUS, z }`、`threeToPhysics(x, z)` → `{ x, z }`（スケール 1:1）

**Test scenarios:**
- Happy path: `new Vector2D(1,2).add(new Vector2D(3,4))` → `{ x:4, z:6 }`
- Happy path: `new Vector2D(3,4).normalize().length()` ≈ 1.0
- Edge case: `new Vector2D(0,0).normalize()` → `{ x:0, z:0 }`（NaN にならない）
- Happy path: `physicsToThree(1.0, 0.5)` → `{ x:1.0, y: BALL_RADIUS, z:0.5 }`
- Happy path: `threeToPhysics(physicsToThree(x,z).x, physicsToThree(x,z).z)` → 元の `(x,z)` と一致

**Verification:**
- `npm run dev` でブラウザに空ページが表示される
- `npm run test` でユニット 1 のテストが全パス

---

- [ ] **Unit 2: 2D 物理エンジン**

**Goal:** 固定ステップ物理ループ、弾性衝突、転がり摩擦、ポケット検出、衝突イベントログを実装する

**Requirements:** R1（ボール構成）、R2/R4（ファウル判定の基盤）、R11（物理ループ）

**Dependencies:** Unit 1

**Files:**
- Create: `src/physics/CollisionLog.js`
- Create: `src/physics/Collision.js`
- Create: `src/physics/PocketDetector.js`
- Create: `src/physics/PhysicsEngine.js`
- Test: `src/physics/Collision.test.js`
- Test: `src/physics/CollisionLog.test.js`
- Test: `src/physics/PocketDetector.test.js`

**Approach:**

**CollisionLog**: ショット開始から終了までの手玉接触ログ
- `start()`: 配列クリア（`applyImpulse` 呼び出し時に実行）
- `record(ballId, step)`: 手玉が ballId のボールに接触したとき追記。同一ショット内で同じ ballId の重複エントリは無視
- `getFirstContact()`: 配列先頭の ballId。空なら null（未接触 = ファウル）

**Collision**: 衝突数学ライブラリ（純粋関数群）
- `resolveCircleCircle(ballA, ballB, collisionLog, isCueBall)`:
  1. `d = distance(A, B)`、`d < 2*BALL_RADIUS` で接触判定
  2. 位置補正: `overlap = 2R - d`、`correction = (overlap - SLOP) * 0.8 / 2`（SLOP=0.001m）。両球を法線方向へ押し離す
  3. 速度インパルス: `dvn = dot(velB - velA, normal)`、`dvn >= 0` なら skip（分離中）、`j = -(1+E_BALL) * dvn / 2`、両球に適用
  4. `isCueBall=true` の場合 `collisionLog.record(ballB.id, step)` 呼び出し
- `resolveCircleWall(ball)`: 4 辺境界チェック。超えた場合は位置クランプ + `vel *= E_WALL` で符号を反転

**PocketDetector**:
- `check(ball, pockets)`: `distSq < POCKET_RADIUS²` なら `{ pocketed: true, pocketId }` を返す（平方根を使わない）

**PhysicsEngine**: ゲームループから呼ばれるメインコントローラー
- `balls[]`: 全ボールの物理状態 `{ id, pos: Vector2D, vel: Vector2D, isActive }`
- `step(dt)` のフロー（この順序が重要）:
  1. 全アクティブボールに転がり摩擦適用 → 速度キャップ（MAX_SPEED）
  2. 位置統合: `pos += vel * dt`（前ステップ位置も保存：補間用）
  3. 壁衝突解決
  4. ボール間衝突解決（iterative impulse solver, SOLVER_ITER=8 回反復）
  5. ポケット検出 → `pocketedThisStep[]` に積み上げ、activeリストから除去
- `update(elapsedMs)`: アキュムレータパターン。`accumulator` に加算、FIXED_DT ごとに `step` 実行。MAX_CATCHUP=0.25s でクランプ
- `isSettled()`: 全アクティブボールの速度 < REST_THRESH
- `applyImpulse(cueBallId, vx, vz)`: `collisionLog.start()` 呼び出し後にインパルス適用

**Test scenarios:**
- Happy path: 等質量 2 球の正面衝突で速度が完全交換される（弾性）
- Happy path: 45 度掠め衝突で進行方向が適切に変化
- Edge case: 重なって置かれた 2 球が 1 ステップで離れる（depenetration）
- Happy path: 壁衝突で X 速度が反転し Z 速度は E_WALL 倍で維持される
- Happy path: 速度が REST_THRESH 以下で厳密にゼロになる（オーバーシュートなし）
- Happy path: `CollisionLog.getFirstContact()` が最初に接触した ballId を返す
- Edge case: 手玉が 1 ステップで 2 球に接触した場合、CollisionLog に先に処理された方のみ記録される
- Happy path: ボールが POCKET_RADIUS 以内でポケット判定される
- Edge case: ボールが POCKET_RADIUS+0.001m の距離ではポケット判定されない

**Verification:**
- 全テストパス
- PhysicsEngine 単独実行でランダム配置 10 球が 60 秒以内に停止する（無限ループしない）

---

- [ ] **Unit 3: Three.js シーン・ビジュアルアセット**

**Goal:** Three.js シーン、カメラ、ライティング、テーブル・ボールの 3D メッシュ、環境マップを構築する

**Requirements:** R14（テーブル・カメラ）、R15（ボール光沢）、R16（フェルト・クッション）、R17（ポケット）

**Dependencies:** Unit 1

**Files:**
- Create: `src/scene/SceneManager.js`
- Create: `src/scene/TableMesh.js`
- Create: `src/scene/BallMesh.js`
- Create: `src/scene/AimLine.js`

**Approach:**

**SceneManager**:
- `init(container)`: `WebGLRenderer({ antialias: true })`、`setPixelRatio(devicePixelRatio)`、`setSize`、DOM append
- `setupCamera()`: `PerspectiveCamera(45, aspect, 0.1, 100)`、`position.set(0, 2.0, 1.8)`、`lookAt(0,0,0)` → 斜め上約45度視点
- `setupLighting()`: `AmbientLight(0xffffff, 0.5)` + `DirectionalLight(0xffffff, 1.2)` を scene.add
- `setupEnvironment()`: `PMREMGenerator(renderer)` + `RoomEnvironment()` で `scene.environment` を設定。`fromScene()` 完了後に両者を `dispose()`（重要: 個別の `material.envMap` は設定不要）
- `handleResize()`: camera.aspect・updateProjectionMatrix・renderer.setSize を更新
- `startLoop(updateCallback)`: `renderer.setAnimationLoop(...)` で開始

**TableMesh**:
- テーブル台: `PlaneGeometry(TABLE_W, TABLE_H)` を `rotateX(-Math.PI/2)` で水平に配置、`MeshLambertMaterial({ color: 0x1a7c3e })`
- クッション（4辺）: `BoxGeometry` 4 本をテーブル周囲に配置、木目色 (0x8B4513)、高さ `BALL_RADIUS * 2`
- ポケット穴（6か所）: `CircleGeometry(POCKET_RADIUS)` を `y=0.001` に配置、黒色 (0x111111)。`constants.js` の POCKET_POSITIONS を参照
- `addToScene(scene)` でまとめて scene.add

**BallMesh**:
- `SphereGeometry(BALL_RADIUS, 32, 32)` + `MeshStandardMaterial({ roughness: 0.05, metalness: 0.0, envMapIntensity: 1.5 })`
- `createBallMesh(ballId)`: ballId に応じた色（constants.js の BALL_COLORS 参照）でマテリアルを作成して返す
- 手玉(id=0): 白 (0xffffff)、1-9 番は各色

**AimLine**:
- `BufferGeometry().setFromPoints([start, end])` で 2 点を初期化
- `LineBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true })`
- y 座標は `BALL_RADIUS + 0.005`（z-fighting 防止）
- `update(sx, sz, ex, ez)`: `position.setXYZ(0, sx, y, sz)` / `setXYZ(1, ex, y, ez)` 後に `needsUpdate = true`
- `setVisible(bool)`: `line.visible` 切り替え
- *注: `calculateEndPoint(cueBallPos, direction, activeBalls, tableBounds)` メソッドは Unit 5 で追加される（2D レイキャスト。Unit 3 時点では未実装）*

**Patterns to follow:**
- Three.js `three/addons/` パスからの import（旧 `examples/jsm` は使用しない）

**Test expectation: none** — ビジュアル確認はブラウザで目視

**Verification:**
- `npm run dev` でテーブル（緑）、クッション（茶）、ポケット（黒丸）、ボール（光沢球）が表示される
- ボールに環境反射が見える（PMREMGenerator 効果の確認）

---

- [ ] **Unit 4: ゲーム状態管理・ルールエンジン**

**Goal:** ターン管理、ファウル判定、勝利判定、ラック配置、ボール配列管理を実装する

**Requirements:** R1-R7（ルール・フロー全般）

**Dependencies:** Unit 2

**Files:**
- Create: `src/game/GameState.js`
- Create: `src/game/BallManager.js`
- Create: `src/game/RulesEngine.js`
- Create: `src/game/RackSetup.js`
- Test: `src/game/RulesEngine.test.js`
- Test: `src/game/RackSetup.test.js`
- Test: `src/game/BallManager.test.js`

**Approach:**

**GameState**:
- 状態定数（文字列）: `IDLE, RACK, PLAYER_AIMING, PLAYER_BIH, SIMULATING, RESULT_CHECK, AI_THINKING, GAME_OVER`
- `currentState`、`currentTurn`（`'player'` | `'ai'`）、`winner`（`null` | `'player'` | `'ai'`）
- `transition(newState)`: 状態を更新し `onStateChange(prev, next)` を呼び出す
- `onStateChange` コールバックを外部から登録可能にする

**BallManager**:
- `balls[]`: 10 ボール全ての状態 `{ id, pos: Vector2D, vel: Vector2D, isActive, isPocketed }`（`id=0` が手玉）
- `activeBalls`: `balls.filter(b => b.isActive)` を返す getter
- `pocket(ballId)`: `isPocketed=true, isActive=false` に設定
- `getTargetBall()`: `activeBalls` の中で `id >= 1` の最小 id（9 番のみ残ったら 9 を返す）
- `isNineOnTable()`: 9 番ボールが `isActive` かチェック
- `respotNineBall()`: 9 番を `pos=(0, FOOT_SPOT_Z)`（= (0, 0.25)、constants.js の FOOT_SPOT_Z を参照）に移動し `isActive=true, isPocketed=false` に戻す
- `reset(rackPositions)`: 全ボールの状態を初期化して rackPositions を適用

**RulesEngine**:
- `evaluateShot(collisionLog, pocketedThisShot, ballManager)` → `{ foul, foulType, winner, respotNine }` を返す
- 判定順序（優先度順）:
  1. 手玉がポケット → `{ foul: true, foulType: 'SCRATCH' }`
  2. `collisionLog.getFirstContact()` が null → `{ foul: true, foulType: 'NO_CONTACT' }`
  3. 先当たりが `getTargetBall()` 以外 → `{ foul: true, foulType: 'WRONG_BALL' }`
  4. ファウルで 9 番がポケットされた → `{ foul: true, foulType: 'FOUL_NINE', respotNine: true }`
  5. 有効ショットで 9 番がポケットされた → `{ foul: false, winner: currentTurn }`
  6. ファウルなし・通常結果 → `{ foul: false, pocketedCount: n }`
- `isValidBIHPosition(pos, activeBalls)`: 境界チェック + 全 activeBalls との重複チェック

**RackSetup**:
- `generatePositions()`: ダイヤモンド 9 ポジションを計算して返す
  - ラック中心: `(0, FOOT_SPOT_Z)` = `(0, 0.25)`
  - 行間隔 `ROW_DX = BALL_RADIUS * √3 ≈ 0.04949m`、`ROW_DZ = BALL_RADIUS * 2 ≈ 0.05715m`
  - 行 0（先頭）: 1 球、行 1: 2 球、行 2: 3 球（中央）、行 3: 2 球、行 4: 1 球
  - 位置 0（先頭）に 1 番固定、位置 4（行 2 の中央）に 9 番固定
  - 残り 7 ポジションに 2-8 番をシャッフルして割り当て

**Test scenarios:**
- Happy path: 有効ショット（正しい先当たり、ポケットなし）→ `foul=false, winner=null`
- Error path: 手玉ポケット → `foul=true, foulType='SCRATCH'`
- Error path: 未接触 → `foul=true, foulType='NO_CONTACT'`
- Error path: 間違いボール先当たり → `foul=true, foulType='WRONG_BALL'`
- Happy path: 有効ショットで 9 番ポケット → `winner` が `currentTurn` と一致
- Happy path: ファウルショットで 9 番ポケット → `foul=true, respotNine=true, winner=null`
- Happy path: `RackSetup` で 1 番が先頭、9 番が中央（ポジション 4）にある
- Happy path: `RackSetup` を 10 回実行して毎回異なるシャッフル結果になる（確率的テスト）
- Edge case: BIH 位置チェックで別ボールとの重複 → invalid
- Edge case: BIH 位置チェックでテーブル境界外 → invalid

**Verification:**
- 全テストパス
- RulesEngine が全 6 ファウルタイプを正しく識別する

---

- [ ] **Unit 5: プレイヤー入力システム**

**Goal:** ドラッグ＆リリースショット、エイムライン更新、ボール・イン・ハンド配置を実装する

**Requirements:** R8（ドラッグ操作）、R9（エイムライン）、R10（BIH 配置）

**Dependencies:** Unit 1-4（InputHandlerが GameState.currentState を参照してドラッグ/BIHを切り替えるため Unit 4 に依存する）

**Files:**
- Create: `src/input/InputHandler.js`
- Create: `src/input/DragShot.js`
- Create: `src/input/BallInHand.js`
- Modify: `src/scene/AimLine.js`（`calculateEndPoint` メソッド追加）
- Test: `src/input/DragShot.test.js`
- Test: `src/input/BallInHand.test.js`

**Approach:**

**InputHandler**:
- canvas の `mousedown`, `mousemove`, `mouseup` を管理
- `getTablePosition(event)`: `getBoundingClientRect()` でキャンバスオフセット補正 → NDC → `Raycaster.setFromCamera()` → `ray.intersectPlane(tablePlane, target)` → `{ x, z }` を返す。交点 null の場合は null を返す
- 現在の入力モード（`GameState` から取得）に応じて DragShot / BallInHand に委譲

**DragShot**:
- `startDrag(tablePos, cueBallPos)`: tablePos が cueBall 半径内ならドラッグ開始。`dragStart` を記録
- `updateDrag(tablePos)`: `dragVector = dragStart - tablePos` 計算（cueBall からの方向 = ショット方向）。`AimLine.update()` を呼び出す
- `endDrag(tablePos)`: `dragDistance = |dragVector|`。`< MIN_DRAG_DISTANCE` ならドラッグキャンセル（null 返却）。有効なら `velocity = normalize(dragVector).scale(speed)` を返す。`speed = min(dragDistance * DRAG_SCALE, MAX_SPEED)`
- `cancel()`: エイムライン非表示

**BallInHand**:
- `activate(activeBalls, scene)`: BIH モード開始。半透明の白球ゴーストメッシュをシーンに追加
- `moveTo(tablePos, activeBalls)`: ゴーストメッシュを tablePos に移動。`isValidBIHPosition` で有効性確認 → 有効: 白、無効: 赤表示
- `confirm(tablePos, activeBalls)`: 有効なら `{ placed: true, position: tablePos }` を返す。無効なら null
- `deactivate(scene)`: ゴーストメッシュをシーンから除去

**AimLine.calculateEndPoint 追加**:
- `calculateEndPoint(cueBallPos, direction, activeBalls, tableBounds)`: 方向ベクトルに沿って壁 + 全アクティブボールとの最短交点を返す（2D レイキャスト）
- 結果を `update()` に渡してエイムラインを更新

**Test scenarios:**
- Happy path: ドラッグ距離 > MIN_DRAG_DISTANCE → 有効な velocity Vector2D を返す
- Edge case: ドラッグ距離 < MIN_DRAG_DISTANCE → null を返す（誤タップ防止）
- Happy path: 下にドラッグ → 上方向 (z 負方向) にショット方向が向く（反転確認）
- Happy path: BIH confirm が有効位置 → `{ placed: true, position }` を返す
- Edge case: BIH confirm が他ボールと重なる位置 → null を返す
- Edge case: BIH confirm がテーブル境界外 → null を返す
- Happy path: `calculateEndPoint` が壁方向に打った場合、壁の手前で終端する距離を返す
- Happy path: `calculateEndPoint` がボール方向に打った場合、そのボール表面で終端する

**Verification:**
- ブラウザでドラッグ中にエイムラインが表示され、壁またはボールで終端する
- リリースでショットが実行され、手玉が動く
- BIH モードでゴーストプレビューが表示され、無効位置は赤くなる

---

- [ ] **Unit 6: AI システム**

**Goal:** ターゲットボールへの有効ショット角度を計算し、遅延演出後にショットを実行する AI を実装する

**Requirements:** R18（AI 演出）、R19（有効ショット保証）、R20（難易度調整）

**Dependencies:** Unit 2（PhysicsEngine）、Unit 4（BallManager）

**Files:**
- Create: `src/ai/ShotCalculator.js`
- Create: `src/ai/AIPlayer.js`
- Test: `src/ai/ShotCalculator.test.js`

**Approach:**

**ShotCalculator**:
- `findDirectShot(cueBall, targetBall, activeBalls)`:
  - `dir = targetBall.pos - cueBall.pos`、`baseAngle = atan2(dir.z, dir.x)`
  - `castRay(cueBall.pos, baseAngle, activeBalls, tableBounds)` の最初のヒットが targetBall.id なら `{ valid: true, angle: baseAngle }`
  - それ以外 → `{ valid: false }`
- `findBankShot(cueBall, targetBall, activeBalls)`:
  - 4 レール（TOP/BOTTOM/LEFT/RIGHT）で virtualTarget を計算（ターゲットをレール軸にミラー）
  - 各 virtualTarget に向けた `findDirectShot` を実行
  - 最初に valid なものを返す。全部無効なら `{ valid: false }`
- `calculateTolerance(cueBall, targetBall)`:
  - `dist = distance(cueBall.pos, targetBall.pos)`
  - `return dist > 0 ? atan2(BALL_RADIUS, dist) : Math.PI / 4`（ゼロ除算防止）
- `addError(baseAngle, tolerance)`:
  - `errorRange = tolerance * 0.5`
  - `return baseAngle + (Math.random() * 2 - 1) * errorRange`
- `findBestShot(cueBall, targetBall, activeBalls)`:
  1. 直接ショット valid → `addError` 付加して返す
  2. バンクショット valid → `addError` 付加して返す
  3. フォールバック → `{ valid: true, angle: atan2(dir.z, dir.x), speed: 1.0 }`（最低速でターゲット方向へ、ファウル受容）

**AIPlayer**:
- `takeTurn(ballManager, physicsEngine, gameState, onComplete)`:
  1. GameState → AI_THINKING に遷移
  2. BIH が必要な場合: ShotCalculator で最良の手玉位置を計算してから配置
  3. `ShotCalculator.findBestShot()` でショット計算
  4. `setTimeout(600 + Math.random() * 400, ...)` で 0.6-1.0s 遅延演出
  5. `PhysicsEngine.applyImpulse()` でショット実行
  6. `onComplete()` コールバックで GameState → SIMULATING に遷移

**Patterns to follow:**
- ShotCalculator の `castRay` は Unit 5 の `calculateEndPoint` と同様のレイキャスト実装を共有または参照

**Test scenarios:**
- Happy path: cueBall と targetBall が直線上（障害物なし）→ `findDirectShot` が `valid=true` を返す
- Error path: 別ボールが cueBall と targetBall の間 → `findDirectShot` が `valid=false`
- Happy path: 直接ショット不可でレール反射後に targetBall を狙えるケース → `findBankShot` が有効角度を返す
- Happy path: `addError` の戻り値が `|result - baseAngle| <= errorRange` の範囲内
- Edge case: `calculateTolerance` で distance=0 のとき NaN でなく有効な数値を返す
- Happy path: `findBestShot` が全ケースで non-null を返す（詰まり防止）

**Verification:**
- AI が毎ターン必ずショットを実行し、ゲームが永遠に続かない
- AI のショットが人間らしい不完全さを持つ（ときどきミスする）

---

- [ ] **Unit 7: ゲームループ統合**

**Goal:** 物理エンジンと Three.js シーンを繋ぎ、ターン進行・状態遷移・リスタートを一体化する

**Requirements:** R6（ターン交代）、R11（シミュレーションロック）、R3-R4（勝敗・ファウル遷移）

**Dependencies:** Unit 1-6 全て

**Files:**
- Create: `src/game/Game.js`
- Modify: `src/main.js`（Game の初期化・起動）

**Approach:**

**Game**:
- `init(container)`: SceneManager、PhysicsEngine、BallManager、RulesEngine、AIPlayer、各 UI コンポーネントを初期化。InputHandler をセットアップして PlayerInput コールバックを登録
- `startGame()`: RackSetup.generatePositions() → BallManager.reset() → Three.js のボールメッシュを生成・シーンに追加 → GameState = RACK → PLAYER_AIMING
- Three.js `animationLoop(delta)` 内のフロー:
  1. `physicsEngine.update(deltaMs)` を呼び出す
  2. `syncBallMeshes()`: アクティブボールの Three.js メッシュを physics pos に同期（`CoordinateSystem.physicsToThree` を使用）
  3. ポケットされたボールのメッシュを `visible=false` にする
  4. `state === SIMULATING && physicsEngine.isSettled()` → `onSimulationComplete()` を一度だけ呼び出す（`settledHandled` フラグで二重呼び出し防止）
- `onSimulationComplete()`:
  - `result = RulesEngine.evaluateShot(collisionLog, pocketedThisShot, ballManager)`
  - `if (result.respotNine)`: 9 番リスポット + Three.js メッシュの visible 復元
  - `if (result.winner)`: GameState → GAME_OVER、GameOverScreen.show(result.winner)
  - `if (result.foul)`:
    - 現在ターンが 'player': FoulNotification.show() → 2s 後に AIPlayer.takeTurn()
    - 現在ターンが 'ai': FoulNotification.show() → 2s 後に GameState → PLAYER_BIH
  - ファウルなし・9 番ポケット成功で継続: 同ターンで PLAYER_AIMING or AI_THINKING へ
  - ファウルなし・ノーポケット: ターン交代
- `executePlayerShot(velocity)`: CollisionLog.start()、PhysicsEngine.applyImpulse()、GameState → SIMULATING
- `executeBIH(position)`: BallManager の手玉 pos を更新、Three.js メッシュも同期
- `restart()`: 全ボールをリセット、Three.js メッシュを再生成、GameState → RACK → PLAYER_AIMING

**Test scenarios（状態遷移ロジック – PhysicsEngine と SceneManager をモックして実行）:**
- Happy path: プレイヤーがポケットなしショット → `onSimulationComplete()` 後に `currentTurn === 'ai'` に切り替わる
- Happy path: プレイヤーファウル → `onSimulationComplete()` 後に `GameState` が `PLAYER_BIH` に遷移する（AIがBIH取得）
- Happy path: 9番ボールを有効ショットでポケット → `GameState` が `GAME_OVER`、`winner === 'player'`
- Happy path: ファウルショットで9番ポケット → `BallManager.isNineOnTable()` が true に戻る（リスポット確認）
- Edge case: `isSettled()` が true になった次フレームで `onSimulationComplete()` が再度呼ばれない（`settledHandled` フラグ確認）
- Happy path: `restart()` 後に全ボールの `isActive === true` かつ新しいラック位置が設定されている

**Verification:**
- ゲームが最初から最後まで完走し、勝敗画面が正しく表示される
- ファウル時にターンが適切に切り替わる
- リスタートで新しいラック配置が生成される

---

- [ ] **Unit 8: HUD・UI コンポーネント**

**Goal:** ターン表示、ターゲットボール番号、ファウル通知、勝敗オーバーレイを実装してゲームを完成させる

**Requirements:** R7（勝敗画面）、R12（ファウル通知）、R13（HUD）

**Dependencies:** Unit 4-7

**Files:**
- Create: `src/ui/HUD.js`
- Create: `src/ui/FoulNotification.js`
- Create: `src/ui/GameOverScreen.js`
- Modify: `index.html`（UI HTML 構造を追加）
- Modify: `src/main.js`（UI の初期化・イベントバインド）
- Test: `src/ui/FoulNotification.test.js`

**Approach:**

**index.html の構造**:
- `canvas` は `position: absolute; z-index: 0`
- `div#ui-overlay` は `position: absolute; top:0; left:0; width:100%; height:100%; pointer-events: none; z-index: 1`
  - `div#hud`（左上コーナー）: `span#turn-indicator` + `span#target-ball`
  - `div#foul-notification`（中央上、初期 hidden）
  - `div#game-over-screen`（中央、初期 hidden）: `h2#result-message` + `button#restart-btn`（`pointer-events: auto`）

**HUD**:
- `update(turn, targetBallId)`: DOM テキスト更新
  - turn='player' → 「あなたのターン」、turn='ai' → 「AI のターン」
  - targetBallId → `${targetBallId} 番を狙え`

**FoulNotification**:
- `FOUL_MESSAGES` マップ: `{ SCRATCH: '手玉落ち', NO_CONTACT: '空振り', WRONG_BALL: '先当たり違反', FOUL_NINE: '9番ファウル（リスポット）' }`
- `show(foulType)`: `clearTimeout(this._timer)` で既存タイマーをキャンセル後、対応メッセージを DOM に設定して visible。`this._timer = setTimeout(() => this.hide(), 2000)` で自動非表示
- `hide()`: 要素を非表示

**GameOverScreen**:
- `show(winner)`: winner='player' → 「あなたの勝ち！」、winner='ai' → 「AI の勝ち」を表示、オーバーレイを visible
- `hide()`: 非表示
- `#restart-btn` の click イベントで `Game.restart()` を呼び出す

**Test scenarios（FoulNotification）:**
- Happy path: `show('WRONG_BALL')` 後に要素が visible かつメッセージが「先当たり違反」
- Happy path: `show()` 呼び出し後 2000ms で要素が hidden になる
- Happy path: `hide()` 呼び出しで即座に hidden になる
- Edge case: `show()` を 2 回連続で呼んだ場合、タイマーがリセットされて最後の呼び出しから 2000ms 後に hide される

**Verification:**
- HUD に現在のターンとターゲットボール番号が常時表示される
- ファウル時に種別メッセージが 2 秒間表示されてから消える
- 勝敗時にオーバーレイが表示され、リスタートボタンで新ゲームが始まる

---

## System-Wide Impact

- **Interaction graph:** `PhysicsEngine → PocketDetector → BallManager`、`PhysicsEngine → CollisionLog → RulesEngine`。CollisionLog は PhysicsEngine と RulesEngine が共有する単一インスタンス
- **Error propagation:** PhysicsEngine は例外を投げない設計（速度 NaN を 0 にスナップ）。RulesEngine の `evaluateShot` は全ケースを網羅し、想定外の状態でも `{ foul: false }` を返す
- **State lifecycle risks:** SIMULATING 中に `isSettled()` が true になった直後に `onSimulationComplete()` が複数フレームで呼ばれないよう `settledHandled` フラグで保護する必要がある
- **API surface parity:** CollisionLog の単一インスタンスを PhysicsEngine と RulesEngine の両方に注入して整合性を保つ。ショットごとに `start()` で確実にリセットする
- **Integration coverage:** Unit 7 の目視テストが物理→衝突ログ→ルール→状態遷移の結合を検証する。Unit 2・4 の自動テストが各レイヤーの正確性を担保する

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 物理トンネリング（高速ショット） | MAX_SPEED=8 m/s キャップ + 固定 120Hz ステップで完全防止 |
| ラック初期重複（浮動小数点誤差） | RackSetup で理論計算後、微小ギャップ（1e-6m）を追加して重複を防ぐ |
| AI が詰まって無限ループ | `findBestShot` のフォールバックが常に non-null を保証 |
| Three.js 環境マップなしで球が黒く表示 | `SceneManager.init()` 内で `setupEnvironment()` を必ず `setupLighting()` の後に実行する |
| `onSimulationComplete` の二重呼び出し | `settledHandled` フラグで 1 ショット 1 回のみ実行を保証 |
| タブ非アクティブ後の物理暴走 | MAX_CATCHUP=0.25s クランプで保護 |
| 9 番リスポット先が他ボールと重複 | リスポット時に重複チェックを行い、占有されている場合は最近傍の有効位置にオフセット |
| WebGL 性能不足（統合グラフィックス）| MeshStandardMaterial + envMap + ShadowMap の同時使用は統合 GPU で 60fps を下回る可能性あり。影（shadowMap）はデフォルト無効にし、性能懸念がある場合は `MeshLambertMaterial` へのフォールバックを検討 |
| requestAnimationFrame の変動 dt | Three.js `clock.getDelta()` でフレーム間時間を取得しアキュムレータに渡す。MAX_CATCHUP=0.25s クランプでスパイクを吸収 |

## Sources & References

- **Origin document:** [docs/brainstorms/web-9ball-billiard-requirements.md](docs/brainstorms/web-9ball-billiard-requirements.md)
- Three.js r152+: PMREMGenerator, MeshStandardMaterial, Raycaster, Line API — threejs.org/docs
- 物理演算: 弾性衝突インパルス計算、アキュムレータパターン（Glenn Fiedler "Fix Your Timestep"）
- WPA 規格: ボール直径 57.15mm、テーブル寸法 2540×1270mm
