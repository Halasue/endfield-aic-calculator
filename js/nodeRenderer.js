/**
 * @file nodeRenderer.js
 * @description ノード描画処理（背景、画像、clipPath、テキスト）
 */

import { getSpriteData } from "./dataManager.js";
import { getCachedImage } from "./imageCache.js";
import { Item } from "./item.js";
import { Facility } from "./facility.js";
import { NODE_TYPE, NODE_CONFIG } from "./constants.js";
import { calculateClipPathRect } from "./clipPathUtils.js";
import { t,tText } from "./i18n.js";

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
        const scaleFactor = NODE_CONFIG[d.data.type].IMAGE_CONFIG.SCALEFACTOR;

        const { sprite_col, sprite_row } =
            d.data.type === NODE_TYPE.EQUIPMENT
                ? Facility.getFacilityById(d.data.id)
                : Item.getItemById(d.data.id);

        d3.select(this)
            .attr("xlink:href", category.spriteSheet)
            .attr("x", -((sprite_col * tileSize + tileSize / 2) * scaleFactor))
            .attr("y", -((sprite_row * tileSize + tileSize / 2) * scaleFactor) + NODE_CONFIG[d.data.type].IMAGE_CONFIG.Y_OFFSET)
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
            const clipRect = calculateClipPathRect(d, spriteData);
            if (clipRect) {
                d3.select(this)
                    .attr("x", clipRect.x)
                    .attr("y", clipRect.y)
                    .attr("width", clipRect.width)
                    .attr("height", clipRect.height);
            }
        });
}

/**
 * テキストが指定された最大幅を超える場合にフォントサイズを調整する関数
 * @param {string} text - テキスト内容
 * @param {number} maxWidth - テキストの最大幅
 * @param {string} initialFontSize - 初期フォントサイズ
 * @param {number} padding - 左右の余白
 * @returns {string} 調整されたフォントサイズ
 */
function adjustFontSizeToFit(text, maxWidth, initialFontSize, padding = 3) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let fontSize = parseInt(initialFontSize, 10);
    context.font = `${fontSize}px sans-serif`;

    // テキストが最大幅を超える場合、フォントサイズを調整
    while (context.measureText(text).width > (maxWidth - padding * 2) && fontSize > 6) { // 最小フォントサイズを6pxに設定
        fontSize -= 1;
        context.font = `${fontSize}px sans-serif`;
    }
    return `${fontSize}px`;
}

/**
 * ノードのテキストを描画する。
 * @param {d3.Selection} nodeSelection - ノード群の d3 Selection
 */
export function drawNodeText(nodeSelection) {
    nodeSelection.each(function(d) {
        const config = NODE_CONFIG[d.data.type];
        const group = d3.select(this);
        const maxWidth = config.WIDTH;
        const baseFontSize = parseInt(config.TEXT.FONTSIZE, 10);

        const localizedName = d.data.type === NODE_TYPE.EQUIPMENT
            ? t(Facility.getFacilityById(d.data.id) || { name_jp: d.data.id, name_en: d.data.id })
            : t(Item.getItemById(d.data.id) || { name_jp: d.data.id, name_en: d.data.id });

        const nameFontSize = adjustFontSizeToFit(localizedName, maxWidth, config.TEXT.FONTSIZE);

        // 1行目：ノード名称を表示
        group.append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", -5)
            .text(localizedName)
            .style("font-size", nameFontSize)
            .style("fill", config.TEXT.COLOR);

        // 2行目：生産数のテキスト
        const productionText = d.data.type === NODE_TYPE.EQUIPMENT
            ? `${d.data.required.toFixed(0)} ${tText("units")}`
            : `${d.data.required.toFixed(2)}/min`;

        group.append("text")
            .attr("text-anchor", "middle")
            .attr("x", 0)
            .attr("y", baseFontSize + 2)
            .text(productionText)
            .style("font-size", config.TEXT.FONTSIZE)
            .style("fill", config.TEXT.COLOR);
    });
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