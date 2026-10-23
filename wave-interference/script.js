/**
 * Science Lab Hub - 파동의 중첩과 간섭 시뮬레이터 (script.js)
 * 
 * [3대 탐구 모드 구현]:
 * 1. 파동의 기본 성질: v = f × λ, 매질의 수직 진동 vs 파동의 수평 진행, 속력 일정 모드
 * 2. 파동의 중첩: 파동 1(청색) + 파동 2(적색) = 합성파(자주색 굵은선), 변위 벡터 합산 시각화
 * 3. 2차원 수면파 간섭: 두 점파원 원형파, 클릭 지점 경로차 Δr 계산 및 보강/상쇄 간섭 자동 판별
 */

// ========================================================
// 1. 전역 상태 변수
// ========================================================
var state = {
  currentTab: 'basic',   // 'basic' | 'superposition' | 'interference'
  isPlaying: true,
  playbackSpeed: 1.0,    // 0.5 | 1.0 | 2.0
  time: 0,               // 시뮬레이션 경과 시간 (초)
  
  // [모드 1: 기본 성질]
  basic: {
    amplitude: 35,       // px (진폭 A)
    wavelength: 140,     // px (파장 λ)
    frequency: 1.0,      // Hz (진동수 f)
    keepSpeedConstant: false, // 속력 일정 유지 모드
    probeX: 200          // 매질 진동 관찰 프로브 X 좌표
  },

  // [모드 2: 파동의 중첩]
  super: {
    amp1: 30,
    wave1: 140,
    dir1: 1,             // 1: 오른쪽, -1: 왼쪽
    amp2: 30,
    wave2: 140,
    dir2: -1,            // 마주보고 진행
    phaseDiffDeg: 0,     // 위상차 (도)
    probeX: 300          // 중첩 변위 합성 관찰 프로브 X
  },

  // [모드 3: 2차원 수면파 간섭]
  interf: {
    sourceDist: 140,     // 두 파원 간격 d (px)
    wavelength: 32,      // 파장 λ (px)
    phaseDiffDeg: 0,     // 위상차 (0: 동위상, 180: 반대위상)
    frequency: 1.2,      // 진동수
    probePoint: null     // 학생이 클릭한 수면 좌표 {x, y}
  }
};

// 캔버스 및 렌더러 참조
var canvas = document.getElementById('wave-canvas');
var ctx = canvas ? canvas.getContext('2d') : null;
var animId = null;
var lastTimestamp = 0;

// ========================================================
// 2. 모드 1: 파동의 기본 성질 렌더링
// ========================================================
function renderBasicWave(dt) {
  var width = canvas.width;
  var height = canvas.height;
  var centerY = height / 2;

  var A = state.basic.amplitude;
  var lambda = state.basic.wavelength;
  var f = state.basic.frequency;
  var v = f * lambda; // 파동의 진행 속력 (px/s)

  // 1. 기준선 (중심선)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // 2. 파동 연속 파형 (푸른색 곡선)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (var x = 0; x <= width; x += 2) {
    // y(x, t) = A * sin(2π * (x/λ - f*t))
    var k = (2 * Math.PI) / lambda;
    var omega = 2 * Math.PI * f;
    var y = centerY + A * Math.sin(k * x - omega * state.time);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // 3. 매질의 진동 입자들 (구슬들: 제자리에서 수직 진동만 함을 시각화)
  var beadSpacing = 24;
  for (var bx = 20; bx < width; bx += beadSpacing) {
    var bk = (2 * Math.PI) / lambda;
    var bOmega = 2 * Math.PI * f;
    var by = centerY + A * Math.sin(bk * bx - bOmega * state.time);

    // 입자 구슬
    ctx.beginPath();
    ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();

    // 중심선과의 수직 연결 보조선 (옅은 점선)
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.25)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(bx, centerY);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. 관찰 프로브 매질 점 (강조 빨간색 구슬 및 진동 화살표)
  var px = state.basic.probeX;
  var py = centerY + A * Math.sin(((2 * Math.PI) / lambda) * px - (2 * Math.PI * f) * state.time);

  // 수직 이동 가이드 레일
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, centerY - A - 15);
  ctx.lineTo(px, centerY + A + 15);
  ctx.stroke();
  ctx.setLineDash([]);

  // 프로브 구슬
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  // 매질의 순간 진동 속도 벡터 화살표 (v_y = dy/dt)
  var vy = -A * (2 * Math.PI * f) * Math.cos(((2 * Math.PI) / lambda) * px - (2 * Math.PI * f) * state.time);
  var arrowLen = vy * 0.15;
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + arrowLen);
  ctx.stroke();

  // 5. 파동의 진행 방향 안내 화살표 (수평)
  drawArrow(ctx, 40, 35, 120, 35, '#38bdf8', '파동의 진행 방향 →');
  drawArrow(ctx, px - 35, centerY - 25, px - 35, centerY + 25, '#ef4444', '매질의 진동 ↕');

  // 상태 텍스트 갱신
  document.getElementById('stat-speed').textContent = Math.round(v) + ' px/s';
  document.getElementById('stat-wave-lambda').textContent = lambda + ' px';
  document.getElementById('stat-freq').textContent = f.toFixed(1) + ' Hz';
  document.getElementById('stat-probe-disp').textContent = Math.round(-(py - centerY)) + ' px';
}

// ========================================================
// 3. 모드 2: 파동의 중첩 탐구 렌더링
// ========================================================
function renderSuperpositionWave(dt) {
  var width = canvas.width;
  var height = canvas.height;
  var centerY = height / 2;

  var s = state.super;
  var f = 0.8; // 중첩 관찰에 적합한 일정 진동수
  var omega = 2 * Math.PI * f;
  var phiRad = (s.phaseDiffDeg * Math.PI) / 180;

  // 중심 기준선
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // 1. 파동 1 (푸른색): y1
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (var x = 0; x <= width; x += 2) {
    var k1 = (2 * Math.PI) / s.wave1;
    var y1 = centerY + s.amp1 * Math.sin(k1 * x - s.dir1 * omega * state.time);
    if (x === 0) ctx.moveTo(x, y1);
    else ctx.lineTo(x, y1);
  }
  ctx.stroke();

  // 2. 파동 2 (붉은색): y2
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (var x2 = 0; x2 <= width; x2 += 2) {
    var k2 = (2 * Math.PI) / s.wave2;
    var y2 = centerY + s.amp2 * Math.sin(k2 * x2 - s.dir2 * omega * state.time + phiRad);
    if (x2 === 0) ctx.moveTo(x2, y2);
    else ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // 3. 합성파 (자주/보라색 굵은 선): y_total = y1 + y2
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  for (var xs = 0; xs <= width; xs += 2) {
    var k1s = (2 * Math.PI) / s.wave1;
    var k2s = (2 * Math.PI) / s.wave2;
    var val1 = s.amp1 * Math.sin(k1s * xs - s.dir1 * omega * state.time);
    var val2 = s.amp2 * Math.sin(k2s * xs - s.dir2 * omega * state.time + phiRad);
    var yTot = centerY + (val1 + val2);

    if (xs === 0) ctx.moveTo(xs, yTot);
    else ctx.lineTo(xs, yTot);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4. 프로브 위치에서 중첩 원리(y = y1 + y2) 벡터 막대 시각화
  var px = s.probeX;
  var pk1 = (2 * Math.PI) / s.wave1;
  var pk2 = (2 * Math.PI) / s.wave2;
  var pVal1 = s.amp1 * Math.sin(pk1 * px - s.dir1 * omega * state.time);
  var pVal2 = s.amp2 * Math.sin(pk2 * px - s.dir2 * omega * state.time + phiRad);
  var pValTot = pVal1 + pVal2;

  // 세로 기준점선
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, 30);
  ctx.lineTo(px, height - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // 각 파동의 변위 점 및 합성파 점
  drawPoint(ctx, px, centerY + pVal1, '#3b82f6', 4);
  drawPoint(ctx, px, centerY + pVal2, '#ef4444', 4);
  drawPoint(ctx, px, centerY + pValTot, '#a855f7', 7);

  // 실시간 수치 표기
  document.getElementById('stat-y1-val').textContent = Math.round(-pVal1) + ' px';
  document.getElementById('stat-y2-val').textContent = Math.round(-pVal2) + ' px';
  document.getElementById('stat-ytot-val').textContent = Math.round(-pValTot) + ' px';

  // 간섭 상태 문구 판정
  var statusBadge = document.getElementById('stat-interf-type');
  if (Math.abs(pValTot) > Math.max(s.amp1, s.amp2) * 1.5) {
    statusBadge.textContent = '🌟 보강 간섭 (변위 극대화)';
    statusBadge.className = 'interference-condition-tag tag-constructive';
  } else if (Math.abs(pValTot) < 4) {
    statusBadge.textContent = '🚫 상쇄 간섭 (변위 상쇄 ≈ 0)';
    statusBadge.className = 'interference-condition-tag tag-destructive';
  } else {
    statusBadge.textContent = '〰️ 중첩 진행 중';
    statusBadge.className = 'interference-condition-tag tag-intermediate';
  }
}

// ========================================================
// 4. 모드 3: 2차원 수면파의 간섭 탐구 렌더링
// ========================================================
function render2DInterference(dt) {
  var width = canvas.width;
  var height = canvas.height;
  var centerX = width / 2;
  var centerY = height / 2;

  var d = state.interf.sourceDist; // 두 파원 간격
  var lambda = state.interf.wavelength;
  var omega = 2 * Math.PI * state.interf.frequency;
  var phiRad = (state.interf.phaseDiffDeg * Math.PI) / 180;
  var k = (2 * Math.PI) / lambda;

  // 두 파원의 위치 S1, S2
  var s1 = { x: centerX - d / 2, y: centerY };
  var s2 = { x: centerX + d / 2, y: centerY };

  // 1. 2차원 수면파 픽셀 강도 렌더링 (저해상도 버퍼 업스케일링으로 부드러운 60fps 유지)
  var step = 4; // 4px 격자 간격 샘플링
  for (var y = 0; y < height; y += step) {
    for (var x = 0; x < width; x += step) {
      var dx1 = x - s1.x; var dy1 = y - s1.y;
      var r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

      var dx2 = x - s2.x; var dy2 = y - s2.y;
      var r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      // 두 원형파의 합성 변위
      var wave1 = Math.sin(k * r1 - omega * state.time);
      var wave2 = Math.sin(k * r2 - omega * state.time + phiRad);
      var tot = (wave1 + wave2) / 2; // -1 ~ 1

      // 컬러 맵핑: 보강 간섭 마루(밝은 시안/청록), 골(짙은 남색), 상쇄 간섭 마디선(중간 어두운 회색)
      var intensity = Math.floor((tot + 1) * 127.5);
      var rCol = Math.floor(intensity * 0.15);
      var gCol = Math.floor(intensity * 0.7);
      var bCol = Math.floor(intensity * 0.95);

      ctx.fillStyle = 'rgb(' + rCol + ',' + gCol + ',' + bCol + ')';
      ctx.fillRect(x, y, step, step);
    }
  }

  // 2. 파원 S1, S2 표시
  drawSource(ctx, s1.x, s1.y, 'S₁');
  drawSource(ctx, s2.x, s2.y, 'S₂');

  // 3. 학생이 클릭한 프로브 지점이 있는 경우 계측선 및 경로차 시각화
  var probe = state.interf.probePoint;
  if (probe) {
    var pr1 = Math.sqrt(Math.pow(probe.x - s1.x, 2) + Math.pow(probe.y - s1.y, 2));
    var pr2 = Math.sqrt(Math.pow(probe.x - s2.x, 2) + Math.pow(probe.y - s2.y, 2));
    var pathDiff = Math.abs(pr1 - pr2); // 경로차 Δr

    // S1 -> P 연결 점선
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(probe.x, probe.y);
    ctx.stroke();

    // S2 -> P 연결 점선
    ctx.strokeStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(s2.x, s2.y);
    ctx.lineTo(probe.x, probe.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 클릭 지점 P 핀 마커
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 텍스트 라벨
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Pretendard, sans-serif';
    ctx.fillText('P (측정 지점)', probe.x + 10, probe.y - 10);

    // 경로차 및 보강/상쇄 판별식 수치 갱신
    update2DProbeInfo(pr1, pr2, pathDiff, lambda);
  }
}

/**
 * 파원 S1, S2 표시 헬퍼
 */
function drawSource(c, x, y, label) {
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fillStyle = '#ef4444';
  c.shadowColor = 'rgba(239, 68, 68, 0.8)';
  c.shadowBlur = 10;
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  c.stroke();

  c.fillStyle = '#ffffff';
  c.font = 'bold 12px sans-serif';
  c.fillText(label, x - 8, y - 12);
}

/**
 * 2차원 간섭 경로차 및 보강/상쇄 조건 분석 판별
 */
function update2DProbeInfo(r1, r2, deltaR, lambda) {
  var ratio = deltaR / lambda;
  var roundedRatio = Math.round(ratio * 10) / 10;
  var mInt = Math.round(ratio);
  var diffFromInt = Math.abs(ratio - mInt);

  document.getElementById('stat-r1').textContent = Math.round(r1) + ' px';
  document.getElementById('stat-r2').textContent = Math.round(r2) + ' px';
  document.getElementById('stat-deltar').textContent = Math.round(deltaR) + ' px';
  document.getElementById('stat-deltar-lambda').textContent = ratio.toFixed(2) + ' λ';

  var conditionTag = document.getElementById('stat-2d-condition-tag');
  var conditionDesc = document.getElementById('stat-2d-condition-desc');

  var isInPhase = (state.interf.phaseDiffDeg === 0);

  if (diffFromInt < 0.12) {
    // 경로차가 파장의 정수배: Δr = m·λ
    if (isInPhase) {
      conditionTag.textContent = '🌟 보강 간섭 지점 (밝은 진동선)';
      conditionTag.className = 'interference-condition-tag tag-constructive';
      conditionDesc.textContent = '경로차 Δr = ' + mInt + 'λ (파장의 정수배) ➔ 두 파동의 위상이 일치하여 마루+마루 또는 골+골이 만나 진폭이 2배가 됩니다.';
    } else {
      conditionTag.textContent = '🚫 상쇄 간섭 지점 (마디선)';
      conditionTag.className = 'interference-condition-tag tag-destructive';
      conditionDesc.textContent = '두 파원의 출발 위상이 반대이므로, 경로차가 정수배여도 마루와 골이 만나 상쇄됩니다.';
    }
  } else if (Math.abs(diffFromInt - 0.5) < 0.12) {
    // 경로차가 반파장의 홀수배: Δr = (m + 1/2)·λ
    var halfM = Math.floor(ratio);
    if (isInPhase) {
      conditionTag.textContent = '🚫 상쇄 간섭 지점 (마디선 / Nodal Line)';
      conditionTag.className = 'interference-condition-tag tag-destructive';
      conditionDesc.textContent = '경로차 Δr = (' + halfM + ' + 0.5)λ (반파장의 홀수배) ➔ 항상 마루와 골이 만나 진동이 상쇄되어 수면이 잔잔합니다.';
    } else {
      conditionTag.textContent = '🌟 보강 간섭 지점';
      conditionTag.className = 'interference-condition-tag tag-constructive';
      conditionDesc.textContent = '두 파원의 출발 위상이 반대이므로 반파장의 홀수배 지점에서 보강 간섭이 일어납니다.';
    }
  } else {
    conditionTag.textContent = '〰️ 부분 중첩 영역';
    conditionTag.className = 'interference-condition-tag tag-intermediate';
    conditionDesc.textContent = '완전 보강과 완전 상쇄 사이의 중간 진폭으로 진동하는 지점입니다.';
  }
}

// ========================================================
// 5. 공통 애니메이션 루프 및 메인 렌더러
// ========================================================
function mainAnimationLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  var dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (state.isPlaying) {
    state.time += dt * state.playbackSpeed;
  }

  // 현재 활성화된 탭에 따른 렌더링 분기
  if (state.currentTab === 'basic') {
    renderBasicWave(dt);
  } else if (state.currentTab === 'superposition') {
    renderSuperpositionWave(dt);
  } else if (state.currentTab === 'interference') {
    render2DInterference(dt);
  }

  animId = requestAnimationFrame(mainAnimationLoop);
}

// 헬퍼: 화살표 그리기
function drawArrow(c, fromX, fromY, toX, toY, color, text) {
  var headlen = 8;
  var dx = toX - fromX;
  var dy = toY - fromY;
  var angle = Math.atan2(dy, dx);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(fromX, fromY);
  c.lineTo(toX, toY);
  c.stroke();
  c.beginPath();
  c.moveTo(toX, toY);
  c.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  c.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  c.fill();
  if (text) {
    c.font = 'bold 11px sans-serif';
    c.fillText(text, fromX, fromY - 6);
  }
}

// 헬퍼: 점 그리기
function drawPoint(c, x, y, color, r) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}

// ========================================================
// 6. UI 이벤트 및 탭 전환 관리
// ========================================================
function switchTab(tabName) {
  state.currentTab = tabName;

  // 탭 버튼 스타일 갱신
  document.querySelectorAll('.wave-tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 우측 조작 컨트롤 패널 분기
  document.getElementById('controls-basic').style.display = (tabName === 'basic') ? 'block' : 'none';
  document.getElementById('controls-super').style.display = (tabName === 'superposition') ? 'block' : 'none';
  document.getElementById('controls-interf').style.display = (tabName === 'interference') ? 'block' : 'none';

  // 하단 캔버스 상태바 분기
  document.getElementById('status-basic').style.display = (tabName === 'basic') ? 'flex' : 'none';
  document.getElementById('status-super').style.display = (tabName === 'superposition') ? 'flex' : 'none';
  document.getElementById('status-interf').style.display = (tabName === 'interference') ? 'flex' : 'none';

  // 2차원 간섭 탭에서는 기본 프로브 점 중앙 근처로 초기화
  if (tabName === 'interference' && !state.interf.probePoint) {
    state.interf.probePoint = { x: canvas.width / 2 + 50, y: canvas.height / 2 - 40 };
  }

  // 예측하기 퀴즈 및 실생활 사례 갱신
  updateInquiryContent(tabName);
}

/**
 * 탭별 예측 퀴즈 및 실생활 사례 동적 업데이트
 */
function updateInquiryContent(tabName) {
  var quizQ = document.getElementById('predict-question');
  var quizOpts = document.getElementById('predict-options-container');
  var quizFeedback = document.getElementById('predict-feedback');
  var realList = document.getElementById('real-world-list');

  quizFeedback.style.display = 'none';

  if (tabName === 'basic') {
    quizQ.textContent = 'Q. 매질의 종류가 같아서 파동의 진행 속력(v)이 일정할 때, 파동의 진동수(f)를 2배로 증가시키면 파장(λ)은 어떻게 변할까요?';
    quizOpts.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="false">① 파장도 2배로 길어진다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="true">② v = f × λ 에 의해 파장은 1/2로 줄어든다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ 파동의 파장은 변하지 않는다.</button>'
    );
    realList.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">📻</span>' +
        '<div><h4>전자기파와 라디오 주파수</h4><p>빛의 속력(c = f·λ)은 일정하므로, 진동수가 높은 5G/Wi-Fi 전파는 파장이 매우 짧고, 진동수가 낮은 AM 라디오파는 파장이 수백 미터에 달합니다.</p></div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🎸</span>' +
        '<div><h4>기타 줄의 음정</h4><p>줄의 굵기와 장력(매질)이 정해지면 파동의 속력이 결정되며, 손가락으로 줄을 짧게 잡을수록 파장이 짧아져 높은 진동수(높은 음)가 발생합니다.</p></div>' +
      '</div>'
    );
  } else if (tabName === 'superposition') {
    quizQ.textContent = 'Q. 진폭이 각각 A인 두 파동이 마주보고 진행하다가 한 파동의 마루와 다른 파동의 골이 정확히 겹치는 순간, 합성파의 진폭은 어떻게 될까요?';
    quizOpts.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="false">① 진폭이 2A가 된다 (보강 간섭).</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="true">② (+A) + (-A) = 0 으로 순간적으로 완전히 평평해진다 (상쇄 간섭).</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ 두 파동이 충돌하여 반대 방향으로 튕겨 나간다.</button>'
    );
    realList.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🎧</span>' +
        '<div><h4>액티브 노이즈 캔슬링(ANC) 이어폰</h4><p>외부 소음의 파동을 마이크로 감지한 뒤, 정확히 위상이 180도 반대인 역위상 소음 파동을 발생시켜 상쇄 간섭(y1 + y2 = 0)으로 주변 소음을 제거합니다.</p></div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🌊</span>' +
        '<div><h4>너울성 파도의 중첩</h4><p>먼 바다에서 발생한 여러 개의 파도가 해안가 근처에서 마루와 마루가 겹치면 순간적으로 진폭이 급격히 커지는 거대 너울(보강 간섭)이 일어납니다.</p></div>' +
      '</div>'
    );
  } else {
    quizQ.textContent = 'Q. 같은 위상으로 진동하는 두 수면 파원(S₁, S₂)으로부터 임의의 지점 P까지의 경로차(Δr = |r₁ - r₂|)가 파장의 정수배(1λ, 2λ...)일 때 일어나는 현상은?';
    quizOpts.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="true">① 항상 두 파동의 마루와 마루가 만나 수면이 가장 크게 출렁이는 보강 간섭이 일어난다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">② 항상 마루와 골이 만나 수면이 잔잔해지는 상쇄 간섭이 일어난다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ 파동이 사라진다.</button>'
    );
    realList.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">👓</span>' +
        '<div><h4>안경 렌즈의 무반사 코팅</h4><p>렌즈 표면에 얇은 유전체 박막을 코팅하여, 박막 표면에서 반사된 빛과 렌즈 경계면에서 반사된 빛의 경로차를 반파장의 홀수배로 만들어 반사광을 상쇄 간섭시킵니다.</p></div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🏛️</span>' +
        '<div><h4>콘서트홀 음향 사각지대 방지</h4><p>무대 양쪽 스피커에서 나온 음파가 특정 좌석에서 상쇄 간섭을 일으켜 소리가 작게 들리는 마디선이 생기지 않도록 음향 반사판과 흡음재를 설계합니다.</p></div>' +
      '</div>'
    );
  }

  // 퀴즈 피드백 바인딩
  document.querySelectorAll('.predict-opt-btn').forEach(function(b) {
    b.addEventListener('click', function() {
      var ok = this.getAttribute('data-correct') === 'true';
      document.querySelectorAll('.predict-opt-btn').forEach(function(btn) {
        btn.classList.remove('correct', 'wrong');
      });
      if (ok) {
        this.classList.add('correct');
        quizFeedback.style.display = 'block';
        quizFeedback.style.color = '#15803d';
        quizFeedback.innerHTML = '🎉 <strong>정답입니다!</strong> 위의 시뮬레이터 슬라이더를 직접 움직여 예측한 물리 현상을 확인해 보세요.';
      } else {
        this.classList.add('wrong');
        quizFeedback.style.display = 'block';
        quizFeedback.style.color = '#b91c1c';
        quizFeedback.innerHTML = '🤔 <strong>다시 생각해 볼까요?</strong> 화면의 슬라이더를 조작하고 프로브 위치를 클릭하여 결과를 관찰해 보세요.';
      }
    });
  });
}

// ========================================================
// 7. 슬라이더 및 컨트롤 이벤트 초기화
// ========================================================
document.addEventListener('DOMContentLoaded', function() {
  // 탭 전환
  document.querySelectorAll('.wave-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  });

  // 재생 / 일시정지
  var playBtn = document.getElementById('btn-play-pause');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      state.isPlaying = !state.isPlaying;
      this.innerHTML = state.isPlaying ? '<span>⏸</span> 일시 정지' : '<span>▶</span> 재생';
      this.classList.toggle('active', !state.isPlaying);
    });
  }

  // 프레임 전진 스텝
  var stepBtn = document.getElementById('btn-step-frame');
  if (stepBtn) {
    stepBtn.addEventListener('click', function() {
      state.isPlaying = false;
      if (playBtn) {
        playBtn.innerHTML = '<span>▶</span> 재생';
        playBtn.classList.add('active');
      }
      state.time += 0.05; // 0.05초 전진
    });
  }

  // 초기화
  var resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      state.time = 0;
    });
  }

  // 배속 선택
  var speedSelect = document.getElementById('select-speed');
  if (speedSelect) {
    speedSelect.addEventListener('change', function(e) {
      state.playbackSpeed = parseFloat(e.target.value);
    });
  }

  // --- [모드 1 슬라이더] ---
  bindSlider('slider-basic-amp', function(v) { state.basic.amplitude = v; }, 'badge-basic-amp', ' px');
  bindSlider('slider-basic-lambda', function(v) {
    state.basic.wavelength = v;
    if (state.basic.keepSpeedConstant) {
      // 속력 v 유지: f = v / lambda
      var constV = 140; // 기준 속력 140
      state.basic.frequency = constV / v;
      document.getElementById('slider-basic-freq').value = state.basic.frequency;
      document.getElementById('badge-basic-freq').textContent = state.basic.frequency.toFixed(2) + ' Hz';
    }
  }, 'badge-basic-lambda', ' px');

  bindSlider('slider-basic-freq', function(v) {
    state.basic.frequency = v;
    if (state.basic.keepSpeedConstant) {
      // 속력 v 유지: lambda = v / f
      var constV = 140;
      state.basic.wavelength = constV / v;
      document.getElementById('slider-basic-lambda').value = state.basic.wavelength;
      document.getElementById('badge-basic-lambda').textContent = Math.round(state.basic.wavelength) + ' px';
    }
  }, 'badge-basic-freq', ' Hz');

  // 속력 유지 모드 토글
  var keepSpeedBtn = document.getElementById('btn-toggle-keepspeed');
  if (keepSpeedBtn) {
    keepSpeedBtn.addEventListener('click', function() {
      state.basic.keepSpeedConstant = !state.basic.keepSpeedConstant;
      this.classList.toggle('active', state.basic.keepSpeedConstant);
      this.textContent = state.basic.keepSpeedConstant ? '🔒 속력(v) 일정 유지 중 (f↑ ➔ λ↓)' : '🔓 자유 조절 모드';
    });
  }

  // --- [모드 2 슬라이더] ---
  bindSlider('slider-super-amp1', function(v) { state.super.amp1 = v; }, 'badge-super-amp1', ' px');
  bindSlider('slider-super-amp2', function(v) { state.super.amp2 = v; }, 'badge-super-amp2', ' px');
  bindSlider('slider-super-wave1', function(v) { state.super.wave1 = v; }, 'badge-super-wave1', ' px');
  bindSlider('slider-super-wave2', function(v) { state.super.wave2 = v; }, 'badge-super-wave2', ' px');
  bindSlider('slider-super-phase', function(v) { state.super.phaseDiffDeg = v; }, 'badge-super-phase', '°');

  // 중첩 진행 방향 라디오 토글
  document.querySelectorAll('[data-dir-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-dir-mode]').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      var m = this.dataset.dirMode;
      if (m === 'head-on') { // 마주보고 진행
        state.super.dir1 = 1; state.super.dir2 = -1;
      } else if (m === 'same') { // 같은 방향(우측)
        state.super.dir1 = 1; state.super.dir2 = 1;
      } else { // 반대 방향(좌측)
        state.super.dir1 = -1; state.super.dir2 = -1;
      }
    });
  });

  // --- [모드 3 슬라이더] ---
  bindSlider('slider-interf-dist', function(v) { state.interf.sourceDist = v; }, 'badge-interf-dist', ' px');
  bindSlider('slider-interf-lambda', function(v) { state.interf.wavelength = v; }, 'badge-interf-lambda', ' px');

  // 위상 선택 토글 (동위상 0도 vs 반대위상 180도)
  document.querySelectorAll('[data-phase-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-phase-mode]').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.interf.phaseDiffDeg = parseInt(this.dataset.phaseMode, 10);
    });
  });

  // 캔버스 클릭 시 프로브 위치 이동
  if (canvas) {
    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var clickX = (e.clientX - rect.left) * scaleX;
      var clickY = (e.clientY - rect.top) * scaleY;

      if (state.currentTab === 'basic') {
        state.basic.probeX = Math.max(30, Math.min(canvas.width - 30, clickX));
      } else if (state.currentTab === 'superposition') {
        state.super.probeX = Math.max(30, Math.min(canvas.width - 30, clickX));
      } else if (state.currentTab === 'interference') {
        state.interf.probePoint = { x: clickX, y: clickY };
      }
    });
  }

  // 초기 탭 설정
  switchTab('basic');

  // 애니메이션 루프 가동
  requestAnimationFrame(mainAnimationLoop);
});

// 슬라이더 바인딩 헬퍼
function bindSlider(sliderId, onChange, badgeId, unit) {
  var slider = document.getElementById(sliderId);
  if (!slider) return;
  slider.addEventListener('input', function(e) {
    var val = parseFloat(e.target.value);
    onChange(val);
    if (badgeId) {
      document.getElementById(badgeId).textContent = (val % 1 === 0 ? val : val.toFixed(1)) + unit;
    }
  });
}
