"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetHandlers = exports.configs = exports.unload = exports.load = void 0;
const load = function () {
    console.log('cocos-build-template load');
};
exports.load = load;
const unload = function () {
    console.log('cocos-build-template unload');
};
exports.unload = unload;
exports.configs = {
    '*': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: {
            isBiliGame: {
                label: '导出为bilibili小游戏',
                description: '是否导出为bilibili小游戏?（只在构建微信小游戏生效）',
                default: true,
                render: {
                    ui: 'ui-checkbox',
                },
            },
            biliGameAppId: {
                label: '小游戏AppId',
                description: '小游戏AppId）',
                render: {
                    ui: 'ui-input',
                },
            },
            biliGameVersion: {
                label: '游戏版本号（默认1.0.0）',
                description: '游戏版本号',
                render: {
                    ui: 'ui-input',
                },
            },
        }
    },
};
exports.assetHandlers = './asset-handlers';
