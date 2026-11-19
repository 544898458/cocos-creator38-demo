# -*- coding: utf-8 -*-
"""Hatchery_法线贴图Morph_1024: PNG -> JPEG (保 uuid, 省包体)"""
import json, os
from PIL import Image

D = r"e:/UGit/cocos-creator38-demo/assets/mapres/一方狂三/hatcherydeath/"
PNG = D + "Hatchery_法线贴图Morph_1024.png"
JPEG = D + "Hatchery_法线贴图Morph_1024.jpeg"
META = PNG + ".meta"

d = json.load(open(META, encoding="utf-8"))
u = d["uuid"]

# 转 JPEG (法线标准做法, q92 + 无色度抽样)
img = Image.open(PNG).convert("RGB")
img.save(JPEG, "JPEG", quality=92, subsampling=0)
print("JPEG: %.0f KB (原 PNG %.0f KB)" % (os.path.getsize(JPEG) / 1024, os.path.getsize(PNG) / 1024))

# 更新 meta: 同 uuid, files 换 .jpeg
d["files"] = [".jpeg", ".json"]
json.dump(d, open(JPEG + ".meta", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# 删旧 png 和 meta
os.remove(PNG)
os.remove(META)
print("✓ uuid 不变:", u, "- 材质引用无需改动")
