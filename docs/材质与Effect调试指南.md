# 材质与 Effect 调试指南

> Cocos Creator 3.8 材质系统调试经验：`.mtl` 与 `library` 缓存同步、effect 属性在编辑器隐藏的根因、自定义 UV 流动效果调参、测试材质清理流程、运行时 CDN 高清贴图覆盖。本文案例来自苔蔓 UV 流动材质（2026-11）。

## 一、材质源文件与 library 缓存的关系

Cocos Creator 把它们分两处存放，改动必须两边一致，否则编辑器里看到的效果和游戏里跑的效果不一样：

| 位置 | 作用 | 谁在改 |
|---|---|---|
| `assets/Scene资源/xx.mtl` | 源文件，人在编辑器里编辑的就是它 | 手工编辑 / 编辑器保存 |
| `library/<uuid前2位>/<uuid>.json` | 引擎导入缓存，运行时实际加载的 | 编辑器重新导入时从 `.mtl` 生成 |

**关键陷阱 1：属性格式不同。** 同一个 vec4 属性在两处序列化格式不一样：

- `.mtl` 源文件用数组：`"flowParams": [0.06, 0.3, 4, 1]`
- `library` 缓存用带类型标记的对象：`"flowParams": { "__type__": "cc.Vec4", "x": 0.06, "y": 0.3, "z": 4, "w": 1 }`

手写 library 缓存时按对象格式写，否则运行时反序列化可能读不出值。albedoScale 等 cc.Vec3 同理。

**关键陷阱 2：编辑器重新导入会覆盖缓存。** 编辑器打开项目或资源变动时会从 `.mtl` 重新生成 `library` 缓存。如果你只改了缓存没改源文件，重启后改动会丢失；如果源文件里某个属性编辑器不认识（见下节），重新导入还会把它从缓存里**清掉**。所以：先改 `.mtl`，再同步缓存。

## 二、effect 属性在编辑器不显示：deprecated 陷阱

**症状**：effect 里自定义了属性（如 `flowParams`），材质文件里也有值，但材质属性检查器里找不到它，改不了。

**根因**：在 `properties` 里写了 `target: <与属性同名>`，例如：

```yaml
# 错误写法：属性名和 target 都是 flowParams
flowParams: { value: [0.01, 0.05, 4, 0], target: flowParams, editor: { displayName: Flow Strength/Speed/Scale } }
```

Cocos 3.8 编译器对"属性名与 target 同名"的写法判定为废弃，编译产物 `library/aa/<effect-uuid>.json` 里该属性被加上 `"deprecated": true`，而**带这个标记的属性不会显示在材质面板上**。这也是自定义属性总被重新导入清掉的原因。

**修复**：

1. effect 源码里去掉同名 `target`，让属性名直接对应 UBO 成员名（UBO 里本来就声明了 `vec4 flowParams`）：
   ```yaml
   flowParams: { value: [0.01, 0.05, 4, 0], editor: { displayName: Flow Strength/Speed/Scale } }
   ```
2. 同步删除编译缓存 `library/aa/<effect-uuid>.json` 里两处（opaque / transparent pass）的 `"deprecated": true`。
3. 重启编辑器。属性就会显示在材质面板底部。

注意：内置标准属性（如 `albedo`、`albedoScaleAndCutoff`）带 `deprecated` 是正常的——它们通过 `mainColor`、`albedoScale` 等别名属性设置，本来就不该显示。**只有自定义属性被误标 deprecated 才需要处理。**

## 三、自定义 UV 流动 effect（苔蔓案例）

文件：`assets/Scene资源/苔蔓UV流动.effect`（effect uuid `aa9c54d7-d0df-40b3-9316-111f167b4385`）。

核心是 `flowUV()`，用 flowMap 的两个错时采样产生伪随机流动向量，叠加到基础 UV 上：

```glsl
vec2 flowUV(vec2 uv)
{
  float t = cc_time.x * flowParams.y;              // 速度
  vec2 baseUV = uv * max(flowParams.w, 1.0);       // 平铺
  vec2 scaleUV = uv * flowParams.z;                // 流动图采样尺度
  vec2 flowA = texture(flowMap, scaleUV + vec2(t, -t * 0.37)).rg * 2.0 - 1.0;
  vec2 flowB = texture(flowMap, scaleUV - vec2(t * 0.73, t)).rg * 2.0 - 1.0;
  return baseUV + (flowA + flowB) * 0.5 * flowParams.x;  // 扰动强度
}
```

`flowParams` 四个分量的含义（`[0.06, 0.3, 4, 1]` 为最终值）：

| 分量 | 名称 | 作用 | 调大效果 |
|---|---|---|---|
| `x` | Strength | UV 扰动幅度 | 蠕动更剧烈，过大贴图拉伸变形 |
| `y` | Speed | 采样坐标随时间推进速率 | 流得更快；0 静止 |
| `z` | Scale | flowMap 采样 UV 放大倍数 | 流动纹路更细碎 |
| `w` | 平铺倍数 | 基础 UV 平铺（`max(w,1)`） | 贴图重复次数变多 |

调参入口：材质面板 `Flow Strength/Speed/Scale`（修好 deprecated 后可见），或直接改 `.mtl` 的 `flowParams` 数组。effect 里 albedo / normal / pbr 三类贴图采样**都走同一个 `flowUV()`**，所以一次调整三张图同步流动。

颜色叠加用的是 `albedoScale`（RGB 乘子，映射到 `albedoScaleAndCutoff.xyz`）。苔蔓原材质值为 `[2, 0.5, 0]`，会把暗绿贴图染成棕褐色——这是原始设计意图，不是 bug。要恢复中性色改成 `[1,1,1]`。shader 里 `baseColor.rgb *= albedoScaleAndCutoff.xyz` 就是它生效的位置。

## 四、测试材质与游戏材质的引用管理

测试场景调好的参数**不会自动进入游戏**——测试和游戏通常引用两个不同的 `.mtl` 文件。排查"效果没生效"时，第一步永远是查清 prefab / 场景各自引用的 uuid。

排查方法：搜 uuid 或文件名，看谁在引用：

```
assets/测试材质.scene        → 3253863e...（场景测试专用材质）
assets/resources/建筑/苔蔓.prefab → bc9d3467...（游戏材质，名字虽带"测试"但是正式引用）
```

**删除测试资源的正确流程**（ Mistake：看到名字带"测试"就直接删，结果游戏 prefab 失去材质）：

1. 新建正式材质文件（如 `苔蔓UV流动.mtl`），分配**新 uuid**，写好 `.meta` 和 `library` 缓存
2. 更新引用方（prefab / 场景）的 uuid，**assets 源文件 + library 缓存都要改**
3. 确认旧 uuid 全项目零残留后再删除旧文件（含 `.meta` 和 `library` 缓存）
4. 临时文件在工作区外时，`delete_file` 工具会因工作区边界报错，改用 `Remove-Item -LiteralPath` 命令行删除

## 五、运行时 CDN 高清贴图覆盖本地贴图

本地 `.mtl` 里配的贴图只是低配/测试初始值。游戏运行时会把 CDN 高清图直接灌进贴图对象，覆盖本地设置——**本地修了 CDN 没修等于白修**。

两处加载代码：

| 位置 | 对象 | 贴图 |
|---|---|---|
| `assets/scripts/component/苔蔓Component.ts` 第 125-157 行 | 苔蔓 | `图片/苔蔓高强降噪2048.png`、`苔蔓法线贴图2048.png`、`苔蔓四通道PBR贴图2048.png` |
| `assets/scripts/manager/NetMessage.ts` 第 423-464 行 `handleGame_进Space` | 地图地面 | 配置 `Https高清贴图`（`配置.ts` 第 79 行）；`Https高清法线贴图` 的加载代码目前被注释 |

加载模式都是：`assetManager.loadRemote(cdn图)` → `texture.image = imageAsset`（原地替换贴图内容）→ `material.setProperty('mainTexture'/'normalMap'/'pbrMap', texture)`。

**注意**：这段代码只替换贴图，不会碰 `albedoScale`、`flowParams`、`flowMap` 等材质参数。所以调好参数后，运行时下载高清图不会让参数失效——如果"效果没生效"，查是不是引用了另一个材质（见第四节），而不是怀疑下载代码。

## 六、法线贴图生成的简易路径（无几何标定）

有模型引用时走 `docs/法线贴图修复指南.md` 的几何标定流程。没有模型/只需快速生成时，用简易法：

1. 源图转灰度当高度场，中心差分求 `sx`、`sy`
2. `n = normalize(-sx*S, +sy*S, 1)`（PIL 读图行 0 在顶部，`G = +dH/dy_down` 是 OpenGL 约定）
3. 编码 `rgb = n*0.5+0.5`，保存为 RGB PNG
4. 低分辨率版本由母版 LANCZOS 缩小，**缩小后必须逐像素重归一化** `v/|v|`，否则单位化率掉到 88%、凹凸变平

强度 `S` 的选择：先试几个值生成缩略图，对比目标法线的 RGB 标准差（有效法线 R/G 均值≈0.5、B 均值≈0.95+、标准差 10~25）。苔蔓/大理石这类中低对比度贴图 S≈12 比较接近。

新图片文件要配对 `.meta`（新图片用新 uuid，覆盖现有文件保 uuid 不换），library 缓存建一个 `cc.ImageAsset` 占位即可，编辑器重新导入会更新。

## 七、实战记录（2026-11 苔蔓 UV 流动）

- **症状链**：棕色 → 绿色 → 无蠕动 → 效果可以了但游戏里没生效。根因依次是 `albedoScale=[2,0.5,0]` 染色、贴图分辨率/平铺、flowParams 太弱、测试和游戏用了两个材质文件。
- **最终参数**：`albedoScale=[2,0.5,0]`（恢复原版棕褐色调）、`flowParams=[0.06,0.3,4,1]`。
- **清理**：删除 4 组测试资源（场景测试材质、贴图调试材质、测试场景、旧游戏测试材质），新建正式材质 `苔蔓UV流动.mtl`（uuid `d7c4a1e6-...`），prefab 引用已迁移。
- **附加**：基于 `奶白色大理石.png` 生成 `奶白色大理石法线贴图1024.png`（覆盖）和 `奶白色大理石法线贴图128.png`（新建，uuid `1774f32c-...`）。
