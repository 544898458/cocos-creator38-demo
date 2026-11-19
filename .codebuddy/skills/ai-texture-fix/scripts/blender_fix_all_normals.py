# -*- coding: utf-8 -*-
"""批量修复无效法线贴图: 导入各 FBX 算 UV-世界尺度, 颜色高度场 Sobel 生成 1024 切线空间法线
(Blender 5.1 selected-to-active 失效, 用解析法等价替代)
"""
import bpy
import mathutils
import numpy as np
import json, os

ROOT = r"e:/UGit/cocos-creator38-demo"
MANIFEST = os.path.join(ROOT, ".CodeBuddyTemp", "normal_fix_manifest.json")
OUTDIR = os.path.join(ROOT, ".CodeBuddyTemp", "fix1024")
os.makedirs(OUTDIR, exist_ok=True)
SIZE = 1024

entries = json.load(open(MANIFEST, encoding="utf-8"))
print("待修复:", len(entries))

def fbx_scale(fbx_path):
    """导入 FBX 返回 (world_per_uv, diag_world, 内嵌图片列表)"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    world_area = uv_area = 0.0
    diag = 0.0
    for o in meshes:
        mw = o.matrix_world
        diag = max(diag, max((mw @ mathutils.Vector(c)).length for c in o.bound_box))
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
    wpu = (world_area / uv_area) ** 0.5 if uv_area > 1e-9 else 1.0
    embedded = [im for im in bpy.data.images if im.size[0] > 8 and im.size[1] > 8]
    return wpu, max(diag, 1e-4), embedded

def load_lum(path_or_img, size):
    """读图片亮度, 返回 (行0=底部) 的 SIZE x SIZE 亮度数组"""
    if isinstance(path_or_img, str):
        img = bpy.data.images.load(path_or_img)
    else:
        img = path_or_img
    w0, h0 = img.size
    px = np.array(img.pixels[:], dtype=np.float64).reshape(h0, w0, 4)[..., :3]
    us = (np.arange(size) + 0.5) / size * w0 - 0.5
    xs0 = np.clip(np.floor(us).astype(int), 0, w0 - 1)
    xs1 = np.clip(xs0 + 1, 0, w0 - 1)
    fx = (us - np.floor(us))[None, :, None]
    vs = (np.arange(size) + 0.5) / size * h0 - 0.5
    ys0 = np.clip(np.floor(vs).astype(int), 0, h0 - 1)
    ys1 = np.clip(ys0 + 1, 0, h0 - 1)
    fy = (vs - np.floor(vs))[:, None, None]
    top = px[ys0][:, xs0] * (1 - fx) + px[ys0][:, xs1] * fx
    bot = px[ys1][:, xs0] * (1 - fx) + px[ys1][:, xs1] * fx
    rgb = top * (1 - fy) + bot * fy
    return rgb @ np.array([0.299, 0.587, 0.114])

def sobel_normal(lum, S):
    gx = np.zeros_like(lum); gy = np.zeros_like(lum)
    gx[:, 1:-1] = (lum[:, 2:] - lum[:, :-2]) * 0.5
    gy[1:-1, :] = (lum[2:, :] - lum[:-2, :]) * 0.5
    gx[:, 0] = lum[:, 1] - lum[:, 0]; gx[:, -1] = lum[:, -1] - lum[:, -2]
    gy[0, :] = lum[1, :] - lum[0, :]; gy[-1, :] = lum[-1, :] - lum[-2, :]
    sx, sy = -gx * S, -gy * S
    norm = np.sqrt(sx * sx + sy * sy + 1.0)
    n = np.stack([sx / norm * 0.5 + 0.5, sy / norm * 0.5 + 0.5, 1.0 / norm * 0.5 + 0.5], axis=-1)
    return n, np.sqrt(gx * gx + gy * gy).mean() * S

ok = fail = 0
for ent in entries:
    name = os.path.basename(ent["normal"])
    try:
        if not ent["fbx"]:
            print("跳过(无FBX):", name)
            fail += 1
            continue
        wpu, diag, embedded = fbx_scale(ent["fbx"])
        s_world = 0.01 * diag
        S = s_world * SIZE / wpu
        # 颜色源: 文件优先, 否则取 FBX 内嵌最大贴图(排除名字带法线/normal 的)
        if ent["diffuse"] and os.path.exists(ent["diffuse"]):
            lum = load_lum(ent["diffuse"], SIZE)
            src = os.path.basename(ent["diffuse"])
        else:
            cands = [im for im in embedded
                     if not any(k in im.name.lower() for k in ("normal", "法线", "_n -", "_n."))]
            if not cands:
                cands = embedded
            if not cands:
                print("跳过(无颜色源):", name)
                fail += 1
                continue
            big = max(cands, key=lambda im: im.size[0] * im.size[1])
            lum = load_lum(big, SIZE)
            src = "FBX内嵌:" + big.name
        n, slope = sobel_normal(lum, S)
        out = bpy.data.images.new("out", SIZE, SIZE, alpha=False)
        out.colorspace_settings.name = 'Non-Color'
        out.pixels = np.dstack([n, np.ones((SIZE, SIZE, 1))]).reshape(-1).tolist()
        out_path = os.path.join(OUTDIR, os.path.splitext(name)[0] + "_1024.png")
        out.filepath_raw = out_path
        out.file_format = 'PNG'
        out.save()
        ok += 1
        print("✓ %-46s 颜色源=%-30s world/uv=%.4f 坡度=%.3f" % (name, src, wpu, slope))
    except Exception as e:
        fail += 1
        print("✗ %s: %s" % (name, e))
print("完成: 成功 %d, 失败 %d" % (ok, fail))
