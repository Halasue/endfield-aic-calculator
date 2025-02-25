/**
 * @file i18n.js
 * @description 日英ローカライズ管理用ユーティリティ
 */

// navigator.languageの先頭2文字で初期言語を判定（"ja" なら日本語、それ以外は "en" とする）
export let currentLocale = (navigator.language && navigator.language.slice(0, 2) === "ja") ? "ja" : "en";

export function setLocale(newLocale) {
    currentLocale = newLocale;
}

/**
 * オブジェクト（アイテムや設備）から、現在のロケールに合わせた名称を返す。
 * 対象オブジェクトは { name_jp, name_en } を含むものとする。
 * @param {Object} obj - 翻訳対象オブジェクト
 * @returns {string} ローカライズされた文字列
 */
export function t(obj) {
    return currentLocale === "ja" ? obj.name_jp : obj.name_en;
}

/**
 * 静的テキストキーに基づいて翻訳された文字列を返す。
 *
 * @param {string} key - 翻訳辞書のキー
 * @returns {string} ローカライズされた文字列
 */
export function tText(key) {
    return translations[currentLocale][key] || key;
}

// 静的テキスト用の翻訳辞書
const translations = {
    ja: {
        targetProduction: "目標生産量（個）",
        productionTime: "生産時間（分）",
        itemSelection: "アイテム選択",
        resetButton: "リセット",
        totalEquipment: "総設備数",
        units : "台",
        itemSelectionDefault: "アイテムを選択してください"
    },
    en: {
        targetProduction: "Target Production (pcs)",
        productionTime: "Production Time (min)",
        itemSelection: "Item Selection",
        resetButton: "Reset",
        totalEquipment: "Total Equipment",
        units : "units",
        itemSelectionDefault: "Please select an item"
    }
};

/**
 * data-i18n-key 属性を持つ各HTML要素のテキストを、翻訳辞書内容に更新する。
 */
export function localizeStaticElements() {
    document.querySelectorAll("[data-i18n-key]").forEach(elem => {
        const key = elem.getAttribute("data-i18n-key");
        if (key) {
            elem.textContent = tText(key);
        }
    });
} 