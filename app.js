const state = {
  step: 1,
  type: null,
  genre: null,
  subGenre: null,
  criterion: null,
  selectedTags: []
};

let categories = null;
let characters = [];
let currentResult = null;
const screen = document.querySelector('#screen');

const criteria = {
  personality: { label: '성격', field: 'personalities', icon: '♡', title: '좋아하는 성격을 골라주세요' },
  job: { label: '직업', field: 'jobs', icon: '⌁', title: '끌리는 직업을 골라주세요' },
  appearance: { label: '외형', field: 'appearances', icon: '◇', title: '좋아하는 외형을 골라주세요' },
  relationship: { label: '관계성', field: 'relationships', icon: '∞', title: '좋아하는 관계성을 골라주세요' },
  random: { label: '랜덤', field: null, icon: '↻', title: '' }
};

Promise.all([
  fetch('data/categories.json').then(r => r.json()),
  fetch('data/characters.json').then(r => r.json())
]).then(([categoryData, characterData]) => {
  categories = categoryData;
  characters = characterData;
  render();
}).catch(() => {
  screen.innerHTML = '<div class="no-result"><h2>데이터를 불러오지 못했어요.</h2><p>로컬에서 실행할 때는 간단한 개발 서버를 사용해주세요.</p></div>';
});

function setProgress(step) {
  const total = 5;
  const pct = Math.min(step, total) * 20;
  document.querySelector('#stepText').textContent = `STEP ${Math.min(step, total)} / ${total}`;
  document.querySelector('#progressPercent').textContent = `${pct}%`;
  document.querySelector('#progressFill').style.width = `${pct}%`;
}

function header(label, title, desc) {
  return `<span class="question-label">${label}</span><h2 class="question-title">${title}</h2><p class="question-desc">${desc}</p>`;
}

function render() {
  document.querySelector('#progressWrap').style.display = state.step === 6 ? 'none' : 'block';
  if (state.step <= 5) setProgress(state.step);
  if (state.step === 1) renderType();
  if (state.step === 2) renderGenre();
  if (state.step === 3) renderSubGenre();
  if (state.step === 4) renderCriterion();
  if (state.step === 5) renderTagSelection();
  if (state.step === 6) renderResult();
}

function renderType() {
  screen.innerHTML = header('01 · TYPE', '어떤 캐릭터를 찾고 있나요?', '먼저 추천받을 캐릭터 그룹을 골라주세요.') + `
    <div class="option-grid">
      ${['공','비'].map(v => `<button class="option" data-value="${v}">${v}캐</button>`).join('')}
    </div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => {
    state.type = btn.dataset.value;
    state.step = 2;
    render();
  });
}

function renderGenre() {
  const genres = Object.keys(categories.genres);
  screen.innerHTML = header('02 · GENRE', '끌리는 세계관은?', '캐릭터가 속한 큰 장르를 하나 골라주세요.') + `
    <div class="option-grid">${genres.map(v => `<button class="option" data-value="${v}">${v}</button>`).join('')}</div>
    <div class="actions"><button class="btn-back">이전</button></div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => {
    state.genre = btn.dataset.value;
    state.subGenre = null;
    state.step = 3;
    render();
  });
  screen.querySelector('.btn-back').onclick = () => { state.step = 1; render(); };
}

function renderSubGenre() {
  const subs = categories.genres[state.genre] || [];
  screen.innerHTML = header('03 · DETAIL', `${state.genre}, 조금 더 자세히`, '가장 취향에 가까운 세부 장르를 골라주세요.') + `
    <div class="option-grid">${subs.map(v => `<button class="option" data-value="${v}">${v}</button>`).join('')}</div>
    <div class="actions"><button class="btn-back">이전</button></div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => {
    state.subGenre = btn.dataset.value;
    state.criterion = null;
    state.selectedTags = [];
    state.step = 4;
    render();
  });
  screen.querySelector('.btn-back').onclick = () => { state.step = 2; render(); };
}

function renderCriterion() {
  screen.innerHTML = header('04 · PICK', '어떤 기준으로 골라볼까요?', '취향 기준을 하나 고르거나, 바로 랜덤으로 뽑아보세요.') + `
    <div class="criterion-grid">
      ${Object.entries(criteria).map(([key, item]) => `
        <button class="criterion-card ${key === 'random' ? 'random-card' : ''}" data-value="${key}">
          <span class="criterion-icon">${item.icon}</span>
          <strong>${item.label}</strong>
          <small>${key === 'random' ? '조건 없이 바로 추천' : `${item.label} 태그로 고르기`}</small>
        </button>`).join('')}
    </div>
    <div class="actions"><button class="btn-back">이전</button></div>`;

  screen.querySelectorAll('.criterion-card').forEach(btn => btn.onclick = () => {
    state.criterion = btn.dataset.value;
    state.selectedTags = [];
    if (state.criterion === 'random') {
      state.step = 6;
    } else {
      state.step = 5;
    }
    render();
  });
  screen.querySelector('.btn-back').onclick = () => { state.step = 3; render(); };
}

function baseCandidates() {
  return characters.filter(c =>
    c.type === state.type &&
    Array.isArray(c.genres) && c.genres.includes(state.genre) &&
    Array.isArray(c.subGenres) && c.subGenres.includes(state.subGenre)
  );
}

function availableTags(field) {
  return [...new Set(baseCandidates().flatMap(c => Array.isArray(c[field]) ? c[field] : []))]
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), 'ko'));
}

function renderTagSelection() {
  const config = criteria[state.criterion];
  const tags = availableTags(config.field);

  if (!tags.length) {
    screen.innerHTML = header('05 · FILTER', `${config.label} 데이터가 아직 없어요`, `characters.json의 각 캐릭터에 ${config.field} 배열을 추가하면 자동으로 선택지가 생깁니다.`) + `
      <div class="json-hint"><code>"${config.field}": ["태그1", "태그2"]</code></div>
      <div class="actions"><button class="btn-back">기준 다시 고르기</button></div>`;
    screen.querySelector('.btn-back').onclick = () => { state.step = 4; render(); };
    return;
  }

  screen.innerHTML = header('05 · FILTER', config.title, '여러 개 선택할 수 있어요. 선택한 항목 중 하나라도 해당하는 캐릭터를 모아 랜덤으로 추천합니다.') + `
    <div class="option-grid tag-grid">
      ${tags.map(v => `<button class="option ${state.selectedTags.includes(v) ? 'selected' : ''}" data-value="${v}">${v}</button>`).join('')}
    </div>
    <div class="actions"><button class="btn-back">이전</button><button class="btn-next" ${state.selectedTags.length ? '' : 'disabled'}>이 조건으로 뽑기 (${state.selectedTags.length})</button></div>`;

  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => {
    const value = btn.dataset.value;
    state.selectedTags = state.selectedTags.includes(value)
      ? state.selectedTags.filter(v => v !== value)
      : [...state.selectedTags, value];
    renderTagSelection();
  });
  screen.querySelector('.btn-back').onclick = () => { state.step = 4; render(); };
  screen.querySelector('.btn-next').onclick = () => { state.step = 6; render(); };
}

function resultCandidates() {
  const pool = baseCandidates();
  if (state.criterion === 'random') return pool;

  const field = criteria[state.criterion].field;
  return pool.filter(c => {
    const tags = Array.isArray(c[field]) ? c[field] : [];
    return state.selectedTags.some(tag => tags.includes(tag));
  });
}

function randomCharacter(excludeId = null) {
  let pool = resultCandidates();
  if (excludeId && pool.length > 1) pool = pool.filter(c => c.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderResult() {
  if (!currentResult || !resultCandidates().some(c => c.id === currentResult.id)) {
    currentResult = randomCharacter();
  }

  if (!currentResult) {
    screen.innerHTML = `<div class="no-result">
      <span class="result-badge">NO MATCH</span>
      <h2>조건에 맞는 캐릭터가 없어요</h2>
      <p>${state.type}캐 · ${state.genre} · ${state.subGenre}${state.criterion !== 'random' ? ` · ${state.selectedTags.join(', ')}` : ''}</p>
      <div class="actions"><button class="btn-back edit-condition">조건 바꾸기</button><button class="btn-next restart">처음부터</button></div>
    </div>`;
    screen.querySelector('.edit-condition').onclick = () => { currentResult = null; state.step = 4; render(); };
    screen.querySelector('.restart').onclick = restart;
    return;
  }

  const c = currentResult;
  const criterionLabel = state.criterion === 'random' ? '완전 랜덤' : `${criteria[state.criterion].label} · ${state.selectedTags.join(' / ')}`;
  const displayTags = [
    ...(Array.isArray(c.personalities) ? c.personalities : []),
    ...(Array.isArray(c.jobs) ? c.jobs : []),
    ...(Array.isArray(c.appearances) ? c.appearances : []),
    ...(Array.isArray(c.relationships) ? c.relationships : [])
  ];

  screen.innerHTML = `<div class="result single-result">
    <span class="result-badge">RANDOM PICK · ${state.type}캐</span>
    <p class="result-route">${state.genre} · ${state.subGenre}</p>
    <h2>${c.name}</h2>
    <p class="result-basis">${criterionLabel}</p>
    ${c.quote ? `<blockquote class="result-quote">“${c.quote}”</blockquote>` : ''}
    ${c.description ? `<p class="result-description">${c.description}</p>` : ''}
    ${displayTags.length ? `<div class="tags">${[...new Set(displayTags)].map(v => `<span class="tag">#${v}</span>`).join('')}</div>` : ''}
    <div class="actions result-actions">
      <button class="btn-back edit-condition">조건 바꾸기</button>
      <button class="btn-next reroll">↻ 다시 뽑기</button>
    </div>
    <button class="text-button restart">처음부터 다시 하기</button>
  </div>`;

  screen.querySelector('.reroll').onclick = () => {
    currentResult = randomCharacter(currentResult.id);
    renderResult();
  };
  screen.querySelector('.edit-condition').onclick = () => { currentResult = null; state.step = 4; render(); };
  screen.querySelector('.restart').onclick = restart;
}

function restart() {
  Object.assign(state, { step: 1, type: null, genre: null, subGenre: null, criterion: null, selectedTags: [] });
  currentResult = null;
  render();
}
