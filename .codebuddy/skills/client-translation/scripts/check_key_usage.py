# -*- coding: utf-8 -*-
"""检查缺失/多余/未翻译的 key 在代码里的实际引用"""
import glob, os, re

ROOT = r"e:/UGit/cocos-creator38-demo/assets/scripts"
keys = ["KeyJiJia", "Key机甲", "KuangXuanXiangQiang", "QueDing", "RotateCamera",
        "XiangQiangKongXianGongChengCheGongChong", "XiangQiangQiangXingZou",
        "XiangQiangQuXiaoXuanZhong", "XiangQingQu", "XiangQingQuXiaoDianJiDiMian",
        "XiangQuanBuZhanDouDanWei", "LoginMainSvr", "LoginTestSvr"]

for k in keys:
    hits = []
    for p in glob.glob(os.path.join(ROOT, "**", "*.ts"), recursive=True):
        t = open(p, encoding="utf-8", errors="ignore").read()
        for m in re.finditer(re.escape(k), t):
            line = t[:m.start()].count("\n") + 1
            hits.append("%s:%d" % (os.path.relpath(p, ROOT), line))
    print("%-40s %s" % (k, ", ".join(hits) if hits else "(无引用)"))
