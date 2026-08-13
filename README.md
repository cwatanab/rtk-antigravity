# rtk-antigravity

[RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) を [Google Antigravity](https://antigravity.google) プラグインとして統合するリポジトリ。

`agy plugin install` で導入すると、エージェントが実行するシェルコマンドを自動的に `rtk <cmd>` 形式へ書き換え、LLM コンテキストへ届く bash 出力を最大 90% 削減する。

## インストール

### 前提条件

1. **rtk 本体**:

```bash
# Homebrew (macOS/Linux)
brew install rtk

# Cargo
cargo install --git https://github.com/rtk-ai/rtk

# インストール確認
rtk --version  # "rtk 0.x.x" が表示されるはず
rtk gain       # トークン節約統計が表示されるはず
```

2. **JavaScript ランタイム**:
- [Bun](https://bun.sh)（**推奨**: プロセス起動が極めて高速なためフック実行のオーバーヘッドを最小化できます）
- または [Node.js](https://nodejs.org) (v18+)
  - デフォルトでは `bun` で実行する設定になっています。Node.js を使用する場合は `hooks.json` の `"command"` を `"node ./hooks/pre-tool-use.js"` に変更してください。

### プラグインのインストール

```bash
agy plugin install https://github.com/cwatanab/rtk-antigravity.git
```

### アンインストール

```bash
agy plugin uninstall rtk-antigravity
```

## 機能

### PreToolUse フック

エージェントが `run_shell_command` ツールでシェルコマンドを実行しようとすると、フックが介入して `rtk rewrite <cmd>` を呼び出す。書き換えが必要なコマンドは自動的に `rtk <cmd>` 形式に変換される。

```
エージェント: "git status" を実行
  → フック: rtk rewrite "git status" → "rtk git status"
  → エージェント: "rtk git status" を実行（出力が最大 80% 削減）
```

rtk が未インストールの場合や書き換え不要なコマンドは透過的にスルーするため、動作が止まることはない。

### 対応コマンド

| カテゴリ | 例 | 削減率 |
|----------|-------|--------|
| テスト | cargo test, pytest, go test, jest, vitest, playwright | 90–99% |
| ビルド | cargo build, npm/pnpm build, dotnet build | 70–90% |
| VCS | git status/log/diff/show/push | 70–80% |
| 型チェック | tsc, mypy | 80–83% |
| Lint | eslint, ruff, clippy, golangci-lint | 80–85% |
| ファイル操作 | ls, find, grep, cat, head, tail | 60–75% |
| インフラ | docker, kubectl, aws, terraform | 75–85% |

## リポジトリ構成

```
rtk-antigravity/
├── plugin.json          # Antigravity プラグイン識別子
├── hooks.json           # フック登録設定 (Bun / Node.js 実行)
└── hooks/
    └── pre-tool-use.js  # PreToolUse フック (Bun / Node.js 両対応)
```

## 動作の仕組み

```
agy plugin install
  → plugin.json を認識してプラグインとして登録
  → hooks.json の PreToolUse フックを Antigravity に登録

エージェントがコマンドを実行するたびに
  → pre-tool-use.js が起動 (bun または node)
  → rtk rewrite <cmd> でコマンドを最適化
  → 最適化済みコマンドをエージェントに返す
```

## トラブルシューティング

### rtk が見つからない

```bash
rtk --version  # "rtk 0.x.x" が表示されるか確認
```

表示されない場合は rtk 本体のインストールが必要。`rtk gain` が失敗する場合は同名の別パッケージ ([reachingforthejack/rtk](https://github.com/reachingforthejack/rtk)) が入っている可能性がある。

### コマンドが書き換えられない

1. `rtk rewrite "git status"` を手動で実行して動作確認
2. `rtk gain` でトークン削減統計を確認
3. `agy plugin list` でプラグインが有効か確認

### 特定コマンドを rtk 経由にしたくない

```bash
# 1コマンドだけ無効化
RTK_DISABLED=1 git status

# 永続的に除外 (~/.config/rtk/config.toml)
exclude_commands = ["git push"]
```

## 関連リンク

- [rtk-ai/rtk](https://github.com/rtk-ai/rtk) — RTK 本体
- [Google Antigravity](https://antigravity.google) — Antigravity 公式サイト
- [Antigravity Plugins ドキュメント](https://antigravity.google/docs/plugins) — プラグイン仕様

## ライセンス

MIT
