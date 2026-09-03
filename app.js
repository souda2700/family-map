// Service Workerの登録 (PWA用)
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

// DOM要素の取得（新規登録フォーム）
const spotForm = document.getElementById('spot-form');
const regionInput = document.getElementById('region');
const prefInput = document.getElementById('pref');
const spotNameInput = document.getElementById('spot-name');
const categoryInput = document.getElementById('category');
const visitDateInput = document.getElementById('visit-date');
const ratingInput = document.getElementById('rating');
const mapLinkInput = document.getElementById('map-link');
const spotMemoInput = document.getElementById('spot-memo');

// 検索・絞り込み要素
const searchRegionInput = document.getElementById('search-region');
const searchPrefInput = document.getElementById('search-pref');
const searchCategoryInput = document.getElementById('search-category');
const searchInput = document.getElementById('search-input');
const clearFilterBtn = document.getElementById('clear-filter-btn');

const spotListContainer = document.getElementById('spot-list');

// ローカルストレージからデータ取得
let spots = JSON.parse(localStorage.getItem('familyMapSpots')) || [];

// 登録フォーム：地域選択が変わった時に都道府県のドロップダウンを更新
regionInput.addEventListener('change', () => {
  const selectedRegion = regionInput.value;
  prefInput.innerHTML = ''; // リセット

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

// 検索エリア：地域選択が変わった時に都道府県のドロップダウンを更新
searchRegionInput.addEventListener('change', () => {
  const selectedRegion = searchRegionInput.value;
  searchPrefInput.innerHTML = '<option value="">すべての都道府県</option>'; // リセット

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

// 絞り込み条件の変更イベント設定
if (searchPrefInput) searchPrefInput.addEventListener('change', renderSpots);
if (searchCategoryInput) searchCategoryInput.addEventListener('change', renderSpots);
if (searchInput) searchInput.addEventListener('input', renderSpots);

// 絞り込みクリアボタン
if (clearFilterBtn) {
  clearFilterBtn.addEventListener('click', () => {
    searchRegionInput.value = '';
    searchPrefInput.innerHTML = '<option value="">すべての都道府県</option>';
    searchCategoryInput.value = '';
    searchInput.value = '';
    renderSpots();
  });
}

// 初期表示
renderSpots();

// フォーム送信時の処理
spotForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newSpot = {
    id: Date.now(),
    region: regionInput.value,
    pref: prefInput.value,
    name: spotNameInput.value.trim(),
    category: categoryInput.value,
    visitDate: visitDateInput.value,
    rating: parseInt(ratingInput.value, 10),
    mapLink: mapLinkInput.value.trim(),
    memo: spotMemoInput.value.trim()
  };

  // 配列の先頭に新しいスポットを追加
  spots.unshift(newSpot);
  saveAndRender();

  // フォームのリセットと都道府県の選択肢リセット
  spotForm.reset();
  prefInput.innerHTML = '<option value="">先に地域を選択してください</option>';
});

// データの保存と画面再描画
function saveAndRender() {
  localStorage.setItem('familyMapSpots', JSON.stringify(spots));
  renderSpots();
}

// スポット削除処理
function deleteSpot(id) {
  if (confirm('このスポットを削除してもよろしいですか？')) {
    spots = spots.filter(spot => spot.id !== id);
    saveAndRender();
  }
}

// 画面描画処理
function renderSpots() {
  spotListContainer.innerHTML = '';

  // 絞り込み条件の取得
  const selectedRegion = searchRegionInput ? searchRegionInput.value : '';
  const selectedPref = searchPrefInput ? searchPrefInput.value : '';
  const selectedCategory = searchCategoryInput ? searchCategoryInput.value : '';
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // 絞り込みフィルター処理
  const filteredSpots = spots.filter(spot => {
    // 地域で絞り込み
    if (selectedRegion && spot.region !== selectedRegion) {
      return false;
    }
    // 都道府県で絞り込み
    if (selectedPref && spot.pref !== selectedPref) {
      return false;
    }
    // 目的・カテゴリで絞り込み
    if (selectedCategory && spot.category !== selectedCategory) {
      return false;
    }
    // フリーワード（名前・メモ等）で絞り込み
    if (keyword) {
      const nameMatch = spot.name && spot.name.toLowerCase().includes(keyword);
      const memoMatch = spot.memo && spot.memo.toLowerCase().includes(keyword);
      if (!nameMatch && !memoMatch) {
        return false;
      }
    }
    return true;
  });

  if (filteredSpots.length === 0) {
    if (selectedRegion || selectedPref || selectedCategory || keyword) {
      spotListContainer.innerHTML = '<p style="color:#888; text-align:center; padding: 20px 0;">条件に一致するスポットが見つかりませんでした。</p>';
    } else {
      spotListContainer.innerHTML = '<p style="color:#888; text-align:center; padding: 20px 0;">まだ登録されたスポットはありません。</p>';
    }
    return;
  }

  filteredSpots.forEach(spot => {
    const card = document.createElement('div');
    card.className = 'spot-card';

    // 星の文字列作成
    const stars = '★'.repeat(spot.rating) + '☆'.repeat(5 - spot.rating);

    // 日付フォーマット
    const formattedDate = spot.visitDate ? `📅 ${spot.visitDate}` : '📅 日未設定';

    // 地域・都道府県の表示
    const locationText = spot.pref ? `📍 [${spot.pref}]` : (spot.region ? `📍 [${spot.region}]` : '');

    // カテゴリタグ
    const categoryTag = spot.category ? `<span class="spot-tag">${escapeHtml(spot.category)}</span>` : '';

    card.innerHTML = `
      <button class="btn-delete" onclick="deleteSpot(${spot.id})">✕</button>
      <h3>${escapeHtml(locationText)} ${escapeHtml(spot.name)} ${categoryTag}</h3>
      <div class="spot-meta">
        <span>${formattedDate}</span>
        <span class="spot-rating">${stars}</span>
      </div>
      ${spot.memo ? `<p class="spot-memo">${escapeHtml(spot.memo)}</p>` : ''}
      ${spot.mapLink ? `<a href="${escapeHtml(spot.mapLink)}" target="_blank" rel="noopener noreferrer" class="btn-map">📍 Googleマップで見る</a>` : ''}
    `;

    spotListContainer.appendChild(card);
  });
}

// XSS対策のエスケープ関数
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

// ==========================================
// 💾 データ管理（バックアップ・復元）処理
// ==========================================
const exportBtn = document.getElementById('export-btn');
const importTriggerBtn = document.getElementById('import-trigger-btn');
const importModal = document.getElementById('import-modal');
const importTextInput = document.getElementById('import-text-input');
const importExecuteBtn = document.getElementById('import-execute-btn');
const importCancelBtn = document.getElementById('import-cancel-btn');

// データ出力 (JSONファイルダウンロード)
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

// 「データを復元 (取込)」ボタンクリックで入力画面表示
if (importTriggerBtn && importModal) {
  importTriggerBtn.addEventListener('click', () => {
    importTextInput.value = '';
    importModal.style.display = 'flex';
  });
}

// キャンセルボタン
if (importCancelBtn && importModal) {
  importCancelBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
  });
}

// 復元実行処理
if (importExecuteBtn && importModal) {
  importExecuteBtn.addEventListener('click', () => {
    const rawText = importTextInput.value.trim();
    if (!rawText) {
      alert('テキストが入力されていません。');
      return;
    }

    try {
      const importedSpots = JSON.parse(rawText);
      if (Array.isArray(importedSpots)) {
        if (confirm('現在のデータを上書きして復元しますか？')) {
          spots = importedSpots;
          saveAndRender();
          importModal.style.display = 'none';
          alert('データを正常に復元しました！');
        }
      } else {
        alert('データの形式が正しくありません。');
      }
    } catch (err) {
      alert('テキストの読み込みに失敗しました。正しいバックアップテキストを貼り付けてください。');
    }
  });
}