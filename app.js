// localStorage からデータ取得、なければ空配列
let spots = JSON.parse(localStorage.getItem('mySpots')) || [];

// HTMLの要素を取得
const spotForm = document.getElementById('spotForm');
const spotList = document.getElementById('spotList');
const regionSelect = document.getElementById('region');
const prefSelect = document.getElementById('pref');
const filterStatus = document.getElementById('filterStatus');
const filterRegion = document.getElementById('filterRegion');

// --- 全国47都道府県の連動データ ---
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

// --- 地域選択に応じた都道府県の動的変更 ---
regionSelect.addEventListener('change', () => {
  const selectedRegion = regionSelect.value;
  prefSelect.innerHTML = '';

  if (!selectedRegion || !prefData[selectedRegion]) {
    prefSelect.innerHTML = '<option value="">先に地域を選択してください</option>';
    return;
  }

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '都道府県を選択してください';
  prefSelect.appendChild(defaultOption);

  prefData[selectedRegion].forEach(pref => {
    const option = document.createElement('option');
    option.value = pref;
    option.textContent = pref;
    prefSelect.appendChild(option);
  });
});

// --- スポット一覧の描画（フィルター機能付き） ---
function renderSpots() {
  spotList.innerHTML = '';

  const selectedStatus = filterStatus.value;
  const selectedRegion = filterRegion.value;

  // 条件に合うスポットだけを抽出
  const filteredSpots = spots.filter(spot => {
    const matchStatus = (selectedStatus === 'all' || spot.status === selectedStatus);
    const matchRegion = (selectedRegion === 'all' || spot.region === selectedRegion);
    return matchStatus && matchRegion;
  });

  if (filteredSpots.length === 0) {
    spotList.innerHTML = '<p style="text-align:center; color:#888;">該当するスポットはありません。</p>';
    return;
  }

  filteredSpots.forEach((spot, index) => {
    const card = document.createElement('div');
    card.className = 'spot-card';

    const statusClass = spot.status === '行った' ? 'status-visited' : 'status-wish';

    card.innerHTML = `
      <div class="card-header">
        <h3>${spot.title}</h3>
        <span class="status-badge ${statusClass}">${spot.status}</span>
      </div>
      <p><strong>場所:</strong> ${spot.region} ${spot.pref}</p>
      <p><strong>メモ:</strong> ${spot.memo || 'なし'}</p>
      <div class="card-footer">
        <button class="delete-btn" onclick="deleteSpot(${index})">🗑️ 削除</button>
      </div>
    `;

    spotList.appendChild(card);
  });
}

// --- フォーム送信時の登録処理 ---
spotForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newSpot = {
    title: document.getElementById('title').value,
    status: document.getElementById('status').value,
    region: document.getElementById('region').value,
    pref: document.getElementById('pref').value,
    memo: document.getElementById('memo').value
  };

  spots.push(newSpot);
  localStorage.setItem('mySpots', JSON.stringify(spots));

  spotForm.reset();
  prefSelect.innerHTML = '<option value="">先に地域を選択してください</option>';
  renderSpots();
});

// --- 削除処理 ---
function deleteSpot(index) {
  if (confirm('このスポットを削除しますか？')) {
    spots.splice(index, 1);
    localStorage.setItem('mySpots', JSON.stringify(spots));
    renderSpots();
  }
}

// --- フィルター切り替えイベント ---
filterStatus.addEventListener('change', renderSpots);
filterRegion.addEventListener('change', renderSpots);

// 初期表示
renderSpots();