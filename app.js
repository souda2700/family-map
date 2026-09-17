// --- 1. グローバル変数・初期設定 ---
let spots = JSON.parse(localStorage.getItem('familyMapSpots')) || [];
let currentSortGeo = false;
let userLat = null;
let userLng = null;

// 都道府県の地域別データ
const prefData = {
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

// DOM要素の取得
const spotForm = document.getElementById('spot-form');
const regionSelect = document.getElementById('region');
const prefSelect = document.getElementById('pref');
const searchRegionSelect = document.getElementById('search-region');
const searchPrefSelect = document.getElementById('search-pref');
const searchCategorySelect = document.getElementById('search-category');
const searchInput = document.getElementById('search-input');
const spotListContainer = document.getElementById('spot-list');
const geoSortBtn = document.getElementById('geo-sort-btn');
const clearFilterBtn = document.getElementById('clear-filter-btn');

// --- 2. イベントリスナーの設定 ---
document.addEventListener('DOMContentLoaded', () => {
  // 地域選択時に都道府県の選択肢を更新する処理
  regionSelect.addEventListener('change', () => updatePrefOptions(regionSelect, prefSelect));
  searchRegionSelect.addEventListener('change', () => {
    updatePrefOptions(searchRegionSelect, searchPrefSelect, true);
    renderSpots();
  });

  // 検索・フィルタのリアルタイム反映
  searchPrefSelect.addEventListener('change', renderSpots);
  searchCategorySelect.addEventListener('change', renderSpots);
  searchInput.addEventListener('input', renderSpots);

  // フォーム送信（登録・編集保存）
  spotForm.addEventListener('submit', handleFormSubmit);

  // ボタンイベント
  geoSortBtn.addEventListener('click', toggleGeoSort);
  clearFilterBtn.addEventListener('click', clearFilters);

  // バックアップ関連
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-trigger-btn').addEventListener('click', () => {
    document.getElementById('import-modal').style.display = 'flex';
  });
  document.getElementById('import-cancel-btn').addEventListener('click', () => {
    document.getElementById('import-modal').style.display = 'none';
  });
  document.getElementById('import-execute-btn').addEventListener('click', importData);

  // 初回表示
  renderSpots();
});

// 都道府県ドロップダウンの更新
function updatePrefOptions(regionElem, prefElem, isSearch = false) {
  const selectedRegion = regionElem.value;
  prefElem.innerHTML = isSearch ? '<option value="">すべての都道府県</option>' : '<option value="">選択してください</option>';
  
  if (selectedRegion && prefData[selectedRegion]) {
    prefData[selectedRegion].forEach(pref => {
      const option = document.createElement('option');
      option.value = pref;
      option.textContent = pref;
      prefElem.appendChild(option);
    });
  }
}

// データの保存
function saveSpots() {
  localStorage.setItem('familyMapSpots', JSON.stringify(spots));
}

// フォーム送信処理
function handleFormSubmit(e) {
  e.preventDefault();

  const editId = spotForm.dataset.editId;
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);

  const spotData = {
    id: editId || Date.now().toString(),
    region: regionSelect.value,
    pref: prefSelect.value,
    name: document.getElementById('spot-name').value.trim(),
    categories: categories,
    visitDate: document.getElementById('visit-date').value,
    rating: parseInt(document.getElementById('rating').value, 10),
    mapLink: document.getElementById('map-link').value.trim(),
    memo: document.getElementById('spot-memo').value.trim(),
    lat: editId ? (spots.find(s => s.id === editId)?.lat || null) : null,
    lng: editId ? (spots.find(s => s.id === editId)?.lng || null) : null
  };

  if (editId) {
    spots = spots.map(s => s.id === editId ? spotData : s);
    delete spotForm.dataset.editId;
    document.getElementById('save-btn').textContent = 'スポットを保存';
  } else {
    spots.push(spotData);
  }

  saveSpots();
  spotForm.reset();
  renderSpots();
  alert(editId ? 'スポット情報を更新しました！' : '新しいスポットを登録しました！');
}

// --- 3. 画面描画処理（提示いただいたコードの組み込み部分） ---
function renderSpots() {
  spotListContainer.innerHTML = '';

  // 絞り込み条件の取得
  const regionVal = searchRegionSelect.value;
  const prefVal = searchPrefSelect.value;
  const catVal = searchCategorySelect.value;
  const keywordVal = searchInput.value.toLowerCase().trim();

  let filteredSpots = spots.filter(spot => {
    const matchRegion = !regionVal || spot.region === regionVal;
    const matchPref = !prefVal || spot.pref === prefVal;
    const matchCat = !catVal || (spot.categories && spot.categories.includes(catVal)) || spot.category === catVal;
    const matchKeyword = !keywordVal || 
      spot.name.toLowerCase().includes(keywordVal) || 
      (spot.memo && spot.memo.toLowerCase().includes(keywordVal));

    return matchRegion && matchPref && matchCat && matchKeyword;
  });

  // 現在地からの距離計算とソート（位置情報ソートがONの場合）
  if (currentSortGeo && userLat !== null && userLng !== null) {
    filteredSpots.forEach(spot => {
      if (spot.lat && spot.lng) {
        spot.distance = calculateDistance(userLat, userLng, spot.lat, spot.lng);
      } else {
        spot.distance = null;
      }
    });

    filteredSpots.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  } else {
    filteredSpots.forEach(spot => spot.distance = null);
  }

  if (filteredSpots.length === 0) {
    spotListContainer.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">条件に合うスポットが見つかりません。</p>';
    return;
  }

  // ループでカードを生成して描画
  filteredSpots.forEach(spot => {
    const card = document.createElement('div');
    card.className = 'spot-card';
    card.style.position = 'relative';

    const stars = '★'.repeat(spot.rating || 0) + '☆'.repeat(5 - (spot.rating || 0));
    const formattedDate = spot.visitDate ? `📅 ${spot.visitDate}` : '📅 日未設定';
    const locationText = spot.pref ? `📍 [${spot.pref}]` : (spot.region ? `📍 [${spot.region}]` : '');
    
    let categoryTagsHtml = '';
    if (Array.isArray(spot.categories) && spot.categories.length > 0) {
      categoryTagsHtml = spot.categories.map(cat => `<span class="tag">${escapeHtml(cat)}</span>`).join(' ');
    } else if (spot.category) {
      categoryTagsHtml = `<span class="tag">${escapeHtml(spot.category)}</span>`;
    }

    const distanceBadge = spot.distance !== null ? `<span style="font-size:0.8rem; background:#e2e8f0; padding:2px 6px; border-radius:4px;">現在地から約 ${spot.distance} km</span>` : '';

    const hpSearchUrl = spot.mapLink && spot.mapLink.trim() !== ''
      ? spot.mapLink
      : `https://www.google.com/search?q=${encodeURIComponent((spot.pref || '') + ' ' + spot.name + ' 公式')}`;

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((spot.pref || '') + ' ' + spot.name)}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((spot.pref || '') + ' ' + spot.name)}`;

    const coordStatusBtn = (spot.lat && spot.lng)
      ? `<span style="font-size: 0.8rem; color: #28a745; background: #e8f5e9; padding: 2px 6px; border-radius: 4px;">📍 座標設定済み</span>`
      : `<button onclick="fetchSpotCoordinates('${spot.id}', '${escapeHtml(spot.pref || '')}', '${escapeHtml(spot.name)}')" style="font-size: 0.8rem; color: #17a2b8; background: #e0f7fa; border: 1px solid #17a2b8; border-radius: 4px; cursor: pointer; padding: 2px 6px;">📍 1タップ座標取得</button>`;

    card.innerHTML = `
      <div class="card-header-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
        <button class="btn-edit" onclick="editSpot('${spot.id}')" style="background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #007bff;">✏️ 編集</button>
        <button class="btn-delete" onclick="deleteSpot('${spot.id}')" style="background: none; border: none; cursor: pointer; font-size: 0.9rem; color: #dc3545;">✕</button>
      </div>
      <h3 style="padding-right: 60px;">${escapeHtml(locationText)} ${escapeHtml(spot.name)} ${categoryTagsHtml} ${distanceBadge}</h3>
      <div class="spot-meta" style="display: flex; align-items: center; gap: 10px;">
        <span>${formattedDate}</span>
        <span class="spot-rating" style="color:#f59e0b;">${stars}</span>
        ${coordStatusBtn}
      </div>
      ${spot.memo ? `<p class="spot-memo" style="margin: 8px 0; font-size: 0.9rem; color: #4a5568;">${escapeHtml(spot.memo)}</p>` : ''}
      <div class="spot-actions" style="display: flex; gap: 6px; margin-top: 10px;">
        <a href="${escapeHtml(hpSearchUrl)}" target="_blank" rel="noopener noreferrer" style="background:#3182ce; color:white;">🌐 HP検索</a>
        <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" style="background:#38a169; color:white;">📍 マップ</a>
        <a href="${escapeHtml(routeUrl)}" target="_blank" rel="noopener noreferrer" style="background:#dd6b20; color:white;">🚗 ルート案内</a>
      </div>
    `;

    spotListContainer.appendChild(card);
  });
}

// --- 4. 補助関数（座標取得・編集・削除など） ---

// 国土地理院Web APIを利用した座標自動取得
async function fetchSpotCoordinates(spotId, pref, name) {
  const query = `${pref} ${name}`.trim();
  if (!query) return alert('スポット名が取得できませんでした。');

  try {
    const res = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data && data.length > 0) {
      const [lng, lat] = data[0].geometry.coordinates;
      const targetSpot = spots.find(s => s.id === spotId);
      if (targetSpot) {
        targetSpot.lat = lat;
        targetSpot.lng = lng;
        saveSpots();
        alert(`「${name}」の座標（緯度:${lat.toFixed(4)}, 経度:${lng.toFixed(4)}）を取得・保存しました！`);
        renderSpots();
      }
    } else {
      alert(`「${query}」の座標が見つかりませんでした。`);
    }
  } catch (err) {
    console.error(err);
    alert('座標の取得に失敗しました。');
  }
}

// エスケープ処理
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

// スポットの編集
function editSpot(id) {
  const spot = spots.find(s => s.id === id);
  if (!spot) return;

  regionSelect.value = spot.region;
  updatePrefOptions(regionSelect, prefSelect);
  prefSelect.value = spot.pref;
  document.getElementById('spot-name').value = spot.name;
  
  document.querySelectorAll('input[name="category"]').forEach(cb => {
    cb.checked = spot.categories ? spot.categories.includes(cb.value) : (spot.category === cb.value);
  });

  document.getElementById('visit-date').value = spot.visitDate || '';
  document.getElementById('rating').value = spot.rating || 3;
  document.getElementById('map-link').value = spot.mapLink || '';
  document.getElementById('spot-memo').value = spot.memo || '';

  spotForm.dataset.editId = id;
  document.getElementById('save-btn').textContent = '変更を保存する';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// スポットの削除
function deleteSpot(id) {
  if (confirm('このスポットを削除してもよろしいですか？')) {
    spots = spots.filter(s => s.id !== id);
    saveSpots();
    renderSpots();
  }
}

// 現在地ソートのトグル
function toggleGeoSort() {
  if (!currentSortGeo) {
    if (!navigator.geolocation) {
      alert('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }
    geoSortBtn.textContent = '📍 位置情報取得中...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        currentSortGeo = true;
        geoSortBtn.textContent = '✅ 現在地から近い順（解除する）';
        geoSortBtn.style.backgroundColor = '#2b6cb0';
        renderSpots();
      },
      (err) => {
        alert('現在地を取得できませんでした。位置情報の利用を許可してください。');
        geoSortBtn.textContent = '📍 現在地から近い順に並び替え';
      }
    );
  } else {
    currentSortGeo = false;
    geoSortBtn.textContent = '📍 現在地から近い順に並び替え';
    geoSortBtn.style.backgroundColor = '#38a169';
    renderSpots();
  }
}

// 2点間の距離計算（Km）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(1 - Math.min(1, a)));
  return Math.round(R * c);
}

// 検索条件のクリア
function clearFilters() {
  searchRegionSelect.value = '';
  updatePrefOptions(searchRegionSelect, searchPrefSelect, true);
  searchPrefSelect.value = '';
  searchCategorySelect.value = '';
  searchInput.value = '';
  renderSpots();
}

// データのエクスポート
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spots, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `family_map_backup_${new Date().toISOString().slice(0,10)}.json`);
  dlAnchorElem.click();
}

// データのインポート
function importData() {
  const text = document.getElementById('import-text-input').value.trim();
  if (!text) return alert('テキストを入力してください。');

  try {
    const importedSpots = JSON.parse(text);
    if (!Array.isArray(importedSpots)) throw new Error('形式が正しくありません。');

    const existingIds = new Set(spots.map(s => s.id));
    let newCount = 0;

    importedSpots.forEach(s => {
      if (s.id && s.name && !existingIds.has(s.id)) {
        spots.push(s);
        newCount++;
      }
    });

    saveSpots();
    renderSpots();
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('import-text-input').value = '';
    alert(`${newCount} 件のデータを復元・追加しました！`);
  } catch (err) {
    alert('データの取り込みに失敗しました。正しいJSON形式のデータか確認してください。');
  }
}