# -*- coding: utf-8 -*-
"""提取 leaf frag 主流程上下文"""
import json

d = json.load(open(r"e:\UGit\cocos-creator38-demo\library\e3\e396231e-43c6-4547-86f5-0ef92bf154ce.json"))
frag = d["shaders"][0]["glsl4"]["frag"]  # 最新版本
lines = frag.split("\n")

def show(kw, before=3, after=10, maxhits=3):
    hits = [i for i, ln in enumerate(lines) if kw in ln]
    print(f"\n##### {kw}: {len(hits)} hits")
    for h in hits[:maxhits]:
        print("-----")
        for i in range(max(0, h-before), min(len(lines), h+after)):
            print(f"{i:5d} {lines[i]}")

show("col *=", after=6)
show("vec4 baseColor = albedo", after=14)
show("distance = length", after=14)
show("normalMap, NORMAL_UV", after=8)
