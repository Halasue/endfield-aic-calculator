/**
 * @file item.js
 * @description アイテムを表現するクラス
 */
import { getItems } from "./dataManager.js";

let itemCache = new Map();

/**
 * アイテムを表現するクラス
 */
export class Item {
    /**
     * コンストラクタ
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
     * 指定アイテムIDに該当するアイテムインスタンスを取得する。
     * もし `itemCache` に存在しない場合はデータを取得する。
     *
     * @param {string} itemId - アイテムID
     * @returns {Item|null} アイテムインスタンスまたは `null`
     */
    static getItemById(itemId) {
        if (!itemCache.size) {
            itemCache = new Map(
                getItems().map((item) => [item.item_id, new Item(item)])
            );
        }
        return itemCache.get(itemId) ?? null;
    }

    /**
     * 全アイテムのインスタンス一覧を取得する。
     * もし `itemCache` にデータが存在しない場合は、データを取得する。
     *
     * @returns {Array<Item>} アイテムインスタンスの配列
     */
    static getAllItems() {
        if (!itemCache.size) {
            itemCache = new Map(
                getItems().map((item) => [item.item_id, new Item(item)])
            );
        }
        return Array.from(itemCache.values());
    }
}
