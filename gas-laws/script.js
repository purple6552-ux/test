/**
 * Science Lab Hub - 기체 법칙 가상 실험실 스크립트 (script.js)
 * 
 * [핵심 기능]:
 * 1. 보일 법칙, 샤를 법칙, 보일·샤를 법칙 모드 전환 및 변인 통제 관리
 * 2. 캔버스 기반 피스톤 실린더 & 기체 분자 입자 운동 시뮬레이션:
 *    - 온도(T)에 비례한 분자 운동 속력(v ∝ √T) 육안 구별
 *    - 압력 및 온도에 따른 피스톤 높이(부피) 실시간 연동 및 탄성 충돌
 * 3. Chart.js 실시간 물리 그래프 플롯 및 실험 데이터 수집
 * 4. 실험 전 예측하기 퀴즈 및 실생활 과학 사례 동적 갱신
 */

// ========================================================
// 1. 상태 변수 및 물리 시뮬레이션 상수
// ========================================================
var state = {
  currentLaw: 'boyle', // 'boyle' | 'charles' | 'combined'
  pressure: 1.0,       // atm (0.5 ~ 4.0)
  temperatureC: 25,    // ℃ (-50 ~ 200)
  volume: 100,         // mL (기본 기준 부피 100 mL)
  recordedData: []     // 학생들이 기록한 실험 데이터 포인트들
};

// 기준 상수: 1 atm, 25℃(298.15 K)에서 부피 100 mL
var BASE_T_K = 298.15;
var BASE_P = 1.0;
var BASE_V = 100;

/**
 * 이상 기체 상태 방정식에 따른 부피(V) 계산
 * V = V0 * (P0 / P) * (T / T0)
 */
function calculateVolume(p, tempC) {
  var tK = tempC + 273.15;
  var v = BASE_V * (BASE_P / p) * (tK / BASE_T_K);
  return Math.round(v * 10) / 10;
}

// ========================================================
// 2. 기체 입자(Particle) 물리 모델 및 캔버스 렌더러
// ========================================================
var canvas = document.getElementById('gas-canvas');
var ctx = canvas ? canvas.getContext('2d') : null;
var animFrameId = null;

var PARTICLE_COUNT = 55;
var particles = [];

function initParticles() {
  particles = [];
  var chamberWidth = 320;
  var chamberHeight = 220;

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    var angle = Math.random() * Math.PI * 2;
    particles.push({
      x: 30 + Math.random() * (chamberWidth - 60),
      y: 100 + Math.random() * 100,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      radius: 4.5
    });
  }
}

/**
 * 온도(K)에 따른 기체 분자의 속력 계수 계산
 * v_rms ∝ √(T) (맥스웰-볼츠만 분포 원리)
 */
function getSpeedMultiplier() {
  var tK = state.temperatureC + 273.15;
  // 기준 온도 298.15 K에서 기준 속도 약 2.5
  return Math.sqrt(tK / BASE_T_K) * 2.8;
}

/**
 * 온도에 따른 입자 색상 (차가우면 푸른빛, 뜨거우면 붉은빛)
 */
function getParticleColor() {
  var t = state.temperatureC; // -50 ~ 200
  if (t < 0) {
    return '#60a5fa'; // 차가움: 밝은 파랑
  } else if (t < 60) {
    return '#38bdf8'; // 실온: 시원한 하늘색
  } else if (t < 130) {
    return '#fbbf24'; // 따뜻함: 노랑/주황
  } else {
    return '#ef4444'; // 뜨거움: 붉은색
  }
}

/**
 * 캔버스 애니메이션 루프
 */
function renderSimulation() {
  if (!ctx || !canvas) return;

  var width = canvas.width;
  var height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // 실린더 챔버 경계 영역 설정
  var chamberX = 60;
  var chamberY = 30;
  var chamberW = width - 120;
  var chamberH = height - 50;

  // 부피(V: 약 20mL ~ 300mL)에 따라 피스톤 헤드의 Y 위치 계산
  // 부피가 클수록 피스톤이 위로 올라감 (minY: 40, maxY: chamberH - 20)
  var clampedV = Math.max(25, Math.min(300, state.volume));
  var pistonY = chamberY + chamberH - ((clampedV / 280) * (chamberH - 40));

  // 1. 실린더 내부 배경 (기체 부피 영역)
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.fillRect(chamberX, pistonY, chamberW, (chamberY + chamberH) - pistonY);

  // 2. 실린더 외부 벽면 그리기 (U자형 금속 용기)
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(chamberX, chamberY);
  ctx.lineTo(chamberX, chamberY + chamberH);
  ctx.lineTo(chamberX + chamberW, chamberY + chamberH);
  ctx.lineTo(chamberX + chamberW, chamberY);
  ctx.stroke();

  // 부피 눈금자 눈금선 그리기
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#64748b';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px sans-serif';
  for (var vMark = 50; vMark <= 250; vMark += 50) {
    var markY = chamberY + chamberH - ((vMark / 280) * (chamberH - 40));
    ctx.beginPath();
    ctx.moveTo(chamberX - 8, markY);
    ctx.lineTo(chamberX, markY);
    ctx.stroke();
    ctx.fillText(vMark + 'mL', chamberX - 42, markY + 3);
  }

  // 3. 기체 분자 입자 이동 및 벽면 탄성 충돌
  var speed = getSpeedMultiplier();
  var pColor = getParticleColor();

  ctx.fillStyle = pColor;
  ctx.shadowColor = pColor;
  ctx.shadowBlur = 6;

  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];

    // 이동
    p.x += p.dirX * speed;
    p.y += p.dirY * speed;

    // 좌우 벽면 충돌
    if (p.x - p.radius <= chamberX) {
      p.x = chamberX + p.radius;
      p.dirX *= -1;
    } else if (p.x + p.radius >= chamberX + chamberW) {
      p.x = chamberX + chamberW - p.radius;
      p.dirX *= -1;
    }

    // 바닥면 충돌
    var floorY = chamberY + chamberH;
    if (p.y + p.radius >= floorY) {
      p.y = floorY - p.radius;
      p.dirY *= -1;
    }

    // 피스톤 헤드 충돌
    if (p.y - p.radius <= pistonY) {
      p.y = pistonY + p.radius;
      p.dirY *= -1;
    }

    // 피스톤이 급격히 내려와서 입자가 피스톤 위로 갇히는 현상 방지 보정
    if (p.y < pistonY + p.radius) {
      p.y = pistonY + p.radius + 2;
    }

    // 그리기
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0; // 그림자 초기화

  // 4. 피스톤 헤드 및 핸들 그리기
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  // 피스톤 플레이트
  ctx.fillRect(chamberX + 2, pistonY - 14, chamberW - 4, 14);
  ctx.strokeRect(chamberX + 2, pistonY - 14, chamberW - 4, 14);

  // 피스톤 연결 로드(막대)
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(width / 2 - 8, Math.max(0, pistonY - 60), 16, 46);
  ctx.strokeRect(width / 2 - 8, Math.max(0, pistonY - 60), 16, 46);

  // 5. 온도 표시 히터/쿨러 불꽃/얼음 시각화 (바닥면)
  drawHeatSource(chamberX, chamberH + chamberY, chamberW);

  animFrameId = requestAnimationFrame(renderSimulation);
}

/**
 * 챔버 바닥면 가열/냉각 상태 시각화
 */
function drawHeatSource(x, y, w) {
  var t = state.temperatureC;
  if (t > 50) {
    // 가열 상태: 주황/붉은 불꽃 표시
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(x + 10, y + 4, w - 20, 10);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 가열 중 (분자 속도 증가)', x + w / 2, y + 24);
  } else if (t < 0) {
    // 냉각 상태: 푸른 얼음/냉각 표시
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.fillRect(x + 10, y + 4, w - 20, 10);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❄️ 냉각 중 (분자 속도 감소)', x + w / 2, y + 24);
  }
}

// ========================================================
// 3. Chart.js 물리 실험 그래프 연동
// ========================================================
var gasChart = null;

function initGasChart() {
  var chartCanvas = document.getElementById('gas-chart-canvas');
  if (!chartCanvas) return;

  var ctxChart = chartCanvas.getContext('2d');

  gasChart = new Chart(ctxChart, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: '이론적 연속 곡선',
          data: [],
          showLine: true,
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        },
        {
          label: '학생 실험 기록값 📌',
          data: [],
          backgroundColor: '#dc2626',
          borderColor: '#ffffff',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: '현재 실시간 상태',
          data: [],
          backgroundColor: '#2563eb',
          borderColor: '#ffffff',
          borderWidth: 2,
          pointRadius: 8,
          pointStyle: 'triangle'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: '압력 P (atm)', font: { weight: 'bold' } },
          min: 0,
          max: 4.5
        },
        y: {
          title: { display: true, text: '부피 V (mL)', font: { weight: 'bold' } },
          min: 0,
          max: 250
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return '(' + context.parsed.x + ', ' + context.parsed.y + ' mL)';
            }
          }
        }
      }
    }
  });

  updateChartStructure();
}

/**
 * 선택된 법칙 모드에 맞춰 그래프 축과 이론 곡선 업데이트
 */
function updateChartStructure() {
  if (!gasChart) return;

  var law = state.currentLaw;
  var xTitle = '';
  var theoreticalPoints = [];

  if (law === 'boyle') {
    xTitle = '압력 P (atm)';
    gasChart.options.scales.x.min = 0;
    gasChart.options.scales.x.max = 4.5;
    gasChart.options.scales.x.title.text = xTitle;

    // 보일 법칙 이론 곡선 생성 (P: 0.5 ~ 4.0)
    for (var p = 0.5; p <= 4.0; p += 0.1) {
      theoreticalPoints.push({ x: Number(p.toFixed(2)), y: calculateVolume(p, state.temperatureC) });
    }
  } else if (law === 'charles') {
    xTitle = '온도 T (℃)';
    gasChart.options.scales.x.min = -60;
    gasChart.options.scales.x.max = 220;
    gasChart.options.scales.x.title.text = xTitle;

    // 샤를 법칙 이론 직선 생성 (T: -50 ~ 200)
    for (var tc = -50; tc <= 200; tc += 10) {
      theoreticalPoints.push({ x: tc, y: calculateVolume(state.pressure, tc) });
    }
  } else {
    xTitle = '압력 P (atm)';
    gasChart.options.scales.x.min = 0;
    gasChart.options.scales.x.max = 4.5;
    gasChart.options.scales.x.title.text = xTitle + ' (온도: ' + state.temperatureC + '℃)';

    for (var cp = 0.5; cp <= 4.0; cp += 0.1) {
      theoreticalPoints.push({ x: Number(cp.toFixed(2)), y: calculateVolume(cp, state.temperatureC) });
    }
  }

  // 데이터셋 0: 이론 곡선
  gasChart.data.datasets[0].data = theoreticalPoints;

  // 데이터셋 2: 현재 상태 점
  updateCurrentPointOnChart();

  gasChart.update();
}

/**
 * 실시간 현재 상태 점 차트에 반영
 */
function updateCurrentPointOnChart() {
  if (!gasChart) return;

  var currentX = (state.currentLaw === 'charles') ? state.temperatureC : state.pressure;
  gasChart.data.datasets[2].data = [{ x: currentX, y: state.volume }];
  gasChart.update('none'); // 애니메이션 없이 즉각 갱신
}

// ========================================================
// 4. UI 갱신 및 변인 통제 동적 관리
// ========================================================
function updateDashboardValues() {
  state.volume = calculateVolume(state.pressure, state.temperatureC);

  // 계측기 수치 갱신
  document.getElementById('val-pressure').textContent = state.pressure.toFixed(2) + ' atm';
  document.getElementById('val-volume').textContent = state.volume.toFixed(1) + ' mL';
  document.getElementById('val-temp').textContent = state.temperatureC + ' ℃ (' + (state.temperatureC + 273.15).toFixed(1) + ' K)';

  // 슬라이더 배지 갱신
  document.getElementById('badge-pressure-val').textContent = state.pressure.toFixed(2) + ' atm';
  document.getElementById('badge-temp-val').textContent = state.temperatureC + ' ℃';

  // 그래프의 현재 점 갱신
  updateCurrentPointOnChart();
}

/**
 * 법칙 탭 전환 처리
 */
function setLawMode(law) {
  state.currentLaw = law;

  // 탭 버튼 활성화 스타일
  document.querySelectorAll('.law-tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.law === law);
  });

  // 슬라이더 잠금/활성화 및 변인 통제 설정
  var pSlider = document.getElementById('slider-pressure');
  var tSlider = document.getElementById('slider-temp');
  var pLockMsg = document.getElementById('msg-lock-pressure');
  var tLockMsg = document.getElementById('msg-lock-temp');

  var manipBadge = document.getElementById('badge-manipulated-var');
  var respBadge = document.getElementById('badge-responding-var');
  var ctrlBadge = document.getElementById('badge-controlled-var');

  if (law === 'boyle') {
    // 보일: 압력 조작, 온도 고정(25℃)
    state.temperatureC = 25;
    tSlider.value = 25;
    tSlider.disabled = true;
    pSlider.disabled = false;
    tLockMsg.style.display = 'block';
    pLockMsg.style.display = 'none';

    manipBadge.textContent = '압력 P (기압)';
    respBadge.textContent = '부피 V (mL)';
    ctrlBadge.textContent = '온도 T (25℃ 일정), 기체 몰수 n';
  } else if (law === 'charles') {
    // 샤를: 온도 조작, 압력 고정(1.0 atm)
    state.pressure = 1.0;
    pSlider.value = 1.0;
    pSlider.disabled = true;
    tSlider.disabled = false;
    pLockMsg.style.display = 'block';
    tLockMsg.style.display = 'none';

    manipBadge.textContent = '온도 T (℃ 또는 절대온도 K)';
    respBadge.textContent = '부피 V (mL)';
    ctrlBadge.textContent = '압력 P (1 atm 일정), 기체 몰수 n';
  } else {
    // 보일·샤를: 압력과 온도 모두 조작 가능
    pSlider.disabled = false;
    tSlider.disabled = false;
    pLockMsg.style.display = 'none';
    tLockMsg.style.display = 'none';

    manipBadge.textContent = '압력 P & 온도 T 동시 조작';
    respBadge.textContent = '부피 V (mL)';
    ctrlBadge.textContent = '기체 몰수 n (일정)';
  }

  // 학생 기록 데이터 초기화 및 차트 구조 갱신
  state.recordedData = [];
  renderRecordedDataTable();
  updateDashboardValues();
  updateChartStructure();

  // 탐구 퀴즈 및 실생활 사례 갱신
  updateInquiryContent(law);
}

/**
 * 실험 전 예측하기 퀴즈 및 실생활 사례 동적 갱신
 */
function updateInquiryContent(law) {
  var quizTitle = document.getElementById('predict-question');
  var optContainer = document.getElementById('predict-options-container');
  var feedbackEl = document.getElementById('predict-feedback');
  var realWorldContainer = document.getElementById('real-world-list');

  feedbackEl.style.display = 'none';

  if (law === 'boyle') {
    quizTitle.textContent = 'Q. 온도가 일정할 때, 실린더에 가하는 외부 압력을 2배(1 atm → 2 atm)로 증가시키면 기체의 부피는 어떻게 변할까요?';
    optContainer.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="false">① 부피가 2배로 증가한다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="true">② 부피가 1/2로 줄어든다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ 부피는 전혀 변하지 않는다.</button>'
    );

    realWorldContainer.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🤿</span>' +
        '<div>' +
          '<h4>스쿠버 다이버의 공기 방울</h4>' +
          '<p>깊은 바다 속에서는 수압이 매우 높아 공기 방울이 작지만, 수면으로 올라올수록 압력이 낮아져 방울의 부피가 급격히 커집니다.</p>' +
        '</div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">✈️</span>' +
        '<div>' +
          '<h4>높은 산이나 비행기 속 과자 봉지</h4>' +
          '<p>고도가 높아지면 대기압이 낮아집니다. 봉지 내부 기체의 압력이 외부보다 커지면서 과자 봉지가 빵빵하게 부풀어 오릅니다.</p>' +
        '</div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">💉</span>' +
        '<div>' +
          '<h4>주사기 피스톤 누르기</h4>' +
          '<p>주사기 입구를 손가락으로 막고 피스톤을 힘껏 밀면, 압력이 증가함에 따라 내부 공기의 부피가 압축됩니다.</p>' +
        '</div>' +
      '</div>'
    );
  } else if (law === 'charles') {
    quizTitle.textContent = 'Q. 압력이 일정할 때, 기체의 온도를 높여주면 기체 분자 운동과 부피는 어떻게 될까요?';
    optContainer.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="true">① 분자 운동이 활발해져 벽면 충돌이 강해지고 부피가 팽창한다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">② 분자 운동이 느려져 부피가 수축한다.</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ 분자 운동 속도는 온도와 무관하므로 부피는 일정하다.</button>'
    );

    realWorldContainer.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🏓</span>' +
        '<div>' +
          '<h4>찌그러진 탁구공 펴기</h4>' +
          '<p>찌그러진 탁구공을 뜨거운 물에 넣으면 내부 공기의 온도가 올라가면서 부피가 팽창하여 공이 원래대로 둥글게 펴집니다.</p>' +
        '</div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🎈</span>' +
        '<div>' +
          '<h4>열기구의 비행 원리</h4>' +
          '<p>버너로 공기를 가열하면 부피가 팽창하고 밀도가 공기보다 작아져 하늘 위로 떠오르는 부력을 얻습니다.</p>' +
        '</div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🚗</span>' +
        '<div>' +
          '<h4>여름철과 겨울철 자동차 타이어 공기압</h4>' +
          '<p>여름철에는 아스팔트 열기로 타이어 내부 기체 온도가 상승해 공기압이 높아지고, 겨울철에는 수축하여 공기압 경고등이 켜집니다.</p>' +
        '</div>' +
      '</div>'
    );
  } else {
    quizTitle.textContent = 'Q. 압력(P)과 절대온도(T)가 동시에 변할 때, 보일·샤를 법칙에 따른 올바른 관계식은 무엇일까요?';
    optContainer.innerHTML = (
      '<button type="button" class="predict-opt-btn" data-correct="true">① (P × V) / T = 일정</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">② P × V × T = 일정</button>' +
      '<button type="button" class="predict-opt-btn" data-correct="false">③ (P × T) / V = 일정</button>'
    );

    realWorldContainer.innerHTML = (
      '<div class="real-world-item">' +
        '<span class="real-world-icon">🌤️</span>' +
        '<div>' +
          '<h4>기상 관측용 풍선 (라디오존데)</h4>' +
          '<p>상공으로 올라갈수록 기온은 낮아지지만 기압 감소 효과가 훨씬 커서 풍선이 점점 커지다가 결국 터지게 됩니다.</p>' +
        '</div>' +
      '</div>' +
      '<div class="real-world-item">' +
        '<span class="real-world-icon">⚙️</span>' +
        '<div>' +
          '<h4>내연기관 실린더 압축 및 폭발</h4>' +
          '<p>자동차 엔진 실린더 내에서 피스톤이 연료-공기 혼합기를 압축할 때 압력과 온도가 급격히 상승하며 연소가 일어납니다.</p>' +
        '</div>' +
      '</div>'
    );
  }

  // 퀴즈 옵션 클릭 이벤트 바인딩
  document.querySelectorAll('.predict-opt-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var isCorrect = this.getAttribute('data-correct') === 'true';
      document.querySelectorAll('.predict-opt-btn').forEach(function(b) {
        b.classList.remove('correct', 'wrong');
      });
      if (isCorrect) {
        this.classList.add('correct');
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#15803d';
        feedbackEl.innerHTML = '🎉 <strong>정답입니다!</strong> 위의 슬라이더를 직접 조작하며 실험 시뮬레이션과 그래프로 예측이 맞는지 확인해 보세요.';
      } else {
        this.classList.add('wrong');
        feedbackEl.style.display = 'block';
        feedbackEl.style.color = '#b91c1c';
        feedbackEl.innerHTML = '🤔 <strong>다시 생각해 볼까요?</strong> 위의 시뮬레이터에서 슬라이더를 움직여 피스톤의 움직임과 분자 운동을 관찰해 보세요.';
      }
    });
  });
}

// ========================================================
// 5. 학생 실험 데이터 기록 기능 (Data Logging)
// ========================================================
function recordCurrentData() {
  var currentX = (state.currentLaw === 'charles') ? state.temperatureC : state.pressure;
  var point = {
    p: state.pressure,
    t: state.temperatureC,
    v: state.volume,
    x: currentX,
    y: state.volume
  };

  state.recordedData.push(point);

  // 차트에 학생 기록 점 추가
  if (gasChart) {
    gasChart.data.datasets[1].data.push({ x: point.x, y: point.y });
    gasChart.update();
  }

  renderRecordedDataTable();
}

function clearRecordedData() {
  state.recordedData = [];
  if (gasChart) {
    gasChart.data.datasets[1].data = [];
    gasChart.update();
  }
  renderRecordedDataTable();
}

function renderRecordedDataTable() {
  var tbody = document.getElementById('data-table-body');
  if (!tbody) return;

  if (state.recordedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1rem;">기록된 실험 데이터가 없습니다. 우측 [데이터 기록 📌]을 눌러보세요.</td></tr>';
    return;
  }

  tbody.innerHTML = state.recordedData.map(function(d, idx) {
    return (
      '<tr>' +
        '<td style="font-weight:700; text-align:center;">#' + (idx + 1) + '</td>' +
        '<td style="text-align:center;">' + d.p.toFixed(2) + ' atm</td>' +
        '<td style="text-align:center;">' + d.t + ' ℃</td>' +
        '<td style="text-align:center; font-weight:700; color:#2563eb;">' + d.v.toFixed(1) + ' mL</td>' +
      '</tr>'
    );
  }).join('');
}

// ========================================================
// 6. 이벤트 리스너 바인딩 및 앱 초기화
// ========================================================
document.addEventListener('DOMContentLoaded', function() {
  initParticles();
  initGasChart();

  // 법칙 전환 탭 이벤트
  document.querySelectorAll('.law-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setLawMode(this.dataset.law);
    });
  });

  // 압력 슬라이더 이벤트
  var pSlider = document.getElementById('slider-pressure');
  if (pSlider) {
    pSlider.addEventListener('input', function(e) {
      state.pressure = parseFloat(e.target.value);
      updateDashboardValues();
    });
  }

  // 온도 슬라이더 이벤트
  var tSlider = document.getElementById('slider-temp');
  if (tSlider) {
    tSlider.addEventListener('input', function(e) {
      state.temperatureC = parseInt(e.target.value, 10);
      updateDashboardValues();
    });
  }

  // 데이터 기록 버튼
  var recordBtn = document.getElementById('btn-record-data');
  if (recordBtn) {
    recordBtn.addEventListener('click', recordCurrentData);
  }

  // 기록 초기화 버튼
  var clearBtn = document.getElementById('btn-clear-data');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearRecordedData);
  }

  // 초기 모드 실행 (보일 법칙)
  setLawMode('boyle');

  // 시뮬레이션 루프 시작
  renderSimulation();
});
