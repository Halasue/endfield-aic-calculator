/**
 * @file treeRenderer.js
 * @description D3.js 利用によるツリー描画処理
 */
import { getSpriteData } from "./dataManager.js";
import { getCachedImage } from "./imageCache.js";
import { Item } from "./item.js";
import { Facility } from "./facility.js";

// 定数定義
const ITEM_NODE_WIDTH = 150;
const ITEM_NODE_HEIGHT = 100;

const EQUIPMENT_NODE_WIDTH = 200;
const EQUIPMENT_NODE_HEIGHT = 120;

const NODE_RADIUS = 10;
const NODE_VERTICAL_SPACING = 120;
const NODE_HORIZONTAL_SPACING = 200;

const TREE_PADDING = 10;

const ZOOM_SCALE_MIN = 0.2;
const ZOOM_SCALE_MAX = 5;

const ITEM_IMAGE_SCALE_FACTOR = 0.3;
const EQUIPMENT_IMAGE_SCALE_FACTOR = 0.5;

/**
 * ツリー全体サイズ算出処理
 * @param {Object} root - d3.hierarchy オブジェクトルート
 * @returns {Object} {treeWidth, treeHeight, xExtent, yExtent} 座標範囲情報
 */
function getTreeSize(root) {
    const allNodes = root.descendants();

    const xValues = allNodes.flatMap((d) => {
        const nodeHeight =
            d.data.type === "equipment"
                ? EQUIPMENT_NODE_HEIGHT
                : ITEM_NODE_HEIGHT;
        return [d.x - nodeHeight / 2, d.x + nodeHeight / 2];
    });

    const yValues = allNodes.flatMap((d) => {
        const nodeWidth =
            d.data.type === "equipment"
                ? EQUIPMENT_NODE_WIDTH
                : ITEM_NODE_WIDTH;
        return [d.y - nodeWidth / 2, d.y + nodeWidth / 2];
    });

    const xExtent = d3.extent(xValues);
    const yExtent = d3.extent(yValues);

    const treeWidth = yExtent[1] - yExtent[0];
    const treeHeight = xExtent[1] - xExtent[0];

    return { treeWidth, treeHeight, xExtent, yExtent };
}

/**
 * コンテナ内 SVG および描画用グループ生成処理
 * @param {HTMLElement|string} container - コンテナ要素またはセレクタ
 * @returns {Object} {svg, g, width, height} SVG要素とコンテナ寸法
 */
function createSVG(container) {
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
 * SVG ズーム機能設定処理
 * @param {d3.Selection} svg - SVG 要素
 * @param {d3.Selection} g - ズーム対象グループ
 * @param {number} width - SVG 横幅
 * @param {number} height - SVG 高さ
 * @returns {d3.ZoomBehavior} ズーム動作
 */
function setupZoom(svg, g, width, height) {
    const zoom = d3
        .zoom()
        .scaleExtent([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);
    return zoom;
}

/**
 * SVG ドロップシャドウフィルター追加処理
 * @param {d3.Selection} svg - SVG 要素
 */
function addDropShadow(svg) {
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
        .attr("flood-color", "rgba(20, 20, 20, 0.5)")
        .attr("result", "colorBlur");
    filter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 3)
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
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offsetBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}

/**
 * ツリーリンク（枝）描画処理
 * @param {d3.Selection} g - 描画グループ
 * @param {Object} root - d3.hierarchy オブジェクトルート
 */
function drawLinks(g, root) {
    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr(
            "d",
            d3
                .linkHorizontal()
                .x((d) => -d.y)
                .y((d) => d.x)
        )
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);
}

/**
 * ノード画像描画処理
 * ※対象カテゴリごとに画像ソース・タイルサイズ参照
 * 　各ノードの sprite_col, sprite_row から中心位置算出、スケール乗算により配置補正
 * @param {d3.Selection} nodeSelection - ノード群 d3 Selection
 * @param {Function} isEquipment - 設備判定関数
 */
function renderNodeImage(nodeSelection, isEquipment) {
    const spriteDataLocal = getSpriteData();

    const itemCategory = spriteDataLocal.categories.item;
    const equipmentCategory = spriteDataLocal.categories.equipment;

    const cachedItemImage = getCachedImage(itemCategory.spriteSheet);
    const cachedEquipmentImage = getCachedImage(equipmentCategory.spriteSheet);

    const itemTileSize = itemCategory.tileSize;
    const equipmentTileSize = equipmentCategory.tileSize;

    const itemImageWidth = cachedItemImage ? cachedItemImage.naturalWidth : 0;
    const itemImageHeight = cachedItemImage ? cachedItemImage.naturalHeight : 0;

    const equipmentImageWidth = cachedEquipmentImage
        ? cachedEquipmentImage.naturalWidth
        : 0;
    const equipmentImageHeight = cachedEquipmentImage
        ? cachedEquipmentImage.naturalHeight
        : 0;

    nodeSelection
        .append("image")
        .attr("xlink:href", (d) =>
            isEquipment(d)
                ? equipmentCategory.spriteSheet
                : itemCategory.spriteSheet
        )
        .attr("x", (d) => {
            if (isEquipment(d)) {
                const facility = Facility.getFacilityById(d.data.id);
                if (!facility) return 0;
                return -(
                    (facility.sprite_col * equipmentTileSize +
                        equipmentTileSize / 2) *
                    EQUIPMENT_IMAGE_SCALE_FACTOR
                );
            } else {
                const item = Item.getItemById(d.data.id);
                if (!item) return 0;
                return -(
                    (item.sprite_col * itemTileSize + itemTileSize / 2) *
                    ITEM_IMAGE_SCALE_FACTOR
                );
            }
        })
        .attr("y", (d) => {
            if (isEquipment(d)) {
                const facility = Facility.getFacilityById(d.data.id);
                if (!facility) return 0;
                return -(
                    (facility.sprite_row * equipmentTileSize +
                        equipmentTileSize / 2) *
                    EQUIPMENT_IMAGE_SCALE_FACTOR
                );
            } else {
                const item = Item.getItemById(d.data.id);
                if (!item) return 0;
                return -(
                    (item.sprite_row * itemTileSize + itemTileSize / 2) *
                    ITEM_IMAGE_SCALE_FACTOR
                );
            }
        })
        .attr("width", (d) =>
            isEquipment(d)
                ? equipmentImageWidth * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemImageWidth * ITEM_IMAGE_SCALE_FACTOR
        )
        .attr("height", (d) =>
            isEquipment(d)
                ? equipmentImageHeight * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemImageHeight * ITEM_IMAGE_SCALE_FACTOR
        )
        .attr("clip-path", (d) => `url(#clip-${d.data.id})`);
}

/**
 * ノードクリップパス設定処理
 * @param {d3.Selection} nodeSelection - ノード群 d3 Selection
 * @param {Function} isEquipment - 設備判定関数
 */
function addClipPathToNodes(nodeSelection, isEquipment) {
    const spriteDataLocal = getSpriteData();
    const itemCategory = spriteDataLocal.categories.item;
    const equipmentCategory = spriteDataLocal.categories.equipment;
    nodeSelection
        .append("clipPath")
        .attr("id", (d) => `clip-${d.data.id}`)
        .append("rect")
        .attr("x", (d) => {
            return isEquipment(d)
                ? (-equipmentCategory.tileSize * EQUIPMENT_IMAGE_SCALE_FACTOR) /
                      2
                : (-itemCategory.tileSize * ITEM_IMAGE_SCALE_FACTOR) / 2;
        })
        .attr("y", (d) => {
            return isEquipment(d)
                ? (-equipmentCategory.tileSize * EQUIPMENT_IMAGE_SCALE_FACTOR) /
                      2
                : (-itemCategory.tileSize * ITEM_IMAGE_SCALE_FACTOR) / 2;
        })
        .attr("width", (d) => {
            return isEquipment(d)
                ? equipmentCategory.tileSize * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemCategory.tileSize * ITEM_IMAGE_SCALE_FACTOR;
        })
        .attr("height", (d) => {
            return isEquipment(d)
                ? equipmentCategory.tileSize * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemCategory.tileSize * ITEM_IMAGE_SCALE_FACTOR;
        });
}

/**
 * ノードおよびテキスト描画処理
 * ※1行目：ID、2行目：必要数（設備は整数、アイテムは小数点2位固定）
 * @param {d3.Selection} g - 描画用グループ
 * @param {Object} root - d3.hierarchy オブジェクトルート
 */
function drawNodes(g, root) {
    const isEquipment = (d) => d.data.type === "equipment";
    const nodeSelection = g
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${-d.y},${d.x})`); // 左右反転（d.y 符号反転）

    nodeSelection
        .append("rect")
        .attr("width", (d) =>
            isEquipment(d) ? EQUIPMENT_NODE_WIDTH : ITEM_NODE_WIDTH
        )
        .attr("height", (d) =>
            isEquipment(d) ? EQUIPMENT_NODE_HEIGHT : ITEM_NODE_HEIGHT
        )
        .attr("x", (d) =>
            isEquipment(d) ? -EQUIPMENT_NODE_WIDTH / 2 : -ITEM_NODE_WIDTH / 2
        )
        .attr("y", (d) =>
            isEquipment(d) ? -EQUIPMENT_NODE_HEIGHT / 2 : -ITEM_NODE_HEIGHT / 2
        )
        .attr("rx", NODE_RADIUS)
        .attr("ry", NODE_RADIUS)
        .attr("fill", (d) =>
            isEquipment(d) ? "rgb(51,51,51)" : "rgb(245,245,245)"
        )
        .attr("stroke", "none")
        .attr("filter", "url(#dropShadow)");

    // 画像描画
    renderNodeImage(nodeSelection, isEquipment);
    addClipPathToNodes(nodeSelection, isEquipment);

    nodeSelection
        .append("text")
        .attr("text-anchor", "middle")
        .style("font-size", (d) => (isEquipment(d) ? "14px" : "12px"))
        .selectAll("tspan")
        .data((d) => [
            d.data.id,
            isEquipment(d)
                ? d.data.required
                : `${d.data.required.toFixed(2)}/min`,
        ])
        .enter()
        .append("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => (i === 0 ? "-0.2em" : "1.2em"))
        .style("fill", (text, i, nodes) => {
            const nodeDatum = d3.select(nodes[i].parentNode).datum();
            return nodeDatum.data.type === "equipment"
                ? "rgb(255,255,255)"
                : "rgb(0,0,0)";
        })
        .text((d) => d);
}

/**
 * 初期ズーム設定適用処理
 * ※各軸範囲とコンテナサイズからスケールおよび平行移動量算出
 * （小さい方のスケール採用、左右中心は符号反転補正）
 * @param {d3.ZoomBehavior} zoom - ズーム動作
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} root - d3.hierarchy ルート
 * @param {number} width - SVG 横幅
 * @param {number} height - SVG 高さ
 * @returns {Object} 初期変換情報
 */
function applyInitialTransform(zoom, svg, root, width, height) {
    const { treeWidth, treeHeight, xExtent, yExtent } = getTreeSize(root);

    const scaleX = (width - 2 * TREE_PADDING) / treeWidth;
    const scaleY = height / treeHeight;

    let desiredScale = Math.min(scaleX, scaleY);
    desiredScale = Math.min(desiredScale, ZOOM_SCALE_MAX);

    const centerX = -((yExtent[0] + yExtent[1]) / 2); // 左右反転補正
    const centerY = (xExtent[0] + xExtent[1]) / 2;

    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(desiredScale)
        .translate(-centerX, -centerY);

    svg.call(zoom.transform, initialTransform);

    return initialTransform;
}

/**
 * リセットボタンイベント設定処理
 * @param {d3.ZoomBehavior} zoom - ズーム動作
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} initialTransform - 初期変換情報
 */
function addResetButton(zoom, svg, initialTransform) {
    d3.select("#resetZoom").on("click", function () {
        svg.transition().duration(750).call(zoom.transform, initialTransform);
    });
}

/**
 * ツリー描画メイン処理
 * @param {Object} treeData - ツリーデータ構造
 * @param {HTMLElement|string} container - 描画コンテナまたはセレクタ
 */
export function renderTree(treeData, container) {
    const { svg, g, width, height } = createSVG(container);

    const zoom = setupZoom(svg, g, width, height);

    addDropShadow(svg);

    const root = d3.hierarchy(treeData);
    const treeLayout = d3
        .tree()
        .nodeSize([NODE_VERTICAL_SPACING, NODE_HORIZONTAL_SPACING]);

    treeLayout(root);

    drawLinks(g, root);
    drawNodes(g, root);

    const initialTransform = applyInitialTransform(
        zoom,
        svg,
        root,
        width,
        height
    );
    addResetButton(zoom, svg, initialTransform);
}
