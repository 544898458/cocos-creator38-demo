# -*- coding: utf-8 -*-
"""双边滤波去 AI 颗粒: 保边(苔藓团块/叶脉边缘) + 去高频颗粒
9x9 窗口, 亮度域高斯权重, numpy 向量化
"""
import numpy as np
from PIL import Image, ImageFilter

ROOT = r"e:/UGit/cocos-creator38-demo/"
SRC = ROOT + ".CodeBuddyTemp/moss_color_2048.png"
OUT = ROOT + ".CodeBuddyTemp/moss_color_denoised2048.png"

img = Image.open(SRC).convert("RGB")
a = np.asarray(img).astype(np.float32) / 255.0
H, W, _ = a.shape

R = 4            # 半径 -> 9x9 窗口
SIGMA_R = 0.10   # 亮度域 sigma: 越大越平滑 (颗粒 0.038 量级, 0.10 保留大结构)

lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
# 填充
pad = np.pad(a, ((R, R), (R, R), (0, 0)), mode='edge')
pad_lum = np.pad(lum, ((R, R), (R, R)), mode='edge')

num = np.zeros_like(a)
den = np.zeros((H, W), dtype=np.float32)
space_w = np.exp(-0.5 * (np.arange(-R, R + 1) ** 2).sum() / None) if False else None
for dy in range(-R, R + 1):
    for dx in range(-R, R + 1):
        ws = np.exp(-0.5 * (dy * dy + dx * dx) / (R * R / 4.0))  # 空间权重
        patch = pad[R + dy:R + dy + H, R + dx:R + dx + W]
        patch_lum = pad_lum[R + dy:R + dy + H, R + dx:R + dx + W]
        wr = np.exp(-0.5 * (patch_lum - lum) ** 2 / (SIGMA_R * SIGMA_R))  # 亮度域权重
        w = (ws * wr)[..., None]
        num += patch * w
        den += w[..., 0]

out = num / den[..., None]
out = np.clip(out, 0, 1)

# 轻微高斯(0.6)收尾, 平滑双边滤波的微小残留
Image.fromarray((out * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)).save(OUT)
print("saved ->", OUT)

# ---- 验证 ----
den2 = np.asarray(Image.open(OUT).convert("RGB")).astype(np.float64) / 255.0
def grain(x): return np.abs(np.diff(x[..., 0], axis=1)).mean()
print("颗粒度: %.4f -> %.4f (降低 %.0f%%)" % (grain(a), grain(den2), (1 - grain(den2) / grain(a)) * 100))
ls = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))).astype(np.float64) / 255.0
ld = np.asarray(Image.fromarray((den2 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))).astype(np.float64) / 255.0
Ls = (ls @ np.array([0.299, 0.587, 0.114])).flatten(); Ld = (ld @ np.array([0.299, 0.587, 0.114])).flatten()
c = ((Ls - Ls.mean()) * (Ld - Ld.mean())).sum() / np.sqrt(((Ls - Ls.mean()) ** 2).sum() * ((Ld - Ld.mean()) ** 2).sum())
print("低频结构相关性: %.4f" % c)
print("R/G/B 均值偏移: %.4f %.4f %.4f" % tuple(den2[..., i].mean() - a[..., i].mean() for i in range(3)))

# 局部放大对比图
S = 500
c1 = img.crop((924, 924, 1124, 1124)).resize((S, S), Image.NEAREST)
c2 = Image.open(OUT).crop((924, 924, 1124, 1124)).resize((S, S), Image.NEAREST)
combo = Image.new("RGB", (S * 2, S))
combo.paste(c1, (0, 0)); combo.paste(c2, (S, 0))
combo.save(ROOT + ".CodeBuddyTemp/去噪对比_局部放大.png")
print("对比图: .CodeBuddyTemp/去噪对比_局部放大.png (左原图 右去噪)")
