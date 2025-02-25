/**
 * @file calc.js
 * @description 生産ツリー構築および総設備数計算処理
 */

import { buildProductionTree } from "./treeDataBuilder.js";
import { NODE_TYPE } from "./constants.js";

/**
 * 生産ツリー構築処理
 * 指定アイテムIDと目標生産数、期間から1分あたりの必要個数を計算し、
 * `buildProductionTree` を用いて生産ツリーデータを生成する。
 *
 * @param {string} itemId - アイテムID
 * @param {number} targetProduction - 目標生産数
 * @param {number} timePeriod - 期間（分）
 * @returns {Object} 生産ツリーデータ
 */
export function calculateProductionTree(itemId, targetProduction, timePeriod) {
    const requiredPerMinute = targetProduction / timePeriod; // 1分あたり必要個数算出
    return buildProductionTree(itemId, requiredPerMinute, new Set());
}

/**
 * 総設備数の再帰計算処理
 * 生産ツリーデータの各ノードについて、
 * `type` が `NODE_TYPE.EQUIPMENT` の場合に `required` を加算し、
 * 子ノードも再帰的に計算して総設備数を求める。
 *
 * @param {Object} node - 生産ツリーノード
 * @returns {number} 総設備数（自身の設備数 + 子ノードの設備数の合計）
 */
export function calculateTotalEquipment(node) {
    return (
        (node.type === NODE_TYPE.EQUIPMENT ? node.required : 0) +
        (node.children?.reduce(
            (sum, child) => sum + calculateTotalEquipment(child),
            0
        ) ?? 0)
    );
}
