/**
 * @file treeDataBuilder.js
 * @description 生産ツリーの構造構築処理。
 *              指定アイテムIDから再帰的にツリーを構築する。
 */

import { Item } from "./item.js";
import { Facility } from "./facility.js";
import { getRecipes, getMaterials } from "./dataManager.js";
import { NODE_TYPE } from "./constants.js";

/**
 * アイテムノードを生成する。
 * @param {Item|null} item - アイテムインスタンス（存在しない場合は null）
 * @param {number} requiredPerMinute - 1分あたりの必要個数
 * @returns {Object} アイテムノード
 */
function createItemNode(item, requiredPerMinute) {
    return {
        type: NODE_TYPE.ITEM,
        id: item ? item.item_id : "UNKNOWN_ITEM",
        required: requiredPerMinute,
        children: [],
    };
}

/**
 * 設備ノードを生成する。
 * @param {Facility|null} facility - 設備インスタンス（存在しない場合は null）
 * @param {number} equipmentCount - 必要設備数
 * @returns {Object} 設備ノード
 */
function createEquipmentNode(facility, equipmentCount) {
    return {
        type: NODE_TYPE.EQUIPMENT,
        id: facility ? facility.facility_id : "UNKNOWN_EQUIPMENT",
        required: equipmentCount,
        children: [],
    };
}

/**
 * 指定アイテムから生産ツリーを再帰的に構築する。
 * @param {string} itemId - アイテムID
 * @param {number} requiredPerMinute - 1分あたりの必要個数
 * @param {Set<string>} visited - 再帰ループ防止用セット
 * @returns {Object|null} 生産ツリーノードまたは null（アイテム未取得時）
 */
export function buildProductionTree(itemId, requiredPerMinute, visited) {
    if (visited.has(itemId)) return null;
    visited.add(itemId);

    const item = Item.getItemById(itemId);
    if (!item) {
        console.warn(`Item not found: ${itemId}`);
        return null;
    }

    let node = createItemNode(item, requiredPerMinute);
    if (item.is_seed) return node;

    getRecipes()
        .filter((recipe) => recipe.item_id === itemId)
        .map((recipe) => processRecipe(recipe, requiredPerMinute, visited))
        .filter(Boolean)
        .forEach((equipmentNode) => node.children.push(equipmentNode));

    visited.delete(itemId);
    return node;
}

/**
 * レシピに基づき設備ノードと子ノードを生成する再帰処理。
 * @param {Object} recipe - レシピ情報
 * @param {number} requiredPerMinute - 1分あたりの必要個数
 * @param {Set<string>} visited - 再帰ループ防止用セット
 * @returns {Object|null} 設備ノードまたは null（設備未取得時）
 */
function processRecipe(recipe, requiredPerMinute, visited) {
    const facility = Facility.getFacilityById(recipe.facility_id);
    if (!facility) return null;

    const equipmentCount = Math.ceil(
        (requiredPerMinute * facility.process_time) / recipe.output_quantity
    );
    const equipmentNode = createEquipmentNode(facility, equipmentCount);

    getMaterials()
        .filter((mat) => mat.recipe_id === recipe.recipe_id)
        .forEach((mat) => {
            const materialRequired =
                (requiredPerMinute * mat.quantity) / recipe.output_quantity;
            const childItemNode = visited.has(mat.material_id)
                ? null
                : buildProductionTree(
                      mat.material_id,
                      materialRequired,
                      new Set(visited)
                  );
            if (childItemNode) equipmentNode.children.push(childItemNode);
        });

    return equipmentNode;
}
