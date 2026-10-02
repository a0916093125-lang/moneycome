/**
 * ========================================================
 * 天天樂 PWA 核心引擎 (sw.js)
 * 升級：離線優先 (Offline-First) 與 Stale-While-Revalidate 策略
 * ========================================================
 */

// 每次您有修改 index.html 想要強迫使用者更新時，把這裡的 v2 改成 v3 即可！
const CACHE_VERSION = 'tt-pwa-cache-v2';

// 核心靜態資源清單 (系統會在第一次打開時，偷偷把這些檔案載進手機記憶體)
const CORE_ASSETS = [
  './',
  './index.html',
  './api.js',
  './logic.js',
  './manifest.json'
];

// 【階段一：安裝 (Install)】預先快取核心資源
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 強制新版 Service Worker 立即接管，不等舊版關閉
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log(`[PWA 引擎] 📦 正在預先快取核心資源...`);
      // 使用 Promise.allSettled 確保就算某個檔案找不到，也不會導致整個 PWA 安裝失敗
      return Promise.allSettled(
        CORE_ASSETS.map(url => cache.add(url).catch(err => console.warn(`無法快取: ${url}`, err)))
      );
    })
  );
});

// 【階段二：啟動 (Activate)】自動清除舊版快取，釋放手機空間
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 如果快取名稱開頭是 tt-pwa-cache- 但版本號跟現在不同，就當作垃圾刪除
          if (cacheName.startsWith('tt-pwa-cache-') && cacheName !== CACHE_VERSION) {
            console.log(`[PWA 引擎] 🧹 清除舊版快取: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`[PWA 引擎] 🚀 已全面接管控制權！`);
      return self.clients.claim(); // 立即控制所有開啟的網頁
    })
  );
});

// 【階段三：攔截請求 (Fetch)】智慧快取策略
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. 只攔截 GET 請求 (像是 POST 贊助表單這種要傳資料的，直接放行)
  if (request.method !== 'GET') return;

  // 2. 針對 Google API 開獎數據：絕對不要放進 PWA 快取！
  // 因為前端 index.html 裡面已經有寫了一套更聰明的 localStorage 機制了，這裡直接放行避免打架。
  if (url.origin.includes('script.google.com') || url.origin.includes('script.googleusercontent.com')) {
    return;
  }

  // 3. 針對網站本身檔案 (HTML, JS, CSS)：採用 Stale-While-Revalidate (邊用邊更新策略)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      
      // 定義一個背景去網路抓新檔案的動作
      const fetchPromise = fetch(request).then((networkResponse) => {
        // 如果成功從網路抓到新檔案，就把新檔案存進快取倉庫裡備用
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // 如果沒網路抓不到，也沒關係，靜靜地什麼都不做
         console.log('[PWA 引擎] 📶 目前處於離線狀態');
      });

      // 👑 核心魔法：如果 cachedResponse 裡面有舊資料，就「瞬間」印出畫面給使用者看！
      // 同時間背景的 fetchPromise 繼續執行更新。如果都沒快取才去網路抓。
      return cachedResponse || fetchPromise;
    })
  );
});