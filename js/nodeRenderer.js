/**
 * @file nodeRenderer.js
 * @description ノード描画処理（背景、画像、clipPath、テキスト）
 */

import { getSpriteData } from "./dataManager.js";
import { getCachedImage } from "./imageCache.js";
import { Item } from "./item.js";
import { Facility } from "./facility.js";
import { NODE_TYPE, NODE_CONFIG } from "./constants.js";

// --- 画像スケール ---
const IMAGE_CONFIG = {
    [NODE_TYPE.ITEM]: { SCALEFACTOR: 0.6 },
    [NODE_TYPE.EQUIPMENT]: { SCALEFACTOR: 1 },
};

/**
 * ノード背景（矩形）を描画する。
 * @param {d3.Selection} nodeSelection - ノード群の d3 Selection
 */
export function drawNodeRect(nodeSelection) {
    nodeSelection
        .append("rect")
        .attr("width", (d) => NODE_CONFIG[d.data.type].WIDTH)
        .attr("height", (d) => NODE_CONFIG[d.data.type].HEIGHT)
        .attr("x", (d) => -NODE_CONFIG[d.data.type].WIDTH / 2)
        .attr("y", (d) => -NODE_CONFIG[d.data.type].HEIGHT / 2)
        .attr("rx", (d) => NODE_CONFIG[d.data.type].RADIUS)
        .attr("ry", (d) => NODE_CONFIG[d.data.type].RADIUS)
        .attr("fill", (d) => NODE_CONFIG[d.data.type].COLOR)
        .attr("stroke", "none")
        .attr("filter", "url(#dropShadow)");
}

/**
 * ノードの画像を描画する。
 * @param {d3.Selection} nodeSelection - ノード群の d3 Selection
 */
export function drawNodeImage(nodeSelection) {
    const spriteData = getSpriteData();

    nodeSelection.append("image").each(function (d) {
        const category = spriteData.categories[d.data.type];
        const cachedImage = getCachedImage(category.spriteSheet);
        const tileSize = category.tileSize;
        const scaleFactor = IMAGE_CONFIG[d.data.type].SCALEFACTOR;

        const { sprite_col, sprite_row } =
            d.data.type === NODE_TYPE.EQUIPMENT
                ? Facility.getFacilityById(d.data.id)
                : Item.getItemById(d.data.id);

        d3.select(this)
            .attr("xlink:href", category.spriteSheet)
            .attr("x", -((sprite_col * tileSize + tileSize / 2) * scaleFactor))
            .attr("y", -((sprite_row * tileSize + tileSize / 2) * scaleFactor))
            .attr("width", cachedImage.naturalWidth * scaleFactor)
            .attr("height", cachedImage.naturalHeight * scaleFactor)
            .attr("clip-path", `url(#clip-${d.data.id})`);
    });
}

/**
 * ノードの clipPath を設定する。
 * @param {d3.Selection} nodeSelection - ノード群の d3 Selection
 */
export function addClipPath(nodeSelection) {
    const spriteData = getSpriteData();

    nodeSelection
        .append("clipPath")
        .attr("id", (d) => `clip-${d.data.id}`)
        .append("rect")
        .each(function (d) {
            const category = spriteData.categories[d.data.type];
            const tileSize = category.tileSize;
            const scaleFactor = IMAGE_CONFIG[d.data.type].SCALEFACTOR;

            d3.select(this)
                .attr("x", -(tileSize * scaleFactor) / 2)
                .attr("y", -(tileSize * scaleFactor) / 2)
                .attr("width", tileSize * scaleFactor)
                .attr("height", tileSize * scaleFactor);
        });
}

/**
 * ノードのテキストを描画する。
 * @param {d3.Selection} nodeSelection - ノード群の d3 Selection
 */
export function drawNodeText(nodeSelection) {
    nodeSelection
        .append("text")
        .attr("text-anchor", "middle")
        .style("font-size", (d) => NODE_CONFIG[d.data.type].FONTSIZE)
        .style("fill", (d) => NODE_CONFIG[d.data.type].TEXTCOLOR)
        .selectAll("tspan")
        .data((d) => [d.data.id, `${d.data.required.toFixed(2)}/min`])
        .enter()
        .append("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => (i === 0 ? "-0.2em" : "1.2em"))
        .text((d) => d);
}

/**
 * メインのノード描画処理（背景・画像・clipPath・テキスト）
 * @param {d3.Selection} g - 描画グループ
 * @param {Object} root - d3.hierarchy オブジェクトルート
 */
export function drawNodes(g, root) {
    const nodeSelection = g
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    drawNodeRect(nodeSelection);
    drawNodeImage(nodeSelection);
    addClipPath(nodeSelection);
    drawNodeText(nodeSelection);
}
