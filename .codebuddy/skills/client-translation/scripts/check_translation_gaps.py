# -*- coding: utf-8 -*-
"""对比中英翻译表: 找英文缺失的 key 和未翻译(目标值仍为中文)的词条"""
import pandas as pd

ZH = r"e:/UGit/cocos-creator38-demo/assets/翻译/zh-Hans-CN.xlsx"
EN = r"e:/UGit/cocos-creator38-demo/assets/翻译/en-US.xlsx"

dz = pd.read_excel(ZH)
de = pd.read_excel(EN)
zk = set(dz["key"].astype(str))
ek = set(de["key"].astype(str))

print("中文词条 %d, 英文词条 %d" % (len(zk), len(ek)))
missing = zk - ek
print("\n=== 英文缺失的 key (%d 个) ===" % len(missing))
zh_map = dict(zip(dz["key"].astype(str), dz["sourceValue"].astype(str)))
for k in sorted(missing):
    print("%-30s %s" % (k, zh_map.get(k, "")))

extra = ek - zk
if extra:
    print("\n=== 英文多出的 key (%d 个) ===" % len(extra))
    for k in sorted(extra):
        print(k)

# 英文表里 targetValue 仍是中文的(未翻译)
de_s = de["sourceValue"].astype(str).fillna("")
de_t = de["targetValue"].astype(str).fillna("")
untranslated = de[de_t.str.match(r".*[\u4e00-\u9fff].*", na=False) & (de_t == de_s)]
print("\n=== 英文表 targetValue 仍等于中文 sourceValue (%d 个) ===" % len(untranslated))
for _, row in untranslated.iterrows():
    print("%-30s %s" % (row["key"], row["targetValue"]))
