/**
 * @file item.js
 * @description アイテムを表現するクラス
 */
import { getItems } from "./dataManager.js";

export class Item {
    /**
     * コンストラクタ
     * アイテムデータからインスタンス生成
     * @param {Object} data - アイテムデータ
     */
    constructor(data) {
        this.item_id = data.item_id;
        this.name_jp = data.name_jp;
        this.name_en = data.name_en;
        this.sprite_col = data.sprite_col;
        this.sprite_row = data.sprite_row;
        this.is_seed = data.is_seed;
    }

    /**
     * 指定アイテムIDに該当するアイテムインスタンス取得処理
     * @param {string} itemId - アイテムID
     * @returns {Item|null} アイテムインスタンスまたは null
     */
    static getItemById(itemId) {
        const items = getItems();
        const found = items.find((item) => item.item_id === itemId);
        if (found) {
            return new Item(found);
        }
        console.error("Item not found", itemId);
        return null;
    }

    /**
     * 全アイテムインスタンス取得処理
     * @returns {Array<Item>} アイテムインスタンス一覧
     */
    static getAllItems() {
        const items = getItems();
        return items.map((data) => new Item(data));
    }
}
