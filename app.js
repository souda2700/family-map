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

// DOM要素の取得
const spotForm = document.getElementById('spot-form');
const regionInput = document.getElementById('region');
const prefInput = document.getElementById('pref');
const spotNameInput = document.getElementById('spot-name');
const visitDateInput = document.getElementById('visit-date');
const ratingInput = document.getElementById('rating');
const mapLinkInput = document.getElementById('map-link');
const spotMemoInput = document.getElementById('spot-memo');
const searchInput = document.getElementById('search-input');
const spotListContainer = document.getElementById('spot-list');

// ローカルストレージからデータ取得
let spots = JSON.parse(localStorage.getItem('familyMapSpots')) || [];

// 地域選択が変わった時に都道府県のドロップダウンを更新する処理
regionInput.addEventListener('change', () => {
  const selectedRegion = regionInput.value;
  prefInput.innerHTML = ''; // 一旦リセット

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

// 検索入力時のリアルタイム絞り込み処理
searchInput.addEventListener('input', () => {
  renderSpots();
});

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
    visitDate: visitDateInput.value,
    rating: parseInt(ratingInput.value, 10),
    mapLink: mapLinkInput.value.trim(),
    memo: spotMemoInput.value.trim()
  };

  spots.unshift(newSpot); // 新しいものを先頭に追加
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

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // 検索キーワードでフィルター処理
  const filteredSpots = spots.filter(spot => {
    if (!keyword) return true;
    
    const nameMatch = spot.name && spot.name.toLowerCase().includes(keyword);
    const prefMatch = spot.pref && spot.pref.toLowerCase().includes(keyword);
    const regionMatch = spot.region && spot.region.toLowerCase().includes(keyword);
    const memoMatch = spot.memo && spot.memo.toLowerCase().includes(keyword);

    return nameMatch || prefMatch || regionMatch || memoMatch;
  });

  if (filteredSpots.length === 0) {
    if (keyword) {
      spotListContainer.innerHTML = '<p style="color:#888; text-align:center;">該当するスポットが見つかりませんでした。</p>';
    } else {
      spotListContainer.innerHTML = '<p style="color:#888; text-align:center;">まだ登録されたスポットはありません。</p>';
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

    card.innerHTML = `
      <button class="btn-delete" onclick="deleteSpot(${spot.id})">✕</button>
      <h3>${escapeHtml(locationText)} ${escapeHtml(spot.name)}</h3>
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