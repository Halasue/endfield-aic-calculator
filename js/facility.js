/**
 * @file facility.js
 * @description 設備を表現するクラス
 */

import { getFacilities } from "./dataManager.js";

export class Facility {
    /**
     * コンストラクタ
     * 設備データオブジェクトからインスタンス生成
     * @param {Object} data - 設備データ
     */
    constructor(data) {
        this.facility_id = data.facility_id;
        this.process_time = data.process_time;
        this.sprite_col = data.sprite_col;
        this.sprite_row = data.sprite_row;
    }

    /**
     * 指定設備IDに該当する設備インスタンス取得処理
     * @param {string} facilityId - 設備ID
     * @returns {Facility|null} 設備インスタンスまたは null
     */
    static getFacilityById(facilityId) {
        const facilities = getFacilities();
        const found = facilities.find(
            (facility) => facility.facility_id === facilityId
        );
        if (found) {
            return new Facility(found);
        }
        console.error("Facility not found", facilityId);
        return null;
    }

    /**
     * 全設備インスタンス取得処理
     * @returns {Array<Facility>} 設備インスタンス一覧
     */
    static getAllFacilities() {
        const facilities = getFacilities();
        return facilities.map((data) => new Item(data));
    }
}
