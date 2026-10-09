/**
 * 🍄 초코송이들 춘천 나들이 — 후기 페이지(review.html) 저장소 + 관리자 정리본
 *
 * 쓰는 법 (자세한 건 survey/README.md)
 *  1. script.google.com → 새 프로젝트 → 이 파일 내용 붙여넣기
 *  2. 아래 PARTICIPANTS 에 참가자 이름 입력 (깃허브에는 올리지 마세요)
 *  3. setup 실행 → 응답 시트 두 개가 만들어져요
 *  4. 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자) → 웹 앱 URL 복사
 *  5. 응답이 모이면
 *     - makeReport       → 후기 정리본 (공유·출력용, 비밀 쪽지 없음)
 *     - makeSecretReport → 🔒 비밀 쪽지 정리본 (관리자만)
 *
 * 후기와 비밀 쪽지는 서로 다른 시트에 따로 저장돼요.
 * 후기에는 이름·시각을 남기지 않고 행 위치도 섞어서, 관리자도 쪽지와 짝지을 수 없어요.
 */

// 참가자 명단 — 비밀 쪽지에서 체크박스로 보여요.
const PARTICIPANTS = [
  // '홍길동',
  // '김철수',
];

const PLACES = ['38마일 브런치', '김유정역', '춘천 닭갈비', '산토리니'];

// review.html 의 name 과 같아야 해요. [키, 시트 머리글, 허용값(없으면 자유 입력)]
const SCORE = ['1', '2', '3', '4', '5'];
const REVIEW_FIELDS = [
  ['overall', '전체 만족도', SCORE],
  ['oneLine', '한 줄 표현'],
  ['place0', PLACES[0], SCORE],
  ['place1', PLACES[1], SCORE],
  ['place2', PLACES[2], SCORE],
  ['place3', PLACES[3], SCORE],
  ['best', '가장 좋았던 순간'],
  ['talk', '새로운 사람과 대화', SCORE],
  ['groups', '조 바꾸기 방식', ['좋았어요', '보통이에요', '한 조로 쭉 가는 게 나았어요']],
  ['noProfile', '당일 실명 방식', ['좋았어요', '보통이에요', '미리 아는 게 나았어요']],
  ['pace', '일정 시간 배분', ['빡빡했어요', '적당했어요', '여유로웠어요']],
  ['fee', '회비 7만 원', ['적당했어요', '비쌌어요', '저렴했어요']],
  ['again', '다음 참여', ['꼭 참여할래요', '아마도요', '글쎄요']],
  ['wish', '아쉬운 점 · 바라는 점'],
  ['thanks', '하고 싶은 말'],
];
const SECRET_HEADERS = ['날짜', '보낸 사람', '더 이야기 나누고 싶었던 분', '운영진에게'];
const MAX_TEXT = 1000;

/** 1) 응답 시트 두 개를 만들어요. 한 번만 실행하세요. */
function setup() {
  if (PARTICIPANTS.length < 2) throw new Error('PARTICIPANTS 에 참가자 이름을 먼저 입력해 주세요.');
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('REVIEW_ID')) {
    throw new Error('이미 만들어졌어요. 다시 만들려면 프로젝트 설정 → 스크립트 속성을 지우고 실행하세요.');
  }
  // 따로 만들어서, 후기 시트를 공유해도 비밀 쪽지는 딸려가지 않게 해요.
  const review = SpreadsheetApp.create('초코송이들 후기 응답');
  review.getSheets()[0].appendRow(['날짜'].concat(REVIEW_FIELDS.map(f => f[1]))).setFrozenRows(1);
  const secret = SpreadsheetApp.create('🔒 초코송이들 비밀 쪽지 응답');
  secret.getSheets()[0].appendRow(SECRET_HEADERS).setFrozenRows(1);

  props.setProperties({ REVIEW_ID: review.getId(), SECRET_ID: secret.getId() });
  Logger.log('후기 응답 시트 : ' + review.getUrl());
  Logger.log('비밀 쪽지 응답 시트 : ' + secret.getUrl());
  Logger.log('이제 배포 → 새 배포 → 웹 앱으로 배포하고, 웹 앱 URL 을 review.html 에 넣어주세요.');
}

/** 페이지가 참가자 명단을 가져갈 때 */
function doGet() {
  return json({ ok: true, participants: PARTICIPANTS });
}

/** 페이지에서 후기·쪽지를 보낼 때 */
function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad-json' }); }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (data.type === 'review') return json(saveReview(data));
    if (data.type === 'secret') return json(saveSecret(data));
    return json({ ok: false, error: 'bad-type' });
  } finally {
    lock.releaseLock();
  }
}

function saveReview(d) {
  const row = [dateOnly()];
  for (const [key, , allowed] of REVIEW_FIELDS) {
    const v = d[key] == null ? '' : String(d[key]);
    if (allowed) {
      if (allowed.indexOf(v) < 0) return { ok: false, error: 'missing:' + key };
      row.push(v);
    } else {
      row.push(clean(v));
    }
  }
  const sheet = sheetOf('REVIEW_ID');
  // 제출 순서로 짐작하지 못하게, 기존 응답 사이 아무 곳에나 넣어요.
  const last = sheet.getLastRow();
  const at = 2 + Math.floor(Math.random() * last); // 2 ~ last+1
  if (at <= last) sheet.insertRowBefore(at);
  sheet.getRange(at, 1, 1, row.length).setValues([row]);
  return { ok: true };
}

function saveSecret(d) {
  const me = String(d.me || '');
  if (PARTICIPANTS.indexOf(me) < 0) return { ok: false, error: 'missing:me' };
  const picks = (Array.isArray(d.picks) ? d.picks : [])
    .map(String).filter(p => p !== me && PARTICIPANTS.indexOf(p) >= 0);
  if (!picks.length) return { ok: false, error: 'missing:picks' };
  sheetOf('SECRET_ID').appendRow([dateOnly(), me, picks.join(', '), clean(String(d.note || ''))]);
  return { ok: true };
}

/** 2) 후기 정리본 — 공유·출력해도 되는 문서예요 (비밀 쪽지 없음). */
function makeReport() {
  const values = sheetOf('REVIEW_ID').getDataRange().getValues();
  const rows = values.slice(1).map(r => {
    const m = {};
    REVIEW_FIELDS.forEach((f, i) => { m[f[0]] = String(r[i + 1]); });
    return m;
  });
  const n = rows.length;
  const col = key => rows.map(r => r[key]);
  const choices = key => REVIEW_FIELDS.find(f => f[0] === key)[2];
  const label = key => REVIEW_FIELDS.find(f => f[0] === key)[1];

  const doc = DocumentApp.create('🍄 초코송이들 후기 정리본 ' + now());
  const body = doc.getBody();
  body.appendParagraph('🍄 초코송이들 춘천 나들이 후기').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('10월 9일(금) 춘천 · 응답 ' + n + '명 · ' + now() + ' 기준');
  if (!n) { doc.saveAndClose(); Logger.log('아직 응답이 없어요. ' + doc.getUrl()); return; }

  h(body, '한눈에 보기');
  body.appendTable([['항목', '평균 (5점 만점)']].concat(
    ['overall', 'talk', 'place0', 'place1', 'place2', 'place3'].map(k => [label(k), avg(col(k))])
  ));
  const yes = col('again').filter(v => v === '꼭 참여할래요').length;
  body.appendParagraph('다음에도 꼭 참여 : ' + yes + '명 (' + Math.round(yes / n * 100) + '%)');

  h(body, '점수 분포');
  ['overall', 'talk'].forEach(k => dist(body, label(k), col(k), SCORE.slice().reverse()));

  h(body, '만남 · 운영');
  ['groups', 'noProfile', 'pace', 'fee', 'again'].forEach(k => dist(body, label(k), col(k), choices(k)));

  h(body, '나눠준 이야기');
  ['oneLine', 'best', 'wish', 'thanks'].forEach(k => quotes(body, label(k), shuffle(col(k))));

  doc.saveAndClose();
  Logger.log('후기 정리본 : ' + doc.getUrl());
}

/** 3) 🔒 비밀 쪽지 정리본 — 관리자만 보세요. */
function makeSecretReport() {
  const values = sheetOf('SECRET_ID').getDataRange().getValues().slice(1);
  // 같은 사람이 여러 번 냈으면 마지막 쪽지만 써요.
  const byName = {};
  values.forEach(r => {
    byName[r[1]] = { picks: String(r[2]).split(',').map(s => s.trim()).filter(Boolean), note: r[3] };
  });
  const names = Object.keys(byName).sort();

  const doc = DocumentApp.create('🔒 초코송이들 비밀 쪽지 정리본 ' + now());
  const body = doc.getBody();
  body.appendParagraph('🔒 비밀 쪽지 정리본').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('관리자만 확인 · 공유·출력 주의 · 쪽지 ' + names.length + '명 · ' + now() + ' 기준');

  h(body, '💞 서로 고른 사이');
  const mutual = [];
  names.forEach(a => byName[a].picks.forEach(b => {
    if (a < b && byName[b] && byName[b].picks.indexOf(a) >= 0) mutual.push(a + '  ↔  ' + b);
  }));
  if (mutual.length) mutual.forEach(m => body.appendListItem(m));
  else body.appendParagraph('아직 없어요.');

  h(body, '쪽지 목록');
  if (names.length) {
    body.appendTable([['보낸 사람', '더 이야기 나누고 싶었던 분', '운영진에게']]
      .concat(names.map(a => [a, byName[a].picks.join(', '), String(byName[a].note || '')])));
  } else {
    body.appendParagraph('아직 쪽지가 없어요.');
  }

  doc.saveAndClose();
  Logger.log('🔒 비밀 쪽지 정리본 : ' + doc.getUrl());
}

// ── 도우미 ──────────────────────────────────────────────

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheetOf(key) {
  const id = PropertiesService.getScriptProperties().getProperty(key);
  if (!id) throw new Error('setup 을 먼저 실행해 주세요.');
  return SpreadsheetApp.openById(id).getSheets()[0];
}

// 길이 제한 + 시트 수식으로 해석되지 않게
function clean(s) {
  s = s.trim().slice(0, MAX_TEXT);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function h(body, text) {
  body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function avg(values) {
  const nums = values.map(Number).filter(v => v > 0);
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '-';
}

function dist(body, title, values, choices) {
  body.appendParagraph(title).editAsText().setBold(true);
  const total = values.filter(Boolean).length || 1;
  choices.forEach(c => {
    const k = values.filter(v => v === c).length;
    const bar = '■'.repeat(Math.round(k / total * 20)) || '·';
    const name = /^\d$/.test(c) ? c + '점' : c;
    body.appendParagraph(name + '  ' + bar + '  ' + k + '명').editAsText().setBold(false);
  });
}

function quotes(body, title, values) {
  const list = values.map(v => String(v).replace(/^'/, '').trim()).filter(Boolean);
  body.appendParagraph(title + ' (' + list.length + ')').editAsText().setBold(true);
  if (!list.length) { body.appendParagraph('—').editAsText().setBold(false); return; }
  list.forEach(v => body.appendListItem(v).editAsText().setBold(false));
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 시각을 남기면 쪽지와 짝지을 수 있어서 날짜만 남겨요.
function dateOnly() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
}

function now() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}
