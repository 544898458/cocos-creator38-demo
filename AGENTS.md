# AGENTS.md — AI 助手项目指南

本文件是所有 AI 编码工具的通用入口（Codex / Claude Code / Cursor / Copilot / CodeBuddy 等）。项目特定的经验文档和技能按以下索引使用。

## 项目概览

Cocos Creator 3.8 即时战略游戏客户端（中文标识符代码库，简体中文交流）。服务器侧配置与文本（CDN yaml、网络消息字段）**不属于客户端修改范围**。

## 经验文档（遇到相关任务先读）

| 文档 | 覆盖 |
|---|---|
| `docs/法线贴图修复指南.md` | AI 贴图的法线/PBR 生成、检验、修复、增强全流程 |
| `docs/材质与Effect调试指南.md` | `.mtl` 与 library 缓存同步、effect 属性 deprecated 陷阱、UV 流动调参、测试材质清理、运行时 CDN 贴图覆盖 |
| `docs/翻译与本地化指南.md` | 中英翻译体系（xlsx 词条、翻译Key.ts、格式化规则、一致性质检） |
| `docs/小游戏包体优化.md` | 微信小游戏 30MB 限的体积分析与瘦身 |
| `docs/文本编码规则.md` | C++ 服务器/客户端的 UTF-8/GBK 编码规范 |
| `docs/小游戏包体优化.md`、`docs/法线贴图修复指南.md`、`docs/材质与Effect调试指南.md` | 各附实战修复记录 |

## 技能（可复用的脚本工具箱 + 工作流）

技能位于 `.codebuddy/skills/`（CodeBuddy 原生加载；其他 AI 工具可直接读取其中的 `SKILL.md` 和 `scripts/`，格式是通用的 SKILL.md 规范）：

- `ai-texture-fix/` — 法线/PBR 检验修复脚本（scan/gen/check 系列）
- `client-translation/` — 翻译表质检与补齐脚本
- `wechat-package-optimize/` — 包体扫描与换格式瘦身脚本

其他入口：`.codex/`（Codex CLI 读取，内含 client-translation 技能的独立副本与编码规则副本）、`CLAUDE.md`（引用本文件）。注意：`.codex/规则/文本编码规则.md` 与 `docs/文本编码规则.md` 是同一份内容的两个存放点，**改 `docs/` 下的为主**，`.codex/` 的副本同步更新。

## 代码修改约定

1. 代码标识符、注释用中文（跟随现有风格）
2. 面向用户的字符串拼接禁止硬编码语言文字，走 `翻译Key.翻译格式化()`（详见翻译指南第四节）
3. 贴图资源修改保 uuid（改 meta 不换 uuid，引用零改动）
4. 临时产物放 `.CodeBuddyTemp/`（git 已忽略），可复用脚本沉淀进对应技能的 `scripts/`
5. 服务器下发的文本（entityName/nickName、CDN yaml）客户端原样使用，不做翻译替换
