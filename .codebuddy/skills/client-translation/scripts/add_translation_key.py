# -*- coding: utf-8 -*-
"""在两个翻译表的 LevelFormat 行后插入 AttrLevelFormat 词条"""
from openpyxl import load_workbook

ZH = r"e:/UGit/cocos-creator38-demo/assets/翻译/zh-Hans-CN.xlsx"
EN = r"e:/UGit/cocos-creator38-demo/assets/翻译/en-US.xlsx"

def insert_after_levelformat(path, target_value):
    wb = load_workbook(path)
    ws = wb.active
    row_lf = None
    for row in range(1, ws.max_row + 1):
        if str(ws.cell(row, 1).value) == "LevelFormat":
            row_lf = row
            break
    assert row_lf, "LevelFormat 行未找到: " + path
    ws.insert_rows(row_lf + 1)
    ws.cell(row_lf + 1, 1, "AttrLevelFormat")
    ws.cell(row_lf + 1, 2, "{0}:{1}级")
    ws.cell(row_lf + 1, 3, target_value)
    wb.save(path)
    print("✓", path.split("/")[-1] if "/" in path else path.split("\\")[-1], "-> AttrLevelFormat =", target_value)

insert_after_levelformat(ZH, "{0}:{1}级")
insert_after_levelformat(EN, "{0}: Lv.{1}")
