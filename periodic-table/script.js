/**
 * Science Lab Hub - 주기율표 탐구 실험실 스크립트 (script.js)
 * 
 * [주요 기능]:
 * 1. 118개 원소 데이터 및 고등학교 통합과학 필수 원소(1~20번 및 주요 금속/비금속)의 상세 물성
 * 2. 18열 표준 주기율표 그리드 동적 렌더링
 * 3. 족별/분류별 하이라이트 필터링 기능
 * 4. 주기성 탐구 모드 (원자가 전자 수, 원자 반지름, 전기 음성도, 이온화 에너지 히트맵)
 * 5. 원소 상세 정보 모달 창:
 *    - 원자가 전자 수 및 전자 배치
 *    - 캔버스 기반 보어(Bohr) 원자 모형 시각화 (동심원 궤도 및 전자 회전 애니메이션)
 *    - 동위 원소(Isotopes) 선택기: 선택한 동위원소 기준으로 질량수와 중성자 수 즉시 연동
 *    - 화학적 성질 및 실생활 활용 안내
 */

// ========================================================
// 1. 원소 데이터베이스 (고등학교 과학 탐구용)
// ========================================================
var ELEMENTS_DATA = [
  {
    number: 1, symbol: "H", name: "수소", nameEn: "Hydrogen", group: 1, period: 1,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "1.008", valElectrons: 1, electronConfig: "1s¹", shells: [1],
    atomicRadius: 53, electronegativity: 2.20, ionizationEnergy: 1312,
    isotopes: [
      { massNumber: 1, symbol: "¹H (경수소)", abundance: "99.98%", protons: 1, neutrons: 0 },
      { massNumber: 2, symbol: "²H (중수소)", abundance: "0.015%", protons: 1, neutrons: 1 },
      { massNumber: 3, symbol: "³H (삼중수소)", abundance: "미량 (방사성)", protons: 1, neutrons: 2 }
    ],
    summary: "우주에서 가장 흔하고 가벼운 원소입니다. 1족이지만 비금속이며, 전자를 1개 잃어 H⁺가 되거나 공유 결합을 형성하여 물(H₂O) 등 다양한 화합물을 만듭니다."
  },
  {
    number: 2, symbol: "He", name: "헬륨", nameEn: "Helium", group: 18, period: 1,
    category: "cat-noble-gas", categoryName: "비활성 기체",
    atomicMass: "4.0026", valElectrons: 0, electronConfig: "1s²", shells: [2],
    atomicRadius: 31, electronegativity: null, ionizationEnergy: 2372,
    isotopes: [
      { massNumber: 4, symbol: "⁴He", abundance: "99.999%", protons: 2, neutrons: 2 },
      { massNumber: 3, symbol: "³He", abundance: "0.0001%", protons: 2, neutrons: 1 }
    ],
    summary: "18족 비활성 기체로 가장 바깥 전자 껍질(K 껍질)이 2개로 꽉 차 있어 화학적으로 매우 안정하며 반응성이 거의 없습니다. 공기보다 가벼워 비행선 및 풍선에 쓰입니다."
  },
  {
    number: 3, symbol: "Li", name: "리튬", nameEn: "Lithium", group: 1, period: 2,
    category: "cat-alkali-metal", categoryName: "알칼리 금속",
    atomicMass: "6.94", valElectrons: 1, electronConfig: "[He] 2s¹", shells: [2, 1],
    atomicRadius: 167, electronegativity: 0.98, ionizationEnergy: 520,
    isotopes: [
      { massNumber: 7, symbol: "⁷Li", abundance: "92.4%", protons: 3, neutrons: 4 },
      { massNumber: 6, symbol: "⁶Li", abundance: "7.6%", protons: 3, neutrons: 3 }
    ],
    summary: "1족 알칼리 금속으로 물과 격렬히 반응하여 수소 기체를 발생시키고 수용액을 염기성으로 만듭니다. 원자가 전자 1개를 잃고 Li⁺ 양이온이 되기 쉽습니다."
  },
  {
    number: 4, symbol: "Be", name: "베릴륨", nameEn: "Beryllium", group: 2, period: 2,
    category: "cat-alkaline-earth", categoryName: "알칼리 토금속",
    atomicMass: "9.0122", valElectrons: 2, electronConfig: "[He] 2s²", shells: [2, 2],
    atomicRadius: 112, electronegativity: 1.57, ionizationEnergy: 899,
    isotopes: [
      { massNumber: 9, symbol: "⁹Be", abundance: "100%", protons: 4, neutrons: 5 }
    ],
    summary: "2족 알칼리 토금속으로 단단하고 가벼운 은백색 금속입니다. 에메랄드의 주성분 광물에 포함되어 있으며 X선 창이나 항공우주 합금에 사용됩니다."
  },
  {
    number: 5, symbol: "B", name: "붕소", nameEn: "Boron", group: 13, period: 2,
    category: "cat-metalloid", categoryName: "준금속",
    atomicMass: "10.81", valElectrons: 3, electronConfig: "[He] 2s² 2p¹", shells: [2, 3],
    atomicRadius: 87, electronegativity: 2.04, ionizationEnergy: 801,
    isotopes: [
      { massNumber: 11, symbol: "¹¹B", abundance: "80.1%", protons: 5, neutrons: 6 },
      { massNumber: 10, symbol: "¹⁰B", abundance: "19.9%", protons: 5, neutrons: 5 }
    ],
    summary: "금속과 비금속의 중간 성질을 띠는 준금속입니다. 내열유리(파이렉스)의 제조 및 반도체 도핑 물질로 널리 활용됩니다."
  },
  {
    number: 6, symbol: "C", name: "탄소", nameEn: "Carbon", group: 14, period: 2,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "12.011", valElectrons: 4, electronConfig: "[He] 2s² 2p²", shells: [2, 4],
    atomicRadius: 67, electronegativity: 2.55, ionizationEnergy: 1086,
    isotopes: [
      { massNumber: 12, symbol: "¹²C (원자량 기준)", abundance: "98.9%", protons: 6, neutrons: 6 },
      { massNumber: 13, symbol: "¹³C", abundance: "1.1%", protons: 6, neutrons: 7 },
      { massNumber: 14, symbol: "¹⁴C (방사성)", abundance: "극미량", protons: 6, neutrons: 8 }
    ],
    summary: "원자가 전자가 4개로 최대 4개의 공유 결합을 형성할 수 있어, 사슬·고리 등 무수히 다양한 유기 화합물과 생명체의 기본 골격을 구성합니다."
  },
  {
    number: 7, symbol: "N", name: "질소", nameEn: "Nitrogen", group: 15, period: 2,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "14.007", valElectrons: 5, electronConfig: "[He] 2s² 2p³", shells: [2, 5],
    atomicRadius: 56, electronegativity: 3.04, ionizationEnergy: 1402,
    isotopes: [
      { massNumber: 14, symbol: "¹⁴N", abundance: "99.6%", protons: 7, neutrons: 7 },
      { massNumber: 15, symbol: "¹⁵N", abundance: "0.4%", protons: 7, neutrons: 8 }
    ],
    summary: "대기의 약 78%를 차지하며, 질소 원자 2개가 매우 강한 삼중 공유 결합(N≡N)을 이루고 있어 상온에서 반응성이 매우 낮습니다. 단백질과 핵산의 필수 성분입니다."
  },
  {
    number: 8, symbol: "O", name: "산소", nameEn: "Oxygen", group: 16, period: 2,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "15.999", valElectrons: 6, electronConfig: "[He] 2s² 2p⁴", shells: [2, 6],
    atomicRadius: 48, electronegativity: 3.44, ionizationEnergy: 1314,
    isotopes: [
      { massNumber: 16, symbol: "¹⁶O", abundance: "99.76%", protons: 8, neutrons: 8 },
      { massNumber: 18, symbol: "¹⁸O", abundance: "0.20%", protons: 8, neutrons: 10 },
      { massNumber: 17, symbol: "¹⁷O", abundance: "0.04%", protons: 8, neutrons: 9 }
    ],
    summary: "지각과 인체에서 가장 질량비가 큰 원소입니다. 전기 음성도가 두 번째로 커서 다른 원소들과 쉽게 산화 반응 및 연소 반응을 일으키며 물과 호흡의 핵심입니다."
  },
  {
    number: 9, symbol: "F", name: "플루오린", nameEn: "Fluorine", group: 17, period: 2,
    category: "cat-halogen", categoryName: "할로젠",
    atomicMass: "18.998", valElectrons: 7, electronConfig: "[He] 2s² 2p⁵", shells: [2, 7],
    atomicRadius: 42, electronegativity: 3.98, ionizationEnergy: 1681,
    isotopes: [
      { massNumber: 19, symbol: "¹⁹F", abundance: "100%", protons: 9, neutrons: 10 }
    ],
    summary: "모든 원소 중 전기 음성도(3.98)가 가장 크며 전자 친화력이 매우 강해 반응성이 폭발적입니다. 원자가 전자가 7개로 전자 1개를 얻어 F⁻ 음이온이 되기 쉽습니다."
  },
  {
    number: 10, symbol: "Ne", name: "네온", nameEn: "Neon", group: 18, period: 2,
    category: "cat-noble-gas", categoryName: "비활성 기체",
    atomicMass: "20.180", valElectrons: 0, electronConfig: "[He] 2s² 2p⁶", shells: [2, 8],
    atomicRadius: 38, electronegativity: null, ionizationEnergy: 2081,
    isotopes: [
      { massNumber: 20, symbol: "²⁰Ne", abundance: "90.48%", protons: 10, neutrons: 10 },
      { massNumber: 22, symbol: "²²Ne", abundance: "9.25%", protons: 10, neutrons: 12 },
      { massNumber: 21, symbol: "²¹Ne", abundance: "0.27%", protons: 10, neutrons: 11 }
    ],
    summary: "옥텟 규칙(가장 바깥 전자 8개)을 만족하여 매우 안정합니다. 방전관에 넣고 고전압을 가하면 특유의 밝은 주황빛을 내어 네온사인 조명에 널리 쓰입니다."
  },
  {
    number: 11, symbol: "Na", name: "나트륨 (소듐)", nameEn: "Sodium", group: 1, period: 3,
    category: "cat-alkali-metal", categoryName: "알칼리 금속",
    atomicMass: "22.990", valElectrons: 1, electronConfig: "[Ne] 3s¹", shells: [2, 8, 1],
    atomicRadius: 190, electronegativity: 0.93, ionizationEnergy: 496,
    isotopes: [
      { massNumber: 23, symbol: "²³Na", abundance: "100%", protons: 11, neutrons: 12 }
    ],
    summary: "칼로 잘릴 정도로 무른 1족 알칼리 금속입니다. 물과 격렬히 반응하여 염기성 수용액과 수소 기체를 만들며, 염소와 이온 결합하여 염화 나트륨(소금, NaCl)을 이룹니다."
  },
  {
    number: 12, symbol: "Mg", name: "마그네슘", nameEn: "Magnesium", group: 2, period: 3,
    category: "cat-alkaline-earth", categoryName: "알칼리 토금속",
    atomicMass: "24.305", valElectrons: 2, electronConfig: "[Ne] 3s²", shells: [2, 8, 2],
    atomicRadius: 145, electronegativity: 1.31, ionizationEnergy: 738,
    isotopes: [
      { massNumber: 24, symbol: "²⁴Mg", abundance: "79.0%", protons: 12, neutrons: 12 },
      { massNumber: 25, symbol: "²⁵Mg", abundance: "10.0%", protons: 12, neutrons: 13 },
      { massNumber: 26, symbol: "²⁶Mg", abundance: "11.0%", protons: 12, neutrons: 14 }
    ],
    summary: "가볍고 단단한 금속으로 연소 시 눈부신 백색 빛을 방출합니다. 식물의 광합성에 필수적인 엽록소(클로로필) 분자의 중심 원소입니다."
  },
  {
    number: 13, symbol: "Al", name: "알루미늄", nameEn: "Aluminium", group: 13, period: 3,
    category: "cat-post-transition", categoryName: "전이후 금속",
    atomicMass: "26.982", valElectrons: 3, electronConfig: "[Ne] 3s² 3p¹", shells: [2, 8, 3],
    atomicRadius: 118, electronegativity: 1.61, ionizationEnergy: 578,
    isotopes: [
      { massNumber: 27, symbol: "²⁷Al", abundance: "100%", protons: 13, neutrons: 14 }
    ],
    summary: "지각에 철보다 많이 존재하는 가장 풍부한 금속 원소입니다. 가볍고 녹슬지 않는 산화 피막을 형성하여 음료수 캔, 창틀, 비행기 기체 합금에 쓰입니다."
  },
  {
    number: 14, symbol: "Si", name: "규소 (실리콘)", nameEn: "Silicon", group: 14, period: 3,
    category: "cat-metalloid", categoryName: "준금속",
    atomicMass: "28.085", valElectrons: 4, electronConfig: "[Ne] 3s² 3p²", shells: [2, 8, 4],
    atomicRadius: 111, electronegativity: 1.90, ionizationEnergy: 786,
    isotopes: [
      { massNumber: 28, symbol: "²⁸Si", abundance: "92.2%", protons: 14, neutrons: 14 },
      { massNumber: 29, symbol: "²⁹Si", abundance: "4.7%", protons: 14, neutrons: 15 },
      { massNumber: 30, symbol: "³⁰Si", abundance: "3.1%", protons: 14, neutrons: 16 }
    ],
    summary: "암석과 모래의 주성분으로 지각 질량의 약 28%를 차지합니다. 현대 반도체 및 컴퓨터 칩, 태양전지의 핵심이 되는 대표적 준금속입니다."
  },
  {
    number: 15, symbol: "P", name: "인", nameEn: "Phosphorus", group: 15, period: 3,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "30.974", valElectrons: 5, electronConfig: "[Ne] 3s² 3p³", shells: [2, 8, 5],
    atomicRadius: 98, electronegativity: 2.19, ionizationEnergy: 1012,
    isotopes: [
      { massNumber: 31, symbol: "³¹P", abundance: "100%", protons: 15, neutrons: 16 }
    ],
    summary: "DNA와 RNA의 당-인산 골격, 생체 에너지 화합물인 ATP(아데노신 삼인산), 뼈와 치아의 주성분을 이루는 생명체 필수 원소입니다."
  },
  {
    number: 16, symbol: "S", name: "황", nameEn: "Sulfur", group: 16, period: 3,
    category: "cat-reactive-nonmetal", categoryName: "반응성 비금속",
    atomicMass: "32.06", valElectrons: 6, electronConfig: "[Ne] 3s² 3p⁴", shells: [2, 8, 6],
    atomicRadius: 88, electronegativity: 2.58, ionizationEnergy: 1000,
    isotopes: [
      { massNumber: 32, symbol: "³²S", abundance: "95.0%", protons: 16, neutrons: 16 },
      { massNumber: 34, symbol: "³⁴S", abundance: "4.2%", protons: 16, neutrons: 18 }
    ],
    summary: "상온에서 노란색 고체로 존재하며 화산 지대나 온천에서 발견됩니다. 황산 제조, 고무의 가황 공정, 아미노산(시스테인, 메싸이오닌)의 구성 원소입니다."
  },
  {
    number: 17, symbol: "Cl", name: "염소", nameEn: "Chlorine", group: 17, period: 3,
    category: "cat-halogen", categoryName: "할로젠",
    atomicMass: "35.45", valElectrons: 7, electronConfig: "[Ne] 3s² 3p⁵", shells: [2, 8, 7],
    atomicRadius: 79, electronegativity: 3.16, ionizationEnergy: 1251,
    isotopes: [
      { massNumber: 35, symbol: "³⁵Cl", abundance: "75.8%", protons: 17, neutrons: 18 },
      { massNumber: 37, symbol: "³⁷Cl", abundance: "24.2%", protons: 17, neutrons: 20 }
    ],
    summary: "17족 할로젠 원소로 황록색의 자극적인 독성 기체(Cl₂)입니다. 강한 살균 및 표백 작용이 있어 수돗물 소독제 및 소금(NaCl)의 음이온으로 쓰입니다."
  },
  {
    number: 18, symbol: "Ar", name: "아르곤", nameEn: "Argon", group: 18, period: 3,
    category: "cat-noble-gas", categoryName: "비활성 기체",
    atomicMass: "39.948", valElectrons: 0, electronConfig: "[Ne] 3s² 3p⁶", shells: [2, 8, 8],
    atomicRadius: 71, electronegativity: null, ionizationEnergy: 1521,
    isotopes: [
      { massNumber: 40, symbol: "⁴⁰Ar", abundance: "99.6%", protons: 18, neutrons: 22 },
      { massNumber: 36, symbol: "³⁶Ar", abundance: "0.3%", protons: 18, neutrons: 18 }
    ],
    summary: "대기 중에 질소와 산소 다음으로 많은 기체(약 0.93%)입니다. 화학적으로 매우 불활성이어서 백열전구의 충전 기체나 금속 용접 시 보호 기체로 쓰입니다."
  },
  {
    number: 19, symbol: "K", name: "칼륨 (포타슘)", nameEn: "Potassium", group: 1, period: 4,
    category: "cat-alkali-metal", categoryName: "알칼리 금속",
    atomicMass: "39.098", valElectrons: 1, electronConfig: "[Ar] 4s¹", shells: [2, 8, 8, 1],
    atomicRadius: 243, electronegativity: 0.82, ionizationEnergy: 419,
    isotopes: [
      { massNumber: 39, symbol: "³⁹K", abundance: "93.3%", protons: 19, neutrons: 20 },
      { massNumber: 41, symbol: "⁴¹K", abundance: "6.7%", protons: 19, neutrons: 22 },
      { massNumber: 40, symbol: "⁴⁰K (방사성)", abundance: "0.012%", protons: 19, neutrons: 21 }
    ],
    summary: "나트륨보다 반응성이 더 큰 1족 알칼리 금속입니다. 물과 닿으면 보라색 불꽃을 내며 폭발적으로 반응합니다. 신경 전달과 세포 내 전해질 균형에 필수적입니다."
  },
  {
    number: 20, symbol: "Ca", name: "칼슘", nameEn: "Calcium", group: 2, period: 4,
    category: "cat-alkaline-earth", categoryName: "알칼리 토금속",
    atomicMass: "40.078", valElectrons: 2, electronConfig: "[Ar] 4s²", shells: [2, 8, 8, 2],
    atomicRadius: 194, electronegativity: 1.00, ionizationEnergy: 590,
    isotopes: [
      { massNumber: 40, symbol: "⁴⁰Ca", abundance: "96.9%", protons: 20, neutrons: 20 },
      { massNumber: 44, symbol: "⁴⁴Ca", abundance: "2.1%", protons: 20, neutrons: 24 }
    ],
    summary: "사람의 뼈와 치아의 주성분이며 근육 수축과 혈액 응고에 관여합니다. 석회석(탄산 칼슘, CaCO₃)과 시멘트의 주요 원료입니다."
  },
  // 고교 과학 탐구에서 자주 등장하는 주요 대표 원소들
  { number: 26, symbol: "Fe", name: "철", nameEn: "Iron", group: 8, period: 4, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "55.845", valElectrons: 2, electronConfig: "[Ar] 3d⁶ 4s²", shells: [2, 8, 14, 2], atomicRadius: 156, electronegativity: 1.83, ionizationEnergy: 762, isotopes: [{ massNumber: 56, symbol: "⁵⁶Fe", abundance: "91.8%", protons: 26, neutrons: 30 }], summary: "인류 문명을 지탱해 온 가장 중요한 금속입니다. 헤모글로빈 중심에서 산소를 운반합니다." },
  { number: 29, symbol: "Cu", name: "구리", nameEn: "Copper", group: 11, period: 4, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "63.546", valElectrons: 1, electronConfig: "[Ar] 3d¹⁰ 4s¹", shells: [2, 8, 18, 1], atomicRadius: 145, electronegativity: 1.90, ionizationEnergy: 745, isotopes: [{ massNumber: 63, symbol: "⁶³Cu", abundance: "69.2%", protons: 29, neutrons: 34 }], summary: "은 다음으로 전기 전도성과 열 전도성이 뛰어난 붉은빛 금속으로 전선과 회로에 필수적입니다." },
  { number: 30, symbol: "Zn", name: "아연", nameEn: "Zinc", group: 12, period: 4, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "65.38", valElectrons: 2, electronConfig: "[Ar] 3d¹⁰ 4s²", shells: [2, 8, 18, 2], atomicRadius: 142, electronegativity: 1.65, ionizationEnergy: 906, isotopes: [{ massNumber: 64, symbol: "⁶⁴Zn", abundance: "48.6%", protons: 30, neutrons: 34 }], summary: "철의 부식을 막는 아연 도금(함석)과 볼타 전지·다니엘 전지의 음극재로 널리 쓰입니다." },
  { number: 35, symbol: "Br", name: "브로민", nameEn: "Bromine", group: 17, period: 4, category: "cat-halogen", categoryName: "할로젠", atomicMass: "79.904", valElectrons: 7, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵", shells: [2, 8, 18, 7], atomicRadius: 94, electronegativity: 2.96, ionizationEnergy: 1140, isotopes: [{ massNumber: 79, symbol: "⁷⁹Br", abundance: "50.7%", protons: 35, neutrons: 44 }], summary: "비금속 원소 중 상온에서 유일하게 적갈색 액체 상태로 존재하는 17족 할로젠 원소입니다." },
  { number: 47, symbol: "Ag", name: "은", nameEn: "Silver", group: 11, period: 5, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "107.87", valElectrons: 1, electronConfig: "[Kr] 4d¹⁰ 5s¹", shells: [2, 8, 18, 18, 1], atomicRadius: 165, electronegativity: 1.93, ionizationEnergy: 731, isotopes: [{ massNumber: 107, symbol: "¹⁰⁷Ag", abundance: "51.8%", protons: 47, neutrons: 60 }], summary: "모든 금속 중 전기 전도도와 열 전도도가 가장 높습니다. 귀금속 및 항균 소재로 쓰입니다." },
  { number: 53, symbol: "I", name: "아이오딘", nameEn: "Iodine", group: 17, period: 5, category: "cat-halogen", categoryName: "할로젠", atomicMass: "126.90", valElectrons: 7, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵", shells: [2, 8, 18, 18, 7], atomicRadius: 115, electronegativity: 2.66, ionizationEnergy: 1008, isotopes: [{ massNumber: 127, symbol: "¹²⁷I", abundance: "100%", protons: 53, neutrons: 74 }], summary: "상온에서 흑자색 고체이며 가열하면 보라색 기체로 승화합니다. 녹말 검출 및 소독약에 쓰입니다." },
  { number: 79, symbol: "Au", name: "금", nameEn: "Gold", group: 11, period: 6, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "196.97", valElectrons: 1, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", shells: [2, 8, 18, 32, 18, 1], atomicRadius: 174, electronegativity: 2.54, ionizationEnergy: 890, isotopes: [{ massNumber: 197, symbol: "¹⁹⁷Au", abundance: "100%", protons: 79, neutrons: 118 }], summary: "공기나 물에서 전혀 산화되지 않는 가장 안정하고 연성·전성이 뛰어난 황금빛 귀금속입니다." },
  { number: 80, symbol: "Hg", name: "수은", nameEn: "Mercury", group: 12, period: 6, category: "cat-transition-metal", categoryName: "전이 금속", atomicMass: "200.59", valElectrons: 2, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", shells: [2, 8, 18, 32, 18, 2], atomicRadius: 171, electronegativity: 2.00, ionizationEnergy: 1007, isotopes: [{ massNumber: 202, symbol: "²⁰²Hg", abundance: "29.9%", protons: 80, neutrons: 122 }], summary: "금속 원소 중 상온에서 유일하게 은백색 액체 상태로 존재하는 중금속 원소입니다." },
  { number: 92, symbol: "U", name: "우라늄", nameEn: "Uranium", group: 3, period: 7, category: "cat-actinide", categoryName: "악티늄족", atomicMass: "238.03", valElectrons: 2, electronConfig: "[Rn] 5f³ 6d¹ 7s²", shells: [2, 8, 18, 32, 21, 9, 2], atomicRadius: 175, electronegativity: 1.38, ionizationEnergy: 597, isotopes: [{ massNumber: 238, symbol: "²³⁸U", abundance: "99.27%", protons: 92, neutrons: 146 }, { massNumber: 235, symbol: "²³⁵U (핵분열)", abundance: "0.72%", protons: 92, neutrons: 143 }], summary: "자연계에 존재하는 가장 무거운 원소로, ²³⁵U는 원자력 발전소와 핵무기의 원료로 쓰입니다." }
];

// 원소 1~118번 표준 전체 리스트 채우기 (기본값 자동 보강)
var FULL_PERIODIC_TABLE = (function() {
  var basicNames = [
    null,
    "H","He","Li","Be","B","C","N","O","F","Ne",
    "Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca",
    "Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn",
    "Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr",
    "Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn",
    "Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd",
    "Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb",
    "Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg",
    "Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th",
    "Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm",
    "Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds",
    "Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"
  ];

  var koreanNames = [
    null,
    "수소","헬륨","리튬","베릴륨","붕소","탄소","질소","산소","플루오린","네온",
    "나트륨","마그네슘","알루미늄","규소","인","황","염소","아르곤","칼륨","칼슘",
    "스칸듐","타이타늄","바나듐","크로뮴","망가니즈","철","코발트","니켈","구리","아연",
    "갈륨","저마늄","비소","셀레늄","브로민","크립톤","루비듐","스트론튬","이트륨","지르코늄",
    "나이오븀","몰리브데넘","테크네튬","루테늄","로듐","팔라듐","은","카드뮴","인듐","주석",
    "안티모니","텔루륨","아이오딘","제논","세슘","바륨","란타넘","세륨","프라세오디뮴","네오디뮴",
    "프로메튬","사마륨","유로퓸","가돌리늄","터븀","디스프로슘","홀뮴","어븀","툴륨","이터븀",
    "루테튬","하프늄","탄탈럼","텅스텐","레늄","오스뮴","이리듐","백금","금","수은",
    "탈륨","납","비스무트","폴로늄","아스타틴","라돈","프랑슘","라듐","악티늄","토륨",
    "프로트악티늄","우라늄","넵투늄","플루토늄","아메리슘","퀴륨","버클륨","캘리포늄","아인슈타이늄","페르뮴",
    "멘델레븀","노벨륨","로렌슘","러더포듐","더브늄","시보귬","보륨","하슘","마이트너륨","다름슈타튬",
    "뢴트게늄","코페르니슘","니호늄","플레로븀","모스코븀","리버모륨","테네신","오가네손"
  ];

  // 표준 18열 격자 좌표 맵핑
  function getPosition(z) {
    if (z === 1) return { period: 1, group: 1 };
    if (z === 2) return { period: 1, group: 18 };
    if (z >= 3 && z <= 4) return { period: 2, group: z - 2 };
    if (z >= 5 && z <= 10) return { period: 2, group: z + 8 };
    if (z >= 11 && z <= 12) return { period: 3, group: z - 10 };
    if (z >= 13 && z <= 18) return { period: 3, group: z };
    if (z >= 19 && z <= 36) return { period: 4, group: z - 18 };
    if (z >= 37 && z <= 54) return { period: 5, group: z - 36 };
    if (z === 55 || z === 56) return { period: 6, group: z - 54 };
    if (z >= 57 && z <= 71) return { period: 8, group: z - 56 + 3, isLanthanide: true }; // 란타넘족
    if (z >= 72 && z <= 86) return { period: 6, group: z - 68 };
    if (z === 87 || z === 88) return { period: 7, group: z - 86 };
    if (z >= 89 && z <= 103) return { period: 9, group: z - 88 + 3, isActinide: true }; // 악티늄족
    if (z >= 104 && z <= 118) return { period: 7, group: z - 100 };
    return { period: 7, group: 18 };
  }

  function getCategory(z, group) {
    if (z === 1) return { key: "cat-reactive-nonmetal", name: "반응성 비금속" };
    if (z >= 57 && z <= 71) return { key: "cat-lanthanide", name: "란타넘족" };
    if (z >= 89 && z <= 103) return { key: "cat-actinide", name: "악티늄족" };
    if (group === 1) return { key: "cat-alkali-metal", name: "알칼리 금속" };
    if (group === 2) return { key: "cat-alkaline-earth", name: "알칼리 토금속" };
    if (group === 17) return { key: "cat-halogen", name: "할로젠" };
    if (group === 18) return { key: "cat-noble-gas", name: "비활성 기체" };
    if (group >= 3 && group <= 12) return { key: "cat-transition-metal", name: "전이 금속" };
    if ([5, 14, 32, 33, 51, 52].indexOf(z) !== -1) return { key: "cat-metalloid", name: "준금속" };
    if ([13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116].indexOf(z) !== -1) return { key: "cat-post-transition", name: "전이후 금속" };
    return { key: "cat-reactive-nonmetal", name: "반응성 비금속" };
  }

  var list = [];
  for (var i = 1; i <= 118; i++) {
    // 세부 데이터가 있으면 병합, 없으면 자동 생성
    var detail = ELEMENTS_DATA.find(function(el) { return el.number === i; });
    var pos = getPosition(i);
    var cat = getCategory(i, pos.group);

    if (detail) {
      detail.gridPeriod = pos.period;
      detail.gridGroup = pos.group;
      list.push(detail);
    } else {
      var approxMass = Math.round(i * 2 + (i > 20 ? (i - 20) * 0.4 : 0));
      list.push({
        number: i,
        symbol: basicNames[i],
        name: koreanNames[i],
        nameEn: basicNames[i],
        group: pos.group,
        period: pos.period <= 7 ? pos.period : (pos.period === 8 ? 6 : 7),
        gridPeriod: pos.period,
        gridGroup: pos.group,
        category: cat.key,
        categoryName: cat.name,
        atomicMass: String(approxMass),
        valElectrons: (pos.group <= 2 ? pos.group : (pos.group >= 13 && pos.group <= 18 ? (pos.group === 18 ? 0 : pos.group - 10) : 2)),
        electronConfig: "원자 번호 " + i,
        shells: [2, 8, Math.min(18, Math.max(1, i - 10))],
        atomicRadius: Math.max(30, 200 - (i % 18) * 6),
        electronegativity: (pos.group === 18 ? null : Number((1.0 + (pos.group / 18) * 2.5).toFixed(2))),
        ionizationEnergy: Math.round(500 + (pos.group * 45) - (pos.period * 30)),
        isotopes: [
          { massNumber: approxMass, symbol: "^" + approxMass + basicNames[i], abundance: "주요 동위원소", protons: i, neutrons: approxMass - i }
        ],
        summary: koreanNames[i] + "(" + basicNames[i] + ")은(는) 원자 번호 " + i + "번 원소로 " + cat.name + "에 속합니다."
      });
    }
  }
  return list;
})();

// ========================================================
// 2. 주기율표 렌더링 및 인터랙션 상태 관리
// ========================================================
var currentFilter = "all";
var currentMode = "default";
var selectedElement = null;
var activeIsotopeIndex = 0;
var bohrAnimId = null;
var bohrRotation = 0;

var mainGrid = document.getElementById("periodic-grid");
var fBlockGrid = document.getElementById("f-block-grid");

/**
 * 주기율표 그리드 렌더링
 */
function renderPeriodicTable() {
  mainGrid.innerHTML = "";
  fBlockGrid.innerHTML = "";

  FULL_PERIODIC_TABLE.forEach(function(el) {
    var tile = document.createElement("div");
    tile.className = "element-tile " + el.category;
    tile.dataset.number = el.number;

    // 히트맵 탐구 모드에 따른 표시 텍스트 결정
    var propDisplay = "";
    if (currentMode === "valElectrons") {
      propDisplay = "<div class='tile-val-property'>원자가: " + el.valElectrons + "</div>";
    } else if (currentMode === "atomicRadius") {
      propDisplay = "<div class='tile-val-property'>" + (el.atomicRadius ? el.atomicRadius + " pm" : "-") + "</div>";
    } else if (currentMode === "electronegativity") {
      propDisplay = "<div class='tile-val-property'>" + (el.electronegativity ? "EN: " + el.electronegativity : "-") + "</div>";
    } else if (currentMode === "ionizationEnergy") {
      propDisplay = "<div class='tile-val-property'>" + (el.ionizationEnergy ? el.ionizationEnergy + " kJ" : "-") + "</div>";
    }

    tile.innerHTML = (
      "<div class='tile-top'>" +
        "<span class='tile-number'>" + el.number + "</span>" +
        "<span class='tile-mass'>" + Math.round(parseFloat(el.atomicMass)) + "</span>" +
      "</div>" +
      "<div class='tile-symbol'>" + el.symbol + "</div>" +
      "<div class='tile-name'>" + el.name + "</div>" +
      propDisplay
    );

    // 필터 조건 검사
    if (currentFilter !== "all" && el.category !== currentFilter) {
      tile.classList.add("dimmed");
    }

    // 타일 클릭 시 모달 열기
    tile.addEventListener("click", function() {
      openElementModal(el);
    });

    // 란타넘/악티늄족(8, 9행)은 하단 f-block 영역에 배치
    if (el.gridPeriod >= 8) {
      tile.style.gridColumn = el.gridGroup;
      fBlockGrid.appendChild(tile);
    } else {
      tile.style.gridRow = el.gridPeriod;
      tile.style.gridColumn = el.gridGroup;
      mainGrid.appendChild(tile);
    }
  });
}

// ========================================================
// 3. 모달 창 및 보어 원자 모형 캔버스 애니메이션
// ========================================================
var modalBackdrop = document.getElementById("element-modal");
var modalCloseBtn = document.getElementById("modal-close-btn");
var bohrCanvas = document.getElementById("bohr-canvas");
var bohrCtx = bohrCanvas ? bohrCanvas.getContext("2d") : null;

/**
 * 모달 열기
 */
function openElementModal(el) {
  selectedElement = el;
  activeIsotopeIndex = 0; // 기본 동위원소 첫 번째 선택

  document.getElementById("modal-elem-num").textContent = el.number;
  document.getElementById("modal-elem-symbol").textContent = el.symbol;
  document.getElementById("modal-elem-name").textContent = el.name;
  document.getElementById("modal-elem-eng").textContent = el.nameEn;
  document.getElementById("modal-badge-cat").textContent = el.categoryName;
  document.getElementById("modal-badge-group").textContent = el.period + "주기 " + el.group + "족";

  // 기본 성질 테이블 채우기
  document.getElementById("modal-prop-group-period").textContent = el.period + "주기 " + el.group + "족";
  document.getElementById("modal-prop-val-electrons").textContent = el.valElectrons + "개 (화학 반응 참여 전자)";
  document.getElementById("modal-prop-config").textContent = el.electronConfig;
  document.getElementById("modal-prop-mass").textContent = el.atomicMass + " amu (원소들의 평균치)";

  // 요약 설명
  document.getElementById("modal-prop-summary").textContent = el.summary;

  // 동위원소 버튼 목록 렌더링
  renderIsotopeButtons();
  updateIsotopeDetails();

  // 보어 원자 모형 캔버스 애니메이션 시작
  startBohrAnimation();

  modalBackdrop.classList.add("open");
}

/**
 * 모달 닫기
 */
function closeElementModal() {
  modalBackdrop.classList.remove("open");
  if (bohrAnimId) {
    cancelAnimationFrame(bohrAnimId);
    bohrAnimId = null;
  }
}

/**
 * 동위원소 버튼 렌더링
 */
function renderIsotopeButtons() {
  var container = document.getElementById("isotope-buttons");
  container.innerHTML = "";

  selectedElement.isotopes.forEach(function(iso, idx) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "isotope-btn" + (idx === activeIsotopeIndex ? " active" : "");
    btn.textContent = iso.symbol;
    btn.title = "존재비: " + iso.abundance;
    btn.addEventListener("click", function() {
      activeIsotopeIndex = idx;
      renderIsotopeButtons();
      updateIsotopeDetails();
    });
    container.appendChild(btn);
  });
}

/**
 * 선택된 동위원소에 따라 중성자 수와 질량수 갱신
 * (원자량 평균값과의 혼동 방지)
 */
function updateIsotopeDetails() {
  var currentIso = selectedElement.isotopes[activeIsotopeIndex];
  document.getElementById("modal-prop-protons").textContent = currentIso.protons + "개";
  document.getElementById("modal-prop-neutrons").textContent = currentIso.neutrons + "개";
  document.getElementById("modal-prop-mass-number").textContent = currentIso.massNumber + " (양성자 + 중성자)";
  document.getElementById("modal-prop-abundance").textContent = currentIso.abundance;

  // 동위원소 안내문 업데이트
  var guide = document.getElementById("isotope-guide-text");
  guide.textContent = "현재 선택된 동위 원소는 " + currentIso.symbol + "입니다. " +
                      "원자량(" + selectedElement.atomicMass + ")은 자연계에 존재하는 동위원소들의 평균치이며, " +
                      "질량수(" + currentIso.massNumber + ")는 이 특정 동위원소의 양성자(" + currentIso.protons + ")+중성자(" + currentIso.neutrons + ") 개수입니다.";
}

/**
 * 캔버스 기반 보어 원자 모형 회전 애니메이션
 */
function startBohrAnimation() {
  if (bohrAnimId) {
    cancelAnimationFrame(bohrAnimId);
  }

  var shells = selectedElement.shells || [selectedElement.number];
  var shellNames = ["K", "L", "M", "N", "O", "P", "Q"];

  // 전자 껍질 범례 텍스트 표시
  var shellsText = shells.map(function(num, idx) {
    return shellNames[idx] + "껍질: <strong>" + num + "개</strong>";
  }).join(" | ");
  document.getElementById("bohr-shells-text").innerHTML = "전자 껍질별 배치 → " + shellsText;

  function renderBohrFrame() {
    if (!bohrCtx) return;

    var width = bohrCanvas.width;
    var height = bohrCanvas.height;
    var centerX = width / 2;
    var centerY = height / 2;

    bohrCtx.clearRect(0, 0, width, height);

    // 1. 중심 원자핵 그리기
    var coreRadius = 24;
    var grad = bohrCtx.createRadialGradient(centerX - 4, centerY - 4, 3, centerX, centerY, coreRadius);
    grad.addColorStop(0, "#f87171");
    grad.addColorStop(1, "#dc2626");

    bohrCtx.beginPath();
    bohrCtx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    bohrCtx.fillStyle = grad;
    bohrCtx.shadowColor = "rgba(220, 38, 38, 0.4)";
    bohrCtx.shadowBlur = 8;
    bohrCtx.fill();
    bohrCtx.shadowBlur = 0; // 그림자 초기화

    // 원자핵 텍스트
    bohrCtx.fillStyle = "#ffffff";
    bohrCtx.font = "bold 11px Pretendard, sans-serif";
    bohrCtx.textAlign = "center";
    bohrCtx.textBaseline = "middle";
    bohrCtx.fillText(selectedElement.symbol, centerX, centerY - 5);
    bohrCtx.font = "9px Pretendard, sans-serif";
    bohrCtx.fillText("+" + selectedElement.number, centerX, centerY + 8);

    // 2. 전자 껍질 궤도와 전자들 그리기
    var baseRadius = 40;
    var radiusStep = 24;

    shells.forEach(function(electronCount, shellIdx) {
      var r = baseRadius + shellIdx * radiusStep;

      // 동심원 궤도 선
      bohrCtx.beginPath();
      bohrCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
      bohrCtx.strokeStyle = "#cbd5e1";
      bohrCtx.setLineDash([3, 3]);
      bohrCtx.lineWidth = 1;
      bohrCtx.stroke();
      bohrCtx.setLineDash([]); // 점선 초기화

      // 껍질 이름 라벨
      bohrCtx.fillStyle = "#94a3b8";
      bohrCtx.font = "9px sans-serif";
      bohrCtx.fillText(shellNames[shellIdx], centerX + r - 8, centerY - 2);

      // 공전하는 전자(e-) 그리기
      var dir = (shellIdx % 2 === 0) ? 1 : -1; // 껍질마다 회전 방향 반대로
      var speed = (0.015 / (shellIdx + 1));
      var currentAngle = bohrRotation * dir * speed * 30;

      for (var e = 0; e < electronCount; e++) {
        var angle = currentAngle + (e * (Math.PI * 2 / electronCount));
        var ex = centerX + Math.cos(angle) * r;
        var ey = centerY + Math.sin(angle) * r;

        // 전자 본체
        bohrCtx.beginPath();
        bohrCtx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        bohrCtx.fillStyle = "#2563eb";
        bohrCtx.shadowColor = "rgba(37, 99, 235, 0.5)";
        bohrCtx.shadowBlur = 6;
        bohrCtx.fill();
        bohrCtx.shadowBlur = 0;

        // 음전하 (-) 표시
        bohrCtx.fillStyle = "#ffffff";
        bohrCtx.font = "bold 9px sans-serif";
        bohrCtx.textAlign = "center";
        bohrCtx.textBaseline = "middle";
        bohrCtx.fillText("-", ex, ey - 0.5);
      }
    });

    bohrRotation += 0.05;
    bohrAnimId = requestAnimationFrame(renderBohrFrame);
  }

  renderBohrFrame();
}

// ========================================================
// 4. 이벤트 리스너 바인딩
// ========================================================
document.addEventListener("DOMContentLoaded", function() {
  renderPeriodicTable();

  // 분류 필터 셀렉트박스 변경
  var filterSelect = document.getElementById("pt-filter-select");
  if (filterSelect) {
    filterSelect.addEventListener("change", function(e) {
      currentFilter = e.target.value;
      renderPeriodicTable();
    });
  }

  // 주기성 탐구 모드 변경
  var modeSelect = document.getElementById("pt-mode-select");
  if (modeSelect) {
    modeSelect.addEventListener("change", function(e) {
      currentMode = e.target.value;
      renderPeriodicTable();
    });
  }

  // 범례 항목 클릭 시 해당 분류만 필터링
  var legendItems = document.querySelectorAll(".pt-legend-item");
  legendItems.forEach(function(item) {
    item.addEventListener("click", function() {
      var cat = this.getAttribute("data-category");
      if (filterSelect) {
        filterSelect.value = cat;
        currentFilter = cat;
        renderPeriodicTable();
      }
    });
  });

  // 모달 닫기 버튼 및 배경 클릭
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeElementModal);
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function(e) {
      if (e.target === modalBackdrop) {
        closeElementModal();
      }
    });
  }

  // ESC 키로 모달 닫기
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
      closeElementModal();
    }
  });
});
