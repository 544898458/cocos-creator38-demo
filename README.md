# CocosCreator38Demo

#### 介绍
用于测试C++20协程服务器

#### 软件架构


#### 安装教程

1.  首先要有npm命令，安装了node.js才会有npm这个命令
2.  在本项目根目录执行
```PowerShell
    npm install msgpack-lite
    npm i --save-dev @types/msgpack-lite
```
否则可能报下面的错误：
![输入图片说明](README%E6%96%B0%E5%BB%BA%E4%BD%8D%E5%9B%BE%E5%9B%BE%E5%83%8F.png)

```
[Scene] {hidden(::SceneExecutorImportExceptionHandler::)} Error: Error: Module "msgpack-lite/dist/msgpack.min.js" not found for file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/assets/UiLogin.ts 
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
Error: [Scene] {hidden(::SceneExecutorImportExceptionHandler::)} Error: Error: Module "msgpack-lite/dist/msgpack.min.js" not found for file:///C:/Users/Administrator/source/repos/cocos-creator38-demo/assets/UiLogin.ts 
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

3.  用Cocos Creator 3.8.0打开本项目
4.  找到UiLogin.ts文件里的onClickLogin方法，修改要连接的服务器IP
5.  服务器代码在 https://gitee.com/griffon2/iocp20coroutine

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献



