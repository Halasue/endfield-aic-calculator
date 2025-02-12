/**
 * app.js
 * ------
 * メインの初期化処理およびイベント設定
 */

let recipesData = [],
  materialsData = [],
  itemsData = [],
  facilitiesData = [],
  spriteData = [];

document.addEventListener("DOMContentLoaded", () => {
  // data.json と sprites.json を読み込む
  Promise.all([
    fetch("../data/data.json").then((response) => response.json()),
    fetch("../data/sprites.json").then((response) => response.json()),
  ])
    .then(([data, sprites]) => {
      recipesData = data.recipes;
      materialsData = data.materials;
      itemsData = data.items;
      facilitiesData = data.facilities;
      spriteData = sprites;

      createItemDropdown();

      document
        .getElementById("itemSelect")
        .addEventListener("change", recalcProductionFlow);
      document
        .getElementById("quantityInput")
        .addEventListener("input", recalcProductionFlow);
      document
        .getElementById("timeInput")
        .addEventListener("input", recalcProductionFlow);

      recalcProductionFlow();
    })
    .catch((error) => console.error("Error loading data:", error));

  // ウィンドウサイズが変更されたときに再描画
  window.addEventListener("resize", recalcProductionFlow);
});

// アイテムドロップダウン作成
function createItemDropdown() {
  const select = document.getElementById("itemSelect");
  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "アイテムを選択してください";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  itemsData.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.item_id;
    option.textContent = `${item.name_jp} (${item.name_en})`;
    select.appendChild(option);
  });
}

// 総設備数の計算：再帰的に equipment ノードの required 値を合計
function computeTotalEquipment(node) {
  let total = 0;
  if (node.type === "equipment") total += node.required;
  if (node.children) {
    node.children.forEach((child) => {
      total += computeTotalEquipment(child);
    });
  }
  return total;
}

// 入力変更に応じた再計算
function recalcProductionFlow() {
  const selectedItemId = document.getElementById("itemSelect").value;
  if (!selectedItemId) return;

  const targetProduction = parseFloat(
    document.getElementById("quantityInput").value
  );
  const timePeriod = parseFloat(document.getElementById("timeInput").value);
  if (
    isNaN(targetProduction) ||
    isNaN(timePeriod) ||
    targetProduction <= 0 ||
    timePeriod <= 0
  )
    return;

  // 1分あたり必要な個数
  const requiredPerMinute = targetProduction / timePeriod;
  const treeData = buildTreeForItem(
    selectedItemId,
    requiredPerMinute,
    new Set()
  );

  // #svgContainer 内だけをクリアしてツリー描画
  const svgContainer = document.getElementById("svgContainer");
  svgContainer.innerHTML = "";
  renderTree(treeData, svgContainer);

  // 総設備数の計算
  const totalEquipment = computeTotalEquipment(treeData);
  const totalDiv = document.getElementById("totalEquipment");
  if (totalDiv) {
    totalDiv.textContent = "総設備数: " + totalEquipment;
  }
}

// デバッグ用
function debugLog(message) {
  const debugDiv = document.getElementById("debug");
  const p = document.createElement("p");
  p.textContent = message;
  debugDiv.appendChild(p);

  // 10行以上になったら古いログを削除
  if (debugDiv.childNodes.length > 10) {
    debugDiv.removeChild(debugDiv.firstChild);
  }
}

function debugUpdate(message) {
  const debugDiv = document.getElementById("debug");
  debugDiv.textContent = message;
}

function debugClear() {
  const debugDiv = document.getElementById("debug");
  debugDiv.textContent = "";
}
