# 変換. — 仮想通貨コンバーター PWA

スマホのホーム画面に追加できる、仮想通貨↔法定通貨コンバーターアプリです。

## 機能
- 300種以上の通貨に対応(仮想通貨 + 法定通貨)
- リアルタイム為替レート(fawazahmed0 Currency API)
- 手数料%の自動計算(表示通貨をFrom/Toから選択可能)
- 変換履歴の保存
- 日付・時刻のリアルタイム表示
- SNS共有(X, LINE, WhatsApp)
- PWA対応 — ホーム画面に追加してアプリのように使える
- オフラインでも起動可能

---

## 🚀 ローカルで動かす

Node.js 18以上が必要です。

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## 📦 本番ビルド

```bash
npm run build
```

`dist/` フォルダに静的ファイルが生成されます。

---

## 🌐 Vercelで公開する(推奨・無料・所要5分)

### 手順

1. **GitHubリポジトリを作成**
   - GitHubで新規リポジトリを作成(例: `crypto-converter`)
   - このフォルダの中身をpush:
     ```bash
     git init
     git add .
     git commit -m "initial commit"
     git branch -M main
     git remote add origin https://github.com/あなたのID/crypto-converter.git
     git push -u origin main
     ```

2. **Vercelにデプロイ**
   - https://vercel.com にGitHubアカウントでサインアップ
   - 「New Project」→ 先ほどのリポジトリを選択
   - Framework Preset: `Vite`(自動で検出される)
   - そのまま「Deploy」を押すだけ
   - 数十秒で `https://crypto-converter-xxx.vercel.app` のようなURLが発行されます

3. **友人にURLを送る**
   - そのURLをLINE/メッセージ等で送るだけで使ってもらえます

---

## 📱 スマホのホーム画面に追加する方法

公開したURLをスマホで開いた後、以下の操作をします。

### iPhone (Safari)
1. Safariで公開URLを開く
2. 画面下部の「共有」ボタン(□に↑のアイコン)をタップ
3. 「**ホーム画面に追加**」を選択
4. 右上の「追加」をタップ
5. ホーム画面に「変.」アイコンが追加される

### Android (Chrome)
1. Chromeで公開URLを開く
2. 右上の「⋮」(メニュー)をタップ
3. 「**ホーム画面に追加**」または「アプリをインストール」を選択
4. ホーム画面にアイコンが追加される

一度追加すれば、ネイティブアプリと同じ感覚で起動できます。URLバーも消えて全画面表示になります。

---

## 🔧 カスタマイズ

- **アプリ名を変える**: `vite.config.js` の `manifest.name` / `manifest.short_name`
- **テーマ色を変える**: `vite.config.js` の `manifest.theme_color` と `index.html` の `meta name="theme-color"`
- **アイコンを変える**: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` を差し替え
- **UIの配色**: `src/App.jsx` のTailwindクラスを編集

---

## 📄 ライセンス
個人利用・商用利用とも自由です。
