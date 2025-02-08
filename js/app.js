let cachedSpriteSheet = null; // スプライトシートのキャッシュ

document.addEventListener("DOMContentLoaded", () => {
    // データを取得して表示する処理
    Promise.all([
        fetch('../data/data.json').then(response => response.json()),
        fetch('../data/sprites.json').then(response => response.json())
    ])
    .then(([itemData, spriteData]) => {
        preloadSpriteSheet(spriteData.spriteSheet); // 画像の事前読み込み
        createDropdown(itemData.items, spriteData);
    })
    .catch(error => console.error('Error loading data:', error));
});

// スプライトシートを事前に読み込んでキャッシュする関数
function preloadSpriteSheet(spriteSheetPath) {
    cachedSpriteSheet = new Image();
    cachedSpriteSheet.src = `../images/${spriteSheetPath}`;
}

// ドロップダウンリストを作成する関数
function createDropdown(items, spriteData) {
    const itemList = document.getElementById('item-list');

    const dropdown = document.createElement('select');
    dropdown.id = 'item-dropdown';

    // デフォルトのオプション
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select an item';
    defaultOption.value = '';
    dropdown.appendChild(defaultOption);

    // アイテムをドロップダウンに追加
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name_en;
        option.textContent = `${item.name_jp} (${item.name_en})`;
        dropdown.appendChild(option);
    });

    // 選択時のイベントリスナー
    dropdown.addEventListener('change', (event) => {
        const selectedItem = items.find(item => item.name_en === event.target.value);
        displaySelectedItem(selectedItem, spriteData);
    });

    itemList.appendChild(dropdown);
}

// 選択されたアイテムを表示する関数
function displaySelectedItem(item, spriteData) {
    const selectedItemDisplay = document.getElementById('selected-item') || document.createElement('div');
    selectedItemDisplay.id = 'selected-item';
    selectedItemDisplay.innerHTML = ''; // クリア

    if (item) {
        const text = document.createElement('p');
        text.textContent = `Selected Item: ${item.name_jp} (${item.name_en})`;

        const icon = document.createElement('div');
        icon.style.width = `${spriteData.tileSize}px`;
        icon.style.height = `${spriteData.tileSize}px`;
        icon.style.backgroundImage = `url(${cachedSpriteSheet.src})`;

        // デバッグ用ログ
        console.log(`Item: ${item.name_en}, X: ${item.sprite_x}, Y: ${item.sprite_y}`);

        // 背景位置の計算（正しい座標計算）
        const posX = -(item.sprite_x * spriteData.tileSize);
        const posY = -(item.sprite_y * spriteData.tileSize);
        icon.style.backgroundPosition = `${posX}px ${posY}px`;

        // スプライトシート全体のサイズを指定
        icon.style.backgroundSize = `${spriteData.sheetWidth}px ${spriteData.sheetHeight}px`;

        selectedItemDisplay.appendChild(text);
        selectedItemDisplay.appendChild(icon);
    }

    document.getElementById('item-list').appendChild(selectedItemDisplay);
}
