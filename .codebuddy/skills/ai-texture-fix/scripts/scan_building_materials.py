# -*- coding: utf-8 -*-
"""扫描建筑 prefab -> FBX -> 内嵌材质的法线配置"""
import json, glob, os, re

ROOT = r"e:/UGit/cocos-creator38-demo"
ASSETS = os.path.join(ROOT, "assets")
uuid2path = {}
for meta in glob.glob(os.path.join(ASSETS, "**", "*.meta"), recursive=True):
    try: d = json.load(open(meta, encoding="utf-8"))
    except: continue
    if d.get("uuid"): uuid2path[d["uuid"]] = meta[:-5]

def tex_name(meta_path):
    """解析贴图资产: 内嵌(fbx@sub) 或外部文件"""
    if not meta_path or "@" not in meta_path:
        return meta_path
    fbx_meta, sub = meta_path.rsplit("@", 1)
    try:
        d = json.load(open(fbx_meta + ".meta", encoding="utf-8"))
        sub_name = d.get("subMetas", {}).get(sub, {}).get("name", "?")
        return "%s{%s}" % (os.path.basename(fbx_meta), sub_name)
    except Exception:
        return meta_path

for prefab_name in ["民房.prefab", "重车厂.prefab"]:
    p = os.path.join(ASSETS, "resources", "建筑", prefab_name)
    text = open(p, encoding="utf-8").read()
    print("\n=========", prefab_name)
    seen = set()
    for u in sorted(set(re.findall(r'"__uuid__":\s*"([^"]+@[^"]+|[^"]+)"', text))):
        base = u.split("@")[0]
        path = uuid2path.get(base)
        if path and path.endswith(".fbx") and base not in seen:
            seen.add(base)
            print("模型:", os.path.basename(path))
            try:
                d = json.load(open(path + ".meta", encoding="utf-8"))
            except Exception:
                continue
            for k, m in (d.get("userData", {}).get("materials") or {}).items():
                props = (m.get("_props") or [{}])[0]
                nm = props.get("normalMap")
                ns = props.get("normalStrength")
                mt = props.get("mainTexture")
                print("   材质 %-20s mainTexture=%s  normalMap=%s  normalStrength=%s" % (
                    k.split("@")[-1],
                    tex_name(uuid2path.get(mt.get("__uuid__", "").split("@")[0], mt.get("__uuid__", "?"))) if isinstance(mt, dict) else "-",
                    tex_name(uuid2path.get(nm.get("__uuid__", "").split("@")[0], nm.get("__uuid__", "?"))) if isinstance(nm, dict) else "无",
                    ns))
