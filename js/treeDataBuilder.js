/**
 * @file treeDataBuilder.js
 * @description 生産ツリーの構造構築処理。
 *              ※外部からは「必要個数／分」が与えられている前提でツリー構造を再帰的に生成。
 */

import { Item } from "./item.js";
import { Facility } from "./facility.js";
import { getRecipes, getMaterials } from "./dataManager.js";

/**
 * アイテムノード生成処理
 * @param {Item|null} item - アイテムインスタンス（存在しない場合は null）
 * @param {number} requiredPerMinute - 1分あたり必要個数
 * @returns {Object} アイテムノード
 */
function createItemNode(item, requiredPerMinute) {
    return {
        type: "item",
        id: item ? item.item_id : "Error", // アイテム未取得時の保険
        required: requiredPerMinute,
        children: [],
    };
}

/**
 * 設備ノード生成処理
 * @param {Facility|null} facility - 設備インスタンス（存在しない場合は null）
 * @param {number} equipmentCount - 必要設備数
 * @returns {Object} 設備ノード
 */
function createEquipmentNode(facility, equipmentCount) {
    return {
        type: "equipment",
        id: facility ? facility.facility_id : "Error", // 設備未取得時の保険
        required: equipmentCount,
        children: [],
    };
}

/**
 * レシピに基づく設備ノードおよび子ノード生成の再帰処理
 * ※1サイクル処理時間と出力数から必要設備数を算出
 * @param {Object} recipe - レシピ情報
 * @param {number} requiredPerMinute - 1分あたり必要個数
 * @param {Set} visited - 再帰ループ防止用セット
 * @returns {Object|null} 設備ノードまたは null（設備未取得時）
 */
function processRecipe(recipe, requiredPerMinute, visited) {
    const facility = Facility.getFacilityById(recipe.facility_id);
    if (!facility) return null; // Equipment not found

    // (必要個数 × 処理時間 ÷ 出力数) の切り上げで必要設備数算出
    const processTime = facility.process_time;
    const outputQuantity = recipe.output_quantity;
    const equipmentCount = Math.ceil(
        (requiredPerMinute * processTime) / outputQuantity
    );
    const equipmentNode = createEquipmentNode(facility, equipmentCount);

    // レシピ原料データから各原料の必要個数算出し、再帰的に子ノード生成
    const materials = getMaterials().filter(
        (mat) => mat.recipe_id === recipe.recipe_id
    );
    materials.forEach((mat) => {
        const materialRequired =
            (requiredPerMinute * mat.quantity) / outputQuantity;
        const childItemNode = buildTreeForItem(
            mat.material_id,
            materialRequired,
            new Set(visited)
        );
        equipmentNode.children.push(childItemNode);
    });

    return equipmentNode;
}

/**
 * 指定アイテムから生産ツリーを再帰的に構築する低レベル処理
 * ※必要個数／分は外部から与えられている前提
 * @param {string} itemId - アイテムID
 * @param {number} requiredPerMinute - 1分あたり必要個数
 * @param {Set} visited - 再帰ループ防止用セット
 * @returns {Object} 生産ツリーノード
 */
export function buildTreeForItem(itemId, requiredPerMinute, visited) {
    const item = Item.getItemById(itemId);
    let node = createItemNode(item, requiredPerMinute);

    // 種アイテムの場合は分解せずツリー構築終了
    if (item && item.is_seed) {
        return node;
    }
    if (visited.has(itemId)) {
        return node;
    }
    visited.add(itemId);

    // 対象アイテムの全生産レシピに対し枝生成
    const recipes = getRecipes().filter((recipe) => recipe.item_id === itemId);
    recipes.forEach((recipe) => {
        const equipmentNode = processRecipe(recipe, requiredPerMinute, visited);
        if (equipmentNode) {
            node.children.push(equipmentNode);
        }
    });

    visited.delete(itemId);
    return node;
}
