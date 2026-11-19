# -*- coding: utf-8 -*-
"""在 prefab/scene/mtl 及全部 ts 里搜这些 key(含动态拼接前缀)"""
import glob, os

ROOT = r"e:/UGit/cocos-creator38-demo/assets"
keys = ["KeyJiJia", "Key机甲", "KuangXuanXiangQiang", "QueDing", "RotateCamera",
        "XiangQiangKongXianGongChengCheGongChong", "XiangQiangQiangXingZou",
        "XiangQiangQuXiaoXuanZhong", "XiangQingQu", "XiangQingQuXiaoDianJiDiMian",
        "XiangQuanBuZhanDouDanWei", "LoginMainSvr", "LoginTestSvr"]
prefixes = ["XiangQiang", "XiangQing", "XiangQuan"]

for k in keys:
    hits = []
    for p in glob.glob(os.path.join(ROOT, "**", "*"), recursive=True):
        if not p.endswith((".prefab", ".scene", ".ts", ".mtl")):
            continue
        try:
            t = open(p, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        if k in t:
            hits.append(os.path.relpath(p, ROOT))
    print("%-40s %s" % (k, ("%.1d 处: " % len(hits)) + "; ".join(hits[:3]) if hits else "(无引用)"))

print("\n=== 动态拼接前缀检查 ===")
for pre in prefixes:
    hits = []
    for p in glob.glob(os.path.join(ROOT, "scripts", "**", "*.ts"), recursive=True):
        t = open(p, encoding="utf-8", errors="ignore").read()
        if pre in t:
            for i, line in enumerate(t.split("\n"), 1):
                if pre in line:
                    hits.append("%s:%d: %s" % (os.path.relpath(p, ROOT), i, line.strip()[:100]))
    for h in hits[:8]:
        print(h)
