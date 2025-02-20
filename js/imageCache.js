/**
 * @file imageCache.js
 * @description 画像キャッシュ管理処理
 */

let imageCache = {};

/**
 * 指定URLの画像を非同期に読み込みキャッシュする処理
 * @param {string} url - 画像URL
 * @returns {Promise<HTMLImageElement>} 読み込み済み画像
 */
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (imageCache[url]) {
            resolve(imageCache[url]);
            return;
        }
        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache[url] = img;
            resolve(img);
        };
        img.onerror = (err) => {
            console.error("Failed to load image", url, err);
            reject(err);
        };
    });
}

/**
 * スプライトデータに基づき、複数画像を事前にロードする処理
 * @param {Object} spriteData - スプライトデータ
 * @returns {Promise<void>} ロード完了までのPromise
 */
export async function preloadImages(spriteData) {
    const categoryKeys = Object.keys(spriteData.categories);
    await Promise.all(
        categoryKeys.map((category) =>
            loadImage(spriteData.categories[category].spriteSheet)
        )
    );
}

/**
 * キャッシュ済み画像の取得処理
 * @param {string} url - 画像URL
 * @returns {HTMLImageElement|null} キャッシュ画像または null
 */
export function getCachedImage(url) {
    return imageCache[url] || null;
}
