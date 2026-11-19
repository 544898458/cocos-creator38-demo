# -*- coding: utf-8 -*-
"""虫巢法线对齐检验: 部署文件 vs 颜色图解析坡度"""
import numpy as np
from PIL import Image, ImageFilter

ROOT = r"e:/UGit/cocos-creator38-demo/"
S = 512

# 颜色高度源 (PIL, 行0=顶部)
d = Image.open(ROOT + "assets/mapres/一方狂三/hatcherydeath/Hatchery_Diffuse高清.jpg").convert("RGB").resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
H = np.asarray(d).astype(np.float64) / 255.0 @ np.array([0.299, 0.587, 0.114])
dHdx = np.zeros_like(H); dHdx[:, 1:-1] = (H[:, 2:] - H[:, :-2]) * 0.5
dHdy = np.zeros_like(H); dHdy[1:-1, :] = (H[2:, :] - H[:-2, :]) * 0.5  # dH/dy_down

# 部署的法线 (JPEG 128, 实际内容 1024)
n = np.asarray(Image.open(ROOT + "assets/mapres/一方狂三/hatcherydeath/Hatchery_法线贴图128.jpeg").convert("RGB").resize((S, S), Image.LANCZOS)).astype(np.float64) / 255.0
R = (n[..., 0] - 0.5) * 2
G = (n[..., 1] - 0.5) * 2

def corr(a, b):
    a = (a - a.mean()).flatten(); b = (b - b.mean()).flatten()
    return (a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-12)

print("有效性: R=%.3f G=%.3f B=%.3f" % (n[..., 0].mean(), n[..., 1].mean(), n[..., 2].mean()))
print("R vs -dH/dx (标准应>0): %.4f | 反号: %.4f" % (corr(R, -dHdx), corr(R, dHdx)))
print("G vs +dH/dy_down (标准应>0): %.4f | 反号: %.4f" % (corr(G, dHdy), corr(G, -dHdy)))
print("垂直翻转对照: %.4f | 水平翻转对照: %.4f" % (corr(G, dHdy[::-1]), corr(R, -dHdx[:, ::-1])))
