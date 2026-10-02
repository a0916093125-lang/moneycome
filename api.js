const API_URL = "https://script.google.com/macros/s/AKfycbzKEejUwDBid5P9fmM1MmAvlSn4QDM0f7OatIRRhwaiEqe5kkvxsgOwTGxYGZ9sLgs/exec"; 

let LOTTERY_DATA = {};
let SHEETS_META = {};

// 具備指數退避重試機制的 Fetch 封裝
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP 異常: ${response.status}`);
      return await response.json(); 
    } catch (error) {
      console.warn(`第 ${i + 1} 次連線失敗，準備重試...`, error);
      if (i === maxRetries - 1) throw error; 
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
}

// 自動抓取並處理快取，避免版面閃爍 (Layout Shift)
async function fetchLatestData() {
  try {
    const cachedDataStr = localStorage.getItem('tt_lottery_cache');
    const cachedMetaStr = localStorage.getItem('tt_meta_cache');
    
    // 步驟一：立即載入本地快取渲染畫面，達成秒開體驗
    if (cachedDataStr && cachedMetaStr) {
      LOTTERY_DATA = JSON.parse(cachedDataStr);
      SHEETS_META = JSON.parse(cachedMetaStr);
      if (typeof renderAll === 'function') renderAll();
    }

    // 步驟二：背景發送非同步請求，附加時間戳避免瀏覽器強快取
    const fetchUrl = `${API_URL}?limit=30&t=${Date.now()}`;
    const json = await fetchWithRetry(fetchUrl, 3);
    
    if (json.status === "success") {
      const newDataStr = JSON.stringify(json.data);
      const newMetaStr = JSON.stringify(json.meta);
      
      // 步驟三：比對新舊資料，偵測到新開獎時才重繪畫面
      if (newDataStr !== cachedDataStr || newMetaStr !== cachedMetaStr) {
        LOTTERY_DATA = json.data;
        SHEETS_META = json.meta;
        localStorage.setItem('tt_lottery_cache', newDataStr);
        localStorage.setItem('tt_meta_cache', newMetaStr);
        if (typeof renderAll === 'function') renderAll();
      }
    } else {
      if (typeof showErrorUI === 'function') showErrorUI(json.message);
    }
  } catch (error) {
    if (typeof showErrorUI === 'function') {
      showErrorUI("連線異常，無法取得數據，請稍後再試。");
    }
  }
}

// 發送 POST 贊助表單，以純文字繞過 OPTIONS 預檢
async function sendSponsorApi(name, amount, message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'sponsor', name: name, amount: amount, message: message })
  });
  return await response.json();
}

// 智慧高頻輪詢 (Smart Polling)
function startSmartPolling() {
  setInterval(async () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    
    const is539Time = (h === 20 && m >= 30 && m <= 45); 
    const isMarkSixTime = (h === 21 && m >= 30 && m <= 45); 
    const isF5Time = (h === 9 && m >= 30 && m <= 45) || (h === 10 && m >= 30 && m <= 45);

    if (is539Time || isMarkSixTime || isF5Time) {
      console.log("進入開獎時段，啟動高頻輪詢...");
      await fetchLatestData();
    }
  }, 15000); 
}

startSmartPolling();