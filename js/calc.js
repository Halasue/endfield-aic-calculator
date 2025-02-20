/**
 * @file calc.js
 * @description 生産ツリー構築および総設備数計算処理
 */

import { buildTreeForItem } from "./treeDataBuilder.js";

/**
 * 生産ツリー構築処理
 * 指定アイテムIDと目標生産数、期間から1分あたり必要個数を計算し、
 * buildTreeForItem を用いて生産ツリーデータを生成
 * @param {string} itemId - アイテムID
 * @param {number} targetProduction - 目標生産数
 * @param {number} timePeriod - 期間（分）
 * @returns {Object} 生産ツリーデータ
 */
export function calculateProductionTree(itemId, targetProduction, timePeriod) {
    const requiredPerMinute = targetProduction / timePeriod; // 1分あたり必要個数算出
    return buildTreeForItem(itemId, requiredPerMinute, new Set());
}

/**
 * 総設備数再帰計算処理
 * 生産ツリーデータの各ノードについて、
 * type が "equipment" の場合に required を加算し、
 * 子ノードも再帰的に計算して総設備数を求める
 * @param {Object} node - 生産ツリーノード
 * @returns {number} 総設備数
 */
export function calculateTotalEquipment(node) {
    let total = 0;
    if (node.type === "equipment") total += node.required;
    if (node.children) {
        node.children.forEach((child) => {
            total += calculateTotalEquipment(child);
        });
    }
    return total;
}
