#!/usr/bin/env node
// RTK PreToolUse hook for Antigravity
// コマンド実行前に `rtk rewrite <cmd>` を呼び出し、最適化されたコマンドに書き換える。
// rtk が未インストールまたは書き換え不要な場合は透過的にスルー (exit 0, no output)。

'use strict';

const { execFileSync } = require('child_process');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    input = input.replace(/^\uFEFF/, '').trim();
    if (!input) {
      process.exit(0);
    }

    const event = JSON.parse(input);

    // Antigravity 形式と Claude Code 形式の入力を両対応
    const toolName = event.toolCall?.name || event.tool_name || event.toolName || '';
    if (toolName && !/^(run_command|run_shell_command|bash|execute_command)$/i.test(toolName)) {
      process.exit(0);
    }

    const args = event.toolCall?.args || event.tool_input || event.toolInput || {};
    let argKey = 'CommandLine';
    let command = '';

    if (typeof args.CommandLine === 'string') {
      argKey = 'CommandLine';
      command = args.CommandLine;
    } else if (typeof args.command === 'string') {
      argKey = 'command';
      command = args.command;
    } else if (typeof args.cmd === 'string') {
      argKey = 'cmd';
      command = args.cmd;
    }

    command = (command || '').trim();
    if (!command) {
      process.exit(0);
    }

    // rtk rewrite でコマンドを書き換え
    // 書き換え成功時は exit code 3 (または 0) を返し stdout に書き換え結果を出力する仕様
    let rewritten = null;
    try {
      const result = execFileSync('rtk', ['rewrite', command], {
        encoding: 'utf8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });
      rewritten = (result || '').trim();
    } catch (e) {
      if ((e.status === 3 || e.status === 0) && e.stdout) {
        rewritten = String(e.stdout).trim();
      } else {
        // rtk 未対応 (exit code 1)、未インストール、タイムアウト等のエラー時は安全に exit 0
        process.exit(0);
      }
    }

    // 書き換えなし (空 or 同じコマンド) の場合はスルー
    if (!rewritten || rewritten === command) {
      process.exit(0);
    }

    // Antigravity 形式の PreToolUse 出力
    const response = {
      decision: 'allow',
      overwrite: {
        [argKey]: rewritten,
      },
    };

    process.stdout.write(JSON.stringify(response) + '\n');
    process.exit(0);
  } catch (_err) {
    // パースエラー等の予期せぬ例外時も安全に exit 0
    process.exit(0);
  }
});

