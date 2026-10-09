/**
 * 🍄 초코송이들 춘천 나들이 — 후기 설문 + 관리자 정리본
 *
 * 쓰는 법 (자세한 건 survey/README.md)
 *  1. script.google.com → 새 프로젝트 → 이 파일 내용 붙여넣기
 *  2. 아래 PARTICIPANTS 에 참가자 이름 입력 (깃허브에는 올리지 마세요)
 *  3. createSurvey 실행 → 실행 로그에 나온 "후기 설문 링크"를 카톡방에 공유
 *  4. 응답이 모이면
 *     - makeReport       → 후기 정리본 (공유·출력용, 비밀 쪽지 없음)
 *     - makeSecretReport → 🔒 비밀 쪽지 정리본 (관리자만)
 *
 * 설문은 두 개로 나뉘어요.
 *  - 후기 설문 : 완전 익명. 이름·이메일을 받지 않아요.
 *  - 비밀 쪽지 : 선택. 후기 제출 뒤 안내 링크로 들어가고, 이 쪽지에만 이름을 적어요.
 *    두 설문은 서로 연결되지 않아서, 관리자도 후기와 이름을 짝지을 수 없어요.
 */

// 참가자 명단 — 비밀 쪽지에서 체크박스로 보여요.
const PARTICIPANTS = [
  // '홍길동',
  // '김철수',
];

const TITLE = '🍄 초코송이들 춘천 나들이 후기';
const SECRET_TITLE = '💌 초코송이들 비밀 쪽지';

const Q = {
  overall: '오늘 초코송이들 나들이는 전체적으로 어땠나요?',
  oneLine: '오늘 하루를 한 줄로 표현한다면?',
  places: '장소별로 어땠나요?',
  best: '가장 좋았던 순간이나 장소는?',
  talk: '새로운 사람과 충분히 이야기 나눌 수 있었나요?',
  groups: '조를 바꿔가며 다닌 방식은 어땠나요?',
  noProfile: '프로필 없이 당일 실명으로 만나는 방식은 어땠나요?',
  pace: '일정 시간 배분은 어땠나요?',
  fee: '회비 7만 원은 어땠나요?',
  again: '다음에도 참여하고 싶나요?',
  wish: '아쉬웠던 점이나 바라는 점이 있다면?',
  thanks: '함께한 지체들이나 섬겨준 분들께 하고 싶은 말',
};
const PLACES = ['38마일 브런치', '김유정역', '춘천 닭갈비', '산토리니'];
const SCALE = ['1', '2', '3', '4', '5'];

const S = {
  me: '내 이름',
  them: '오늘 더 이야기 나누지 못해 아쉬웠던 분이 있나요?',
  note: '운영진에게 남기고 싶은 말 (선택)',
};

/** 1) 설문 두 개와 응답 시트를 만들어요. 한 번만 실행하세요. */
function createSurvey() {
  if (PARTICIPANTS.length < 2) {
    throw new Error('PARTICIPANTS 에 참가자 이름을 먼저 입력해 주세요.');
  }
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    throw new Error('이미 만들어졌어요. 다시 만들려면 프로젝트 설정 → 스크립트 속성을 지우고 실행하세요.');
  }

  // 비밀 쪽지 먼저 만들어야 후기 설문 완료 메시지에 링크를 넣을 수 있어요.
  const secret = FormApp.create(SECRET_TITLE)
    .setDescription(
      '오늘 시간이 짧아서 더 이야기 나누지 못해 아쉬웠던 분이 있다면 살짝 알려주세요 🍄\n\n' +
      '· 운영진(관리자)만 확인하고, 상대방을 포함해 누구에게도 공개하지 않아요.\n' +
      '· 다음 만남에서 자연스럽게 같은 조가 되도록 돕는 데만 사용해요.\n' +
      '· 남기지 않아도 전혀 괜찮아요.'
    );
  baseSettings(secret);
  secret.addListItem().setTitle(S.me).setChoiceValues(PARTICIPANTS).setRequired(true);
  secret.addCheckboxItem().setTitle(S.them)
    .setHelpText('여러 명 골라도 돼요. 본인 이름은 빼고 골라주세요.')
    .setChoiceValues(PARTICIPANTS).setRequired(true);
  secret.addParagraphTextItem().setTitle(S.note);
  secret.setConfirmationMessage('소중한 마음 고마워요. 운영진만 보고 조용히 간직할게요 💌');

  const form = FormApp.create(TITLE)
    .setDescription(
      '오늘 함께해 주셔서 고마워요! 3분이면 끝나요.\n' +
      '이름·연락처를 받지 않는 익명 설문이니 편하게 적어주세요.'
    );
  baseSettings(form);

  form.addSectionHeaderItem().setTitle('오늘 하루');
  form.addScaleItem().setTitle(Q.overall).setBounds(1, 5)
    .setLabels('아쉬웠어요', '최고였어요').setRequired(true);
  form.addTextItem().setTitle(Q.oneLine);
  form.addGridItem().setTitle(Q.places)
    .setHelpText('1 아쉬웠어요 · 5 최고였어요')
    .setRows(PLACES).setColumns(SCALE).setRequired(true);
  form.addParagraphTextItem().setTitle(Q.best);

  form.addSectionHeaderItem().setTitle('만남과 교제');
  form.addScaleItem().setTitle(Q.talk).setBounds(1, 5)
    .setLabels('거의 못 했어요', '충분했어요').setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.groups)
    .setChoiceValues(['좋았어요', '보통이에요', '한 조로 쭉 가는 게 나았어요']).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.noProfile)
    .setChoiceValues(['좋았어요', '보통이에요', '미리 아는 게 나았어요']).setRequired(true);

  form.addSectionHeaderItem().setTitle('운영');
  form.addMultipleChoiceItem().setTitle(Q.pace)
    .setChoiceValues(['빡빡했어요', '적당했어요', '여유로웠어요']).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.fee)
    .setChoiceValues(['적당했어요', '비쌌어요', '저렴했어요']).setRequired(true);

  form.addSectionHeaderItem().setTitle('다음을 위해');
  form.addMultipleChoiceItem().setTitle(Q.again)
    .setChoiceValues(['꼭 참여할래요', '아마도요', '글쎄요']).setRequired(true);
  form.addParagraphTextItem().setTitle(Q.wish);
  form.addParagraphTextItem().setTitle(Q.thanks);

  form.setConfirmationMessage(
    '후기 고마워요! 🍄\n\n' +
    '혹시 오늘 더 이야기 나누지 못해 아쉬웠던 분이 있다면, 비밀 쪽지로 살짝 알려주세요.\n' +
    '운영진만 보고, 누구에게도 공개하지 않아요. (선택)\n' +
    shortUrl(secret)
  );

  // 응답 시트는 따로 — 후기 시트를 공유해도 비밀 쪽지는 딸려가지 않아요.
  const ss = SpreadsheetApp.create('초코송이들 후기 응답');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  const secretSs = SpreadsheetApp.create('🔒 초코송이들 비밀 쪽지 응답');
  secret.setDestination(FormApp.DestinationType.SPREADSHEET, secretSs.getId());

  props.setProperties({ FORM_ID: form.getId(), SECRET_FORM_ID: secret.getId() });

  Logger.log('후기 설문 링크 (카톡방에 공유) : ' + shortUrl(form));
  Logger.log('비밀 쪽지 링크 : ' + shortUrl(secret));
  Logger.log('후기 설문 편집 : ' + form.getEditUrl());
  Logger.log('후기 응답 시트 : ' + ss.getUrl());
  Logger.log('비밀 쪽지 응답 시트 : ' + secretSs.getUrl());
}

function baseSettings(form) {
  form.setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setPublishingSummary(false)   // 응답자가 다른 사람 응답을 못 보게
    .setProgressBar(false);
  try { form.setRequireLogin(false); } catch (e) { /* 개인 계정은 해당 없음 */ }
  if (typeof form.setPublished === 'function') form.setPublished(true);
}

function shortUrl(form) {
  try { return form.shortenFormUrl(form.getPublishedUrl()); } catch (e) { return form.getPublishedUrl(); }
}

/** 2) 후기 정리본 — 공유·출력해도 되는 문서예요 (비밀 쪽지 없음). */
function makeReport() {
  const form = FormApp.openById(prop('FORM_ID'));
  const rows = form.getResponses().map(toMap);
  const n = rows.length;

  const doc = DocumentApp.create(TITLE + ' 정리본 ' + today());
  const body = doc.getBody();
  body.appendParagraph(TITLE + ' 정리본').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('10월 9일(금) 춘천 · 응답 ' + n + '명 · ' + today() + ' 기준');
  if (!n) { doc.saveAndClose(); Logger.log('아직 응답이 없어요. ' + doc.getUrl()); return; }

  h(body, '한눈에 보기');
  body.appendTable([
    ['항목', '평균 (5점 만점)'],
    ['전체 만족도', avg(rows.map(r => r[Q.overall]))],
    ['새로운 사람과 대화', avg(rows.map(r => r[Q.talk]))],
  ].concat(PLACES.map((p, i) => [p, avg(rows.map(r => (r[Q.places] || [])[i]))])));
  body.appendParagraph('다음에도 꼭 참여 : ' + pct(rows, Q.again, '꼭 참여할래요'));

  h(body, '점수 분포');
  dist(body, Q.overall, rows.map(r => r[Q.overall]), SCALE.slice().reverse());
  dist(body, Q.talk, rows.map(r => r[Q.talk]), SCALE.slice().reverse());

  h(body, '만남 · 운영');
  dist(body, Q.groups, rows.map(r => r[Q.groups]), ['좋았어요', '보통이에요', '한 조로 쭉 가는 게 나았어요']);
  dist(body, Q.noProfile, rows.map(r => r[Q.noProfile]), ['좋았어요', '보통이에요', '미리 아는 게 나았어요']);
  dist(body, Q.pace, rows.map(r => r[Q.pace]), ['빡빡했어요', '적당했어요', '여유로웠어요']);
  dist(body, Q.fee, rows.map(r => r[Q.fee]), ['적당했어요', '비쌌어요', '저렴했어요']);
  dist(body, Q.again, rows.map(r => r[Q.again]), ['꼭 참여할래요', '아마도요', '글쎄요']);

  h(body, '나눠준 이야기');
  // 순서를 섞어서 제출 순서로 누가 썼는지 짐작하지 못하게 해요.
  [Q.oneLine, Q.best, Q.wish, Q.thanks].forEach(q => quotes(body, q, shuffle(rows.map(r => r[q]))));

  doc.saveAndClose();
  Logger.log('후기 정리본 : ' + doc.getUrl());
}

/** 3) 🔒 비밀 쪽지 정리본 — 관리자만 보세요. */
function makeSecretReport() {
  const form = FormApp.openById(prop('SECRET_FORM_ID'));
  // 같은 사람이 여러 번 냈으면 마지막 응답만 써요.
  const byName = {};
  form.getResponses().forEach(res => {
    const r = toMap(res);
    if (r[S.me]) byName[r[S.me]] = { picks: (r[S.them] || []).filter(x => x !== r[S.me]), note: r[S.note] };
  });
  const names = Object.keys(byName).sort();

  const doc = DocumentApp.create('🔒 ' + SECRET_TITLE + ' 정리본 ' + today());
  const body = doc.getBody();
  body.appendParagraph('🔒 비밀 쪽지 정리본').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('관리자만 확인 · 공유·출력 주의 · 쪽지 ' + names.length + '명 · ' + today() + ' 기준');

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
      .concat(names.map(a => [a, byName[a].picks.join(', '), byName[a].note || ''])));
  } else {
    body.appendParagraph('아직 쪽지가 없어요.');
  }

  doc.saveAndClose();
  Logger.log('🔒 비밀 쪽지 정리본 : ' + doc.getUrl());
}

// ── 도우미 ──────────────────────────────────────────────

function prop(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('createSurvey 를 먼저 실행해 주세요.');
  return v;
}

function toMap(res) {
  const m = {};
  res.getItemResponses().forEach(ir => { m[ir.getItem().getTitle()] = ir.getResponse(); });
  return m;
}

function h(body, text) {
  body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING2);
}

function avg(values) {
  const nums = values.map(Number).filter(v => v > 0);
  return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '-';
}

function pct(rows, q, choice) {
  const hit = rows.filter(r => r[q] === choice).length;
  return hit + '명 (' + Math.round(hit / rows.length * 100) + '%)';
}

function dist(body, title, values, choices) {
  body.appendParagraph(title).editAsText().setBold(true);
  const total = values.filter(Boolean).length || 1;
  choices.forEach(c => {
    const k = values.filter(v => v === c).length;
    const bar = '■'.repeat(Math.round(k / total * 20)) || '·';
    body.appendParagraph(pad(c) + '  ' + bar + '  ' + k + '명').editAsText().setBold(false);
  });
}

function quotes(body, title, values) {
  const list = values.filter(v => v && String(v).trim());
  body.appendParagraph(title + ' (' + list.length + ')').editAsText().setBold(true);
  if (!list.length) { body.appendParagraph('—').editAsText().setBold(false); return; }
  list.forEach(v => body.appendListItem(String(v).trim()).editAsText().setBold(false));
}

function pad(s) {
  return /^\d$/.test(s) ? s + '점' : s;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function today() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}
