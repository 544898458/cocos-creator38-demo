---
name: wechat-package-optimize
description: 微信小游戏包体超 30MB 时的体积分析与瘦身。当用户提到包体超限、微信小游戏体积、构建产物减肥时使用。分析 build/wechatgame-wechatgame 的体积分布并给出可执行的瘦身手段。
---

# 微信小游戏包体优化

完整结论见 `docs/小游戏包体优化.md`。核心认知：**图片侧油水很少（197 张共 4.1 MB），大头是 FBX 模型和序列化 JSON**。

## 流程

1. 用 `scripts/identify_build_files.py` 扫描 `build/wechatgame-wechatgame` 体积分布（Top 40 文件 + 全部图片合计）
2. build 内文件名是 uuid，反查 `assets/**/.meta` 得到源资产身份（脚本自带 uuid 索引）
3. 按性价比选手段：

| 手段 | 可省 | 适用 |
|---|---|---|
| 图片 PNG→JPEG | 单张 30%~80% | 法线/不带透明的贴图；q92 + subsampling=0 |
| FBX→glb 或远程加载 | MB 级 | 大地形/内嵌几何模型 |
| 去掉未用 physics 模块 | 0.45 MB | 项目没用 3D 物理时（bullet.wasm） |
| 字体子集化 | ~0.15 MB | 全量字体文件 |

## 保 uuid 换格式手法（引用零改动）

改文件内容 + 重写 meta 的 `files` 字段（如 `.png` → `.jpeg`），uuid 不变，所有引用（FBX 内嵌材质 `userData.materials`、prefab、mtl）无需改动。模板：`scripts/morph_normal_to_jpeg.py`（1.57MB→0.30MB 实战案例）。

## 注意

改完必须重新构建才能反映到包体；每次优化后重跑扫描脚本确认效果。
