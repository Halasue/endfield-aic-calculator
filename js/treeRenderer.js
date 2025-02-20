import { spriteData } from "./app.js";
import { getCachedImage } from "./imageCache.js";
import { getItem, getFacility } from "./treeDataBuilder.js";

/**
 * treeRenderer.js
 *
 * ツリー構造のデータをもとに、D3.js を用いてツリー全体を表示領域に収めた状態で中央に配置する描画処理。
 */

/* ===============================
   設定 & 定数
   =============================== */

// ノードのサイズ設定（ノードの種類によってサイズが異なる）
const ITEM_NODE_WIDTH = 150;
const ITEM_NODE_HEIGHT = 100;
const EQUIPMENT_NODE_WIDTH = 200;
const EQUIPMENT_NODE_HEIGHT = 120;

// ノードの角丸半径
const NODE_RADIUS = 10;

// ツリー内のノード間隔（d.x：上下, d.y：左右）
const NODE_VERTICAL_SPACING = 120;
const NODE_HORIZONTAL_SPACING = 200;

// ツリー初期表示時の左右余白
const TREE_PADDING = 10;

// 必要に応じてズームの制限を設定
const ZOOM_SCALE_MIN = 0.2;
const ZOOM_SCALE_MAX = 5;

const ITEM_IMAGE_SCALE_FACTOR = 0.3;
const EQUIPMENT_IMAGE_SCALE_FACTOR = 0.5;

/* ===============================
   ユーティリティ関数
   =============================== */

/**
 * ツリー全体のサイズを計算する関数
 * ノードのタイプに応じたサイズを考慮して、各ノードの最小／最大座標から
 * ツリー全体の横幅・高さを求める。
 *
 * @param {Object} root - ツリーのルート（d3.hierarchy オブジェクト）
 * @returns {Object} ツリーの横幅、縦幅、x軸の最小・最大、y軸の最小・最大
 */
function getTreeSize(root) {
    const allNodes = root.descendants();

    // 各ノードの上下方向（d.x）の座標を求める
    const xValues = allNodes.flatMap((d) => {
        const nodeHeight =
            d.data.type === "equipment"
                ? EQUIPMENT_NODE_HEIGHT
                : ITEM_NODE_HEIGHT;
        return [d.x - nodeHeight / 2, d.x + nodeHeight / 2];
    });

    // 各ノードの左右方向（d.y）の座標を求める
    const yValues = allNodes.flatMap((d) => {
        const nodeWidth =
            d.data.type === "equipment"
                ? EQUIPMENT_NODE_WIDTH
                : ITEM_NODE_WIDTH;
        return [d.y - nodeWidth / 2, d.y + nodeWidth / 2];
    });

    const xExtent = d3.extent(xValues); // [最小, 最大] (上下)
    const yExtent = d3.extent(yValues); // [最小, 最大] (左右)

    const treeWidth = yExtent[1] - yExtent[0]; // 横幅
    const treeHeight = xExtent[1] - xExtent[0]; // 高さ

    return { treeWidth, treeHeight, xExtent, yExtent };
}

/**
 * コンテナ内に SVG とメインのグループ要素 (g) を生成する関数
 *
 * @param {HTMLElement|string} container - コンテナの要素またはセレクタ
 * @returns {Object} SVG要素、グループ要素、コンテナの横幅、コンテナの高さ
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
 * SVG にズーム機能を設定する関数
 *
 * @param {d3.Selection} svg - SVG 要素
 * @param {d3.Selection} g - ズーム対象のグループ
 * @param {number} width - SVG の横幅
 * @param {number} height - SVG の高さ
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
 * SVG にドロップシャドウのフィルターを追加する関数
 *
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
 * ツリーのリンク（枝）を描画する関数
 *
 * @param {d3.Selection} g - リンクを描画するグループ要素
 * @param {Object} root - ツリーのルート（d3.hierarchy オブジェクト）
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
                .x((d) => -d.y) // 左右反転
                .y((d) => d.x)
        )
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);
}

/**
 * ツリーのノード（矩形とテキスト）を描画する関数
 *
 * @param {d3.Selection} g - ノードを描画するグループ要素
 * @param {Object} root - ツリーのルート（d3.hierarchy オブジェクト）
 */
function drawNodes(g, root) {
    const isEquipment = (d) => d.data.type === "equipment";

    const node = g
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => "translate(" + -d.y + "," + d.x + ")"); // 左右反転

    // ノードの矩形を描画
    node.append("rect")
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

    // 画像表示
    const itemSpriteSheet = spriteData.categories.item.spriteSheet;
    const equipmentSpriteSheet = spriteData.categories.equipment.spriteSheet;

    const itemTileSize = spriteData.categories.item.tileSize;
    const equipmentTileSize = spriteData.categories.equipment.tileSize;

    const cachedItemImage = getCachedImage(itemSpriteSheet);
    const cachedEquipmentImage = getCachedImage(equipmentSpriteSheet);

    let itemImageWidth = cachedItemImage.naturalWidth;
    let itemImageHeight = cachedItemImage.naturalHeight;

    let equipmentImageWidth = cachedEquipmentImage.naturalWidth;
    let equipmentImageHeight = cachedEquipmentImage.naturalHeight;

    node.append("image")
        .attr("xlink:href", (d) => {
            return isEquipment(d) ? equipmentSpriteSheet : itemSpriteSheet;
        })
        .attr("x", (d) =>
            isEquipment(d)
                ? -(
                      (getFacility(d.data.id).sprite_x * equipmentTileSize +
                          equipmentTileSize / 2) *
                      EQUIPMENT_IMAGE_SCALE_FACTOR
                  )
                : -(
                      (getItem(d.data.id).sprite_x * itemTileSize +
                          itemTileSize / 2) *
                      ITEM_IMAGE_SCALE_FACTOR
                  )
        )
        .attr("y", (d) =>
            isEquipment(d)
                ? -(
                      (getFacility(d.data.id).sprite_y * equipmentTileSize +
                          equipmentTileSize / 2) *
                      EQUIPMENT_IMAGE_SCALE_FACTOR
                  )
                : -(
                      (getItem(d.data.id).sprite_y * itemTileSize +
                          itemTileSize / 2) *
                      ITEM_IMAGE_SCALE_FACTOR
                  )
        )

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

    // スプライトの切り抜き
    node.append("clipPath")
        .attr("id", (d) => `clip-${d.data.id}`)
        .append("rect")
        .attr("x", (d) =>
            isEquipment(d)
                ? (-equipmentTileSize * EQUIPMENT_IMAGE_SCALE_FACTOR) / 2
                : (-itemTileSize * ITEM_IMAGE_SCALE_FACTOR) / 2
        )
        .attr("y", (d) =>
            isEquipment(d)
                ? (-equipmentTileSize * EQUIPMENT_IMAGE_SCALE_FACTOR) / 2
                : (-itemTileSize * ITEM_IMAGE_SCALE_FACTOR) / 2
        )
        .attr("width", (d) =>
            isEquipment(d)
                ? equipmentTileSize * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemTileSize * ITEM_IMAGE_SCALE_FACTOR
        )
        .attr("height", (d) =>
            isEquipment(d)
                ? equipmentTileSize * EQUIPMENT_IMAGE_SCALE_FACTOR
                : itemTileSize * ITEM_IMAGE_SCALE_FACTOR
        );

    // ノード内にテキスト（2行表示）を描画
    node.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", (d) => (isEquipment(d) ? "14px" : "12px"))
        .selectAll("tspan")
        .data((d) => [
            d.data.id,
            isEquipment(d)
                ? d.data.required
                : d.data.required.toFixed(2) + "/min",
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
 * ツリー全体がコンテナに収まるように、初期ズーム（変換）を計算して適用する関数
 *
 * @param {d3.ZoomBehavior} zoom - ズーム動作
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} root - ツリーのルート（d3.hierarchy オブジェクト）
 * @param {number} width - SVG の横幅
 * @param {number} height - SVG の高さ
 * @returns 初期のズーム変換情報
 */
function applyInitialTransform(zoom, svg, root, width, height) {
    const { treeWidth, treeHeight, xExtent, yExtent } = getTreeSize(root);

    // 表示領域に収めるためのスケールを計算
    const scaleX = (width - 2 * TREE_PADDING) / treeWidth;
    const scaleY = height / treeHeight;
    let desiredScale = Math.min(scaleX, scaleY);
    console.log(`scaleX:${scaleX} scaleY:${scaleY}`);

    desiredScale = Math.min(desiredScale, ZOOM_SCALE_MAX);

    // ツリー全体の中心を求める
    const centerX = -((yExtent[0] + yExtent[1]) / 2); //左右反転
    const centerY = (xExtent[0] + xExtent[1]) / 2;

    // 初期変換：ツリー中心をコンテナの中央に持ってくる
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(desiredScale)
        .translate(-centerX, -centerY);

    svg.call(zoom.transform, initialTransform);
    return initialTransform;
}

/**
 * リセットボタン（id="resetZoom"）が存在する場合に、
 * 初期状態に戻すイベントを設定する関数
 *
 * @param {d3.ZoomBehavior} zoom - ズーム動作
 * @param {d3.Selection} svg - SVG 要素
 * @param {Object} initialTransform - 初期ズーム変換
 */
function addResetButton(zoom, svg, initialTransform) {
    d3.select("#resetZoom").on("click", function () {
        svg.transition().duration(750).call(zoom.transform, initialTransform);
    });
}

/* ===============================
   メイン描画処理
   =============================== */

/**
 * ツリーを描画するメイン関数
 *
 * @param {Object} treeData - ツリーの階層データ
 * @param {HTMLElement|string} container - コンテナの要素またはセレクタ
 */
export function renderTree(treeData, container) {
    // コンテナ内に SVG とグループ要素を作成
    const { svg, g, width, height } = createSVG(container);

    // ズーム機能を設定
    const zoom = setupZoom(svg, g, width, height);

    //ドロップシャドウのフィルターを追加
    addDropShadow(svg);

    // 階層構造を作成し、ツリーのレイアウトを計算
    const root = d3.hierarchy(treeData);
    const treeLayout = d3
        .tree()
        .nodeSize([NODE_VERTICAL_SPACING, NODE_HORIZONTAL_SPACING]);
    treeLayout(root);

    // ツリーのリンク（枝）を描画
    drawLinks(g, root);

    // ツリーのノード（矩形とテキスト）を描画
    drawNodes(g, root);

    // ツリー全体が表示領域に収まるよう初期ズームを適用
    const initialTransform = applyInitialTransform(
        zoom,
        svg,
        root,
        width,
        height
    );

    // リセットボタンがあれば、初期状態に戻すイベントを設定
    addResetButton(zoom, svg, initialTransform);
}
