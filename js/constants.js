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
        WIDTH: 100,
        HEIGHT: 35,
        RADIUS: 5,
        COLOR: "rgb(245,245,245)",
        TEXT: {
            COLOR: "rgb(0,0,0)",
            FONTSIZE: "10px",
        },
        IMAGE_CONFIG: {
            SCALEFACTOR: 0.6,
            Y_OFFSET: -45,
        },
    },
    [NODE_TYPE.EQUIPMENT]: {
        WIDTH: 150,
        HEIGHT: 55,
        RADIUS: 10,
        COLOR: "rgb(51,51,51)",
        TEXT: {
            COLOR: "rgb(255,255,255)",
            FONTSIZE: "14px",
        },
        IMAGE_CONFIG: {
            SCALEFACTOR: 0.8,
            Y_OFFSET: -65,
        },
    },
};
