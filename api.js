const API_URL = "https://script.google.com/macros/s/AKfycbx9m5XcTshUv_oeMdQkNV4RB64wgbe1kMrUOB4HP6HhM114H7iGjohZySBh9KWsEEmW/exec"; 

let LOTTERY_DATA = {};
let SHEETS_META = {};

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

async function fetchLatestData() {
  try {
    const fetchUrl = `${API_URL}?limit=30&t=${Date.now()}`;
    const json = await fetchWithRetry(fetchUrl, 3);
    if (json.status === "success") {
      LOTTERY_DATA = json.data;
      SHEETS_META = json.meta;
      if (typeof renderAll === 'function') {
        renderAll();
      }
    } else {
      if (typeof showErrorUI === 'function') {
        showErrorUI(json.message);
      }
    }
  } catch (error) {
    if (typeof showErrorUI === 'function') {
      showErrorUI("連線異常，無法取得數據，請稍後再試。");
    }
  }
}

async function sendSponsorApi(name, amount, message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'sponsor', name: name, amount: amount, message: message })
  });
  return await response.json();
}