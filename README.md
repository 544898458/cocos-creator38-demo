# CocosCreator38Demo

#### 介绍

用于测试C++20协程服务器

#### 软件架构

#### 安装教程

1. 首先要有npm命令，安装了node.js才会有npm这个命令
2. 在本项目根目录执行

```PowerShell
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

3. 用Cocos Creator 3.8.4打开本项目
4. 修改电脑本地hosts文件把域名 rtsgame.online 定位到 127.0.0.1
5. 服务器代码在 https://gitee.com/griffon2/iocp20coroutine

#### 导出后端寻路文件的方法

1. 地面y坐标0，高于或低于面的地方不可站立，无网格处不可站立
2. 选中要导出的场景，必须双击选中打开“scene四方对战”
3. 菜单，扩展，杨宗保，网格
4. 选择Plane节点，保存为obj文件
5. obj文件复制到后端代码库的 Iocp20Coroutine\RecastDemo\Meshes
6. 双击打开RecastDemo.exe，选择“Temp Obastacles”，“Agent Radius”改为1.0

#### 参与贡献



关卡：阳光下的一个虾(QQ 1179331661)
首页底图：不问清阴(QQ 3969340418)
3D模型：TripoAI、混元AI	抠图：豆包AI	地面纹理：夸克AI
头像图片：文小言AI
音乐：SunoAI
绑定/动作：mixamo.com
绑定/动作：小白阿姨(QQ 3276812319)、九里庆安(QQ 284102069)
绑定/动作：大呲花(QQ 3029823814)、恒(QQ 2682677034)
绑定/动作：天涳の翼(QQ 349070005)、适中(QQ 1136976220)
绑定/动作：哈哈哈哈(QQ 2517969872)、一方狂三(QQ 1256604813)
模型/动作：<color=#a0ff50>荧瞳(QQ 287859992)、荒野乱斗(QQ 2930801690)</color>
语音：若有道心(QQ 1602576119)、潭(QQ 1514475926)、<color=#a0ff50>凌枭(QQ 2862703087)</color>
程序：火凤凰(QQ 75187631)、<color=#a0ff50>江沉晚吟时(QQ 3380125833)</color>
程序：kunnka(QQ 954436840)、樱木花道(QQ 251949672)


