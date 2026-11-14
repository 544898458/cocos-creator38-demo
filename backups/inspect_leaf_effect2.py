# -*- coding: utf-8 -*-
"""遍历 effect JSON, 找到着色器源码块并检查关键字上下文"""
import json

d = json.load(open(r"e:\UGit\cocos-creator38-demo\library\e3\e396231e-43c6-4547-86f5-0ef92bf154ce.json"))

chunks = []
def walk(o, path=""):
    if isinstance(o, dict):
        for k, v in o.items():
            walk(v, path + "/" + str(k))
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, path + f"[{i}]")
    elif isinstance(o, str) and len(o) > 80 and ("vec4" in o or "uniform" in o or "void main" in o):
        chunks.append((path, o))

walk(d)
print("源码块数:", len(chunks))
allsrc = ""
for path, s in chunks:
    print("--", path, len(s))
    allsrc += s + "\n"

for kw in ["albedo", "USE_NORMAL_MAP", "USE_TANGENT", "a_color", "mainColor", "normalMap", "tangent"]:
    lines = [ln.strip() for ln in allsrc.split("\n") if kw in ln]
    print(f"\n=== {kw} ({len(lines)}) ===")
    for ln in lines[:15]:
        print(" ", ln[:160])
