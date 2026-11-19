---
name: ai-texture-fix
description: AI 生成贴图的法线/四通道PBR 检验、修复与增强。当用户提到法线贴图无效/对不上/加强、去 AI 颗粒、生成配对法线、PBR 打包、材质错配排查时使用。覆盖本项目 Cocos Creator 资源（prefab→FBX→userData.materials 链路）。
---

# AI 贴图法线与 PBR 修复

本项目大量使用 AI 生成的贴图，"法线贴图"多数是法线风格图（无效数据），四通道 PBR 也常带噪声。完整方法论与踩坑记录见 `docs/法线贴图修复指南.md`（必读），本技能提供可执行的脚本工具箱。

## 第一步：检验（永远先做）

`scripts/scan_normal_maps.py` 扫描全库法线有效性（R/G≈0.5、B≈0.95+、单位化 >80% 为有效）。

已确认对齐/符号问题时，用 `scripts/check_hatchery_align.py`（改路径）做坡度场带符号互相关：直接对照应显著为正，翻转对照应 ≈0。

## 第二步：按场景选修复脚本

| 场景 | 脚本 | 要点 |
|---|---|---|
| 批量修复 17 张清单内法线 | `blender_fix_all_normals.py` + `build_fix_manifest.py` | 清单 JSON 由 prefab 扫描生成；三种颜色源情况见指南第二节 |
| 单张按颜色生成（有模型） | `scripts/gen_hatchery_normals2.py` 模式 | Blender 导 FBX 算 world_per_uv 几何标定 |
| 单张独立贴图（无模型引用） | `gen_objects02_maps.py` | 坡度归一 0.5；RGBA 先合成中性灰防镂空假坡度 |
| 苔蔓法线重生成 | `gen_moss_normal_analytic.py` | 高度源=去噪图 r=1 + unsharp；符号约定 OpenGL 标准 |
| PBR 四通道重打包 | `regen_moss_pbr.py` | R=metallic0, G=roughness `0.92-0.07*lum`, B/A 预留 |
| 颜色图去 AI 颗粒 | `denoise_bilateral.py` | numpy 双边滤波 9x9；Blender 合成器/OIDN 都不可用（指南第六节） |
| "加强法线效果" | `scan_building_materials.py` 扫描 → `boost_building_normals.py` 改配置 | 128→1024 兄弟文件 + normalStrength=3，双管齐下 |
| 保 uuid 换格式/尺寸 | `morph_normal_to_jpeg.py` 模式 | 改 meta 的 files 字段但 uuid 不动，引用零改动 |

## 铁律

1. **高度场必须低通**后再做坡度校准（r 越小越细，r=1 为极限，再小是残余噪声）
2. **缩小法线必须重归一化**（LANCZOS 后逐像素 `v/|v|`），否则坡度变缓
3. 解析法符号（PIL 行 0=顶部）：`R = -dH/dx, G = +dH/dy_down`；Blender 烘焙管线符号不可控，别用
4. 部署覆盖原文件保 uuid；JPEG 用 quality=95 + subsampling=0
5. CDN 上的贴图运行时会覆盖本地，CDN 不修就白修

## 部署

修好的 2048 CDN 上传件在 `.CodeBuddyTemp/上传CDN_*.png`；原图备份在 `.CodeBuddyTemp/备份_原法线贴图/`。
