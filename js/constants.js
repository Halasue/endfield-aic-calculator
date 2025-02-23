/**
 * @file constants.js
 * @description アプリケーション内で使用する定数の定義
 */

export const NODE_TYPE = {
    ITEM: "item",
    EQUIPMENT: "equipment",
};

export const TREE_DIRECTION = {
    TOP_DOWN: "top-down",
    RIGHT_LEFT: "right-left",
};

export const NODE_CONFIG = {
    [NODE_TYPE.ITEM]: {
        WIDTH: 150,
        HEIGHT: 100,
        COLOR: "rgb(245,245,245)",
        RADIUS: 10,
        TEXTCOLOR: "rgb(0,0,0)",
        FONTSIZE: "12px",
    },
    [NODE_TYPE.EQUIPMENT]: {
        WIDTH: 200,
        HEIGHT: 120,
        RADIUS: 10,
        COLOR: "rgb(51,51,51)",
        TEXTCOLOR: "rgb(255,255,255)",
        FONTSIZE: "14px",
    },
};
