/**
 * @file app.js
 * @description メイン初期化およびイベント設定処理
 */
import { loadData, getSpriteData } from "./dataManager.js";
import { renderTree } from "./treeRenderer.js";
import { preloadImages } from "./imageCache.js";
import { Item } from "./item.js";
import { calculateProductionTree, calculateTotalEquipment } from "./calc.js";

/**
 * アイテムドロップダウン生成処理
 */
function createItemDropdown() {
    const selectElement = document.getElementById("itemSelect");
    if (!selectElement) {
        console.error("Item select element not found");
        return;
    }
    selectElement.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Please select an item";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption);

    // 全アイテムのインスタンス一覧取得
    const items = Item.getAllItems();
    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.item_id;
        option.textContent = `${item.name_jp} (${item.name_en})`;
        selectElement.appendChild(option);
    });
}

/**
 * 入力変更時の生産フロー再計算イベント処理
 * ※DOM要素存在確認および入力値数値検証含む
 */
function recalcProductionFlow() {
    const itemSelect = document.getElementById("itemSelect");
    if (!itemSelect) {
        console.error("Item select element not found");
        return;
    }
    const selectedItemId = itemSelect.value;
    if (!selectedItemId) return;

    const quantityInput = document.getElementById("quantityInput");
    const timeInput = document.getElementById("timeInput");
    if (!quantityInput || !timeInput) {
        console.error("Input elements not found");
        return;
    }
    const targetProduction = parseFloat(quantityInput.value);
    const timePeriod = parseFloat(timeInput.value);
    if (targetProduction <= 0 || timePeriod <= 0) return;

    const treeData = calculateProductionTree(
        selectedItemId,
        targetProduction,
        timePeriod
    );

    const svgContainer = document.getElementById("svgContainer");
    if (!svgContainer) {
        console.error("SVG container not found");
        return;
    }
    svgContainer.innerHTML = "";
    renderTree(treeData, svgContainer);

    const totalEquipment = calculateTotalEquipment(treeData);
    const totalDiv = document.getElementById("totalEquipment");
    if (totalDiv) {
        totalDiv.textContent = "Total equipment: " + totalEquipment;
    }
}

/**
 * DOMContentLoaded 時初期化処理
 * ※データ読み込み、画像プリロード、イベント設定の順次実行
 */
document.addEventListener("DOMContentLoaded", () => {
    loadData()
        .then(() => {
            const spriteData = getSpriteData();
            preloadImages(spriteData)
                .then(() => {
                    recalcProductionFlow();
                })
                .catch((err) => console.error("Image preload failed", err));
            createItemDropdown();

            const itemSelect = document.getElementById("itemSelect");
            const quantityInput = document.getElementById("quantityInput");
            const timeInput = document.getElementById("timeInput");

            if (itemSelect)
                itemSelect.addEventListener("change", recalcProductionFlow);
            if (quantityInput)
                quantityInput.addEventListener("input", recalcProductionFlow);
            if (timeInput)
                timeInput.addEventListener("input", recalcProductionFlow);

            recalcProductionFlow();
        })
        .catch((error) => console.error("Data load failed", error));
});
