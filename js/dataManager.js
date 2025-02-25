/**
 * @file dataManager.js
 * @description データの読み込みおよびグローバルデータ管理
 */

let recipesData = [];
let materialsData = [];
let itemsData = [];
let facilitiesData = [];
let spriteData = {};

/**
 * データおよびスプライト情報を非同期で読み込む。
 * - `data.json` からレシピ、素材、アイテム、設備データを取得
 * - `sprites.json` からスプライトデータを取得
 *
 * @async
 * @throws {Error} データ取得に失敗した場合のエラー
 * @returns {Promise<void>} 読み込み完了までの `Promise`
 */
export async function loadData() {
    try {
        const [dataResponse, spriteResponse] = await Promise.all([
            fetch("../data/data.json"),
            fetch("../data/sprites.json"),
        ]);

        if (!dataResponse.ok)
            throw new Error(
                `Failed to fetch data.json: ${dataResponse.status}`
            );
        if (!spriteResponse.ok)
            throw new Error(
                `Failed to fetch sprites.json: ${spriteResponse.status}`
            );

        const [data, sprites] = await Promise.all([
            dataResponse.json(),
            spriteResponse.json(),
        ]);

        recipesData = data.recipes ?? [];
        materialsData = data.materials ?? [];
        itemsData = data.items ?? [];
        facilitiesData = data.facilities ?? [];
        spriteData = sprites ?? {};
    } catch (error) {
        console.error("Data load failed:", error);
    }
}

/** @returns {Array<Object>} レシピデータを取得 */
export const getRecipes = () => recipesData;

/** @returns {Array<Object>} 素材データを取得 */
export const getMaterials = () => materialsData;

/** @returns {Array<Object>} アイテムデータを取得 */
export const getItems = () => itemsData;

/** @returns {Array<Object>} 設備データを取得 */
export const getFacilities = () => facilitiesData;

/** @returns {Object} スプライトデータを取得 */
export const getSpriteData = () => spriteData;
