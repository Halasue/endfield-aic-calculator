/**
 * @file imageCache.js
 * @description 画像キャッシュ管理処理
 */

let imageCache = {};
let pendingLoads = {};

/**
 * 指定URLの画像を読み込みキャッシュする。
 * すでにキャッシュ済みの場合は即座に返す。
 * 読み込み中の画像は `pendingLoads` に保存し、同じ画像を重複して読み込まないようにする。
 *
 * @param {string} url - 画像URL
 * @returns {Promise<HTMLImageElement>} 読み込み済みの画像
 */
export function loadImage(url) {
    if (imageCache[url]) {
        return Promise.resolve(imageCache[url]);
    }
    if (pendingLoads[url]) {
        return pendingLoads[url];
    }

    pendingLoads[url] = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache[url] = img;
            delete pendingLoads[url]; // 完了後に削除
            resolve(img);
        };
        img.onerror = () => {
            const errorMessage = `[imageCache] Image load failed: ${url}`;
            console.error(errorMessage);
            delete pendingLoads[url];
            reject(new Error(errorMessage));
        };
    });

    return pendingLoads[url];
}

/**
 * スプライトデータに基づき、複数の画像を事前にロードする。
 * `loadImage` を使用してキャッシュに登録する。
 *
 * @param {Object} spriteData - スプライトデータ
 * @returns {Promise<void>} ロード完了までの `Promise`
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
 * キャッシュ済みの画像を取得する。
 * @param {string} url - 画像URL
 * @returns {HTMLImageElement|null} キャッシュ画像または `null`
 */
export function getCachedImage(url) {
    return imageCache[url] || null;
}

/**
 * キャッシュ内の特定の画像を削除する。
 * @param {string} url - 画像URL
 */
export function removeCachedImage(url) {
    if (imageCache[url]) {
        delete imageCache[url];
        console.log("Removed cached image for", url);
    }
}

/**
 * すべてのキャッシュをクリアする。
 */
export function clearCache() {
    imageCache = {};
    console.log("Cleared image cache");
}
