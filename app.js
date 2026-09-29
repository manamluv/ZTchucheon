const state = { step: 1, type: null, genre: null, subGenre: null, personalities: [] };
let categories = null;
let characters = [];
const screen = document.querySelector('#screen');

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
  const pct = step * 25;
  document.querySelector('#stepText').textContent = `STEP ${step} / 4`;
  document.querySelector('#progressPercent').textContent = `${pct}%`;
  document.querySelector('#progressFill').style.width = `${pct}%`;
}

function header(label, title, desc) {
  return `<span class="question-label">${label}</span><h2 class="question-title">${title}</h2><p class="question-desc">${desc}</p>`;
}

function render() {
  if (state.step <= 4) setProgress(state.step);
  if (state.step === 1) renderType();
  if (state.step === 2) renderGenre();
  if (state.step === 3) renderSubGenre();
  if (state.step === 4) renderPersonality();
  if (state.step === 5) renderResult();
}

function renderType() {
  screen.innerHTML = header('01 · TYPE', '어떤 캐릭터를 찾고 있나요?', '먼저 추천받을 캐릭터 그룹을 골라주세요.') + `
    <div class="option-grid">
      ${['공','비'].map(v => `<button class="option ${state.type===v?'selected':''}" data-value="${v}">${v}캐</button>`).join('')}
    </div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => { state.type = btn.dataset.value; state.step = 2; render(); });
}

function renderGenre() {
  const genres = Object.keys(categories.genres);
  screen.innerHTML = header('02 · GENRE', '끌리는 세계관은?', '캐릭터가 속한 큰 장르를 하나 골라주세요.') + `
    <div class="option-grid">${genres.map(v => `<button class="option ${state.genre===v?'selected':''}" data-value="${v}">${v}</button>`).join('')}</div>
    <div class="actions"><button class="btn-back">이전</button></div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => { state.genre = btn.dataset.value; state.subGenre = null; state.step = 3; render(); });
  screen.querySelector('.btn-back').onclick = () => { state.step = 1; render(); };
}

function renderSubGenre() {
  const subs = categories.genres[state.genre] || [];
  screen.innerHTML = header('03 · DETAIL', `${state.genre}, 조금 더 자세히`, '가장 취향에 가까운 세부 장르를 골라주세요.') + `
    <div class="option-grid">${subs.map(v => `<button class="option ${state.subGenre===v?'selected':''}" data-value="${v}">${v}</button>`).join('')}</div>
    <div class="actions"><button class="btn-back">이전</button></div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => { state.subGenre = btn.dataset.value; state.step = 4; render(); });
  screen.querySelector('.btn-back').onclick = () => { state.step = 2; render(); };
}

function renderPersonality() {
  screen.innerHTML = header('04 · PERSONALITY', '좋아하는 성격을 골라주세요', '여러 개 선택할 수 있어요. 많이 고를수록 취향을 더 세밀하게 비교합니다.') + `
    <div class="option-grid personality-grid">
      ${categories.personalities.map(v => `<button class="option ${state.personalities.includes(v)?'selected':''}" data-value="${v}">${v}</button>`).join('')}
    </div>
    <div class="actions"><button class="btn-back">이전</button><button class="btn-next" ${state.personalities.length ? '' : 'disabled'}>결과 보기 (${state.personalities.length})</button></div>`;
  screen.querySelectorAll('.option').forEach(btn => btn.onclick = () => {
    const value = btn.dataset.value;
    state.personalities = state.personalities.includes(value) ? state.personalities.filter(v => v !== value) : [...state.personalities, value];
    renderPersonality();
  });
  screen.querySelector('.btn-back').onclick = () => { state.step = 3; render(); };
  screen.querySelector('.btn-next').onclick = () => { state.step = 5; render(); };
}

function calculateMatches() {
  const pool = characters.filter(c =>
    c.type === state.type &&
    Array.isArray(c.genres) && c.genres.includes(state.genre) &&
    Array.isArray(c.subGenres) && c.subGenres.includes(state.subGenre)
  );

  return pool.map(c => {
    const personalities = Array.isArray(c.personalities) ? c.personalities : [];
    const matchedPersonalities = state.personalities.filter(p => personalities.includes(p));

    return {
      ...c,
      matchedPersonalities,
      matchedCount: matchedPersonalities.length
    };
  }).sort((a, b) => {
    // 선택한 성격과 많이 겹치는 캐릭터를 우선 추천합니다.
    if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;

    // 동점이면 캐릭터가 가진 성격 태그 중 사용자가 고르지 않은 태그가 적은 쪽을 우선합니다.
    const aExtra = (Array.isArray(a.personalities) ? a.personalities.length : 0) - a.matchedCount;
    const bExtra = (Array.isArray(b.personalities) ? b.personalities.length : 0) - b.matchedCount;
    if (aExtra !== bExtra) return aExtra - bExtra;

    // 그래도 같으면 결과가 매번 뒤섞이지 않도록 이름순으로 고정합니다.
    return String(a.name).localeCompare(String(b.name), 'ko');
  });
}

function renderResult() {
  document.querySelector('#progressWrap').style.display = 'none';
  const matches = calculateMatches();
  const topMatches = matches.slice(0, 3);

  if (!topMatches.length) {
    screen.innerHTML = `<div class="no-result"><span class="result-badge">NO MATCH</span><h2>아직 딱 맞는 캐릭터가 없어요</h2><p>${state.type}캐 · ${state.genre} · ${state.subGenre} 조건의 캐릭터를 JSON에 추가해 주세요.</p><div class="actions"><button class="btn-next restart">다시 하기</button></div></div>`;
  } else {
    screen.innerHTML = `<div class="result">
      <span class="result-badge">TOP MATCH · ${state.type}캐</span>
      <h2 class="result-heading">취향에 가까운 캐릭터</h2>
      <p class="result-summary">${state.genre} · ${state.subGenre}에서 선택한 성격과 많이 겹치는 순서예요.</p>
      <div class="result-list">
        ${topMatches.map((character, index) => `
          <article class="result-card ${index === 0 ? 'best' : ''}">
            <div class="rank">${index + 1}</div>
            <div class="result-card-image">
              ${character.image ? `<img src="${character.image}" alt="${character.name}">` : '<span>IMAGE</span>'}
            </div>
            <div class="result-card-body">
              <div class="result-card-top">
                <h3>${character.name}</h3>
                <span class="match-count">${character.matchedCount}개 일치</span>
              </div>
              ${character.description ? `<p>${character.description}</p>` : ''}
              <div class="tags result-tags">
                ${character.matchedPersonalities.map(v => `<span class="tag">#${v}</span>`).join('') || '<span class="tag">성격 태그 일치 없음</span>'}
              </div>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="actions"><button class="btn-next restart">테스트 다시 하기</button></div>
    </div>`;
  }

  screen.querySelector('.restart').onclick = restart;
}

function restart() {
  Object.assign(state, { step:1, type:null, genre:null, subGenre:null, personalities:[] });
  document.querySelector('#progressWrap').style.display = 'block';
  render();
}
