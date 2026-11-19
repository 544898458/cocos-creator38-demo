# -*- coding: utf-8 -*-
"""objects_02 - 高清.png: 去颗粒 + 法线贴图 + 四通道PBR (1024/128)"""
import numpy as np
from PIL import Image, ImageFilter
from numpy.lib.stride_tricks import sliding_window_view

ROOT = r"e:/UGit/cocos-creator38-demo/assets/mapres/坦格利安/"
SRC = ROOT + "objects_02 - 高清.png"

# ---------- 1. 读图, 透明区合成到中性灰 (防镂空边缘产生假坡度) ----------
src = Image.open(SRC).convert("RGBA")
W, H = src.size
a = np.asarray(src).astype(np.float64) / 255.0
alpha = a[..., 3:4]
rgb = a[..., :3] * alpha + 0.5 * (1 - alpha)
print("源图 %dx%d, 不透明像素占比 %.0f%%" % (W, H, (alpha[..., 0] > 0.5).mean() * 100))

# ---------- 2. 双边滤波去 AI 颗粒 ----------
def bilateral(img, R=4, sigma_r=0.10):
    lum = img @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    pad = np.pad(img, ((R, R), (R, R), (0, 0)), mode='edge')
    pad_l = np.pad(lum, ((R, R), (R, R)), mode='edge')
    h, w = lum.shape
    num = np.zeros_like(img); den = np.zeros((h, w), dtype=np.float32)
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            ws = np.exp(-0.5 * (dy * dy + dx * dx) / (R * R / 4.0))
            patch = pad[R + dy:R + dy + h, R + dx:R + dx + w]
            pl = pad_l[R + dy:R + dy + h, R + dx:R + dx + w]
            wr = np.exp(-0.5 * (pl - lum) ** 2 / (sigma_r * sigma_r))
            wgt = (ws * wr)[..., None]
            num += patch * wgt; den += wgt[..., 0]
    return num / den[..., None]

rgb_d = bilateral(rgb.astype(np.float32))
g0 = np.abs(np.diff(rgb @ np.array([0.299, 0.587, 0.114]), axis=1)).mean()
g1 = np.abs(np.diff(rgb_d @ np.array([0.299, 0.587, 0.114]), axis=1)).mean()
print("颗粒度: %.4f -> %.4f (降低 %.0f%%)" % (g0, g1, (1 - g1 / g0) * 100))
color_d = Image.fromarray((np.clip(rgb_d, 0, 1) * 255).astype(np.uint8))

# ---------- 3. 法线: 高度源 = 去噪图低通 r3, Sobel, 平均坡度 0.5 ----------
h_img = color_d.filter(ImageFilter.GaussianBlur(3))
H = np.asarray(h_img).astype(np.float64) / 255.0 @ np.array([0.299, 0.587, 0.114])
gx = np.zeros_like(H); gy = np.zeros_like(H)
gx[:, 1:-1] = (H[:, 2:] - H[:, :-2]) * 0.5
gy[1:-1, :] = (H[2:, :] - H[:-2, :]) * 0.5
gx[:, 0] = H[:, 1] - H[:, 0]; gx[:, -1] = H[:, -1] - H[:, -2]
gy[0, :] = H[1, :] - H[0, :]; gy[-1, :] = H[-1, :] - H[-2, :]
SLOPE = 0.5
scale = SLOPE / max(np.sqrt(gx * gx + gy * gy).mean(), 1e-6)
sx = -gx * scale          # R = -dH/dx
sy = gy * scale           # G = +dH/dy_down (OpenGL, v 向上)
norm = np.sqrt(sx * sx + sy * sy + 1.0)
n = np.stack([sx / norm * 0.5 + 0.5, sy / norm * 0.5 + 0.5, 1.0 / norm * 0.5 + 0.5], axis=-1)
n_img = Image.fromarray((np.clip(n, 0, 1) * 255).astype(np.uint8))
print("法线标定 scale %.1f, 平均坡度 %.3f" % (scale, np.sqrt(sx * sx + sy * sy).mean()))

def save_normal(img, size, path):
    im = img.resize((size, size), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float64) / 255.0
    v = arr * 2 - 1
    ln = np.sqrt((v ** 2).sum(axis=-1, keepdims=True))
    v = v / np.maximum(ln, 1e-6)  # 缩放后重归一化
    Image.fromarray((np.clip((v + 1) / 2, 0, 1) * 255).astype(np.uint8)).save(path, "PNG")
    a2 = np.asarray(Image.open(path)).astype(np.float64) / 255.0
    v2 = a2 * 2 - 1
    ln2 = v2[..., 0] ** 2 + v2[..., 1] ** 2 + v2[..., 2] ** 2
    print("✓ %s  单位化 %.1f%%" % (path.split("/")[-1], (np.abs(ln2 - 1) < 0.2).mean() * 100))

save_normal(n_img, 1024, ROOT + "objects_02 - 法线贴图 1024.png")
save_normal(n_img, 128, ROOT + "objects_02 - 法线贴图 128.png")

# ---------- 4. 四通道 PBR: R=metallic0 G=roughness(0.85~0.92) B=0 A=1 ----------
lum_d = rgb_d @ np.array([0.299, 0.587, 0.114])
rough = np.clip(0.92 - 0.07 * lum_d, 0, 1)
pbr = np.zeros((lum_d.shape[0], lum_d.shape[1], 4), dtype=np.float32)
pbr[..., 1] = rough
pbr[..., 3] = 1.0
pbr_img = Image.fromarray((pbr * 255).astype(np.uint8), "RGBA")
for size, name in [(1024, "objects_02 - 四通道PBR贴图 1024.png"), (128, "objects_02 - 四通道PBR贴图 128.png")]:
    im = pbr_img.resize((size, size), Image.LANCZOS)
    im.save(ROOT + name, "PNG")
    g = np.asarray(im).astype(np.float64)[..., 1] / 255.0
    print("✓ %s  G(roughness) 均值 %.3f" % (name, g.mean()))
