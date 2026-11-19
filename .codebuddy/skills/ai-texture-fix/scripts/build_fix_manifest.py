# -*- coding: utf-8 -*-
"""为每张无效法线贴图建立修复清单: {法线文件, 配对颜色贴图, 所属FBX}"""
import json, os, glob
import numpy as np
from PIL import Image

ROOT = r"e:/UGit/cocos-creator38-demo"
DIRS = [os.path.join(ROOT, "assets", "resources", "建筑"),
        os.path.join(ROOT, "assets", "resources", "活动单位")]

uuid2meta = {}
for meta in glob.glob(os.path.join(ROOT, "assets", "**", "*.meta"), recursive=True):
    try:
        d = json.load(open(meta, encoding="utf-8"))
    except Exception:
        continue
    if d.get("uuid"):
        uuid2meta[d["uuid"]] = meta[:-5]

manifest = []
seen = set()

def tex_path(uuid_full):
    base = uuid_full.split("@")[0]
    p = uuid2meta.get(base)
    if p and p.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".tga")):
        return p
    return None

def fbx_path(uuid_full):
    """FBX 内嵌材质的 base uuid 就是 FBX 资源 uuid"""
    base = uuid_full.split("@")[0]
    p = uuid2meta.get(base)
    if p and p.lower().endswith(".fbx"):
        return p
    return None

def valid_normal(path):
    try:
        img = Image.open(path).convert("RGB")
    except Exception:
        return False
    a = np.asarray(img).astype(np.float64) / 255.0
    v = a * 2 - 1
    ln = v[..., 0] ** 2 + v[..., 1] ** 2 + v[..., 2] ** 2
    return (np.abs(ln - 1) < 0.2).mean() > 0.8

def load_material(uuid_full, 来源):
    if uuid_full in seen:
        return
    seen.add(uuid_full)
    base = uuid_full.split("@")[0]
    mtl_json = None
    if uuid2meta.get(base, "").lower().endswith(".mtl"):
        mtl_json = uuid2meta[base]
    else:
        sub = uuid_full.split("@")[1] if "@" in uuid_full else None
        if sub:
            lib = os.path.join(ROOT, "library", base[:2], base + "@" + sub + ".json")
            if os.path.exists(lib):
                d = json.load(open(lib, encoding="utf-8"))
                objs = d if isinstance(d, list) else [d]
                for o in objs:
                    if isinstance(o, dict) and o.get("__type__") == "cc.Material":
                        mtl_json = lib
                        break
    if not mtl_json:
        return
    d = json.load(open(mtl_json, encoding="utf-8"))
    objs = d if isinstance(d, list) else [d]
    for o in objs:
        if not (isinstance(o, dict) and o.get("__type__") == "cc.Material"):
            continue
        props = (o.get("_props") or [{}])[0]
        nm = (props.get("normalMap") or {}).get("__uuid__")
        mt = (props.get("mainTexture") or {}).get("__uuid__")
        if not nm:
            continue
        np_path, mt_path = tex_path(nm), tex_path(mt)
        if not np_path or valid_normal(np_path):
            continue
        manifest.append({
            "normal": np_path,
            "diffuse": mt_path,
            "fbx": fbx_path(uuid_full),
            "来源": 来源,
        })

def collect(path, 来源):
    try:
        arr = json.load(open(path, encoding="utf-8"))
    except Exception:
        return
    objs = arr if isinstance(arr, list) else [arr]
    for o in objs:
        if not isinstance(o, dict):
            continue
        t = o.get("__type__", "")
        if t.endswith("Renderer"):
            for mm in (o.get("_materials") or []):
                u = (mm or {}).get("__uuid__")
                if u:
                    load_material(u, 来源)
        if t == "cc.PrefabInfo":
            u = (o.get("asset") or {}).get("__uuid__")
            if u:
                follow(u, 来源)

def follow(uuid_full, 来源):
    base, sub = uuid_full.split("@")[0], (uuid_full.split("@")[1] if "@" in uuid_full else None)
    p = uuid2meta.get(base)
    if p:
        if p.endswith(".prefab"):
            collect(p, 来源 + ">" + os.path.basename(p)[:-7])
        elif p.lower().endswith(".fbx") and sub:
            lib = os.path.join(ROOT, "library", base[:2], base + "@" + sub + ".json")
            if os.path.exists(lib):
                d = json.load(open(lib, encoding="utf-8"))
                objs = d if isinstance(d, list) else [d]
                for o in objs:
                    if isinstance(o, dict) and o.get("__type__") in ("cc.MeshRenderer", "cc.SkinnedMeshRenderer"):
                        for mm in (o.get("_materials") or []):
                            u = (mm or {}).get("__uuid__")
                            if u:
                                load_material(u, 来源 + ">" + os.path.basename(p)[:-4])
        return
    lib = os.path.join(ROOT, "library", base[:2], (base + "@" + sub if sub else base) + ".json")
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
        collect(meta[:-5], os.path.basename(meta[:-5])[:-7])

out = r"e:/UGit/cocos-creator38-demo/.CodeBuddyTemp/normal_fix_manifest.json"
json.dump(manifest, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for m in manifest:
    print("✗", os.path.basename(m["normal"]), "| 颜色:", os.path.basename(m["diffuse"]) if m["diffuse"] else "无", "| FBX:", os.path.basename(m["fbx"]) if m["fbx"] else "无", "|", m["来源"])
print("共", len(manifest), "张, 清单:", out)
