"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterMake = exports.onBeforeMake = exports.onError = exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = void 0;
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { shell } = require("electron");
// 添加用于解析和生成 JavaScript 代码的库
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const t = require("@babel/types");
const HTTP_URL = "https://miniapp.bilibili.com"; //"http://127.0.0.1:3000"; //https://miniapp.bilibili.com
const getUseAsmJs = (L3, B3) => {
    return `function useAsmJs(t, e) {
    return new Promise(function (i, r) {
      var n;
      ((n = e),
      new Promise(function (t, e) {
        (function (t) {
          return new Promise(function (e) {
            e("cocos-js/" + t);
          });
        })(n)
          .then(function (i) {
            globalThis.fsUtils.readArrayBuffer(i, function (i, r) {
              i ? e(i) : t(r);
            });
          })
          .catch(function () {});
      }))
        .then(function (e) {
          var i = {};
          return (
            (i.buffer = new ArrayBuffer(33554432)),
            t({
              wasmMemory: i,
              memoryInitializerRequest: { response: e, status: 200 },
            }).then(function (t) {
              (${L3} = t),
              ${B3}.forEach(function (t) {
                  t(${L3});
                });
            })
          );
        })
        .then(i)
        .catch(r);
    });
  }`;
};
const getUseWebassembly = (L3, B3) => {
    return `function useWebAssembly(t, e) {
    return new Promise(function (i, n) {
      var r = function (t) {
        return "[Spine]: Spine wasm load failed: " + t;
      };
      t({
        instantiateWasm: function (t, i) {
          (function (t, e) {
            return ((i = t),
            new Promise(function (t) {
              t("cocos-js/" + i);
            })).then(function (t) {
              return WebAssembly.instantiate(t, e);
            });
            var i;
          })(e, t)
            .then(function (t) {
              i(t.instance, t.module);
            })
            .catch(function (t) {
              return n(r(t));
            });
        },
      })
        .then(function (t) {
          (${L3} = t),
            ${B3}.forEach(function (t) {
              t(${L3});
            });
        })
        .then(i)
        .catch(function (t) {
          return n(r(t));
        });
    });
  }`;
};
function getOnPostInfrastructureInitDelegateAddFuncStr(code, isSubPackageWasm) {
    const startIndex = code.indexOf("Spine wasm load failed");
    console.log("开始找 Spine wasm load failed");
    if (startIndex === -1) {
        console.log("未找到 Spine wasm load failed。");
    }
    else {
        // 从 startIndex 开始向前搜索找到第一个 ;
        const openBraceIndex = code.lastIndexOf(";", startIndex);
        if (openBraceIndex === -1) {
            console.log("未找到方法的起始 ;。");
        }
        else {
            const lastSemicolonIndex = code.lastIndexOf(";", openBraceIndex - 1);
            if (lastSemicolonIndex == -1) {
                console.log("--------");
            }
            else {
                const funIndex = code.indexOf("onPostInfrastructureInitDelegate.add", lastSemicolonIndex);
                if (funIndex === -1) {
                    console.log("未找到 onPostInfrastructureInitDelegate.add。");
                }
                else {
                    // 从 startIndex 开始向后搜索找到第一个 catch
                    const pushIndex = code.indexOf(".push", funIndex);
                    if (pushIndex === -1) {
                        console.log("未找 .pushIndex 语法。");
                    }
                    else {
                        const commaIndex = code.lastIndexOf(",", pushIndex + 1);
                        if (commaIndex === -1) {
                            console.log("未找到结束标志 ,");
                        }
                        else {
                            // 提取起始位置和结束位置之间的子字符串
                            const methodContent = code.substring(lastSemicolonIndex + 1, commaIndex);
                            console.log("方法内容：", methodContent);
                            return methodContent;
                        }
                    }
                }
            }
        }
    }
    return "";
}
const EXTENSION_VERSION = "1.0.3";
// 复制文件的函数
function copyFiles(srcDir, destDir) {
    // 确保目标目录存在
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    // 读取源目录下的所有文件
    const files = fs.readdirSync(srcDir);
    console.log("copyFiles", files);
    for (const file of files) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
    }
}
// 递归复制目录的函数
function copyDirectory(srcDir, destDir) {
    // 确保目标目录存在
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    // 读取源目录下的所有文件和目录
    const items = fs.readdirSync(srcDir);
    items.forEach((item) => {
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(destDir, item);
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            // 如果是目录，则递归复制
            copyDirectory(srcPath, destPath);
        }
        else {
            // 如果是文件，则直接复制
            fs.copyFileSync(srcPath, destPath);
        }
    });
}
// 写文件
function writeFile(localFilePath, response) {
    fs.writeFileSync(localFilePath, response.data, "utf8");
}
// 清空目录的函数
function clearDirectory(directory) {
    if (fs.existsSync(directory)) {
        const files = fs.readdirSync(directory);
        files.forEach((file) => {
            const filePath = path.join(directory, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // 如果是目录，则递归删除
                clearDirectory(filePath);
            }
            else {
                // 如果是文件，则直接删除
                fs.unlinkSync(filePath);
            }
        });
        // 最后删除目录本身
        fs.rmdirSync(directory);
    }
}
function compareVersions(version1, version2) {
    if (!version1 || !version2) {
        return 0;
    }
    const v1 = version1.split(".").map(Number);
    const v2 = version2.split(".").map(Number);
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = v1[i] || 0; // 如果不存在，默认为 0
        const num2 = v2[i] || 0; // 如果不存在，默认为 0
        if (num1 > num2)
            return 1; // version1 > version2
        if (num2 > num1)
            return -1; // version2 > version1
    }
    return 0; // 版本号相同
}
// 替换 System.register 的模块定义
function replaceSystemRegister(sourceCode, moduleName, replacementCode) {
    const ast = parser.parse(sourceCode, {
        sourceType: "module",
    });
    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.type === "MemberExpression" &&
                path.node.callee.object.name === "System" &&
                path.node.callee.property.name === "register" &&
                path.node.arguments.length === 3 &&
                path.node.arguments[0].type === "StringLiteral" &&
                path.node.arguments[0].value === moduleName) {
                console.log("找到 System.register 调用: ", moduleName);
                // 替换整个 System.register 调用
                const newRegisterAst = parser.parse(replacementCode, {
                    sourceType: "module",
                }).program.body[0].expression;
                path.replaceWith(newRegisterAst);
                // 如果只需要替换第一个匹配，可以调用 path.stop();
                path.stop();
            }
        },
    });
    return generator(ast, { concise: true }).code;
}
function replaceSpineWasm(originalCode) {
    const ast = parser.parse(originalCode, {
        sourceType: "module",
    });
    console.log("start parse onPostInfrastructureInitDelegateFunc");
    const onPostInfrastructureInitDelegateFunc = `
  (function (t) {
    var platform = wx.getSystemInfoSync()._platform || wx.getSystemInfoSync().platform || "";
    if (platform.toLowerCase() == "ios") {
      return useAsmJs(t[0].default, t[1].default);
    }
    return useWebAssembly(t[2].default, t[3].default);
  })
  `;
    const funcExprAst = parser.parse(onPostInfrastructureInitDelegateFunc, {
        sourceType: "module",
        plugins: ["typescript"],
    }).program.body[0].expression;
    // 遍历 AST 进行修改
    traverse(ast, {
        CallExpression(path) {
            // 检查我们是否在处理Promise.all的调用
            if (path.node.callee.type === "MemberExpression" &&
                path.node.callee.property.name === "then") {
                console.log("Found 'then'");
                // 检查是否为Promise.all的调用结果
                if (path.node.callee.object.type === "CallExpression" &&
                    path.node.callee.object.callee.type === "MemberExpression" &&
                    path.node.callee.object.callee.object.name === "Promise" &&
                    path.node.callee.object.callee.property.name === "all") {
                    console.log("Found 'Promise.all'");
                    // 确保只有一个参数，并且这个参数是数组表达式
                    if (path.node.callee.object.arguments.length === 1 &&
                        t.isArrayExpression(path.node.callee.object.arguments[0])) {
                        console.log("Arguments length is 1 and is an Array");
                        // 检查数组元素
                        if (path.node.callee.object.arguments[0].elements.every((element) => t.isCallExpression(element) &&
                            t.isMemberExpression(element.callee) &&
                            t.isIdentifier(element.callee.object, { name: "e" }) &&
                            t.isIdentifier(element.callee.property, { name: "import" }) &&
                            t.isStringLiteral(element.arguments[0]) &&
                            (element.arguments[0].value.startsWith("external:emscripten/spine/spine") ||
                                element.arguments[0].value.startsWith("./spine")))) {
                            console.log("All imports match criteria");
                            console.log("path.get('arguments.0')", path.get("arguments.0"));
                            path.get("arguments.0").replaceWith(funcExprAst);
                        }
                    }
                }
            }
        },
    });
    // 将函数代码注入 AST 的末尾
    // ast.program.body.push(parser.parse(asmJsFunc, { sourceType: "module" }).program.body[0]);
    // ast.program.body.push(parser.parse(webassemblyFunc, { sourceType: "module" }).program.body[0]);
    // 生成新的代码
    // const { code } = generator(ast);
    return generator(ast, { concise: true }).code;
}
function insertFuncs(originalCode) {
    const ast = parser.parse(originalCode, {
        sourceType: "module",
    });
    // console.log('insertFuncs originalCode: ', originalCode);
    // 从原始代码中提取变量名
    const varDeclaration = originalCode.split(";")[0]; // 取第一个分号前的部分
    const varNames = varDeclaration
        .replace("var ", "")
        .split(",")
        .reduce((acc, item) => {
        let [key, value] = item.split("=");
        if (value) {
            console.log("value", value);
            if (value.indexOf("null") != -1) {
                acc.Ont = key.trim();
            }
            else if (value.indexOf("[]") != -1) {
                acc.Mnt = key.trim();
            }
        }
        return acc;
    }, {});
    // 注入 getUseAsmJs 和 getUseWebassembly 函数
    const asmJsFunc = getUseAsmJs(varNames.Ont, varNames.Mnt);
    const webassemblyFunc = getUseWebassembly(varNames.Ont, varNames.Mnt);
    // 解析单个函数定义为 AST 节点
    const asmJsFuncAst = parser.parse(asmJsFunc, { sourceType: "module" }).program
        .body[0];
    const webassemblyFuncAst = parser.parse(webassemblyFunc, {
        sourceType: "module",
    }).program.body[0];
    // 遍历 AST 进行修改
    traverse(ast, {
        CallExpression(path) {
            // 检查是否为 .add 调用并且前面有 .onPostInfrastructureInitDelegate
            if (path.node.callee.type === "MemberExpression" &&
                path.node.callee.property.name === "add" &&
                path.node.callee.object.type === "MemberExpression" &&
                path.node.callee.object.property.name ===
                    "onPostInfrastructureInitDelegate") {
                // 在此调用前插入 asmJsFunc 和 webassemblyFunc
                path.insertBefore(asmJsFuncAst);
                path.insertBefore(webassemblyFuncAst);
            }
        },
    });
    return generator(ast, { concise: true }).code;
}
// 递归函数，用于遍历目录  
function renameWebAdapterFiles(dirPath) {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // 如果是目录，递归调用  
                renameWebAdapterFiles(filePath);
            }
            else if (file.startsWith('web-adapter.') && file.endsWith('.js')) {
                // 匹配 web-adapter.xxxx.js 文件  
                const newFilePath = path.join(dirPath, 'web-adapter.js');
                // 检查新文件名是否已存在，如果存在则跳过或处理冲突  
                if (files.includes('web-adapter.js')) {
                    console.log(`${newFilePath} already exists, skipping...`);
                }
                else {
                    fs.rename(filePath, newFilePath, err => {
                        if (err) {
                            console.error('Error renaming file:', err);
                        }
                        else {
                            console.log(`Renamed ${filePath} to ${newFilePath}`);
                        }
                    });
                }
            }
        });
    });
}
const PACKAGE_NAME = "biligame-builder";
function log(...arg) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}
let allAssets = [];
exports.throwError = true;
const load = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${PACKAGE_NAME}] Load cocos plugin example in builder.`);
        allAssets = yield Editor.Message.request("asset-db", "query-assets");
    });
};
exports.load = load;
const onBeforeBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkgOptions = options.packages[PACKAGE_NAME];
        if (options.platform == "wechatgame" && pkgOptions.isBiliGame) {
            // Todo some thing
            // log(`${PACKAGE_NAME}.webTestOption`, 'onBeforeBuild');
            console.log("options", options);
            let res = yield axios.get(`${HTTP_URL}/game-issues/api/issue/getAdaptation/getVersion`);
            const orgVersion = res.data.data.version;
            const currVersion = EXTENSION_VERSION;
            if (compareVersions(orgVersion, currVersion) == 1) {
                return new Promise((resolve, reject) => {
                    // 显示一个对话框提示用户
                    Editor.Dialog.info("biligame-builder有新更新，是否前往下载最新版本？", {
                        buttons: ["继续构建", "停止构建，并前往官网"],
                        title: "插件更新提醒",
                    }).then((result) => {
                        if (result.response === 0) {
                            // 用户选择继续，解析 Promise 以继续构建
                            resolve();
                        }
                        else {
                            // 打开默认浏览器并导航到指定URL
                            shell.openExternal("https://miniapp.bilibili.com/small-game-doc/guide/compatibility/");
                            // open('https://miniapp.bilibili.com/small-game-doc/guide/compatibility/');
                            // 用户选择取消，拒绝 Promise 以阻止构建
                            reject(new Error("用户取消操作，构建已停止。"));
                        }
                    });
                });
            }
            console.log("res", res);
        }
    });
};
exports.onBeforeBuild = onBeforeBuild;
const onBeforeCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // const pkgOptions = options.packages[PACKAGE_NAME];
        // if (pkgOptions.webTestOption) {
        //     console.debug('webTestOption', true);
        // }
        // Todo some thing
        console.debug("get settings test", result.settings);
    });
};
exports.onBeforeCompressSettings = onBeforeCompressSettings;
const onAfterCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        console.log("webTestOption", "onAfterCompressSettings");
    });
};
exports.onAfterCompressSettings = onAfterCompressSettings;
const onAfterBuild = function (options, result) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // change the uuid to test
        let orgVersion = Editor.App.version;
        let version = Editor.App.version.split(".").join("");
        const pkgOptions = options.packages[PACKAGE_NAME];
        console.log("options.packages:", JSON.stringify(options.packages));
        if (options.platform == "wechatgame" && pkgOptions.isBiliGame) {
            console.log("正在构建bilibili小游戏~");
            try {
                console.log("开始拉取适配文件");
                // `https://miniapp.bilibili.com/game-issues/api/issue/getAdaptation?version=${orgVersion.slice(
                let res = yield axios.get(`${HTTP_URL}/game-issues/api/issue/getAdaptation?version=${orgVersion.slice(0, 3)}`);
                let newRequireStatements = "";
                const data = res.data.data;
                console.log("拉取到了适配文件", data.files);
                if ((_a = data === null || data === void 0 ? void 0 : data.files) === null || _a === void 0 ? void 0 : _a.length) {
                    const extensionDir = __dirname;
                    const srcDir = path.join(extensionDir, "../static/adapters/download");
                    const biligamePath = path.join(result.dest, "../biligame");
                    // 创建新目录
                    if (!fs.existsSync(biligamePath)) {
                        console.log("创建biligame目录");
                        fs.mkdirSync(biligamePath, { recursive: true });
                    }
                    clearDirectory(srcDir);
                    if (!fs.existsSync(srcDir)) {
                        console.log("创建适配文件目录");
                        fs.mkdirSync(srcDir, { recursive: true });
                    }
                    clearDirectory(biligamePath);
                    copyDirectory(result.dest, biligamePath);
                    for (let i = 0; i < ((_b = data === null || data === void 0 ? void 0 : data.files) === null || _b === void 0 ? void 0 : _b.length); i++) {
                        const fileName = Object.keys(data.files[i])[0];
                        console.log("fileName", fileName);
                        newRequireStatements =
                            newRequireStatements + `require('./${fileName}');\n`;
                        const localFilePath = path.join(biligamePath, `${fileName}`);
                        const fileRes = yield axios({
                            method: "get",
                            url: data.files[i][fileName],
                            responseType: "stream",
                        });
                        console.log("fileRes", fileRes);
                        // 把适配文件，写入biligame目录
                        writeFile(localFilePath, fileRes);
                    }
                    renameWebAdapterFiles(biligamePath);
                    console.log("写入适配文件成功！");
                    // if (version.length < 3) {
                    //   version = version + "";
                    // }
                    // let versionNum = parseInt(version);
                    const destDir = path.join(biligamePath, "."); // 'result.dest' 是构建目录的路径
                    // 修改 game.js
                    const gameJsPath = path.join(destDir, "game.js");
                    let gameJsContent = fs.readFileSync(gameJsPath, "utf8");
                    if (compareVersions(orgVersion, "3.6.0") == -1) {
                        console.log("引擎版本小于 3.6.x, 使用第1套适配方案");
                        gameJsContent = gameJsContent.replace("require('./libs/wrapper/builtin/index')", "");
                    }
                    else {
                        console.log("引擎版本大于等于 3.6.x, 使用第2套适配方案");
                        let start = gameJsContent.indexOf("require('./web-adapter");
                        if (start !== -1) {
                            // 向前找到前一个分号
                            let prevSemicolon = gameJsContent.lastIndexOf(';', start) + 1;
                            // 向后找到后一个分号
                            let nextSemicolon = gameJsContent.indexOf(';', start) + 1;
                            if (prevSemicolon !== -1 && nextSemicolon !== -1) {
                                // 删除这个区间的内容
                                gameJsContent = gameJsContent.slice(0, prevSemicolon) + gameJsContent.slice(nextSemicolon);
                            }
                        }
                        console.log("gameJsContent", gameJsContent);
                    }
                    // 下方添加launchSuccess();
                    gameJsContent += "\nif(bl){bl.launchSuccess()};";
                    // 将新的 require 语句添加到 game.js 的开头
                    gameJsContent = newRequireStatements + gameJsContent;
                    // 将修改后的内容写回 game.js
                    fs.writeFileSync(gameJsPath, gameJsContent, "utf8");
                    console.log("game.js适配成功");
                    const gameJsonPath = path.join(destDir, "game.json");
                    let gameJsonContent = fs.readFileSync(gameJsonPath, "utf8");
                    let gameJsonFormat = JSON.parse(gameJsonContent);
                    if (!gameJsonFormat["appId"]) {
                        console.log("没有appId，正在写入中~");
                        gameJsonFormat["appId"] =
                            pkgOptions["biliGameAppId"] || options.packages["wechatgame"].appid;
                        gameJsonFormat["version"] = pkgOptions["biliGameVersion"] || "1.0.0";
                        let newGameJsonContent = JSON.stringify(gameJsonFormat);
                        fs.writeFileSync(gameJsonPath, newGameJsonContent, "utf8");
                    }
                    console.log("game.json适配成功!");
                    if (compareVersions(orgVersion, "3.8.0") == 1 ||
                        compareVersions(orgVersion, "3.8.0") == 0) {
                        if (compareVersions(orgVersion, "3.8.3") == -1) {
                            console.log("版本大于等于3.8.0并且小于3.8.3，开始对 spine wasm 进行适配~");
                            if (options.packages["wechatgame"].wasmSubpackage) {
                                console.log("已开启 wasm 分包策略，开始处理~");
                                // 读取 spine.asm.js 和 spine.js.mem 的内容
                                let spineAsmModulePath = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-open/spine.asm.js");
                                let spineMemModulePath = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-open/spine.js.mem.js");
                                if (compareVersions(orgVersion, "3.8.2") == -1) {
                                    console.log("版本低于 3.8.2, 不支持wasm分包, 退出适配");
                                    return;
                                }
                                const spineAsmCode = fs.readFileSync(spineAsmModulePath, "utf8");
                                const spineMemCode = fs.readFileSync(spineMemModulePath, "utf8");
                                // 替换 game.js 中的相应模块定义
                                const gameJsPath = path.join(destDir, "cocos-js/chunks/game.js");
                                let gameJsContent = fs.readFileSync(gameJsPath, "utf8");
                                console.log("正在构建chunks/game.js语法树~");
                                gameJsContent = replaceSystemRegister(gameJsContent, "external:emscripten/spine/spine.asm.js", spineAsmCode);
                                gameJsContent = replaceSystemRegister(gameJsContent, "external:emscripten/spine/spine.js.mem", spineMemCode);
                                // 将修改后的 game.js 写回文件
                                fs.writeFileSync(gameJsPath, gameJsContent, "utf8");
                                console.log("已生成新的chunks/game.js~");
                                console.log("spine.asm.js 和 spine.js.mem 替换完成");
                                console.log("正在拷贝 spine.js.mem.bin ~");
                                const assetPath = path.join(destDir, "cocos-js/assets");
                                const spineMemBin = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-open/spine.js.mem.bin");
                                const targetFile = path.join(assetPath, "spine.js.mem.bin");
                                // 拷贝文件
                                fs.copyFileSync(spineMemBin, targetFile);
                                console.log("拷贝 spine.js.mem.bin 成功~");
                                console.log("开始处理cc文件~");
                                // 指定目录路径
                                const cocosJSPath = path.join(destDir, "cocos-js");
                                // 正则表达式匹配可能的 JavaScript 文件
                                const regex = /^cc(\..*)?\.js$/;
                                let ccPath = "";
                                // 读取目录内容
                                fs.readdir(cocosJSPath, (err, files) => {
                                    if (err) {
                                        return console.error("Unable to scan directory: " + err);
                                    }
                                    // 过滤出符合条件的文件
                                    const filteredFiles = files.filter((file) => regex.test(file));
                                    // 处理每个找到的文件
                                    filteredFiles.forEach((file) => {
                                        ccPath = path.join(cocosJSPath, file);
                                        // console.log('Found file:', ccPath);
                                        let ccFileCode = fs.readFileSync(ccPath, "utf8");
                                        // console.log("originCode:", ccFileCode);
                                        const funcStr = getOnPostInfrastructureInitDelegateAddFuncStr(ccFileCode, true);
                                        let newCode = replaceSpineWasm(funcStr);
                                        newCode = insertFuncs(newCode);
                                        if (newCode.endsWith(";")) {
                                            newCode = newCode.slice(0, newCode.length - 1);
                                        }
                                        // fs.copyFileSync(ccPath, path.join(cocosJSPath, "cc.old.js"));
                                        ccFileCode = ccFileCode.replace(funcStr, newCode);
                                        // console.log("newCode", newCode);
                                        // console.log("newCCFileCode", ccFileCode);
                                        fs.writeFileSync(ccPath, ccFileCode, "utf8");
                                        console.log("重写cc.js 成功!");
                                    });
                                    if (filteredFiles.length === 0) {
                                        console.log("No matching JavaScript files found.");
                                    }
                                });
                            }
                            else {
                                console.log("未开启 wasm 分包策略，开始处理~");
                                let spineAsmModulePath = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-close/spine.asm.js");
                                let spineJsModulePath = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-close/spine.js.js");
                                if (compareVersions(orgVersion, "3.8.2") == -1) {
                                    console.log("版本低于 3.8.2, 选用3.8.1适配文件");
                                    spineAsmModulePath = path.join(extensionDir, "../static/spine/cocos3.8.1/wasm-subpackage-close/spine.asm.js");
                                    spineJsModulePath = path.join(extensionDir, "../static/spine/cocos3.8.1/wasm-subpackage-close/spine.js.js");
                                }
                                const spineAsmCode = fs.readFileSync(spineAsmModulePath, "utf8");
                                const spineJsCode = fs.readFileSync(spineJsModulePath, "utf8");
                                const cocosJSPath = path.join(destDir, "cocos-js");
                                console.log("正在拷贝 spine.js.mem.bin ~");
                                const assetPath = path.join(destDir, "cocos-js/assets");
                                let spineMemBin = path.join(extensionDir, "../static/spine/cocos3.8-spine-wasm-subpackage-close/spine.js.mem.bin");
                                if (compareVersions(orgVersion, "3.8.2") == -1) {
                                    console.log("版本低于 3.8.2, 选用3.8.1 spineMemBin 适配文件");
                                    spineMemBin = path.join(extensionDir, "../static/spine/cocos3.8.1/wasm-subpackage-close/spine.js.mem.bin");
                                }
                                const targetFile = path.join(assetPath, "spine.js.mem.bin");
                                fs.copyFileSync(spineMemBin, targetFile);
                                fs.readdir(cocosJSPath, (err, files) => {
                                    files.forEach((file) => {
                                        let filePath = path.join(cocosJSPath, file);
                                        if (file.startsWith("spine.asm-")) {
                                            console.log("正在重写 spine.asm.js~");
                                            fs.writeFileSync(filePath, spineAsmCode, "utf8");
                                        }
                                        if (file.startsWith("spine.js-")) {
                                            console.log("正在重写 spine.js.js~");
                                            fs.writeFileSync(filePath, spineJsCode, "utf8");
                                        }
                                        if (file.startsWith("_virtual_cc")) {
                                            let ccFileCode = fs.readFileSync(filePath, "utf8");
                                            const funcStr = getOnPostInfrastructureInitDelegateAddFuncStr(ccFileCode, false);
                                            let newCode = replaceSpineWasm(funcStr);
                                            newCode = insertFuncs(newCode);
                                            if (newCode.endsWith(";")) {
                                                newCode = newCode.slice(0, newCode.length - 1);
                                            }
                                            ccFileCode = ccFileCode.replace(funcStr, newCode);
                                            fs.writeFileSync(filePath, ccFileCode, "utf8");
                                            console.log("重新_virtual_cc.js 成功!");
                                        }
                                    });
                                });
                            }
                        }
                        else {
                            console.log("版本大于等于3.8.3，开始适配");
                        }
                    }
                    console.log("bilibili小游戏构建成功!");
                }
            }
            catch (error) {
                console.log("文件下载失败:", error);
            }
        }
        const uuidTestMap = {
            image: "57520716-48c8-4a19-8acf-41c9f8777fb0",
        };
        for (const name of Object.keys(uuidTestMap)) {
            const uuid = uuidTestMap[name];
            console.debug(`containsAsset of ${name}`, result.containsAsset(uuid));
            console.debug(`getAssetPathInfo of ${name}`, result.getAssetPathInfo(uuid));
            console.debug(`getRawAssetPaths of ${name}`, result.getRawAssetPaths(uuid));
            console.debug(`getJsonPathInfo of ${name}`, result.getJsonPathInfo(uuid));
        }
    });
};
exports.onAfterBuild = onAfterBuild;
const unload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${PACKAGE_NAME}] Unload cocos plugin example in builder.`);
    });
};
exports.unload = unload;
const onError = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo some thing
        console.warn(`${PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
const onBeforeMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`onBeforeMake: root: ${root}, options: ${options}`);
    });
};
exports.onBeforeMake = onBeforeMake;
const onAfterMake = function (root, options) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`onAfterMake: root: ${root}, options: ${options}`);
    });
};
exports.onAfterMake = onAfterMake;
