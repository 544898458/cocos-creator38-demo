# -*- coding: utf-8 -*-
"""重打包苔蔓 PBR (基于去噪图, 与新颜色/法线一致) + 三件套部署"""
import os
import numpy as np
from PIL import Image

ROOT = r"e:/UGit/cocos-creator38-demo/"
SCENE = ROOT + "assets/Scene资源/"
BK = ROOT + ".CodeBuddyTemp/"
SIZE = 2048

# 颜色源用去噪图 (与颜色/法线同一套图, 亮度变化一致)
img = Image.open(SCENE + "苔蔓高强降噪2048.png").convert("RGB")
a = np.asarray(img).astype(np.float64) / 255.0
lum = a @ np.array([0.299, 0.587, 0.114])
rough = np.clip(0.92 - 0.07 * lum, 0, 1)  # 亮部 0.85, 暗部 0.92 (映射规则与旧版一致)

pbr = np.zeros((SIZE, SIZE, 4), dtype=np.float32)
pbr[..., 0] = 0.0       # R: metallic = 0 (有机物)
pbr[..., 1] = rough     # G: roughness
pbr[..., 2] = 0.0       # B: 预留 AO
pbr[..., 3] = 1.0       # A
pbr_img = Image.fromarray((pbr * 255).astype(np.uint8), "RGBA")

master = BK + "moss_pbr_2048.png"
pbr_img.save(master)
pbr_img.save(BK + "上传CDN_苔蔓四通道PBR贴图2048.png")

for size, name in [(2048, "苔蔓四通道PBR贴图2048.png"), (1024, "苔蔓四通道PBR贴图1024.png"), (128, "苔蔓四通道PBR贴图128.png")]:
    im = pbr_img.resize((size, size), Image.LANCZOS)
    im.save(SCENE + name, "PNG")
    g = np.asarray(im).astype(np.float64)[..., 1] / 255.0
    print("✓ %-28s %4d  G(roughness) 均值 %.3f 范围 [%.3f, %.3f]" % (name, size, g.mean(), g.min(), g.max()))
