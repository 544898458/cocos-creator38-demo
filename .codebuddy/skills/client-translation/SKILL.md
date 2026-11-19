---
name: client-translation
description: 检查或补齐即时战略指挥客户端的 Excel 翻译键。适用于 assets/翻译 下的简体中文和英文翻译工作簿的增补、一致性质检和未翻译排查，不用于服务器配置或 YAML 导出。
---

# 客户端翻译表

客户端翻译源位于：

- `assets/翻译/zh-Hans-CN.xlsx`
- `assets/翻译/en-US.xlsx`

两个工作簿各有一个同名工作表，列固定为：`key`、`sourceValue`、`targetValue`。完整体系约定见 `docs/翻译与本地化指南.md`（含 key 命名、格式化占位符、prefab 中 L10nLabel 的 key 引用）。

## 工作方式

1. 用 `scripts/check_translation_gaps.py` 做一致性质检，一次输出三类报告：英文缺失的 key、targetValue 仍是中文的未翻译行、英文多出的 key
2. 补充缺失键时，先用 key 全库搜索（`.ts + .prefab + .scene + .mtl`）确认是否在用——L10nLabel 的 key 存在 prefab 里，只搜代码会漏报
3. 缺失时只在各自工作表末尾追加一行：
   - 简体中文：`key` 为键名，`sourceValue` 和 `targetValue` 都填中文
   - 英文：`key` 为同一键名，`sourceValue` 填中文原文，`targetValue` 填英文翻译
4. 用 openpyxl（`python -X utf8`）读写 `.xlsx`，保存后用质检脚本复检（必须 0 缺失 0 未翻译），防止重复行

## 边界

- 不修改服务器 `表/单位.xlsx` 的 `翻译` 页
- 不修改客户端或服务器 YAML、TypeScript、C++；用户会自行执行翻译导入（编辑器"面板=>本地化编辑器"重新导入 xlsx）
- 不改已有键的译文、顺序或其他工作表，只补充明确缺失的键
- 若只要求检查，报告两个工作簿是否存在该键，不写入文件

## 脚本

- `scripts/check_translation_gaps.py` — 中英表一致性质检（缺失/未翻译/多余）
- `scripts/check_key_usage.py` / `check_key_usage2.py` — 检查 key 在代码与 prefab 中的实际引用
- `scripts/fill_en_translations.py` — 按清单批量补英文词条（改清单后执行）
