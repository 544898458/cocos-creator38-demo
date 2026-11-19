# -*- coding: utf-8 -*-
"""解析法重生成苔蔓法线 (标准 OpenGL 切线空间约定):
高度源 = 去噪图低通 (与烘焙同源)
R = -dH/dx, G = +dH/dy_down (v 向上约定), B = 1/sqrt(1+sx²+sy²)
"""
import numpy as np
from PIL import Image, ImageFilter

ROOT = r"e:/UGit/cocos-creator38-demo/"
SIZE = 2048

# 高度源: 去噪图 r=1 基底 + 锐化增强 (最细尺度坡度放大 2.2 倍, 颗粒观感更锐更细)
h_img = Image.open(ROOT + "assets/Scene资源/苔蔓高强降噪2048.png").convert("RGB").filter(ImageFilter.GaussianBlur(1))
H0 = np.asarray(h_img).astype(np.float64) / 255.0 @ np.array([0.299, 0.587, 0.114])
H_fine = np.asarray(h_img.filter(ImageFilter.GaussianBlur(2))).astype(np.float64) / 255.0 @ np.array([0.299, 0.587, 0.114])
H = H0 + 1.2 * (H0 - H_fine)   # unsharp: 细节分量增强, 不引入新噪声

# Sobel 梯度 (图像坐标: x=列向右, y=行向下)
def sobel(a, axis):
    k = np.zeros((3, 3))
    k[0, :] = [-1, 0, 1]; k[2, :] = [-1, 0, 1]
    if axis == 1:
        k = k.T
    from numpy.lib.stride_tricks import sliding_window_view
    p = np.pad(a, 1, mode='edge')
    win = sliding_window_view(p, (3, 3))
    return (win * k).sum(axis=(-1, -2))

gx = sobel(H, 0) / 8.0  # dH/dx
gy = sobel(H, 1) / 8.0  # dH/dy_down

# 坡度标定: 最大平均坡度 ~0.5 (苔藓软表面, 与游戏观感匹配; 不足调材质 normalStrength)
SLOPE = 0.5
scale = SLOPE / max(np.sqrt(gx * gx + gy * gy).mean(), 1e-6)
sx = -gx * scale          # R 通道
sy = gy * scale           # G 通道 = +dH/dy_down (OpenGL, v 向上)
print("标定 scale %.1f, 平均坡度 %.3f" % (scale, np.sqrt(sx * sx + sy * sy).mean()))

nz = np.ones_like(sx)
norm = np.sqrt(sx * sx + sy * sy + 1.0)
out = np.stack([sx / norm * 0.5 + 0.5, sy / norm * 0.5 + 0.5, nz / norm * 0.5 + 0.5], axis=-1)
master = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
master.save(ROOT + ".CodeBuddyTemp/moss_normal_2048.png", "PNG")

# 部署三件套 (缩小后重归一化)
for size, name in [(2048, "assets/Scene资源/苔蔓法线贴图2048.png"),
                   (1024, "assets/Scene资源/苔蔓法线贴图1024.png"),
                   (128, "assets/Scene资源/苔蔓法线贴图128.png")]:
    im = master.resize((size, size), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64) / 255.0
    v = a * 2 - 1
    ln = np.sqrt((v ** 2).sum(axis=-1, keepdims=True))
    v = v / np.maximum(ln, 1e-6)
    Image.fromarray((np.clip((v + 1) / 2, 0, 1) * 255).astype(np.uint8)).save(ROOT + name, "PNG")
    a2 = np.asarray(Image.open(ROOT + name)).astype(np.float64) / 255.0
    v2 = a2 * 2 - 1
    ln2 = v2[..., 0] ** 2 + v2[..., 1] ** 2 + v2[..., 2] ** 2
    print("✓ %s 单位化 %.1f%%" % (name, (np.abs(ln2 - 1) < 0.2).mean() * 100))

master.save(ROOT + ".CodeBuddyTemp/上传CDN_苔蔓法线贴图2048.png", "PNG")
print("✓ .CodeBuddyTemp/上传CDN_苔蔓法线贴图2048.png")
