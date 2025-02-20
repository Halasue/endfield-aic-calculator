import {
    itemsData,
    recipesData,
    facilitiesData,
    materialsData,
} from "./app.js";
/**
 * treeDataBuilder.js
 *
 * 指定したアイテムIDと1分あたり必要な個数から、ツリー構造のデータを構築する。
 * 各ノードは以下の形式を持つ:
 * {
 *   type: "item" or "equipment",
 *   name: 表示用名称,
 *   required: 数値,  // アイテムの場合は1分あたり必要な個数、設備の場合は必要設備数
 *   children: [ ... ]
 * }
 *
 * 再帰呼び出しによるループ防止のため、visited（Set）を利用する。
 */

/* =========================================
   ツリー構築用ユーティリティ関数
   ========================================= */

/**
 * アイテムIDからアイテム情報を取得する
 * （見つからなければ null を返す）
 */
export function getItem(itemId) {
    return itemsData.find((x) => x.item_id === itemId) || null;
}

/**
 * 設備IDからアイテム情報を取得する
 * （見つからなければ null を返す）
 */
export function getFacility(facilityId) {
    return facilitiesData.find((x) => x.facility_id === facilityId || null);
}

/**
 * アイテムノードを作成する
 * アイテムが存在しない場合は Error を表示する。
 */
function createItemNode(item, requiredPerMinute) {
    return {
        type: "item",
        id: item ? item.item_id : "Error", // 該当アイテムが存在しない場合 Errorを表示
        required: requiredPerMinute,
        children: [],
    };
}

/**
 * 設備ノードを作成する
 * 設備が存在しない場合は Error を表示する。
 */
function createEquipmentNode(facility, equipmentCount) {
    return {
        type: "equipment",
        id: facility.facility_id ? facility.facility_id : "Error", // 該当設備が存在しない場合 Errorを表示
        required: equipmentCount,
        children: [],
    };
}

/**
 * レシピから設備ノードを作成し、
 * 該当レシピの原料について再帰的にツリーを構築して子ノードに追加する。
 */
function processRecipe(recipe, requiredPerMinute, visited) {
    // 対応する設備情報を取得
    const facility = getFacility(recipe.facility_id);
    if (!facility) return null; // 設備情報が見つからなければ処理をスキップ

    // 1サイクルあたりの処理時間と出力数を取得
    const processTime = facility.process_time; // 単位: 分
    const outputQuantity = recipe.output_quantity; // 1サイクルの出力数

    // 必要な設備数を計算（切り上げ）
    const equipmentCount = Math.ceil(
        (requiredPerMinute * processTime) / outputQuantity
    );

    // 設備ノードを作成
    const equipmentNode = createEquipmentNode(facility, equipmentCount);

    // 該当レシピの原料情報を取得し、各原料について再帰的に処理
    const mats = materialsData.filter((m) => m.recipe_id === recipe.recipe_id);
    mats.forEach((mat) => {
        // 原料の1分あたり必要数を計算
        const materialRequired =
            (requiredPerMinute * mat.quantity) / outputQuantity;
        // 再帰呼び出し時は visited のコピーを渡して、サイクル防止を行う
        const childItemNode = buildTreeForItem(
            mat.material_id,
            materialRequired,
            new Set(visited)
        );
        equipmentNode.children.push(childItemNode);
    });

    return equipmentNode;
}

/* =========================================
   メインツリー構築関数
   ========================================= */

/**
 * 指定したアイテムからツリー構造のデータを再帰的に構築する関数
 *
 * @param {string} itemId - 現在のアイテムID
 * @param {number} requiredPerMinute - 1分あたり必要な個数
 * @param {Set} visited - 再帰ループ防止用の Set
 * @returns {Object} 構築されたツリー構造のノード
 */
export function buildTreeForItem(itemId, requiredPerMinute, visited) {
    // アイテム情報を取得
    const item = getItem(itemId);

    // アイテムノードを作成
    let node = createItemNode(item, requiredPerMinute);

    // 「種」の場合はこれ以上分解せず、再帰を打ち切る
    if (item && item.is_seed) {
        return node;
    }

    // すでに処理済みの場合はサイクル防止のため、再帰を打ち切る
    if (visited.has(itemId)) {
        return node;
    }
    visited.add(itemId);

    // このアイテムを生産するレシピを取得（複数あれば各レシピで枝を作成）
    const recipes = recipesData.filter((r) => r.item_id === itemId);
    recipes.forEach((recipe) => {
        const equipmentNode = processRecipe(recipe, requiredPerMinute, visited);
        if (equipmentNode) {
            node.children.push(equipmentNode);
        }
    });

    // 他の枝への影響を避けるため、visited から削除
    visited.delete(itemId);

    return node;
}
