# -*- coding: utf-8 -*-
"""机场/兵营: 法线换 1024 版 + normalStrength=3"""
import json, glob, os

ROOT = r"e:/UGit/cocos-creator38-demo/assets"

def get_uuid(path):
    return json.load(open(path + ".meta", encoding="utf-8"))["uuid"]

# 贴图 uuid
airport_1024 = get_uuid(ROOT + r"/mapres/⊹꙳ ˶˙ᵕ˙˶ ⊹꙳/sourceimages/02_initialShadingGroup_BaseColor - 法线贴图 1024.jpeg")
barracks_1024 = get_uuid(ROOT + r"/mapres/⊹꙳ ˶˙ᵕ˙˶ ⊹꙳/Factory/01_initialShadingGroup_Normal - 高清.png")
print("机场 1024 法线 uuid:", airport_1024)
print("兵营 1024 法线 uuid:", barracks_1024)

def texref(u): return {"__uuid__": u + "@6c48a", "__expectedType__": "cc.Texture2D"}

# 机场
p = ROOT + r"/mapres/小白阿姨/机场500面/airport_500_1mesh.fbx.meta"
d = json.load(open(p, encoding="utf-8"))
for k, m in d["userData"]["materials"].items():
    props = m["_props"][0]
    props["normalMap"] = texref(airport_1024)
    props["normalStrength"] = 3
    print("机场材质 %s: normalMap -> 1024, strength=3" % k.split("@")[-1])
json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# 兵营
p = ROOT + r"/mapres/小白阿姨/兵营合并网格/factory/Factory_1mesh_model.fbx.meta"
d = json.load(open(p, encoding="utf-8"))
for k, m in d["userData"]["materials"].items():
    props = m["_props"][0]
    if "normalMap" in props:
        props["normalMap"] = texref(barracks_1024)
        props["normalStrength"] = 3
        print("兵营材质 %s: normalMap -> 1024高清, strength=3" % k.split("@")[-1])
json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
