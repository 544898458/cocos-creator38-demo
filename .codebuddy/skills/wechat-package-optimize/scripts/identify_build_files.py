# -*- coding: utf-8 -*-
"""识别包内大文件的源资产 + 统计图片类文件"""
import json, glob, os

ROOT = r"e:/UGit/cocos-creator38-demo"
BUILD = ROOT + r"/build/wechatgame-wechatgame"

uuid2path = {}
for meta in glob.glob(os.path.join(ROOT, "assets", "**", "*.meta"), recursive=True):
    try:
        d = json.load(open(meta, encoding="utf-8"))
    except Exception:
        continue
    if d.get("uuid"):
        uuid2path[d["uuid"]] = meta[:-5]

targets = [
    "7893f185-1738-4619-9e4b-3b59be38cf00",  # 2.90MB bin
    "9c40a865-f383-4cad-b7a1-02e6b1930b2c",  # 1.57MB png (Morph法线?)
    "4162646a-6e52-4053-af2d-2dc9cc1da040",  # Upgrade法线?
    "0f68fccd",                              # 1.01MB json
    "0a35aa5f",                              # 0.94MB json
]
print("=== 大文件识别 ===")
for t in targets:
    hits = [p for u, p in uuid2path.items() if u.startswith(t)]
    print(t[:12], "->", [os.path.relpath(h, ROOT) for h in hits] or "未找到")

# 包内全部图片
print("\n=== 包内图片文件 ===")
imgs = []
for r, _, fs in os.walk(BUILD):
    for f in fs:
        if f.endswith((".png", ".jpeg", ".jpg", ".webp")):
            p = os.path.join(r, f)
            imgs.append((os.path.getsize(p), f))
imgs.sort(reverse=True)
total = sum(s for s, _ in imgs)
print("图片总数 %d, 合计 %.2f MB" % (len(imgs), total / 1048576))
for s, f in imgs[:15]:
    print("%7.2f KB  %s" % (s / 1024, f))
