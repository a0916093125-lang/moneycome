/**
 * ========================================================
 * 天天樂 前端主控制邏輯 (main.js)
 * 負責 UI 渲染、按鈕事件監聽、社群分享與動態 SEO 更新
 * ========================================================
 */

// 1. 註冊 PWA Service Worker (離線快取機制)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW註冊失敗: ', err));
  });
}

const SHARE_URL = "https://539168.com.tw";

// 取得隨機分享文案
function getRandomShareText(type, data) {
  const rand = Math.floor(Math.random() * 4); 
  if (type === 'lucky') {
    return [
      `📊 【天天樂 AI 報牌】${data.lotteryName} (${data.periodStr})\n🤖 模型：${data.modelName} (吉星推薦)\n🎯 鎖定號碼：[ ${data.nums} ]\n---\n👇 免費看更多 AI 大數據精算：\n${SHARE_URL}`,
      `🔥 財神爺點名啦！${data.lotteryName} (${data.periodStr})\n✨ 天天樂 AI 大數據水牌推薦：\n👉【 ${data.nums} 】👈\n祝大家今晚順利摘星中大獎！🎉\n---\n🎁 免費好用的 AI 抓牌神器：\n${SHARE_URL}`,
      `🤫 【天天樂 AI 密碼】${data.lotteryName} (${data.periodStr})\n🎯 演算法剛剛鎖定了這 3 支：\n👉 [ ${data.nums} ]\n---\n你的專屬幸運號碼是什麼？點進來看：\n${SHARE_URL}`,
      `🔥 【天天樂 AI 抓牌神器】${data.lotteryName} (${data.periodStr})\n📈 獨家大數據抓版路，本期水牌出爐！\n👉 推薦全車/二星參考：[ ${data.nums} ]\n祝大家今晚順利摘星、坐車收錢！💸\n---\n👇 查更多 AI 精算版路：\n${SHARE_URL}`
    ][rand];
  } else if (type === 'unlucky') {
    return [
      `🚨 【天天樂 避雷警告】${data.lotteryName} (${data.periodStr})\n☠ 這些號碼動能冰封，建議閃避！\n🛑 冥燈不出牌：[ ${data.nums} ]\n---\n🛡 查查你的號碼安不安全：\n${SHARE_URL}`,
      `🛑 衰神退散！${data.lotteryName} (${data.periodStr})\n⚠ 天天樂 AI 提醒，這幾支號碼今天超冷！\n🧊 建議避開：【 ${data.nums} 】\n保住本金就是贏！💪\n---\n🛡️️ 買牌前先來測測吉凶：\n${SHARE_URL}`,
      `😱 【天天樂 警告】${data.lotteryName} (${data.periodStr})\n🛑 系統算出這 3 支今天千萬不能碰：\n👉 [ ${data.nums} ]\n---\n你買的號碼安全嗎？免費幫你算：\n${SHARE_URL}`,
      `🛑 【天天樂 避雷針】${data.lotteryName} (${data.periodStr})\n⚠️ AI 偵測動能冰封，這幾支超冷千萬別碰！\n🧊 激推五不中/不出牌：[ ${data.nums} ]\n---\n🛡 查更多不出牌避雷版路：\n${SHARE_URL}`
    ][rand];
  } else if (type === 'tail') {
    return [
      `📊 【天天樂 尾數精算】\n🎯 ${data.label}\n👉 鎖定號碼：[ ${data.nums} ]\n---\n👇 免費看更多 AI 大數據精算：\n${SHARE_URL}`,
      `🔥 尾數抓牌看這裡！\n✨ AI 大數據推薦：${data.label}\n👉【 ${data.nums} 】👈\n祝大家順利中大獎！🎉\n---\n🎁 免費好用的抓牌神器：\n${SHARE_URL}`,
      `🤫 【天天樂 AI 密碼】\n🎯 演算法剛剛鎖定了這個組合：\n👉 [ ${data.nums} ] (${data.label})\n---\n你的專屬號碼是什麼？點進來看：\n${SHARE_URL}`,
      `🔥 【天天樂 尾數拖牌】\n📈 獨家大數據共伴版路出爐！\n👉 ${data.label} 推薦：[ ${data.nums} ]\n祝大家今晚坐車收錢！💸\n---\n👇 查更多 AI 精算版路：\n${SHARE_URL}`
    ][rand];
  }
}

const LOTTERY_SCHEDULES = {
  lottery_539: { name: "今彩539", time: "每週一至六 20:30 開獎", fullSchedule: "每週一至週六 20:30 開獎" },
  lottery_f5: { name: "加州天天樂", time: "每日 09:30 開獎", fullSchedule: "每日上午 09:30 開獎" },
  lottery_marksix: { name: "六合彩", time: "每週二四六 21:30 開獎", fullSchedule: "每週二、四、六/日 21:30 開獎" }
};
const QR_CODES = { 88: "https://i.ibb.co/4wwWjz93/88.jpg", 168: "https://i.ibb.co/Cps3mwWg/168.jpg", 888: "https://i.ibb.co/5gMy1q38/888.jpg" };

// 全域狀態變數
let activeLottery = 'lottery_539';
let analysisRange = 30; 
let currentModelCategory = 'lucky';
let savedList = JSON.parse(localStorage.getItem('tt_saved') || '[]');
let selectedAmount = 168; 
let selectedTailCount = 3;

// 2. 開獎直播狀態控制
function updateLiveStatus() {
  const container = document.getElementById('live-stream-container');
  if (!container) return;
  
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.getDay();
  
  let isLive = false;
  let streamHtml = '';

  if (activeLottery === 'lottery_539' && day !== 0 && h === 20 && m >= 25 && m <= 45) {
    isLive = true;
    streamHtml = `
      <div style="background: #1e293b; border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:50%; animation: pulseLive 1.5s infinite;"></span>
            <h3 style="margin:0; font-size: 18px; font-weight: 900;">57彩券王 即時轉播中</h3>
          </div>
          <span style="font-size: 14px; font-weight: 700; color: #94a3b8;">系統高頻偵測中，開出後將自動刷新下方數據</span>
        </div>
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; background: #000;">
          <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/live_stream?channel=UCR3asjvr_WAaxwFZDPpa-Bg&autoplay=1&mute=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
      </div>
    `;
  } 
  else if (activeLottery === 'lottery_marksix' && h === 21 && m >= 25 && m <= 45) {
    isLive = true;
    streamHtml = `
      <div style="background: #1e293b; border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <span style="display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:50%; animation: pulseLive 1.5s infinite;"></span>
          <h3 style="margin:0; font-size: 18px; font-weight: 900;">香港六合彩 攪珠進行中</h3>
        </div>
        <div style="text-align: center; padding: 40px 20px; background: rgba(0,0,0,0.3); border-radius: 12px;">
          <div style="font-size: 40px; margin-bottom: 16px; animation: spinBall 3s linear infinite;">🎰</div>
          <h4 style="font-size: 18px; font-weight: 800; color: #fde047; margin-bottom: 8px;">官方攪珠進行中</h4>
          <p style="font-size: 14px; color: #cbd5e1;">系統已切換為高頻輪詢模式，最新號碼即將同步顯示</p>
        </div>
      </div>
    `;
  }
  else if (activeLottery === 'lottery_f5' && ((h === 9 && m >= 25) || (h === 10 && m <= 45))) {
    isLive = true;
    streamHtml = `
      <div style="background: #1e293b; border-radius: 16px; padding: 20px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
         <div style="display: flex; align-items: center; gap: 10px;">
          <span style="display:inline-block; width:12px; height:12px; background:#10b981; border-radius:50%; animation: pulseLive 1.5s infinite;"></span>
          <h3 style="margin:0; font-size: 18px; font-weight: 900;">加州天天樂 號碼開出中</h3>
        </div>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 8px; margin-bottom: 0;">系統已切換為高頻輪詢模式，將自動抓取並顯示最新開出之號碼。</p>
      </div>
    `;
  }

  if (isLive) {
    if (container.innerHTML !== streamHtml) container.innerHTML = streamHtml;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

// 3. 網頁初始化與 API 載入觸發
document.addEventListener('DOMContentLoaded', async () => {
  const qrEl = document.getElementById('jko-qr-img');
  if (qrEl) qrEl.src = QR_CODES[168];
  initTabs(); 
  updateLiveStatus();
  setInterval(updateLiveStatus, 60000);
  
  // fetchLatestData() 實作於 api.js 中
  if (typeof fetchLatestData === 'function') {
    await fetchLatestData(); 
    setInterval(fetchLatestData, 5 * 60 * 1000); 
  }
});

// 4. UI 互動與功能函式
function copyJkoAccount(acc) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(acc).then(() => showToast(`已複製街口帳號：${acc}`));
  } else {
    const ta = document.createElement('textarea');
    ta.value = acc; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast(`已複製街口帳號：${acc}`);
  }
}

function showErrorUI(msg) {
  if (typeof LOTTERY_DATA !== 'undefined' && Object.keys(LOTTERY_DATA).length === 0) {
    const container = document.getElementById('hero-main-display');
    if (container) container.innerHTML = `<h2 style="font-size:22px; font-weight:900; color:#dc2626;">${msg}</h2>`;
  }
}

function showToast(msg) {
  const t = document.getElementById('toast-box');
  if (!t) return;
  t.innerText = msg; t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2800);
}

function smoothScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (!target) return;
  const header = document.querySelector('header');
  const tabsCard = document.getElementById('main-tabs-card');
  const rangeWrap = document.getElementById('range-control-wrap');
  const navPills = document.getElementById('model-nav-pills');
  
  let totalOffset = 0;
  if (header) totalOffset += header.offsetHeight;
  if (window.innerWidth <= 860) {
    if (tabsCard) totalOffset += tabsCard.offsetHeight + parseInt(window.getComputedStyle(tabsCard).marginBottom || 0);
    if (rangeWrap) totalOffset += rangeWrap.offsetHeight;
    if (navPills) totalOffset += navPills.offsetHeight + parseInt(window.getComputedStyle(navPills).marginBottom || 0);
  } else {
    if (tabsCard) totalOffset += tabsCard.offsetHeight;
    totalOffset += 10;
  }

  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  const elementPosition = target.getBoundingClientRect().top + currentScrollY;
  const targetPosition = Math.max(0, elementPosition - totalOffset);
  window.scrollTo({ top: targetPosition, behavior: 'smooth' });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeLottery = tab.getAttribute('data-lottery');
      
      const newUrl = `/?lottery=${activeLottery.replace('lottery_', '')}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      
      const seoData = {
        lottery_539: {
          title: "539開獎號碼與 AI 預測統計、開獎直播 - 天天樂",
          h1: "今彩539：即時開獎直播與 AI 預測統計",
          desc: "提供最即時的今彩539開獎號碼、官方開獎直播與 AI 大數據預測。獨家吉星富貴選號、冥燈避雷與尾數共伴分析。"
        },
        lottery_f5: {
          title: "天天樂開獎與統計分析 - 天天樂",
          h1: "加州天天樂：即時開獎與尾數分析",
          desc: "提供最即時的加州天天樂 (Fantasy 5) 開獎號碼與大數據統計。獨家純前端 AI 模型，精算天天樂熱門尾數與不出牌避雷預測。"
        },
        lottery_marksix: {
          title: "六合彩開獎號碼與大數據分析 - 天天樂",
          h1: "香港六合彩：最新開獎號碼與大數據統計",
          desc: "提供最即時的香港六合彩開獎號碼、攪珠直播狀態與大數據分析。獨家 AI 預測模型，精算六合彩熱冷門號碼與拖牌統計。"
        }
      };

      const currentSeo = seoData[activeLottery];
      
      document.title = currentSeo.title;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", currentSeo.desc);

      const ogTitle = document.getElementById('og-title');
      const ogDesc = document.getElementById('og-desc');
      const ogUrl = document.getElementById('og-url');
      if (ogTitle) ogTitle.setAttribute("content", currentSeo.title);
      if (ogDesc) ogDesc.setAttribute("content", currentSeo.desc);
      if (ogUrl) ogUrl.setAttribute("content", "https://539168.com.tw" + newUrl);

      const twTitle = document.getElementById('tw-title');
      const twDesc = document.getElementById('tw-desc');
      if (twTitle) twTitle.setAttribute("content", currentSeo.title);
      if (twDesc) twDesc.setAttribute("content", currentSeo.desc);

      const canonical = document.getElementById('canonical-link');
      if (canonical) canonical.setAttribute("href", "https://539168.com.tw" + newUrl);

      const bcName = document.getElementById('bc-current-name');
      const bcLink = document.getElementById('bc-current-link');
      const bcTitles = { lottery_539: "今彩539", lottery_f5: "加州天天樂", lottery_marksix: "六合彩" };
      if (bcName && bcLink) {
        bcName.innerText = bcTitles[activeLottery];
        bcLink.setAttribute('href', "https://539168.com.tw" + newUrl);
      }

      const mainH1 = document.getElementById('main-h1');
      if (mainH1) mainH1.innerText = currentSeo.h1;

      updateLiveStatus();
      renderAll(); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function updateDynamicSEO() {
  const data = getActiveDataset();
  if (!data || data.length === 0) return;
  
  const currentTimeISO = new Date().toISOString();
  const updatedTimeMeta = document.getElementById('og-updated-time');
  if (updatedTimeMeta) updatedTimeMeta.setAttribute("content", currentTimeISO);

  const bcTitles = { lottery_539: "今彩539", lottery_f5: "加州天天樂", lottery_marksix: "六合彩" };
  const currentUrl = "https://539168.com.tw/?lottery=" + activeLottery.replace('lottery_', '');
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "天天樂首頁", "item": "https://539168.com.tw/" },
      { "@type": "ListItem", "position": 2, "name": bcTitles[activeLottery], "item": currentUrl }
    ]
  };

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": document.title,
    "description": document.querySelector('meta[name="description"]').getAttribute("content"),
    "url": window.location.href,
    "keywords": ["開獎數據", "歷史紀錄", "大數據統計", "彩券分析", "走勢圖"],
    "dateModified": currentTimeISO,
    "creator": { "@type": "Organization", "name": "天天樂 AI 預測中心" }
  };

  let bcScript = document.getElementById('dynamic-breadcrumb-schema');
  if (!bcScript) { bcScript = document.createElement('script'); bcScript.id = 'dynamic-breadcrumb-schema'; bcScript.type = 'application/ld+json'; document.head.appendChild(bcScript); }
  bcScript.textContent = JSON.stringify(breadcrumbSchema);

  let dsScript = document.getElementById('dynamic-dataset-schema');
  if (!dsScript) { dsScript = document.createElement('script'); dsScript.id = 'dynamic-dataset-schema'; dsScript.type = 'application/ld+json'; document.head.appendChild(dsScript); }
  dsScript.textContent = JSON.stringify(datasetSchema);
}

function renderAll() {
  if (typeof LOTTERY_DATA === 'undefined' || Object.keys(LOTTERY_DATA).length === 0) return;
  setTimeout(() => {
    updateDynamicSEO();
    renderHero(); 
    renderOverview();
    if (currentModelCategory === 'tails') { renderTailsAnalysis(); } else { renderModels(); }
    renderSavedList();
  }, 0);
}

function getActiveDataset() { return LOTTERY_DATA[activeLottery] || []; }

function renderHero() {
  const data = getActiveDataset(); 
  if (typeof SHEETS_META === 'undefined') return;
  const meta = SHEETS_META[activeLottery];
  if (!meta) return;
  const sched = LOTTERY_SCHEDULES[activeLottery] || { time: "", fullSchedule: "" };
  const badgeEl = document.getElementById('hero-badge-name');
  if (badgeEl) badgeEl.innerText = `${meta.name} ｜ ⏰ ${sched.time}`;
  const container = document.getElementById('hero-main-display');
  if (!data || data.length === 0) { if (container) container.innerHTML = `<h2>尚未取得資料</h2>`; return; }

  const latest = data[0];
  const localDateEl = document.getElementById('hero-local-date');
  if (localDateEl) localDateEl.innerHTML = `<span>當地日期 · ${latest.date}</span><span style="opacity:0.9; font-weight:700;">⏰ 開獎時間：${sched.fullSchedule}</span>`;
  
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.getDay();
  
  let isRolling = false;
  if (activeLottery === 'lottery_539' && day !== 0 && h === 20 && m >= 30 && m <= 38) {
    const drawDateStr = latest.date.replace(/-/g, '');
    const todayStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    if (drawDateStr !== todayStr) isRolling = true;
  }
  
  let ballsHtml = '<div class="pine-balls-stage">';
  if (isRolling) {
     for(let i=0; i<5; i++) {
       ballsHtml += `<div class="white-ball" style="animation: spinBall 0.5s linear infinite;">?</div>`;
     }
  } else {
    latest.numbers.forEach(num => { ballsHtml += `<div class="white-ball">${String(num).padStart(2,'0')}</div>`; });
    if (activeLottery === 'lottery_marksix' && latest.special !== null) {
      ballsHtml += `<span style="font-size:26px; font-weight:900; color:#fde047;">+</span><div class="white-ball special-ball">${String(latest.special).padStart(2,'0')}</div>`;
    }
  }
  ballsHtml += '</div>';

  const sum = latest.numbers.reduce((a,b)=>a+b, 0);
  const maxN = activeLottery === 'lottery_marksix' ? 49 : 39;
  const med = Math.floor(maxN / 2);
  let big = 0, small = 0, odd = 0, even = 0;
  latest.numbers.forEach(n => { if (n > med) big++; else small++; if (n % 2 !== 0) odd++; else even++; });

  const periodHtml = latest.period ? `期別 ${latest.period}` : `最新開獎`;
  if (container) {
    if (isRolling) {
       container.innerHTML = `<div style="font-size:16px; opacity:0.9; font-family:var(--font-mono); font-weight:800; margin-bottom:4px; color:#fde047;">開獎連線中，號碼滾動更新中...</div>${ballsHtml}`;
    } else {
       container.innerHTML = `<div style="font-size:16px; opacity:0.9; font-family:var(--font-mono); font-weight:800; margin-bottom:4px;">${periodHtml}</div>${ballsHtml}<div style="display:flex; gap:16px; font-size:15px; color:rgba(255,255,255,0.9); font-family:var(--font-mono); font-weight:800;"><span>和值: ${sum}</span><span>大小: ${big}大${small}小</span><span>奇偶: ${odd}奇${even}偶</span></div>`;
    }
  }
}

function renderOverview() {
  const data = getActiveDataset(); 
  if (typeof SHEETS_META === 'undefined') return;
  const meta = SHEETS_META[activeLottery]; if (!meta) return;
  const srcRowsEl = document.getElementById('metric-source-rows');
  const pageRowsEl = document.getElementById('metric-page-rows');
  if (srcRowsEl) srcRowsEl.innerText = meta.totalRows.toLocaleString();
  if (pageRowsEl) pageRowsEl.innerText = data.length.toString();
}

// 5. 模型與版面切換邏輯
function setAnalysisRange(val) {
  analysisRange = parseInt(val, 10);
  document.querySelectorAll('#range-btn-group .range-btn').forEach(btn => { btn.classList.toggle('active', parseInt(btn.getAttribute('data-range'), 10) === analysisRange); });
  if (currentModelCategory === 'tails') { renderTailsAnalysis(); } else { renderModels(); }
  setTimeout(() => { smoothScrollTo('scroll-anchor'); }, 50);
}

function switchModelCategory(cat) {
  currentModelCategory = cat;
  const luckyBtn = document.getElementById('tab-model-lucky');
  const unluckyBtn = document.getElementById('tab-model-unlucky');
  const tailsBtn = document.getElementById('tab-model-tails');
  const badge = document.getElementById('ranking-metric-badge');
  if (luckyBtn) luckyBtn.className = 'model-nav-btn lucky';
  if (unluckyBtn) unluckyBtn.className = 'model-nav-btn unlucky';
  if (tailsBtn) tailsBtn.className = 'model-nav-btn tails-btn';
  
  if (cat === 'lucky') {
    if (luckyBtn) luckyBtn.classList.add('active'); if (badge) badge.innerText = '依綜合命中分數排行';
  } else if (cat === 'unlucky') {
    if (unluckyBtn) unluckyBtn.classList.add('active'); if (badge) badge.innerText = '依完全避雷防禦率排行';
  } else {
    if (tailsBtn) tailsBtn.classList.add('active');
  }

  const modelsContainer = document.getElementById('models-grid-container');
  const rankingBar = document.getElementById('ranking-title-bar');
  const tailsWrapper = document.getElementById('tails-wrapper');

  if (cat === 'tails') {
    if (modelsContainer) modelsContainer.style.display = 'none'; if (rankingBar) rankingBar.style.display = 'none'; if (tailsWrapper) tailsWrapper.style.display = 'block';
    renderTailsAnalysis();
  } else {
    if (modelsContainer) modelsContainer.style.display = 'grid'; if (rankingBar) rankingBar.style.display = 'flex'; if (tailsWrapper) tailsWrapper.style.display = 'none';
    renderModels();
  }
  setTimeout(() => { smoothScrollTo('scroll-anchor'); }, 50);
}

// 6. 渲染 AI 模型清單
function renderModels() {
  const container = document.getElementById('models-grid-container');
  const data = getActiveDataset();
  if (!data || data.length === 0 || !container) return;
  const latestDraw = data[0]; const targetPeriod = latestDraw.period || latestDraw.date;
  const maxN = activeLottery === 'lottery_marksix' ? 49 : 39;
  const isLucky = (currentModelCategory === 'lucky');
  
  // 依賴於 logic.js 中的常數與函式
  if (typeof evaluateAndRankModels !== 'function') return;
  const modelsList = isLucky ? LUCKY_MODELS : UNLUCKY_MODELS;
  const { evaluatedModels, totalTestDraws } = evaluateAndRankModels(modelsList, data, activeLottery, targetPeriod, maxN, analysisRange, isLucky);

  let html = '';
  evaluatedModels.slice(0, 6).forEach((item, idx) => {
    const {model: m, pred} = item;
    let ballsHtml = '';
    pred.forEach(num => {
      const bS = 'width:42px; height:42px; font-size:18px; font-weight:900; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-family:var(--font-mono);';
      if (isLucky) { ballsHtml += `<div class="ball-dot-pine" style="${bS} color:#ffffff; box-shadow:0 3px 8px rgba(15,76,58,0.2);">${String(num).padStart(2,'0')}</div>`; }
      else { ballsHtml += `<div style="${bS} background:#ffffff; color:#dc2626; border:2.5px solid #dc2626; box-shadow:0 2px 6px rgba(220,38,38,0.15);">${String(num).padStart(2,'0')}</div>`; }
    });

    let backtestBox = '';
    if (isLucky) {
      const p1 = ((item.hit1 / totalTestDraws) * 100).toFixed(1); const p2 = ((item.hit2 / totalTestDraws) * 100).toFixed(1); const p3 = ((item.hit3 / totalTestDraws) * 100).toFixed(1);
      const winRate = (((item.hit1 + item.hit2 + item.hit3) / totalTestDraws) * 100).toFixed(1);
      backtestBox = `<div class="backtest-box"><div class="backtest-box-header"><span>近 ${totalTestDraws} 期歷史實測</span><span style="color:#047857;">綜合命中率 ${winRate}%</span></div><div class="backtest-pills-row"><div class="backtest-pill"><span>中 1 碼</span><strong>${item.hit1}期 (${p1}%)</strong></div><div class="backtest-pill"><span>中 2 碼</span><strong style="color:#d97706;">${item.hit2}期 (${p2}%)</strong></div><div class="backtest-pill" style="border-color:#bbf7d0; background:#f0fdf4;"><span style="color:#166534;">3碼全中 🔥</span><strong style="color:#0f4c3a;">${item.hit3}期 (${p3}%)</strong></div></div></div>`;
    } else {
      const avoidPct = ((item.hit0 / totalTestDraws) * 100).toFixed(1); const leak1 = ((item.hit1 / totalTestDraws) * 100).toFixed(1); const leak2Plus = (((item.hit2 + item.hit3) / totalTestDraws) * 100).toFixed(1);
      backtestBox = `<div class="backtest-box"><div class="backtest-box-header"><span>近 ${totalTestDraws} 期避雷防禦實測</span><span style="color:#16a34a;">🛡 完全避雷率 ${avoidPct}%</span></div><div class="backtest-pills-row"><div class="backtest-pill" style="border-color:#bbf7d0; background:#f0fdf4;"><span style="color:#166534;">完全避開(0碼)</span><strong style="color:#15803d;">${item.hit0}期 (${avoidPct}%)</strong></div><div class="backtest-pill"><span style="color:#64748b;">破防 1 碼</span><strong style="color:#d97706;">${item.hit1}期 (${leak1}%)</strong></div><div class="backtest-pill"><span style="color:#64748b;">破防 2 碼+</span><strong style="color:#dc2626;">${item.hit2 + item.hit3}期 (${leak2Plus}%)</strong></div></div></div>`;
    }

    const cardCls = isLucky ? 'model-card lucky' : 'model-card unlucky';
    const bookmarkBtnLabel = isLucky ? '⭐ 收藏本期推薦 (3碼)' : '🛡 收藏避雷指標 (3碼)';
    let rankBadgeStyle = isLucky 
      ? (idx === 0 ? 'background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff;' : idx === 1 ? 'background:linear-gradient(135deg, #94a3b8, #64748b); color:#ffffff;' : idx === 2 ? 'background:linear-gradient(135deg, #d97706, #b45309); color:#ffffff;' : 'background:#dcfce7; color:#15803d;') 
      : (idx === 0 ? 'background:linear-gradient(135deg, #dc2626, #991b1b); color:#ffffff;' : 'background:#fee2e2; color:#991b1b; border:1px solid #fca5a5;');
    
    html += `<div class="${cardCls}"><div><div class="model-header-row"><div><div class="model-name"><span style="display:inline-block; font-size:13px; padding:4px 10px; border-radius:6px; font-weight:900; margin-right:8px; ${rankBadgeStyle}">TOP ${idx+1}</span> ${m.name}</div><div style="font-size:14px; font-weight:800; color:var(--text-muted); margin-top:6px;">${m.subtitle}</div></div><span class="model-tag">${isLucky ? '預測 3 碼' : '避雷 3 碼'}</span></div><div class="model-desc-text">${m.logic}</div><div class="model-balls-stage">${ballsHtml}</div>${backtestBox}</div><button class="btn-save-model" onclick='saveModelPrediction("${m.id}", "${m.name}", "${isLucky ? "lucky" : "unlucky"}", ${JSON.stringify(pred)}, "${targetPeriod}")'>${bookmarkBtnLabel}</button></div>`;
  });
  container.innerHTML = html;
}

// 7. 渲染尾數分析區塊
function setTailScheme(n) {
  selectedTailCount = n;
  document.querySelectorAll('#tail-scheme-group .range-btn').forEach(btn => { btn.classList.toggle('active', parseInt(btn.getAttribute('data-tailcount'), 10) === selectedTailCount); });
  renderTailsAnalysis();
}

function renderTailsAnalysis() {
  const container = document.getElementById('tails-wrapper');
  const data = getActiveDataset();
  if (!data || data.length === 0 || !container) return;
  if (typeof calculateTailsData !== 'function') return;

  const tailsData = calculateTailsData(data, activeLottery, analysisRange, selectedTailCount);
  const { totalDraws, tailCounts, maxCount, tailOmission, sortedPairs, hotTail, omTail, killTail, schemeTails, schemeBalls, schemeHitTotal, schemeHit2Plus, bestPairTail, bestPairCount, omRank, doubleTailMatches, tailPool } = tailsData;

  let topPairsHtml = sortedPairs.slice(0, 3).map((p, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:${idx === 0 ? '#f0fdf4' : '#f8fafc'}; border:1px solid ${idx === 0 ? '#bbf7d0' : 'var(--border-card)'}; border-radius:10px; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px;"><strong style="font-size:18px; color:var(--primary-pine);">${p.t1} 尾</strong><span style="font-size:14px; color:#94a3b8;">🤝</span><strong style="font-size:18px; color:var(--primary-pine);">${p.t2} 尾</strong></div>
      <div style="text-align:right;"><strong style="font-size:16px; color:var(--text-main); font-family:var(--font-mono);">${p.count} 次</strong><div style="font-size:12px; color:var(--text-muted); font-weight:700;">同開率 ${((p.count / totalDraws) * 100).toFixed(1)}%</div></div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="tails-ai-rec">
      <div class="tail-badge-box hot">
        <div><div class="tail-badge-title">🔥 本期主推熱尾</div><div class="tail-badge-number">${hotTail} 尾</div><div style="font-size:14px; font-weight:800; opacity:0.9;">近 ${totalDraws} 期強開 ${tailCounts[hotTail]} 次</div><div class="tail-badge-balls">${tailPool(hotTail).map(n => `<span class="tail-ball-pill">${String(n).padStart(2,'0')}</span>`).join('')}</div></div>
        <button class="btn-copy-tail" onclick="shareTailBadgeToLine([${tailPool(hotTail).join(',')}], '🔥 本期主推熱尾：${hotTail} 尾')">🟢 傳 LINE</button>
      </div>
      <div class="tail-badge-box omission">
        <div><div class="tail-badge-title">⚡ 斷層極限回歸</div><div class="tail-badge-number">${omTail} 尾</div><div style="font-size:14px; font-weight:800; opacity:0.9;">${tailOmission[omTail] === 0 ? '上期開出' : `已連續 ${tailOmission[omTail]} 期未開`}</div><div class="tail-badge-balls">${tailPool(omTail).map(n => `<span class="tail-ball-pill">${String(n).padStart(2,'0')}</span>`).join('')}</div></div>
        <button class="btn-copy-tail" onclick="shareTailBadgeToLine([${tailPool(omTail).join(',')}], '⚡ 斷層極限回歸：${omTail} 尾')">🟢 傳 LINE</button>
      </div>
      <div class="tail-badge-box kill">
        <div><div class="tail-badge-title">🛡 本期絕殺避雷</div><div class="tail-badge-number">${killTail} 尾</div><div style="font-size:14px; font-weight:800; opacity:0.9;">動能冰封 · 建議避開</div><div class="tail-badge-balls">${tailPool(killTail).map(n => `<span class="tail-ball-pill">${String(n).padStart(2,'0')}</span>`).join('')}</div></div>
        <button class="btn-copy-tail" onclick="shareTailBadgeToLine([${tailPool(killTail).join(',')}], '🛡️ 本期絕殺避雷：${killTail} 尾')">🟢 傳 LINE</button>
      </div>
    </div>
    <div style="background:#ffffff; border:1px solid var(--border-card); border-radius:16px; padding:24px; margin-bottom:32px; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div><h3 style="font-size:22px; font-weight:900; color:var(--text-main); margin-bottom:6px;">🎯 依數據資料推薦組合方案</h3><p style="font-size:15px; color:var(--text-muted); font-weight:700;">結合出現頻率、遺漏回歸與雙開指數動態精算最佳尾數</p></div>
        <div class="range-btn-group" id="tail-scheme-group"><button class="range-btn ${selectedTailCount === 3 ? 'active' : ''}" data-tailcount="3" onclick="setTailScheme(3)">精選 3 尾</button><button class="range-btn ${selectedTailCount === 4 ? 'active' : ''}" data-tailcount="4" onclick="setTailScheme(4)">精選 4 尾</button><button class="range-btn ${selectedTailCount === 5 ? 'active' : ''}" data-tailcount="5" onclick="setTailScheme(5)">精選 5 尾</button></div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="font-size:15px; font-weight:800; color:var(--text-secondary); margin-bottom:8px;">精選尾數：${schemeTails.map(t => `<strong style="font-size:18px; color:var(--primary-pine); margin-right:8px;">${t}尾</strong>`).join('')}<span style="font-size:14px; color:var(--text-muted); font-weight:700;">(共 ${schemeBalls.length} 顆)</span></div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">${schemeBalls.map(n => `<span class="tail-ball-pill" style="background:#ffffff; border-color:#cbd5e1; font-size:16px;">${String(n).padStart(2,'0')}</span>`).join('')}</div>
        </div>
        <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
          <div style="text-align:right;"><div style="font-size:14px; color:var(--text-muted); font-weight:800;">期均涵蓋球數</div><div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:var(--primary-pine);">${(schemeHitTotal / totalDraws).toFixed(2)} 顆</div></div>
          <div style="text-align:right; border-left:1px solid #cbd5e1; padding-left:20px;"><div style="font-size:14px; color:var(--text-muted); font-weight:800;">2碼以上覆蓋率</div><div style="font-size:24px; font-weight:900; font-family:var(--font-mono); color:#d97706;">${((schemeHit2Plus / totalDraws) * 100).toFixed(1)}%</div></div>
          <div style="display:flex; gap:10px; width:100%; margin-top:10px; justify-content:flex-end;">
            <button class="btn-pine" style="background:#06C755; border:none; padding:10px 16px; font-size:15px; box-shadow:0 2px 6px rgba(6, 199, 85, 0.3);" onclick="shareTailsToLine([${schemeBalls.join(',')}], '${selectedTailCount}個尾數方案')">🟢 傳LINE群組</button>
            <button class="btn-pine" style="background:#ffffff; color:var(--primary-pine); border:1.5px solid var(--primary-pine); padding:10px 16px; font-size:15px;" onclick="copyTailNumbers([${schemeBalls.join(',')}], '${selectedTailCount}個尾數方案')">複製</button>
          </div>
        </div>
      </div>
    </div>
    <div class="tails-grid">
      <div class="tails-card">
        <h3>🌡 0~9 尾數冷熱溫度計 (近 ${totalDraws} 期)</h3>
        <div style="margin-top:20px;">
          ${Array.from({length: 10}, (_, t) => { const count = tailCounts[t], pct = Math.round((count / maxCount) * 100); return `<div class="temp-row"><span class="temp-label">${t} 尾</span><div class="temp-bar-bg"><div class="temp-bar-fill ${pct >= 75 ? 'bg-heat-hot' : pct >= 45 ? 'bg-heat-warm' : 'bg-heat-cool'}" style="width:${pct}%;"></div></div><span class="temp-val">${count} 次</span></div>`; }).join('')}
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:24px;">
        <div class="tails-card">
          <h3>🚨 尾數極限遺漏警戒 (連續未開出)</h3>
          <div class="omission-list" style="margin-top:16px;">
            ${omRank.map((t, idx) => `<div class="omission-item"><div style="display:flex; align-items:center; gap:12px;"><span style="font-size:16px; font-weight:900; color:var(--text-muted); font-family:var(--font-mono);">${idx+1}</span><strong style="color:var(--text-main); font-size:18px;">${t} 尾</strong><span style="font-size:14px; color:var(--text-muted); font-weight:600;">${tailPool(t).map(n => String(n).padStart(2,'0')).join(', ')}</span></div><strong>${tailOmission[t] === 0 ? '上期開出' : `連續 ${tailOmission[t]} 期`}</strong></div>`).join('')}
          </div>
        </div>
        
        <div class="tails-card">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
            <h4 style="font-size:18px; font-weight:900; color:var(--text-main); margin:0;">🧲 雙尾共伴雷達</h4>
            <span style="font-size:12px; font-weight:900; background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff; padding:4px 10px; border-radius:6px; box-shadow:0 2px 4px rgba(217,119,6,0.2);">👑 彩友「二哥」獨家提供</span>
          </div>
          <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; font-weight:600; margin-bottom:16px;">近 ${totalDraws} 期內，這幾組尾數宛如磁鐵般最常在同一期結伴開出。</p>
          ${topPairsHtml}
        </div>
        
      </div>
    </div>
  `;
}

// 8. 複製與社群分享
function copyTailNumbers(arr, label) {
  const text = arr.map(n => String(n).padStart(2, '0')).join(', ');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => { showToast(`已複製 [${label}] 號碼：${text}`); }).catch(() => fallbackCopy(text, label));
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); showToast(label ? `已複製 [${label}] 號碼：${text}` : '已成功複製內容！'); } 
  catch (err) { showToast('複製失敗，請手動複製。'); }
  document.body.removeChild(ta);
}

function saveModelPrediction(modelId, modelName, type, numbers, period) {
  if (typeof SHEETS_META === 'undefined') return;
  savedList.unshift({ id: Date.now(), lottery: activeLottery, lotteryName: SHEETS_META[activeLottery].name, modelName, type, period, numbers, date: new Date().toLocaleDateString('zh-TW') });
  localStorage.setItem('tt_saved', JSON.stringify(savedList)); renderSavedList();
  showToast(`已成功收藏 [${modelName}] 組合！`);
}

function shareToLine(text) {
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
  window.open(lineUrl, '_blank');
}

function shareTailBadgeToLine(arr, typeLabel) {
  const nums = arr.map(n => String(n).padStart(2, '0')).join(', ');
  shareToLine(getRandomShareText('tail', { label: typeLabel, nums }));
}

function shareTailsToLine(arr, label) {
  const nums = arr.map(n => String(n).padStart(2, '0')).join(', ');
  shareToLine(getRandomShareText('tail', { label: label, nums }));
}

function shareSavedItem(id) {
  const item = savedList.find(x => x.id === id);
  if (!item) return;
  const nums = item.numbers.map(n => String(n).padStart(2, '0')).join(', ');
  const periodStr = item.period ? `第 ${item.period} 期` : `${item.date}`;
  shareToLine(getRandomShareText(item.type, { lotteryName: item.lotteryName, periodStr, modelName: item.modelName, nums }));
}

function copySavedItem(id) {
  const item = savedList.find(x => x.id === id);
  if (!item) return;
  const nums = item.numbers.map(n => String(n).padStart(2, '0')).join(', ');
  const periodStr = item.period ? `第 ${item.period} 期` : `${item.date}`;
  const shareText = getRandomShareText(item.type, { lotteryName: item.lotteryName, periodStr, modelName: item.modelName, nums });
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => showToast('🎉 已成功複製分享文案！')).catch(() => fallbackCopy(shareText, null));
  } else { fallbackCopy(shareText, null); }
}

// 9. 我的收藏與模態框邏輯
function renderSavedList() {
  const container = document.getElementById('saved-list-container');
  if (!container) return;
  if (savedList.length === 0) {
    container.innerHTML = `<div style="font-size:15px; color:var(--text-muted); font-weight:600; padding:20px 0;">還沒有收藏，在上方模型卡片點選「收藏」即可保存。</div>`; return;
  }
  container.innerHTML = savedList.map(item => {
    const isLucky = (item.type === 'lucky');
    const matchDraw = (typeof LOTTERY_DATA !== 'undefined' && LOTTERY_DATA[item.lottery]) ? LOTTERY_DATA[item.lottery].find(d => (d.period === item.period || d.date === item.period)) : null;
    let matchBadge = `<span style="font-size:13px; background:#fef3c7; color:#b45309; padding:4px 10px; border-radius:6px; font-weight:800;">⏳ 待開獎對獎</span>`;
    if (matchDraw) {
      const matchCount = item.numbers.filter(n => new Set(matchDraw.numbers).has(n)).length;
      if (isLucky) { matchBadge = matchCount > 0 ? `<span style="font-size:13px; background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:6px; font-weight:900;">🔥 命中 ${matchCount} 碼</span>` : `<span style="font-size:13px; background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:6px; font-weight:800;">未中 (0碼)</span>`; } 
      else { matchBadge = matchCount === 0 ? `<span style="font-size:13px; background:#dbeafe; color:#1e40af; padding:4px 10px; border-radius:6px; font-weight:900;">🛡️ 完美避雷</span>` : `<span style="font-size:13px; background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:6px; font-weight:900;">⚠️ 破防 ${matchCount} 碼</span>`; }
    }
    
    return `
      <div style="background:#f8fafc; border:1px solid var(--border-card); border-radius:12px; padding:16px 20px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <strong style="font-size:16px; color:var(--text-main); font-weight:900;">${item.lotteryName} · ${item.modelName}</strong>${matchBadge}
            </div>
            <div style="font-size:14px; color:var(--text-muted); font-family:var(--font-mono); font-weight:600; margin-top:4px;">${item.period ? `期別 ${item.period}` : `日期 ${item.date}`}</div>
            <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
              ${item.numbers.map(n => `<div class="ball-dot-pine" style="width:30px; height:30px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#ffffff; font-size:14px; font-weight:800; font-family:var(--font-mono);">${String(n).padStart(2,'0')}</div>`).join('')}
            </div>
          </div>
          <button onclick="removeSavedItem(${item.id})" style="background:none; border:none; color:var(--text-light); cursor:pointer; font-size:22px; padding:0 0 4px 10px;">✕</button>
        </div>
        
        <div style="display:flex; gap:10px; margin-top:16px; border-top:1px dashed #cbd5e1; padding-top:12px;">
          <button onclick="shareSavedItem(${item.id})" style="flex:1; padding:10px; border-radius:8px; border:none; background:#06C755; color:#ffffff; font-size:15px; font-weight:900; cursor:pointer; transition:all 0.2s ease; font-family:inherit; box-shadow:0 2px 6px rgba(6, 199, 85, 0.3);">🟢 LINE 轉傳</button>
          <button onclick="copySavedItem(${item.id})" style="flex:1; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; background:#ffffff; color:var(--text-secondary); font-size:15px; font-weight:800; cursor:pointer; transition:all 0.2s ease; font-family:inherit;">📄 複製</button>
        </div>
      </div>
    `;
  }).join('');
}

function removeSavedItem(id) {
  savedList = savedList.filter(x => x.id !== id);
  localStorage.setItem('tt_saved', JSON.stringify(savedList)); renderSavedList();
}

function openSupportModal() { const modal = document.getElementById('support-modal'); if (modal) modal.classList.add('active'); }
function closeSupportModal() { const modal = document.getElementById('support-modal'); if (modal) modal.classList.remove('active'); }

function selectAmt(amt, btn) { 
  selectedAmount = amt; 
  document.querySelectorAll('#support-modal .btn-pill').forEach(b => { b.style.borderColor = 'var(--border-card)'; b.style.background = '#ffffff'; b.style.color = 'var(--text-secondary)'; }); 
  btn.style.borderColor = '#e11d48'; btn.style.background = '#fff1f2'; btn.style.color = '#e11d48'; 
  const qrImg = document.getElementById('jko-qr-img');
  if (qrImg) { qrImg.style.opacity = '0.5'; setTimeout(() => { qrImg.src = QR_CODES[amt]; qrImg.style.opacity = '1'; }, 150); }
}

async function confirmSponsor() {
  const name = document.getElementById('sponsor-name').value.trim() || '幸運彩友';
  const msg = document.getElementById('sponsor-msg').value.trim() || '無留言';
  const btn = document.getElementById('btn-submit-sponsor');
  const originalText = btn.innerText; btn.innerText = "通知發送中..."; btn.disabled = true;
  try {
    if (typeof sendSponsorApi !== 'function') throw new Error("API 未載入");
    const result = await sendSponsorApi(name, selectedAmount, msg);
    if (result.status === "success") { closeSupportModal(); showToast(`感謝 ${name} 贊助 NT$ ${selectedAmount} 或是提供的版路資訊！`); } 
    else { console.error("後端錯誤:", result.message); showToast("通知發送失敗，請稍後再試。"); }
  } catch (error) { console.error('網路異常', error); showToast("網路異常，無法送出通知。"); } 
  finally { btn.innerText = originalText; btn.disabled = false; }
}