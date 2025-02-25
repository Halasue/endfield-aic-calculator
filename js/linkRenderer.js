/**
 * @file linkRenderer.js
 * @description ツリーリンク（枝）描画処理
 */

import { TREE_DIRECTION } from "./constants.js";

/**
 * ツリーのリンク（枝）を描画する。
 * @param {d3.Selection} g - 描画グループ
 * @param {Object} root - d3.hierarchy のルートノード
 * @param {string} direction - ツリーの向き
 */
export function drawLinks(g, root, direction = TREE_DIRECTION.RIGHT_LEFT) {
    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr(
            "d",
            direction === TREE_DIRECTION.TOP_DOWN
                ? d3
                      .linkVertical()
                      .x((d) => d.x)
                      .y((d) => d.y) // 縦向きツリー
                : d3
                      .linkHorizontal()
                      .x((d) => d.x)
                      .y((d) => d.y) // 横向きツリー
        )
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);
}
