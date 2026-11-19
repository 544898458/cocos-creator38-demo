# -*- coding: utf-8 -*-
"""扫描 建筑/活动单位 全部预制体 -> 材质 -> 法线贴图, 检验有效性
处理: 直接引用 | PrefabInstance/PrefabInfo 链 | FBX 内嵌材质(library 子资源)
"""
import json, os, glob
import numpy as np
from PIL import Image

ROOT = r"e:/UGit/cocos-creator38-demo"
DIRS = [os.path.join(ROOT, "assets", "resources", "建筑"),
        os.path.join(ROOT, "assets", "resources", "活动单位")]

# uuid -> (路径, subMetas)
uuid2meta = {}
for meta in glob.glob(os.path.join(ROOT, "assets", "**", "*.meta"), recursive=True):
    try:
        d = json.load(open(meta, encoding="utf-8"))
    except Exception:
        continue
    if d.get("uuid"):
        uuid2meta[d["uuid"]] = (meta[:-5], d.get("subMetas") or {})

def resolve_sub(uuid_full):
    """'uuid@subid' -> 文件路径; 优先 library/<uuid2>/<uuid>@sub.json"""
    if "@" in uuid_full:
        base, sub = uuid_full.split("@", 1)
    else:
        base, sub = uuid_full, None
    info = uuid2meta.get(base)
    if info:
        return info[0], info[1]
    return None, None

seen_materials = set()
checked = set()
results = []  # (法线文件, 来源描述, 是否有效, 统计)

def check_texture(uuid_full, 来源, 槽名):
    if not uuid_full or uuid_full in checked:
        return
    checked.add(uuid_full)
    base, sub = uuid_full.split("@")[0], (uuid_full.split("@")[1] if "@" in uuid_full else None)
    # 本地 assets 文件?
    info = uuid2meta.get(base)
    path = info[0] if info else None
    if not path:
        # library 子资源 (FBX 内嵌)
        lib = os.path.join(ROOT, "library", base[:2], base + ("@" + sub if sub else "") + ".json")
        if os.path.exists(lib) and sub:
            path = lib
        else:
            results.append((uuid_full, 来源, 槽名, "无法定位文件", None))
            return
    ext = path.lower().rsplit(".", 1)[-1]
    if ext not in ("png", "jpg", "jpeg", "webp", "tga", "bmp"):
        return
    try:
        img = Image.open(path)
        mode_img = img.convert("RGB")
    except Exception as e:
        results.append((os.path.basename(path), 来源, 槽名, "打开失败 %s" % e, None))
        return
    a = np.asarray(mode_img).astype(np.float64) / 255.0
    r, g, b = a[..., 0].mean(), a[..., 1].mean(), a[..., 2].mean()
    v = a * 2 - 1
    ln = v[..., 0] ** 2 + v[..., 1] ** 2 + v[..., 2] ** 2
    valid = (np.abs(ln - 1) < 0.2).mean()
    results.append((os.path.basename(path), 来源, 槽名,
                    "R=%.3f G=%.3f B=%.3f 单位化 %.1f%% %s" % (r, g, b, valid * 100, "✓" if valid > 0.8 else "✗"),
                    img.size))

def collect_from_prefab(path, 来源):
    try:
        arr = json.load(open(path, encoding="utf-8"))
    except Exception:
        return
    objs = arr if isinstance(arr, list) else [arr]
    for o in objs:
        if not isinstance(o, dict):
            continue
        t = o.get("__type__", "")
        # 渲染器: _materials 里的材质 uuid (prefab 文件里是 asset 引用)
        if t.endswith("Renderer"):
            for mm in (o.get("_materials") or []):
                u = (mm or {}).get("__uuid__")
                if u:
                    load_material(u, 来源)
        # PrefabInfo -> 引用的基础预制体/FBX
        if t == "cc.PrefabInfo":
            u = (o.get("asset") or {}).get("__uuid__")
            if u:
                follow_asset(u, 来源)

def load_material(uuid_full, 来源):
    if uuid_full in seen_materials:
        return
    seen_materials.add(uuid_full)
    base = uuid_full.split("@")[0]
    # 1) assets 里的 .mtl
    info = uuid2meta.get(base)
    if info and info[0].lower().endswith((".mtl",)):
        mtl = json.load(open(info[0], encoding="utf-8"))
        props = (mtl.get("_props") or [{}])[0]
        for k, v in props.items():
            if isinstance(v, dict) and "__uuid__" in v:
                check_texture(v["__uuid__"], 来源, k)
        return
    # 2) library 子资源 (FBX 内嵌材质)
    sub = uuid_full.split("@")[1] if "@" in uuid_full else None
    lib = os.path.join(ROOT, "library", base[:2], base + ("@" + sub if sub else "") + ".json")
    if os.path.exists(lib):
        d = json.load(open(lib, encoding="utf-8"))
        objs = d if isinstance(d, list) else [d]
        for o in objs:
            if isinstance(o, dict) and o.get("__type__") == "cc.Material":
                props = (o.get("_props") or [{}])[0]
                for k, v in props.items():
                    if isinstance(v, dict) and "__uuid__" in v:
                        check_texture(v["__uuid__"], 来源 + " > FBX材质", k)

def follow_asset(uuid_full, 来源):
    base, sub = uuid_full.split("@")[0], (uuid_full.split("@")[1] if "@" in uuid_full else None)
    info = uuid2meta.get(base)
    if info:
        p = info[0]
        if p.endswith(".prefab"):
            collect_from_prefab(p, 来源 + " > " + os.path.basename(p))
        # FBX: 内嵌 prefab 子资源
        if p.lower().endswith(".fbx") and sub:
            lib = os.path.join(ROOT, "library", base[:2], base + "@" + sub + ".json")
            if os.path.exists(lib):
                d = json.load(open(lib, encoding="utf-8"))
                objs = d if isinstance(d, list) else [d]
                for o in objs:
                    if isinstance(o, dict) and o.get("__type__") in ("cc.MeshRenderer", "cc.SkinnedMeshRenderer"):
                        for mm in (o.get("_materials") or []):
                            u = (mm or {}).get("__uuid__")
                            if u:
                                load_material(u, 来源 + " > " + os.path.basename(p))
        return
    # 未在 assets 找到的 uuid: 试 library
    for cand in [base + "@" + sub if sub else base]:
        lib = os.path.join(ROOT, "library", base[:2], cand + ".json")
        if os.path.exists(lib):
            d = json.load(open(lib, encoding="utf-8"))
            objs = d if isinstance(d, list) else [d]
            for o in objs:
                if isinstance(o, dict) and o.get("__type__") in ("cc.MeshRenderer", "cc.SkinnedMeshRenderer"):
                    for mm in (o.get("_materials") or []):
                        u = (mm or {}).get("__uuid__")
                        if u:
                            load_material(u, 来源)

for d0 in DIRS:
    for meta in glob.glob(os.path.join(d0, "**", "*.prefab.meta"), recursive=True):
        pf = meta[:-5]
        name = os.path.basename(pf)
        collect_from_prefab(pf, name)

print("=== 法线贴图检查结果 ===")
for path, src, slot, stat, size in sorted(results):
    if slot.lower() not in ("normalmap",):
        continue
    print("%-42s %s [%s] %s %s" % (path, src, slot, stat, size or ""))
print("\n=== 其他槽位贴图(参考) ===")
for path, src, slot, stat, size in sorted(results):
    if slot.lower() != "normalmap":
        print("%-42s %s [%s] %s" % (path, src, slot, stat))
