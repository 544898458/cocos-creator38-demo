# CocosCreator38Demo

## 介绍

* 用于测试C++20协程服务器

## 安装

### 注意

* 安装完node.js和下列npm内容之前，不要打开和导入项目；
* 把下列npm按下面要求安装完后才能打开cocos导入和运行工程文件，
* 要用管理员身份运行cmd 或 PowerShell，并且要跳转到工程根目录下，在工程根目录下，完成npm的安装
* 不要解压工程根目录下的biligame-builder-1.0.3.zip包，安装完npm游戏播放没问题后，点击菜单的extension表单，选择 extension manager，进入后点左边栏最上方的，最右边的导入按钮，在放大镜->查找->右边，然后找到根目录下的biligame-builder-1.0.3.zip导入，导入后弹出一个框，选择confirm即可；
* 刚开始不熟悉情况，打开Cocos Creator编辑器可能看不懂，看不到地图，想看到地图，就在左下角搜索map，里面的内容都是地图，只要左键双击一下文件，就能在编辑器主窗口里预览。

### 步骤

1. 首先要有npm命令，安装了node.js才会有npm这个命令
2. 在本项目根目录执行

```PowerShell
npm install fs-extra
    npm install vue@^2.6.14
    npm install @gltf-transform/core
    npm install msgpack-lite
    npm i --save-dev @types/msgpack-lite
    npm install js-yaml
    npm install @types/js-yaml --save-dev

    如果报“因为在此系统上禁止运行脚本”，就先执行下面的
    set-ExecutionPolicy RemoteSigned
    然后输入“Y”
```

否则可能报下面的错误：
![输入图片说明](README%E6%96%B0%E5%BB%BA%E4%BD%8D%E5%9B%BE%E5%9B%BE%E5%83%8F.png)

```
[Scene] {hidden(::SceneExecutorImportExceptionHandler::)} Error: Error: Module "msgpack-lite/dist/msgpack.min.js" not found for file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/assets/Main.ts 
    at rejector (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:759:15) 
    at ExecutorSystem.resolve [as _detailResolve] (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:777:13) 
    at ExecutorSystem._resolve (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\editor-systemjs\index.ts:137:14) 
    at SystemJS.resolve (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\editor-systemjs\index.ts:36:23) 
    at C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:355:37 
    at Array.map (<anonymous>) 
    at C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:353:41 
    at file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/temp/programming/packer-driver/targets/editor/chunks/52/cce:/internal/x/prerequisite-imports:8:13 
    at Object.execute (file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/temp/programming/packer-driver/targets/editor/chunks/52/cce:/internal/x/prerequisite-imports:4:1) 
    at Executor._importPrerequisiteModules (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\executor\index.ts:298:13) 
Error: [Scene] {hidden(::SceneExecutorImportExceptionHandler::)} Error: Error: Module "msgpack-lite/dist/msgpack.min.js" not found for file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/assets/Main.ts 
    at SystemJS.resolve (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\editor-systemjs\index.ts:36:23) 
    at C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:355:37 
    at Array.map (<anonymous>) 
    at C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:353:41 
    at file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/temp/programming/packer-driver/targets/editor/chunks/52/cce:/internal/x/prerequisite-imports:8:13 
    at Object.execute (file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/temp/programming/packer-driver/targets/editor/chunks/52/cce:/internal/x/prerequisite-imports:4:1) 
    at Executor._importPrerequisiteModules (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\executor\index.ts:298:13) 
    at Logger._logHandler (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\builtin\scene\dist\script\3d\manager\startup\log.ccc:1:492) 
    at Logger.record (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@base\electron-logger\lib\renderer.ccc:1:458) 
    at console.error (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@base\electron-logger\lib\renderer.ccc:1:1414) 
    at ScriptManager._handleImportException (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\builtin\scene\dist\script\3d\manager\scripts.ccc:1:5391) 
    at Executor.importExceptionHandler [as _importExceptionHandler] (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\builtin\scene\dist\script\3d\manager\scripts.ccc:1:3485) 
    at Executor._onModuleLoaded (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\executor\index.ts:347:22) 
    at SystemJS.onload (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\src\executor\index.ts:87:18) 
    at triggerOnload (C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:270:10) 
    at C:\ProgramData\cocos\editors\Creator\3.8.0\resources\app.asar\node_modules\@editor\lib-programming\static\executor\systemjs-bridge\out\index.js:431:7 
    at file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/temp/programming/packer-driver/targets/editor/chunks/52/cce:/internal/x/prerequisite-imports:8:13
```

3. 用Cocos Creator 3.8.7打开本项目
4. 修改Cocos Creator本地测试浏览器端口为7456或者7457
5. 选中场景Start，然后点三角形的播放按钮运行游戏
6. 如果要连接本地服务器的话，就修改电脑本地hosts文件把域名 test.rtsgame.online 定位到 127.0.0.1
7. 调试：直接在浏览器按 F12，在源代码文件内加断点
8. 服务器代码在 https://gitee.com/griffon2/iocp20coroutine

### 本地模型替换当前使用模型

1. 使用cocos creater，将项目导入到本地
2. 本地模型复制粘贴到项目中，如\assets\mapres\3D混元AI\机场  这样的位置
3. 找到单位的prefeb文件，双击
4. 在左上角层级管理器已经打开prefeb文件的前提下，找到第二步已经粘贴到项目的文件
5. 将文件中的.prefeb文件拖到左上角层级管理器中
6. 删除原本的模型
7. 场景编辑器左上角，点击保存prefeb
8. 运行测试

#### 问题解决

* 没有贴图

1. 左上层级管理器点击已经导入的fbx名称
2. 选中左下资源管理器的fbx文件->material，右侧属性检查器 Pass 0 属性中，勾选USE ALBEDO MAP，在下方出现的DiffuseMap属性中选择正确的贴图
3. material被修改后需要保存才能生效，右上角点击 绿色√ 保存
4. 测试是否成功

* 没有动画

1. 左上层级管理器点击已经导入的fbx名称
2. 在右侧属性检查器里，找到SkeletalAnimation->剪辑列表，剪辑列表数量为0则没有动画
3. 左下资源管理器中找到对应的动画，拖到剪辑列表中
4. 保存prefeb

### 导出后端寻路文件的方法

1. 地面y坐标0，高于或低于面的地方不可站立，无网格处不可站立
2. 选中要导出的场景，必须双击选中打开“scene四方对战”
3. 菜单，扩展，杨宗保，网格
4. 选择Plane节点，保存为obj文件
5. obj文件复制到后端代码库的 Iocp20Coroutine\RecastDemo\Meshes
6. 双击打开RecastDemo.exe，选择“Temp Obastacles”，“Agent Radius”改为1.0

### 贡献者名单

* 关卡：阳光下的一个虾(QQ 1179331661)
* 首页底图：不问清阴(QQ 3969340418)
* 3D模型：TripoAI、混元AI
* 抠图：豆包AI
* 地面纹理：夸克AI
* 头像图片：文小言AI
* 音乐：乌鸦Producer(QQ 2998975740)、电波暴击(QQ 1106551898)
* 音乐：SunoAI
* 绑定/动作：mixamo.com
* 绑定/动作：小白阿姨(QQ 3276812319)、九里庆安(QQ 284102069)
* 绑定/动作：大呲花(QQ 3029823814)、恒(QQ 2682677034)
* 绑定/动作：天涳の翼(QQ 349070005)、适中(QQ 1136976220)
* 绑定/动作：哈哈哈哈(QQ 2517969872)、一方狂三(QQ 1256604813)
* 模型/动作：⊹꙳ ˶˙ᵕ˙˶ ⊹꙳(QQ 2104435032)、<span style="color: #a0ff50">荧瞳(QQ 287859992)、荒野乱斗(QQ 2930801690)</span>
* 语音：无梦(QQ 1744500392)、水薄荷(QQ 1982131539)
* 语音：若有道心(QQ 1602576119)、潭(QQ 1514475926)、<span style="color: #a0ff50">* 凌枭(QQ 2862703087)</span>
* 程序：火凤凰(QQ 75187631)、<span style="color:#a0ff50">江沉晚吟时(QQ 3380125833)</span>
* 程序：庄园(QQ 2516080307)、kunnka(QQ 954436840)、樱木花道(QQ 251949672)

### 协议

1. 使用此项目造成的一切风险由使用者承担；
2. 允许任何个人或组织将此项目用于学习和非商业用途；
3. 本项目贡献者有权（上文参与贡献名单中的个人或组织，以及项目所引用的第三方库的作者）将此项目用于闭源商业用途，无需向其它贡献者支付任何利益；
4. 任何个人或组织在未修改本项目任何内容的前提下，可以将此项目用于商业用途（比如用于教学盈利）；
5. 任何个人或组织在修改本项目内容并且开源修改后的内容的前提下，可以将此项目用于商业用途（开源的意思是你要先开源然后才能发布产品，而不是发布产品之后过了十年再开源，那不叫开源，那叫闭源）；
6. 参与贡献的方式非常宽松，贡献以下内容进入主分支都算参与贡献：一行代码、一个模型、一个动作、一段音效、一段音乐、一个图片；

