/**
 * @file dataManager.js
 * @description データ読み込みおよびグローバルデータ管理
 */

let recipesData = [];
let materialsData = [];
let itemsData = [];
let facilitiesData = [];
let spriteData = [];

/**
 * データおよびスプライト情報を非同期に読み込む処理
 * ※data.json, sprites.json の取得
 * @returns {Promise<void>} 読み込み完了までのPromise
 */
export function loadData() {
    return Promise.all([
        fetch("../data/data.json").then((response) => response.json()),
        fetch("../data/sprites.json").then((response) => response.json()),
    ])
        .then(([data, sprites]) => {
            recipesData = data.recipes;
            materialsData = data.materials;
            itemsData = data.items;
            facilitiesData = data.facilities;
            spriteData = sprites;
        })
        .catch((error) => {
            console.error("Data load failed", error);
            throw error;
        });
}

/**
 * レシピデータの取得処理
 * @returns {Array<Object>} レシピデータ一覧
 */
export function getRecipes() {
    return recipesData;
}

/**
 * 材料データの取得処理
 * @returns {Array<Object>} 材料データ一覧
 */
export function getMaterials() {
    return materialsData;
}

/**
 * アイテムデータの取得処理
 * @returns {Array<Object>} アイテムデータ一覧
 */
export function getItems() {
    return itemsData;
}

/**
 * 設備データの取得処理
 * @returns {Array<Object>} 設備データ一覧
 */
export function getFacilities() {
    return facilitiesData;
}

/**
 * スプライトデータの取得処理
 * @returns {Object} スプライトデータ
 */
export function getSpriteData() {
    return spriteData;
}
