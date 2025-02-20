let imageCache = {}; // 画像キャッシュ用オブジェクト

/**
 * 画像をキャッシュにロードする
 * @param {string} url - スプライトシートのURL
 * @returns {Promise<HTMLImageElement>} - 読み込んだ画像
 */
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (imageCache[url]) {
            resolve(imageCache[url]); // すでにロード済みならキャッシュを返す
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => {
            imageCache[url] = img; // キャッシュに保存
            resolve(img);
        };
        img.onerror = (err) => {
            console.error(`Error loading image: ${url}`, err);
            reject(err);
        };
    });
}

/**
 * 画像を事前にロードしてキャッシュする
 * @param {Object} spriteData
 * @returns {Promise<void>}
 */
export async function preloadImages(spriteData) {
    const categories = Object.keys(spriteData.categories);
    await Promise.all(
        categories.map((category) =>
            loadImage(spriteData.categories[category].spriteSheet)
        )
    );
}

/**
 * キャッシュされた画像を取得
 * @param {string} url - 画像のURL
 * @returns {HTMLImageElement|null} - キャッシュされた画像（なければnull）
 */
export function getCachedImage(url) {
    return imageCache[url] || null;
}
