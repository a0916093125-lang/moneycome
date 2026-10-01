// ==========================================
// 天天樂 演算法與數學分析模組 (logic.js)
// ==========================================

const LUCKY_MODELS = [
  { id: 'cloud-hot-core', name: '雲端熱門聚變', subtitle: '全歷史真實熱碼', logic: '調用後端運算引擎，擷取萬筆資料中全歷史開出頻率最高的絕對熱門號碼進行重組。' },
  { id: 'cloud-cold-revert', name: '深淵冷碼回歸', subtitle: '全歷史極限回歸', logic: '由後端統計全歷史極度冰凍冷門號，抓取物極必反、即將強力彈升的潛力碼。' },
  { id: 'prime-golden', name: '質數黃金矩陣', subtitle: '數學質數收斂', logic: '排除可被整除的常規號碼，專注鎖定具備特殊獨立機率特徵的純質數群組。' },
  { id: 'fibonacci-spiral', name: '費氏數列共振', subtitle: '螺旋時空排列', logic: '套用自然界黃金比例費波那契數列 (1,2,3,5,8,13...)，尋找符合螺旋序列的神秘交集點。' },
  { id: 'jinyu-flow', name: '金玉滿堂', subtitle: '趨勢金流模型', logic: '鎖定近期動能最強、大單聚焦的高頻突破波段。' },
  { id: 'ziqi-cycle', name: '紫氣東來', subtitle: '週期定盤模型', logic: '依據波段週期回歸規律，捕捉即將反彈之強勢號。' },
  { id: 'fugui-revert', name: '富貴吉祥', subtitle: '均值回歸模型', logic: '鎖定偏離均值後強力拉回之黃金號。' },
  { id: 'hongyun-streak', name: '鴻運當頭', subtitle: '連珠連莊模型', logic: '追蹤連莊號與斜連跳格軌跡，精選連發焦點。' }
];

const UNLUCKY_MODELS = [
  { id: 'shuaishen-freeze', name: '衰神附體', subtitle: '極寒冰封號', logic: '深陷統計極度冰凍冷卻區，動能徹底死絕。' },
  { id: 'mingdeng-exhaust', name: '冥燈高照', subtitle: '熱退冷進號', logic: '連續超頻開出後出現頂部背離警訊，能量衰竭。' },
  { id: 'qiongkun-flatline', name: '窮困潦倒', subtitle: '心電死線號', logic: '連續數十期標準差趨近於零，振幅徹底歸零休克。' },
  { id: 'eyun-clash', name: '厄運纏身', subtitle: '相剋絕殺號', logic: '與近期強勢群組產生極端相位排斥，極難開出。' },
  { id: 'wuyun-abyss', name: '烏雲罩頂', subtitle: '遺漏黑洞號', logic: '陷入多重遺漏奇異點，統計重力場陷阱無力掙脫。' },
  { id: 'baimu-blind', name: '白目瞎衝', subtitle: '盲目送死號', logic: '完全背離大盤趨勢，在極度不合理的逆風位置試圖突破。' },
  { id: 'daomei-crash', name: '倒楣透頂', subtitle: '斷崖跳水號', logic: '跌破所有統計防線，出現斷崖式下跌走勢。' },
  { id: 'heshui-drown', name: '喝水塞牙', subtitle: '絕對冷門號', logic: '存在於多重模型都無法覆蓋的機率真空區。' }
];

const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c64e6d ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getPseudoRandomFromPool(modelId, lotteryType, period, sourcePool, count) {
  const seedVal = cyrb53(`${modelId}:${lotteryType}:${period}`);
  const rng = mulberry32(seedVal >>> 0);
  const pool = [...sourcePool]; 
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function getDeterministicPrediction(modelId, lotteryType, period, maxNum = 39, count = 3) {
  const meta = SHEETS_META[lotteryType];
  
  if (modelId === 'cloud-hot-core' && meta && meta.hotNums) {
    return getPseudoRandomFromPool(modelId, lotteryType, period, meta.hotNums, count);
  }
  if (modelId === 'cloud-cold-revert' && meta && meta.coldNums) {
    return getPseudoRandomFromPool(modelId, lotteryType, period, meta.coldNums, count);
  }
  if (modelId === 'prime-golden') {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47].filter(n => n <= maxNum);
    return getPseudoRandomFromPool(modelId, lotteryType, period, primes, count);
  }
  if (modelId === 'fibonacci-spiral') {
    const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 47].filter(n => n <= maxNum);
    const pool = fibs.length >= count ? fibs : [...fibs, 7, 11, 29].filter(n => n <= maxNum);
    return getPseudoRandomFromPool(modelId, lotteryType, period, pool, count);
  }
  return getPseudoRandomFromPool(modelId, lotteryType, period, Array.from({ length: maxNum }, (_, i) => i + 1), count);
}

function evaluateAndRankModels(modelsList, data, activeLottery, targetPeriod, maxN, analysisRange, isLucky) {
  const backtestDraws = data.slice(0, Math.min(analysisRange, data.length));
  const totalTestDraws = Math.max(backtestDraws.length, 1);

  const evaluatedModels = modelsList.map(m => {
    const pred = getDeterministicPrediction(m.id, activeLottery, targetPeriod, maxN, 3);
    let hit1 = 0, hit2 = 0, hit3 = 0, hit0 = 0;
    backtestDraws.forEach(draw => {
      const histPred = getDeterministicPrediction(m.id, activeLottery, draw.period || draw.date, maxN, 3);
      const drawnSet = new Set(draw.numbers);
      let matchCount = 0;
      histPred.forEach(n => { if (drawnSet.has(n)) matchCount++; });
      if (matchCount === 3) hit3++;
      else if (matchCount === 2) hit2++;
      else if (matchCount === 1) hit1++;
      else hit0++;
    });
    const score = isLucky ? (hit3 * 100 + hit2 * 10 + hit1 * 1) : (hit0 / totalTestDraws);
    return { model: m, pred, hit0, hit1, hit2, hit3, score };
  });

  evaluatedModels.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return isLucky 
      ? (b.hit3 - a.hit3 || b.hit2 - a.hit2 || b.hit1 - a.hit1) 
      : (a.hit3 - b.hit3 || a.hit2 - b.hit2 || a.hit1 - b.hit1);
  });

  return { evaluatedModels, totalTestDraws };
}

function calculateTailsData(data, activeLottery, analysisRange, selectedTailCount) {
  const sample = data.slice(0, Math.min(analysisRange, data.length));
  const maxN = activeLottery === 'lottery_marksix' ? 49 : 39;
  const totalDraws = sample.length;

  const tailCounts = Array(10).fill(0);
  const tailOmission = Array(10).fill(null);
  const pairMap = Array(10).fill(0);
  let doubleTailMatches = 0;
  let tailPairs = {}; 

  sample.forEach((draw, dIdx) => { 
    const roundTails = Array(10).fill(0); 
    draw.numbers.forEach(num => { 
      const t = parseInt(num, 10) % 10; 
      tailCounts[t]++; 
      roundTails[t]++; 
      if (tailOmission[t] === null) tailOmission[t] = dIdx; 
    }); 
    
    let hasDouble = false; 
    for (let t = 0; t < 10; t++) { 
      if (roundTails[t] >= 2) { 
        hasDouble = true; 
        pairMap[t]++; 
      } 
    } 
    if (hasDouble) doubleTailMatches++; 

    let uniqueTails = [...new Set(draw.numbers.map(n => parseInt(n, 10) % 10))].sort((a,b) => a-b);
    for (let i = 0; i < uniqueTails.length; i++) {
      for (let j = i + 1; j < uniqueTails.length; j++) {
        let key = `${uniqueTails[i]}-${uniqueTails[j]}`;
        tailPairs[key] = (tailPairs[key] || 0) + 1;
      }
    }
  });

  let sortedPairs = Object.keys(tailPairs).map(k => ({
    t1: k.split('-')[0], 
    t2: k.split('-')[1], 
    count: tailPairs[k]
  })).sort((a,b) => b.count - a.count);

  for (let t = 0; t < 10; t++) {
    if (tailOmission[t] === null) tailOmission[t] = totalDraws;
  }

  const tailPool = (t) => {
    const res = [];
    for (let i = 1; i <= maxN; i++) {
      if (i % 10 === t) res.push(i);
    }
    return res;
  };

  const weightedScore = Array(10).fill(0);
  for (let t = 0; t < 10; t++) {
    weightedScore[t] = ((tailCounts[t] / tailPool(t).length) * 10) + Math.min(tailOmission[t] * 1.5, 10);
  }

  let hotTail = 0, maxHot = -1, omTail = 0, maxOm = -1, killTail = 0, minScore = 999999;
  for (let t = 0; t < 10; t++) {
    if (tailCounts[t] > maxHot) { maxHot = tailCounts[t]; hotTail = t; }
  }
  for (let t = 0; t < 10; t++) {
    if (t !== hotTail && tailOmission[t] > maxOm) { maxOm = tailOmission[t]; omTail = t; }
  }
  for (let t = 0; t < 10; t++) {
    if (t !== hotTail && t !== omTail) {
      const score = tailCounts[t] * 2 - tailOmission[t];
      if (score < minScore) { minScore = score; killTail = t; }
    }
  }

  const sortedTails = Array.from({length: 10}, (_, i) => i).sort((a, b) => weightedScore[b] - weightedScore[a]);
  const schemeTails = sortedTails.slice(0, selectedTailCount);
  let schemeBalls = [];
  schemeTails.forEach(t => { schemeBalls = schemeBalls.concat(tailPool(t)); });
  schemeBalls.sort((a, b) => a - b);

  let schemeHitTotal = 0, schemeHit2Plus = 0;
  sample.forEach(draw => {
    const drawnSet = new Set(draw.numbers);
    let match = 0;
    schemeBalls.forEach(n => { if (drawnSet.has(n)) match++; });
    schemeHitTotal += match;
    if (match >= 2) schemeHit2Plus++;
  });

  let bestPairTail = 0, bestPairCount = -1;
  for (let t = 0; t < 10; t++) {
    if (pairMap[t] > bestPairCount) { bestPairCount = pairMap[t]; bestPairTail = t; }
  }

  const omRank = Array.from({length: 10}, (_, i) => i).sort((a, b) => tailOmission[b] - tailOmission[a]).slice(0, 3);
  const maxCount = Math.max(...tailCounts, 1);

  return {
    totalDraws,
    tailCounts,
    maxCount,
    tailOmission,
    sortedPairs,
    hotTail,
    omTail,
    killTail,
    schemeTails,
    schemeBalls,
    schemeHitTotal,
    schemeHit2Plus,
    bestPairTail,
    bestPairCount,
    omRank,
    doubleTailMatches,
    tailPool
  };
}