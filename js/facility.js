/**
 * @file facility.js
 * @description 設備を表現するクラス
 */
import { getFacilities } from "./dataManager.js";

let facilityCache = new Map();

/**
 * 設備を表現するクラス
 */
export class Facility {
    /**
     * コンストラクタ
     * @param {Object} data - 設備データ
     */
    constructor(data) {
        this.facility_id = data.facility_id;
        this.process_time = data.process_time;
        this.sprite_col = data.sprite_col;
        this.sprite_row = data.sprite_row;
    }

    /**
     * 指定設備IDに該当する設備インスタンスを取得する。
     * もし `facilityCache` に存在しない場合はデータを取得する。
     *
     * @param {string} facilityId - 設備ID
     * @returns {Facility|null} 設備インスタンスまたは `null`
     */
    static getFacilityById(facilityId) {
        if (!facilityCache.size) {
            facilityCache = new Map(
                getFacilities().map((facility) => [
                    facility.facility_id,
                    new Facility(facility),
                ])
            );
        }
        return facilityCache.get(facilityId) ?? null;
    }

    /**
     * 全設備のインスタンス一覧を取得する。
     * もし `facilityCache` にデータが存在しない場合は、データを取得する。
     *
     * @returns {Array<Facility>} 設備インスタンスの配列
     */
    static getAllFacilities() {
        if (!facilityCache.size) {
            facilityCache = new Map(
                getFacilities().map((facility) => [
                    facility.facility_id,
                    new Facility(facility),
                ])
            );
        }
        return Array.from(facilityCache.values());
    }
}
