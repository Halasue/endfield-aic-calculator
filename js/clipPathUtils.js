/**
 * @file clipPathUtils.js
 * @description クリップパス計算用の共通ユーティリティ
 */

import { NODE_CONFIG } from "./constants.js";

/**
 * ノードデータからクリップパスの矩形パラメータを計算する。
 * nodeRenderer.js の addClipPath と d3Utils.js の getTreeSize で使用している計算と同一です。
 *
 * @param {Object} d - d3.hierarchy のノードデータ
 * @param {Object} spriteData - dataManager.js から取得したスプライト情報
 * @returns {Object|null} { x, y, width, height } または IMAGE_CONFIG が定義されていない場合は null
 */
export function calculateClipPathRect(d, spriteData) {
    const config = NODE_CONFIG[d.data.type];
    if (!config.IMAGE_CONFIG || !spriteData.categories[d.data.type]) {
        return null;
    }
    
    const category = spriteData.categories[d.data.type];
    const tileSize = category.tileSize;
    const scaleFactor = config.IMAGE_CONFIG.SCALEFACTOR;
    
    const x = -(tileSize * scaleFactor) / 2;
    const y = -(tileSize * scaleFactor) / 2 + config.IMAGE_CONFIG.Y_OFFSET;
    const width = tileSize * scaleFactor;
    const height = tileSize * scaleFactor;
    
    return { x, y, width, height };
} 