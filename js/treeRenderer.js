/**
 * @file treeRenderer.js
 * @description ツリー描画のメイン処理
 */

import {
    createSVG,
    setupZoom,
    addDropShadow,
    applyInitialTransform,
    addResetButton,
} from "./d3Utils.js";

import { drawLinks } from "./linkRenderer.js";
import { drawNodes } from "./nodeRenderer.js";
import { TREE_DIRECTION } from "./constants.js";

/** ノードサイズの定義 */
const DEFAULT_NODE_CONFIG = {
    WIDTH: 160,
    HEIGHT: 120,
    SIBLINGSEPARATION: 2,
    NONSIBLINGSEPARATION: 2,
};

/**
 * ツリーのレイアウトを設定する。
 * d3.hierarchy の構造に基づき、各ノードの位置関係を決定する。
 *
 * @param {Object} root - d3.hierarchy のルートノード
 * @param {string} direction - ツリーの向き
 * @returns {Object} 設定済みのツリー構造
 */
function setupTreeLayout(root, direction = TREE_DIRECTION.RIGHT_LEFT) {
    const treeLayout = d3.tree();

    if (direction === TREE_DIRECTION.TOP_DOWN) {
        treeLayout.nodeSize([
            DEFAULT_NODE_CONFIG.WIDTH,
            DEFAULT_NODE_CONFIG.HEIGHT,
        ]);
    } else {
        treeLayout.nodeSize([
            DEFAULT_NODE_CONFIG.HEIGHT,
            DEFAULT_NODE_CONFIG.WIDTH,
        ]); // 幅と高さを入れ替え
    }

    const tree = treeLayout(root);

    if (direction === TREE_DIRECTION.RIGHT_LEFT) {
        tree.each((node) => {
            const tempX = node.x;
            node.x = -node.y; // X 軸と Y 軸を入れ替え、反転
            node.y = tempX;
        });
    }

    return tree;
}

/**
 * ツリーを描画するメイン関数
 * - SVG を作成
 * - ズーム機能を設定
 * - ノードとリンクを描画
 * - 初期ズーム位置を適用
 * - リセットボタンを設定
 *
 * @param {Object} treeData - ツリーデータ（生産ツリー）
 * @param {HTMLElement|string} container - コンテナ要素またはセレクタ
 * @param {string} direction - ツリーの向き
 */
export function renderTree(
    treeData,
    container,
    direction = TREE_DIRECTION.RIGHT_LEFT
) {
    // SVG および描画用グループを作成
    const { svg, g, width, height } = createSVG(container);
    const zoom = setupZoom(svg, g);
    addDropShadow(svg);

    // d3.hierarchy 構造を生成し、レイアウトを適用
    const root = d3.hierarchy(treeData);
    setupTreeLayout(root, direction);

    // ノード間のリンクを描画
    drawLinks(g, root, direction);

    // ノード本体を描画
    drawNodes(g, root);

    // 初期ズーム位置を設定
    const initialTransform = applyInitialTransform(
        zoom,
        svg,
        root,
        width,
        height
    );

    // ズームリセットボタンを追加
    addResetButton(zoom, svg, initialTransform);
}
