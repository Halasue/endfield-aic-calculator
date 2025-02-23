/**
 * @file app.js
 * @description メインの初期化およびイベント設定処理
 */

import { loadData, getSpriteData } from "./dataManager.js";
import { renderTree } from "./treeRenderer.js";
import { preloadImages } from "./imageCache.js";
import { Item } from "./item.js";
import { calculateProductionTree, calculateTotalEquipment } from "./calc.js";

/**
 * アイテム選択ドロップダウンを生成する。
 */
function createItemDropdown() {
    const selectElement = document.getElementById("itemSelect");
    if (!selectElement) {
        console.error("Item select element not found");
        return;
    }

    // ドロップダウンのオプションを一括設定
    selectElement.innerHTML = "";
    selectElement.append(new Option("Please select an item", ""));

    Item.getAllItems().forEach((item) => {
        const option = document.createElement("option");
        option.value = item.item_id;
        option.textContent = `${item.name_jp} (${item.name_en})`;
        selectElement.appendChild(option);
    });
}

/**
 * 生産フローを再計算し、ツリーを再描画する。
 * @throws {Error} 無効な入力値が渡された場合のエラー
 */
function recalcProductionFlow() {
    const itemSelect = document.getElementById("itemSelect");
    const quantityInput = document.getElementById("quantityInput");
    const timeInput = document.getElementById("timeInput");
    const svgContainer = document.getElementById("svgContainer");
    const totalEquipmentDiv = document.getElementById("totalEquipment");

    if (
        !itemSelect ||
        !quantityInput ||
        !timeInput ||
        !svgContainer ||
        !totalEquipmentDiv
    ) {
        console.error("Required DOM elements not found");
        return;
    }

    const selectedItemId = itemSelect.value;
    const targetProduction = parseFloat(quantityInput.value);
    const timePeriod = parseFloat(timeInput.value);

    if (!selectedItemId) {
        console.error("No item selected.");
        return;
    }
    if (isNaN(targetProduction) || targetProduction <= 0) {
        throw new Error(
            "Invalid input: Production quantity must be a positive number."
        );
    }
    if (isNaN(timePeriod) || timePeriod <= 0) {
        throw new Error(
            "Invalid input: Time period must be a positive number."
        );
    }

    try {
        const treeData = calculateProductionTree(
            selectedItemId,
            targetProduction,
            timePeriod
        );
        svgContainer.innerHTML = "";
        renderTree(treeData, svgContainer);
        totalEquipmentDiv.textContent = `Total equipment: ${calculateTotalEquipment(
            treeData
        )}`;
    } catch (error) {
        console.error("Error in production flow calculation:", error);
    }
}

/**
 * ページの初期化処理。
 * - データをロード
 * - スプライト画像をプリロード
 * - ドロップダウンリストを生成
 * - イベントリスナーを設定
 */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadData();
        const spriteData = getSpriteData();
        await preloadImages(spriteData);
        createItemDropdown();

        document
            .getElementById("itemSelect")
            ?.addEventListener("change", recalcProductionFlow);
        document
            .getElementById("quantityInput")
            ?.addEventListener("input", recalcProductionFlow);
        document
            .getElementById("timeInput")
            ?.addEventListener("input", recalcProductionFlow);
    } catch (error) {
        console.error("Data load or image preload failed", error);
    }
});
