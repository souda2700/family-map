// ===============================================
// Service Workerの登録 (PWA用)
// ===============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.error('Service Worker Registration Failed:', err));
}

// 地域と都道府県のマスターデータ
const prefecturesByRegion = {
  "北海道": ["北海道"],
  "東北": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "甲信越・北陸": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県"],
  "東海": ["岐阜県", "静岡県", "愛知県", "三重県"],
  "関西": ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
};

// 都道府県の中心座標（概算用マスターデータ）
const prefCoordinates = {
  "北海道": { lat: 43.0642, lng: 141.3469 },
  "青森県": { lat: 40.8244, lng: 140.7400 },
  "岩手県": { lat: 39.7036, lng: 141.1527 },
  "宮城県": { lat: 38.2688, lng: 140.8719 },
  "秋田県": { lat: 39.7186, lng: 140.1024 },
  "山形県": { lat: 38.2404, lng: 140.3633 },
  "福島県": { lat: 37.7500, lng: 140.4678 },
  "茨城県": { lat: 36.3418, lng: 140.4468 },
  "栃木県": { lat: 36.5657, lng: 139.8836 },
  "群馬県": { lat: 36.3907, lng: 139.0604 },
  "埼玉県": { lat: 35.8574, lng: 139.6489 },
  "千葉県": { lat: 35.6047, lng: 140.1233 },
  "東京都": { lat: 35.6895, lng: 139.6917 },
  "神奈川県": { lat: 35.4478, lng: 139.6425 },
  "新潟県": { lat: 37.9022, lng: 139.0236 },
  "富山県": { lat: 36.6953, lng: 137.2113 },
  "石川県": { lat: 36.5944, lng: 136.6256 },
  "福井県": { lat: 36.0652, lng: 136.2216 },
  "山梨県": { lat: 35.6639, lng: 138.5683 },
  "長野県": { lat: 36.6513, lng: 138.1810 },
  "岐阜県": { lat: 35.3912, lng: 136.7223 },
  "静岡県": { lat: 34.9769, lng: 138.3831 },
  "愛知県": { lat: 35.1802, lng: 136.9066 },
  "三重県": { lat: 34.7303, lng: 136.5086 },
  "滋賀県": { lat: 35.0045, lng: 135.8686 },
  "京都府": { lat: 35.0211, lng: 135.7556 },
  "大阪府": { lat: 34.6937, lng: 135.5023 },
  "兵庫県": { lat: 34.6913, lng: 135.1830 },
  "奈良県": { lat: 34.6853, lng: 135.8327 },
  "和歌山県": { lat: 34.2260, lng: 135.1675 },
  "鳥取県": { lat: 35.5039, lng: 134.2377 },
  "島根県": { lat: 35.4723, lng: 133.0505 },
  "岡山県": { lat: 34.6617, lng: 133.9350 },
  "広島県": { lat: 34.3963, lng: 132.4594 },
  "山口県": { lat: 34.1859, lng: 131.4714 },
  "徳島県": { lat: 34.0657, lng: 134.5593 },
  "香川県": { lat: 34.3401, lng: 134.0434 },
  "愛媛県": { lat: 33.8416, lng: 132.7657 },
  "高知県": { lat: 33.5597, lng: 133.5311 },
  "福岡県": { lat: 33.6064, lng: 130.4181 },
  "佐賀県": { lat: 33.2494, lng: 130.2988 },
  "長崎県": { lat: 32.7503, lng: 129.8777 },
  "熊本県": { lat: 32.7898, lng: 130.7417 },
  "大分県": { lat: 33.2382, lng: 131.6126 },
  "宮崎県": { lat: 31.9111, lng: 131.4239 },
  "鹿児島県": { lat: 31.5602, lng: 130.5581 },
  "沖縄県": { lat: 26.2124, lng: 127.6809 }
};

// DOM要素の取得
const spotForm = document.getElementById('spot-form');
const regionInput = document.getElementById('region');
const prefInput = document.getElementById('pref');
const spotNameInput = document.getElementById('spot-name');
const visitDateInput = document.getElementById('visit-date');
const ratingInput = document.getElementById('rating');
const mapLinkInput = document.getElementById('map-link');
const spotMemoInput = document.getElementById('spot-memo');

const searchRegionInput = document.getElementById('search-region');
const searchPrefInput = document.getElementById('search-pref');
const searchCategoryInput = document.getElementById('search-category');
const searchInput = document.getElementById('search-input');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const geoSortBtn = document.getElementById('geo-sort-btn');

const spotListContainer = document.getElementById('spot-list');

let spots = JSON.parse(localStorage.getItem('familyMapSpots')) || [];
let currentPosition = null; // 現在地保持用

function getSavedSpots() {
  return spots;
}

// 地域選択イベント
if (regionInput) {
  regionInput.addEventListener('change', () => {
    const selectedRegion = regionInput.value;
    prefInput.innerHTML = '';

    if (!selectedRegion) {
      prefInput.innerHTML = '<option value="">先に地域を選択してください</option>';
      return;
    }

    const prefs = prefecturesByRegion[selectedRegion] || [];
    prefInput.innerHTML = '<option value="">都道府県を選択してください</option>';
    
    prefs.forEach(pref => {
      const opt = document.createElement('option');
      opt.value = pref;
      opt.textContent = pref;
      prefInput.appendChild(opt);
    });
  });
}

if (searchRegionInput) {
  searchRegionInput.addEventListener('change', () => {
    const selectedRegion = searchRegionInput.value;
    searchPrefInput.innerHTML = '<option value="">すべての都道府県</option>';

    if (selectedRegion && prefecturesByRegion[selectedRegion]) {
      prefecturesByRegion[selectedRegion].forEach(pref => {
        const opt = document.createElement('option');
        opt.value = pref;
        opt.textContent = pref;
        searchPrefInput.appendChild(opt);
      });
    }
    renderSpots();
  });
}

if (searchPrefInput) searchPrefInput.addEventListener('change', renderSpots);
if (searchCategoryInput) searchCategoryInput.addEventListener('change', renderSpots);
if (searchInput) searchInput.addEventListener('input', renderSpots);

// 絞り込みクリア
if (clearFilterBtn) {
  clearFilterBtn.addEventListener('click', () => {
    if (searchRegionInput) searchRegionInput.value = '';
    if (searchPrefInput) searchPrefInput.innerHTML = '<option value="">すべての都道府県</option>';
    if (searchCategoryInput) searchCategoryInput.value = '';
    if (searchInput) searchInput.value = '';
    currentPosition = null;
    if (geoSortBtn) geoSortBtn.textContent = '📍 現在地から近い順に並び替え';
    renderSpots();
  });
}

// 📍 現在地ソートボタンの処理
if (geoSortBtn) {
  geoSortBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('お使いの端末・ブラウザは位置情報（GPS）に対応していません。');
      return;
    }

    geoSortBtn.textContent = '📍 現在地を取得中...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        geoSortBtn.textContent = '📍 現在地から近い順（適用中）';
        renderSpots();
      },
      (error) => {
        alert('位置情報の取得に失敗しました。スマホの位置情報設定をオンにしてください。');
        geoSortBtn.textContent = '📍 現在地から近い順に並び替え';
      }
    );
  });
}

// 2点間の距離（km）計算
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球の半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// フォーム送信処理
if (spotForm) {
  spotForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const checkedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
      .map(cb => cb.value);

    const selectedPref = prefInput ? prefInput.value : '';
    const coords = prefCoordinates[selectedPref] || { lat: 35.6895, lng: 139.6917 };

    const newSpot = {
      id: Date.now().toString(),
      region: regionInput ? regionInput.value : '',
      pref: selectedPref,
      lat: coords.lat,
      lng: coords.lng,
      name: spotNameInput ? spotNameInput.value.trim() : '',
      categories: checkedCategories,
      visitDate: visitDateInput ? visitDateInput.value : '',
      rating: ratingInput ? parseInt(ratingInput.value, 10) : 3,
      mapLink: mapLinkInput ? mapLinkInput.value.trim() : '',
      memo: spotMemoInput ? spotMemoInput.value.trim() : ''
    };

    spots.unshift(newSpot);
    saveAndRender();

    spotForm.reset();
    if (prefInput) prefInput.innerHTML = '<option value="">先に地域を選択してください</option>';
  });
}

function saveAndRender() {
  localStorage.setItem('familyMapSpots', JSON.stringify(spots));
  renderSpots();
}

function deleteSpot(id) {
  if (confirm('このスポットを削除してもよろしいですか？')) {
    spots = spots.filter(spot => spot.id != id);
    saveAndRender();
  }
}

function renderSpots() {
  if (!spotListContainer) return;
  spotListContainer.innerHTML = '';

  const selectedRegion = searchRegionInput ? searchRegionInput.value : '';
  const selectedPref = searchPrefInput ? searchPrefInput.value : '';
  const selectedCategory = searchCategoryInput ? searchCategoryInput.value : '';
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filteredSpots = spots.filter(spot => {
    if (selectedRegion && spot.region !== selectedRegion) return false;
    if (selectedPref && spot.pref !== selectedPref) return false;
    
    if (selectedCategory) {
      if (Array.isArray(spot.categories)) {
        if (!spot.categories.includes(selectedCategory)) return false;
      } else if (spot.category) {
        if (spot.category !== selectedCategory) return false;
      } else {
        return false;
      }
    }

    if (keyword) {
      const nameMatch = spot.name && spot.name.toLowerCase().includes(keyword);
      const memoMatch = spot.memo && spot.memo.toLowerCase().includes(keyword);
      if (!nameMatch && !memoMatch) return false;
    }
    return true;
  });

  filteredSpots.forEach(spot => {
    if (currentPosition && spot.pref && prefCoordinates[spot.pref]) {
      const targetCoords = prefCoordinates[spot.pref];
      spot.distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        targetCoords.lat,
        targetCoords.lng
      );
    } else {
      spot.distance = null;
    }
  });

  if (currentPosition) {
    filteredSpots.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }

  if (filteredSpots.length === 0) {
    spotListContainer.innerHTML = '<p style="color:#888; text-align:center; padding: 20px 0;">条件に一致するスポットが見つかりませんでした。</p>';
    return;
  }

  filteredSpots.forEach(spot => {
    const card = document.createElement('div');
    card.className = 'spot-card';

    const stars = '★'.repeat(spot.rating || 0) + '☆'.repeat(5 - (spot.rating || 0));
    const formattedDate = spot.visitDate ? `📅 ${spot.visitDate}` : '📅 日未設定';
    const locationText = spot.pref ? `📍 [${spot.pref}]` : (spot.region ? `📍 [${spot.region}]` : '');
    
    let categoryTagsHtml = '';
    if (Array.isArray(spot.categories) && spot.categories.length > 0) {
      categoryTagsHtml = spot.categories.map(cat => `<span class="spot-tag">${escapeHtml(cat)}</span>`).join(' ');
    } else if (spot.category) {
      categoryTagsHtml = `<span class="spot-tag">${escapeHtml(spot.category)}</span>`;
    }

    const distanceBadge = spot.distance !== null ? `<span class="spot-distance">現在地から約 ${spot.distance} km</span>` : '';

    const mapUrl = spot.mapLink 
      ? spot.mapLink 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((spot.pref || '') + ' ' + spot.name)}`;

    const hpSearchUrl = `https://www.google.com/search?q=${encodeURIComponent((spot.pref || '') + ' ' + spot.name + ' 公式')}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((spot.pref || '') + ' ' + spot.name)}`;

    card.innerHTML = `
      <button class="btn-delete" onclick="deleteSpot('${spot.id}')">✕</button>
      <h3>${escapeHtml(locationText)} ${escapeHtml(spot.name)} ${categoryTagsHtml} ${distanceBadge}</h3>
      <div class="spot-meta">
        <span>${formattedDate}</span>
        <span class="spot-rating">${stars}</span>
      </div>
      ${spot.memo ? `<p class="spot-memo">${escapeHtml(spot.memo)}</p>` : ''}
      <div class="spot-action-btns">
        <a href="${escapeHtml(hpSearchUrl)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-hp">🌐 HP検索</a>
        <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-map">📍 マップ</a>
        <a href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-route">🚗 ルート案内</a>
      </div>
    `;

    spotListContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(match) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

// ===============================================
// データ管理処理（※修正箇所）
// ===============================================
const exportBtn = document.getElementById('export-btn');
const importTriggerBtn = document.getElementById('import-trigger-btn');
const importModal = document.getElementById('import-modal');
const importTextInput = document.getElementById('import-text-input');
const importExecuteBtn = document.getElementById('import-execute-btn');
const importCancelBtn = document.getElementById('import-cancel-btn');

if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    if (spots.length === 0) {
      alert('保存するスポットデータがありません。');
      return;
    }
    const fileName = `family_map_backup_${new Date().toISOString().slice(0,10)}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    alert(`バックアップファイルを保存しました！\n（端末の「ダウンロード」フォルダをご確認ください）`);
  });
}

// 復元画面（モーダル）を開く
if (importTriggerBtn && importModal) {
  importTriggerBtn.addEventListener('click', () => {
    if (importTextInput) importTextInput.value = '';
    importModal.style.display = 'flex'; // ✅ 修正：直接styleを表示に切り替え
  });
}

// 復元画面（モーダル）を閉じる
if (importCancelBtn && importModal) {
  importCancelBtn.addEventListener('click', () => {
    importModal.style.display = 'none'; // ✅ 修正：直接styleを非表示に切り替え
  });
}

// 復元処理の実行
if (importExecuteBtn) {
  importExecuteBtn.addEventListener('click', () => {
    const jsonText = importTextInput ? importTextInput.value.trim() : '';
    if (!jsonText) {
      alert('テキストが入力されていません。コピーしたバックアップデータを貼り付けてください。');
      return;
    }

    try {
      const importedSpots = JSON.parse(jsonText);
      if (Array.isArray(importedSpots)) {
        if (confirm('現在のデータを上書きして復元しますか？')) {
          spots = importedSpots;
          saveAndRender();
          if (importModal) importModal.style.display = 'none'; // ✅ 修正：直接非表示へ
          alert('データを正常に復元しました！');
        }
      } else {
        alert('正しいバックアップデータ形式ではありません。');
      }
    } catch (err) {
      alert('データの読み込みに失敗しました。貼り付けたテキストが正しいかご確認ください。');
    }
  });
}

// 初期表示実行
renderSpots();