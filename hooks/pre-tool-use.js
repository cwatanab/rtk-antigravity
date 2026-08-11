#!/usr/bin/env node
// RTK PreToolUse hook for Antigravity
// コマンド実行前に `rtk rewrite <cmd>` を呼び出し、最適化されたコマンドに書き換える。
// rtk が未インストールまたは書き換え不要な場合は透過的にスルー (exit 0, no output)。

'use strict';

const { execFileSync } = require('child_process');

// stdin から JSON を読み込む
let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input);

    // run_shell_command ツール以外はスルー
    const toolName = event.tool_name || '';
    if (toolName !== 'run_shell_command') {
      process.exit(0);
    }

    const toolInput = event.tool_input || {};
    const command = toolInput.command || '';

    if (!command) {
      process.exit(0);
    }

    // rtk rewrite でコマンドを書き換え
    // 書き換え成功時は exit code 3 を返す仕様のため、throw 時も stdout を採用する
    let rewritten;
    try {
      const result = execFileSync('rtk', ['rewrite', command], {
        encoding: 'utf8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      rewritten = result.trim();
    } catch (e) {
      if (!e.stdout) {
        // rtk が未インストール、またはタイムアウト — スルー
        process.exit(0);
      }
      rewritten = String(e.stdout).trim();
    }

    // 書き換えなし (空 or 同じコマンド) の場合はスルー
    if (!rewritten || rewritten === command) {
      process.exit(0);
    }

    // Antigravity (Gemini CLI) の PreToolUse 書き換えフォーマットで出力
    const response = {
      decision: 'allow',
      hookSpecificOutput: {
        tool_input: { command: rewritten },
      },
    };

    process.stdout.write(JSON.stringify(response) + '\n');
    process.exit(0);
  } catch (_parseError) {
    // JSON パース失敗 — スルー
    process.exit(0);
  }
});
