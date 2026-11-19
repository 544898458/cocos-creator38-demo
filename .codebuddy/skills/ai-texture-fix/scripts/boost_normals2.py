# -*- coding: utf-8 -*-
"""民房/重车厂: 法线换 1024 版 + normalStrength=3"""
import json, os

ROOT = r"e:/UGit/cocos-creator38-demo/assets"

def get_uuid(path):
    return json.load(open(path + ".meta", encoding="utf-8"))["uuid"]

def texref(u): return {"__uuid__": u + "@6c48a", "__expectedType__": "cc.Texture2D"}

def patch(fbx_meta, mat_sub_id, normal_uuid, strength):
    d = json.load(open(fbx_meta, encoding="utf-8"))
    hit = False
    for k, m in d["userData"]["materials"].items():
        if k.endswith("@" + mat_sub_id) or k.split("@")[-1] == mat_sub_id:
            props = m["_props"][0]
            props["normalMap"] = texref(normal_uuid)
            props["normalStrength"] = strength
            print("✓ %s [%s] -> 1024, strength=%s" % (os.path.basename(fbx_meta), mat_sub_id, strength))
            hit = True
    if not hit:
        print("✗ 未找到材质子资产:", mat_sub_id)
        return
    json.dump(d, open(fbx_meta, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

base = ROOT + r"/mapres/坦格利安"

# 1. 民房: cangku_01.fbx 材质 98e20
cangku_1024 = get_uuid(base + r"/仓库-提供8人口/cangku_01 法线贴图 - 1024.jpeg")
patch(base + r"/仓库-提供8人口/cangku_01.fbx.meta", "98e20", cangku_1024, 3)

# 2. 重车厂: 风扇飞(1).FBX 材质 05295 / 0b583
tanke_1024 = get_uuid(base + r"/重工厂-生产机械化单位，可挂接科技实验室或反应堆/tankegongchang_01t 法线贴图 1024.jpeg")
fan_1024 = get_uuid(base + r"/重工厂-生产机械化单位，可挂接科技实验室或反应堆/Fan法线贴图1024.jpeg")
fbx = ROOT + r"/mapres/苽禾 QQ 3223213062/风扇飞 (1).FBX.meta"
patch(fbx, "05295", tanke_1024, 3)
patch(fbx, "0b583", fan_1024, 3)
