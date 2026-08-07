---
name: rtk-antigravity
description: >
  RTK (Rust Token Killer) — シェルコマンドの出力を最大90%圧縮するCLIプロキシ。
  git/cargo/npm/pytest等の一般的な開発コマンドを `rtk <cmd>` に置き換えることで
  LLMコンテキストへ届くbash出力バイト数を削減する。
  rtk がインストール済みの場合、シェルコマンド実行時に自動的に使用する。
---

# RTK (Rust Token Killer)

`rtk` はシェルコマンドの出力をLLMコンテキストに届く前にフィルタリング・圧縮するCLIプロキシ。
単一のRustバイナリ、依存関係ゼロ、オーバーヘッド10ms未満。

## 基本ルール

**rtk がインストールされている場合、シェルコマンドは常に `rtk <cmd>` 形式で実行する。**

```bash
# よい例
rtk git status
rtk cargo test
rtk ls src/
rtk grep "pattern" src/
rtk docker ps

# 避ける例（rtk なし）
git status
cargo test
ls src/
```

## 対応コマンド

| カテゴリ | 例 | 削減率 |
|----------|-------|--------|
| テスト | cargo test, pytest, go test, jest, vitest, playwright | 90–99% |
| ビルド | cargo build, npm/pnpm build, dotnet build | 70–90% |
| VCS | git status/log/diff/show/push | 70–80% |
| 型チェック | tsc, mypy | 80–83% |
| Lint | eslint, ruff, clippy, golangci-lint | 80–85% |
| ファイル操作 | ls, find, grep, cat, head, tail | 60–75% |
| インフラ | docker, kubectl, aws, terraform | 75–85% |

## パススルー

rtk が未対応のコマンドは `rtk proxy <cmd>` でトークン追跡しながら実行:

```bash
rtk proxy curl https://api.example.com
rtk proxy some-custom-tool --flag
```

## 節約統計

```bash
rtk gain              # トークン削減統計
rtk gain --graph      # ASCII グラフ（30日間）
rtk discover          # 見逃した節約機会の発見
```

## インストール確認

```bash
rtk --version   # "rtk 0.x.x" と表示されるはず
rtk gain        # トークン節約統計が表示されるはず
```

`rtk gain` が失敗する場合は別の `rtk` パッケージが入っている可能性がある。
正しいバージョンは [`rtk-ai/rtk`](https://github.com/rtk-ai/rtk) (Rust Token Killer)。

## 無効化

特定コマンドをrtk経由にしたくない場合:

```bash
RTK_DISABLED=1 git status   # 1コマンドだけ無効化
```

または `~/.config/rtk/config.toml` の `exclude_commands` で永続的に除外。
