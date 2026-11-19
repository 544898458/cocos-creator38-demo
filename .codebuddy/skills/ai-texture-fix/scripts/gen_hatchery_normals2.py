# -*- coding: utf-8 -*-
"""虫巢 Morph/Upgrade 两张 diffuse 的配对法线 (解析法, 几何标定与 Hatchery_法线贴图128 一致)"""
import bpy
import mathutils
import numpy as np

FBX = r"e:\UGit\cocos-creator38-demo\assets\mapres\一方狂三\hatcherydeath\hatchery_skin.fbx"
SRC_DIR = "e:/UGit/cocos-creator38-demo/assets/mapres/星2/hatchery/"
OUT_DIR = "e:/UGit/cocos-creator38-demo/assets/mapres/一方狂三/hatcherydeath/"
SIZE = 1024

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']

world_area = 0.0
uv_area = 0.0
diag_world = max((o.matrix_world @ mathutils.Vector(c)).length for o in meshes for c in o.bound_box)
for o in meshes:
    mw = o.matrix_world
    for p in o.data.polygons:
        vs = [mw @ o.data.vertices[vi].co for vi in p.vertices]
        for k in range(1, len(vs) - 1):
            world_area += (vs[k] - vs[0]).cross(vs[k + 1] - vs[0]).length * 0.5
    if o.data.uv_layers:
        uv = o.data.uv_layers[0]
        for p in o.data.polygons:
            uvs = [uv.data[li].uv for li in p.loop_indices]
            for k in range(1, len(uvs) - 1):
                a = uvs[k] - uvs[0]
                b = uvs[k + 1] - uvs[0]
                uv_area += abs(a[0] * b[1] - a[1] * b[0]) * 0.5

world_per_uv = (world_area / uv_area) ** 0.5
S = 0.01 * diag_world * SIZE / world_per_uv
print("world/uv %.4f diag %.4f -> S %.2f" % (world_per_uv, diag_world, S))

for name, out_name in [("HatcheryMorph_Diffuse.jpg", "Hatchery_法线贴图Morph_1024.png"),
                       ("Hatchery_Upgrade_Diffuse.jpg", "Hatchery_法线贴图Upgrade_1024.png")]:
    dimg = bpy.data.images.load(SRC_DIR + name)
    w0, h0 = dimg.size
    px = np.array(dimg.pixels[:], dtype=np.float64).reshape(h0, w0, 4)[..., :3]
    # 缩放到 SIZE (双线性, 行序保持 Blender 底前约定)
    us = (np.arange(SIZE) + 0.5) / SIZE * w0 - 0.5
    xs0 = np.clip(np.floor(us).astype(int), 0, w0 - 1); xs1 = np.clip(xs0 + 1, 0, w0 - 1); fx = us - np.floor(us)
    vs_ = (np.arange(SIZE) + 0.5) / SIZE * h0 - 0.5
    ys0 = np.clip(np.floor(vs_).astype(int), 0, h0 - 1); ys1 = np.clip(ys0 + 1, 0, h0 - 1); fy = vs_ - np.floor(vs_)
    top = px[ys0][:, xs0] * (1 - fx)[None, :, None] + px[ys0][:, xs1] * fx[None, :, None]
    bot = px[ys1][:, xs0] * (1 - fx)[None, :, None] + px[ys1][:, xs1] * fx[None, :, None]
    rgb = top * (1 - fy)[:, None, None] + bot * fy[:, None, None]
    lum = rgb @ np.array([0.299, 0.587, 0.114])

    gx = np.zeros_like(lum); gy = np.zeros_like(lum)
    gx[:, 1:-1] = (lum[:, 2:] - lum[:, :-2]) * 0.5
    gy[1:-1, :] = (lum[2:, :] - lum[:-2, :]) * 0.5
    gx[:, 0] = lum[:, 1] - lum[:, 0]; gx[:, -1] = lum[:, -1] - lum[:, -2]
    gy[0, :] = lum[1, :] - lum[0, :]; gy[-1, :] = lum[-1, :] - lum[-2, :]

    sx = -gx * S   # R = -dH/dx
    sy = -gy * S   # G = -dH/dv (bpy 行0=底部, 行=v向上)
    norm = np.sqrt(sx * sx + sy * sy + 1.0)
    n = np.stack([sx / norm * 0.5 + 0.5, sy / norm * 0.5 + 0.5, 1.0 / norm * 0.5 + 0.5], axis=-1)

    out = bpy.data.images.new("n", SIZE, SIZE, alpha=False)
    out.colorspace_settings.name = 'Non-Color'
    out.pixels = np.dstack([n, np.ones((SIZE, SIZE, 1))]).reshape(-1).tolist()
    out.filepath_raw = OUT_DIR + out_name
    out.file_format = 'PNG'
    out.save()
    a = n
    print("✓ %s  R=%.3f G=%.3f B=%.3f  平均坡度 %.3f" % (out_name, a[..., 0].mean(), a[..., 1].mean(), a[..., 2].mean(), float(np.sqrt(gx * gx + gy * gy).mean() * S)))
