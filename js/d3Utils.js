/**
 * @file d3Utils.js
 * @description D3.js の共通処理ユーティリティ
 */

import { NODE_CONFIG } from "./constants.js";

// --- ズーム設定関連 ---
const ZOOM_CONFIG = { MIN: 0.2, MAX: 5 };
const TREE_MARGIN_VERTICAL = 80;
const TREE_MARGIN_HORIZONTAL = 50;


/**
 * ツリー全体のサイズを算出する。
 * @param {Object} root - d3.hierarchy のルートノード
 * @returns {Object} 計算結果（ツリー幅、高さ、範囲情報）
 */
export function getTreeSize(root) {
    const nodes = root.descendants();
    if (nodes.length === 0) {
        console.warn("getTreeSize: No nodes found in tree");
        return {
            treeWidth: 0,
            treeHeight: 0,
            xExtent: [0, 0],
            yExtent: [0, 0],
        };
    }

    const xValues = nodes.flatMap((d) => {
        const width = NODE_CONFIG[d.data.type].WIDTH;
        return [d.x - width / 2, d.x + width / 2];
    });

    const yValues = nodes.flatMap((d) => {
        const height = NODE_CONFIG[d.data.type].HEIGHT;
        return [d.y - height / 2, d.y + height / 2];
    });

    return {
        treeWidth: Math.max(...xValues) - Math.min(...xValues),
        treeHeight: Math.max(...yValues) - Math.min(...yValues),
        xExtent: [Math.min(...xValues), Math.max(...xValues)],
        yExtent: [Math.min(...yValues), Math.max(...yValues)],
    };
}

/**
 * コンテナ内に SVG および描画用グループを生成する。
 * @param {HTMLElement|string} container - コンテナ要素またはセレクタ
 * @returns {Object} { svg, g, width, height } - 生成された SVG, グループ, 幅, 高さ
 */
export function createSVG(container) {
    const containerEl = d3.select(container).node();
    const { width, height } = containerEl.getBoundingClientRect();

    const svg = d3
        .select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid slice");

    const g = svg.append("g");
    return { svg, g, width, height };
}

/**
 * SVG にズーム機能を設定する。
 * @param {d3.Selection} svg - SVG 要素
 * @param {d3.Selection} g - ズーム対象グループ
 * @returns {d3.ZoomBehavior} ズーム動作オブジェクト
 */
export function setupZoom(svg, g) {
    const zoom = d3
        .zoom()
        .scaleExtent([ZOOM_CONFIG.MIN, ZOOM_CONFIG.MAX])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);
    return zoom;
}

/**
 * SVG にドロップシャドウフィルターを追加する。
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} [config] - シャドウ設定（オプション）
 */
export function addDropShadow(
    svg,
    config = { dx: 2, dy: 2, blur: 3, opacity: 0.5 }
) {
    const defs = svg.append("defs");
    const filter = defs
        .append("filter")
        .attr("id", "dropShadow")
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%");

    filter
        .append("feFlood")
        .attr("flood-color", `rgba(20, 20, 20, ${config.opacity})`)
        .attr("result", "colorBlur");

    filter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", config.blur)
        .attr("result", "blur");

    filter
        .append("feComposite")
        .attr("in", "colorBlur")
        .attr("in2", "blur")
        .attr("operator", "in")
        .attr("result", "coloredShadow");

    filter
        .append("feOffset")
        .attr("in", "coloredShadow")
        .attr("dx", config.dx)
        .attr("dy", config.dy)
        .attr("result", "offsetBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}

/**
 * 初期ズーム設定を適用する。
 * @param {d3.ZoomBehavior} zoom - ズーム動作オブジェクト
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} root - d3.hierarchy ルート
 * @param {number} width - SVG 横幅
 * @param {number} height - SVG 高さ
 * @returns {Object} 初期変換情報
 */
export function applyInitialTransform(zoom, svg, root, width, height) {
    if (!zoom) {
        console.error("Zoom object is undefined!");
        return;
    }

    const { treeWidth, treeHeight, xExtent, yExtent } = getTreeSize(root);
    const scale = Math.min(
        (width - TREE_MARGIN_HORIZONTAL) / treeWidth,
        (height - TREE_MARGIN_VERTICAL) / treeHeight,
        ZOOM_CONFIG.MAX
    );

    const [xMin, xMax] = xExtent;
    const [yMin, yMax] = yExtent;

    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-(xMin + xMax) / 2, -(yMin + yMax) / 2);

    const translateY = 50;
    svg.call(zoom.transform, initialTransform.translate(0, translateY)); // Y軸方向に20ピクセルオフセット

    return initialTransform;
}

/**
 * リセットボタンのイベントを設定する。
 * @param {d3.ZoomBehavior} zoom - ズーム動作オブジェクト
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} initialTransform - 初期変換情報
 */
export function addResetButton(zoom, svg, initialTransform) {
    d3.select("#resetZoom").on("click", () => {
        svg.transition().duration(750).call(zoom.transform, initialTransform);
    });
}
