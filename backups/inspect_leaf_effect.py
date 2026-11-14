# -*- coding: utf-8 -*-
"""检查 advanced/leaf effect 的着色器: 切线/法线贴图/颜色属性用法"""
import json, re

src = json.dumps(json.load(open(r"e:\UGit\cocos-creator38-demo\library\e3\e396231e-43c6-4547-86f5-0ef92bf154ce.json")), ensure_ascii=False)
for kw in ["USE_TANGENT", "a_tangent", "a_normal", "USE_NORMAL_MAP", "mainColor", "a_color", "USE_VERTEX_COLOR"]:
    print(kw, "出现次数:", src.count(kw))

# 提取所有着色器源码块, 找 albedo 计算和 TBN 构造相关行
blocks = re.findall(r'"((?:uniform|#include|vec4|void main)[^"]{100,})"', src)
allsrc = "\n".join(blocks)
for kw in ["albedo", "getTangent", "TBN", "normalMap", "USE_NORMAL_MAP", "mainColor", "a_color"]:
    lines = [ln.strip() for ln in allsrc.split("\n") if kw in ln]
    print(f"\n=== {kw} ({len(lines)} lines) ===")
    for ln in lines[:12]:
        print(" ", ln[:150])
