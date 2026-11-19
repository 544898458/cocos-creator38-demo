# -*- coding: utf-8 -*-
"""补齐 en-US.xlsx 缺失词条 + 修正 Key机甲 -> KeyJiJia + 翻译 Login 两键"""
from openpyxl import load_workbook

EN = r"e:/UGit/cocos-creator38-demo/assets/翻译/en-US.xlsx"
wb = load_workbook(EN)
ws = wb.active

# 修正错误 key: Key机甲 -> KeyJiJia
fixed = False
for row in range(1, ws.max_row + 1):
    if str(ws.cell(row, 1).value) == "Key机甲":
        ws.cell(row, 1, "KeyJiJia")
        ws.cell(row, 3, "Mech")
        fixed = True
print("Key机甲 -> KeyJiJia:", "✓" if fixed else "未找到")

# 追加缺失词条 (key, 中文源, 英文)
new_rows = [
    ("QueDing", "确 定", "OK"),
    ("RotateCamera", "旋转视角", "Rotate Camera"),
    ("XiangQingQu", "取消当前操作", "Cancel current action"),
    ("KuangXuanXiangQiang",
     "在屏幕上拖动出一个方框，选中框内所有的活动单位。<br/>  在左边的设置按钮（齿轮图标）里可以在<color=#a0ff50>正矩形框选</color>模式和<color=#a0ff50>菱形框选</color>模式之间切换",
     "Drag a box on the screen to select all active units inside. <br/>  In the settings button on the left (gear icon), you can switch between the <color=#a0ff50>Rectangular Selection</color> and <color=#a0ff50>Diamond Selection</color> modes"),
    ("XiangQiangKongXianGongChengCheGongChong",
     "每点击一次切换到下一个<color=#a0ff50>工程车</color>或<color=#a0ff50>工虫</color>",
     "Each click switches to the next <color=#a0ff50>Engineer Vehicle</color> or <color=#a0ff50>Worker Bug</color>"),
    ("XiangQiangQiangXingZou", "不理会途中遇到的敌人，强行走到目标点",
     "Ignore enemies along the way and force-move to the target point"),
    ("XiangQiangQuXiaoXuanZhong", "取消当前选中的单位。\n    可以防止误操作。",
     "Deselect the currently selected units.\n    Prevents accidental operations."),
    ("XiangQingQuXiaoDianJiDiMian", "Cancel current ground click action",
     "Cancel current ground click action"),
    ("XiangQuanBuZhanDouDanWei", "选中所有可移动的战斗单位",
     "Select all movable combat units"),
    ("LoginMainSvr", "登录正式服", "Log in to Production Server"),
    ("LoginTestSvr", "登录测试体验服", "Log in to Test Server"),
]
for k, s, t in new_rows:
    ws.append([k, s, t])
wb.save(EN)
print("✓ 追加 %d 条" % len(new_rows))
