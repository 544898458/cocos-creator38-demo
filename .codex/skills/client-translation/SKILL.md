---
name: client-translation
description: 检查或补齐即时战略指挥客户端的 Excel 翻译键。适用于 assets/翻译 下的简体中文和英文翻译工作簿，不用于服务器配置或 YAML 导出。
---

# 客户端翻译表

客户端翻译源位于：

- `assets/翻译/zh-Hans-CN.xlsx`
- `assets/翻译/en-US.xlsx`

两个工作簿各有一个同名工作表，列固定为：`key`、`sourceValue`、`targetValue`。

## 工作方式

1. 先在两个工作簿的 `key` 列查找目标键，避免新增重复行。
2. 缺失时只在各自工作表末尾追加一行：
   - 简体中文：`key` 为键名，`sourceValue` 和 `targetValue` 都填中文。
   - 英文：`key` 为同一键名，`sourceValue` 填中文原文，`targetValue` 填英文翻译。
3. 使用 Excel COM 自动化读写 `.xlsx`，保存后重新打开核对新行，确保中文未变成乱码或问号。

## 边界

- 不修改服务器 `表/单位.xlsx` 的 `翻译` 页。
- 不修改客户端或服务器 YAML、TypeScript、C++；用户会自行执行翻译导入。
- 不改已有键的译文、顺序或其他工作表，只补充明确缺失的键。
- 若只要求检查，报告两个工作簿是否存在该键，不写入文件。
