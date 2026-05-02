# Gem Arcade

小学生高学年から中学生向けの、昔ながらのFlashゲーム風ミニゲームサイトです。

## 入っているもの

- 名前登録
- ブラウザ内スコア保存
- ゲーム別ランキング
- スコアに応じたGEM獲得
- YouTube風のゲームカード一覧
- リスト/2列グリッドの表示切替
- お気に入り登録と並び替え
- ゲーム専用ページ
- 16:9ゲーム画面の全画面表示
- Scratchで再現しやすい4つのミニゲーム

## 遊び方

`index.html` をブラウザで開くと動きます。GitHub Pagesにもそのまま置けます。

## GitHub Pagesで公開する場合

1. GitHubで新しいリポジトリを作る
2. このフォルダの `index.html`, `styles.css`, `app.js`, `README.md` をアップロードする
3. Settings > Pages > Build and deployment で `Deploy from a branch` を選ぶ
4. `main` ブランチの `/root` を公開対象にする

## 共有ランキングの注意

今のランキングは `localStorage` を使うため、同じブラウザ内だけで保存されます。
友達全員で同じランキングを見たい場合は、静的サイトだけでは足りません。

おすすめ順:

1. Firebase Firestore: 小規模なら始めやすく、GitHub Pagesと相性が良い
2. Supabase: SQLで管理したい場合に向く
3. GitHub Issues/Actions: 実験には使えるが、ゲームのランキング用途には少し重い

## GEM報酬案

- スコアに応じて基本GEMを付与
- 高スコア時だけボーナス
- 1回プレイすれば最低1GEM
- 将来的にはデイリー上限や自己ベスト更新ボーナスを追加すると健全
