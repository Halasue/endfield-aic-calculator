/**
 * treeDataBuilder.js
 *
 * buildTreeForItem(itemId, requiredPerMinute, visited)
 *   - itemId            : 現在のアイテムID
 *   - requiredPerMinute : 1分あたり必要な個数
 *   - visited           : 再帰ループ防止用のSet
 *
 * 戻り値（例）:
 *   {
 *     type: "item" or "equipment",
 *     name: 表示用名称,
 *     required: 数値, // アイテムの場合は1分あたり必要数、設備の場合は必要設備数
 *     children: [ ... ]
 *   }
 */
function buildTreeForItem(itemId, requiredPerMinute, visited) {
  const item = itemsData.find(x => x.item_id === itemId);
  // アイテムノード（item が存在しない場合は itemId を表示）
  let node = { type: "item", name: item ? item.name_en : itemId, required: requiredPerMinute, children: [] };

  // 種の場合は再帰打ち切り
  if (item && item.is_seed) return node;
  
  // サイクル防止
  if (visited.has(itemId)) return node;
  visited.add(itemId);
  
  // 該当アイテムを生産するレシピ（複数あれば各枝で表示）
  const recipes = recipesData.filter(r => r.item_id === itemId);
  recipes.forEach(recipe => {
    const facility = facilitiesData.find(f => f.facility_id === recipe.facility_id);
    if (!facility) return;
    const processTime = facility.process_time;    // 1サイクルあたりの時間（分）
    const outputQuantity = recipe.output_quantity;  // 1サイクル出力数
    // 設備ノードの必要数＝(requiredPerMinute * processTime) / outputQuantity（切り上げ）
    const equipmentCount = Math.ceil((requiredPerMinute * processTime) / outputQuantity);
    const equipmentNode = { type: "equipment", name: facility.name_en, required: equipmentCount, children: [] };
    
    // 該当レシピの原料（materialsData）
    const mats = materialsData.filter(m => m.recipe_id === recipe.recipe_id);
    mats.forEach(mat => {
      // 原料の1分あたり必要数＝(requiredPerMinute * mat.quantity) / outputQuantity
      const materialRequired = (requiredPerMinute * mat.quantity) / outputQuantity;
      const childItemNode = buildTreeForItem(mat.material_id, materialRequired, new Set(visited));
      equipmentNode.children.push(childItemNode);
    });
    
    node.children.push(equipmentNode);
  });
  
  visited.delete(itemId);
  return node;
}
