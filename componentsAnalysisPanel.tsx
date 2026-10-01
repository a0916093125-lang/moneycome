'use client';

import React, { useState, useMemo } from 'react';
import { LotteryDraw } from '@/lib/api';
import { generateModelNumbers } from '@/lib/algorithms';

interface AnalysisPanelProps {
  history: LotteryDraw[];
  lotteryType: string;
}

// 六合彩波色判定
const MS_RED = new Set([1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46]);
const MS_BLUE = new Set([3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48]);
const MS_GREEN = new Set([5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49]);

function getBallStyle(lotteryType: string, num: number) {
  if (lotteryType === 'lottery_marksix') {
    if (MS_RED.has(num)) return 'bg-red-500 text-white';
    if (MS_BLUE.has(num)) return 'bg-sky-500 text-white';
    if (MS_GREEN.has(num)) return 'bg-emerald-500 text-white';
  }
  return 'bg-[#074a3a] text-white';
}

export default function AnalysisPanel({ history, lotteryType }: AnalysisPanelProps) {
  // 期數篩選：預設近 10 期
  const [selectedPeriod, setSelectedPeriod] = useState<number>(10);

  const isMarkSix = lotteryType === 'lottery_marksix';
  const ballCount = isMarkSix ? 6 : 5;
  const maxBallNum = isMarkSix ? 49 : 39;

  const latestDraw = history[0];
  const targetPeriod = latestDraw?.period || 'NEXT';

  // 1. 吉星富貴選號 (TOP 6)
  const luckyNumbers = useMemo(() => {
    const raw = generateModelNumbers('m1', lotteryType, targetPeriod, 6, maxBallNum);
    return raw.slice(0, 6);
  }, [lotteryType, targetPeriod, maxBallNum]);

  // 2. 冥燈不出牌 (TOP 6)
  const unluckyNumbers = useMemo(() => {
    const raw = generateModelNumbers('u1', lotteryType, targetPeriod, 6, maxBallNum);
    return raw.slice(0, 6);
  }, [lotteryType, targetPeriod, maxBallNum]);

  // 3. 尾數精準分析 (0~9尾)
  const tailStats = useMemo(() => {
    const counts = Array(10).fill(0);
    const sample = history.slice(0, selectedPeriod);
    sample.forEach((draw) => {
      draw.numbers.forEach((n) => {
        counts[n % 10]++;
      });
    });
    return counts.map((count, tail) => ({ tail, count }));
  }, [history, selectedPeriod]);

  // 找出開出次數最高者供高亮標記
  const maxTailCount = Math.max(...tailStats.map((t) => t.count), 1);

  return (
    <div className="w-full">
      {/* 二級吸附層：近 5 期 / 近 10 期 / 近 30 期 */}
      <div className="sticky top-14 z-20 w-full bg-[#074a3a]/95 backdrop-blur-md border-b border-white/10 shadow-sm py-2 px-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <span className="text-xs text-white/80 font-medium">分析樣本期數：</span>
          <div className="flex gap-1.5">
            {[5, 10, 30].map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all touch-manipulation active:scale-95 ${
                    active
                      ? 'bg-amber-400 text-[#074a3a] shadow-sm'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  近 {p} 期
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 下方內容獨立流暢捲動區塊 */}
      <main className="max-w-2xl mx-auto px-3 py-4 space-y-4">
        {/* 區塊 1: ✨ 吉星富貴選號 (TOP 6) */}
        <section className="model-card rounded-xl border border-white/10 shadow-sm overflow-hidden bg-white/5">
          <header className="sticky top-[102px] z-10 bg-[#074a3a] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <span>✨</span>
              <span>吉星富貴選號 (TOP 6)</span>
            </h3>
            <span className="text-[11px] text-amber-200/70 font-mono">
              第 {targetPeriod} 期預測
            </span>
          </header>
          <div className="p-4">
            <div className="flex flex-wrap gap-2.5 justify-center">
              {luckyNumbers.map((n) => (
                <span
                  key={n}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base shadow-sm ${getBallStyle(
                    lotteryType,
                    n
                  )}`}
                >
                  {String(n).padStart(2, '0')}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-white/60 text-center">
              綜合近期熱門連莊、同尾共振與回歸期望值推演
            </p>
          </div>
        </section>

        {/* 區塊 2: 🛡️ 冥燈不出牌 (TOP 6) */}
        <section className="model-card rounded-xl border border-white/10 shadow-sm overflow-hidden bg-white/5">
          <header className="sticky top-[102px] z-10 bg-[#074a3a] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-red-300 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>冥燈不出牌 (TOP 6)</span>
            </h3>
            <span className="text-[11px] text-red-200/70 font-mono">避雷模型</span>
          </header>
          <div className="p-4">
            <div className="flex flex-wrap gap-2.5 justify-center">
              {unluckyNumbers.map((n) => (
                <span
                  key={n}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base bg-red-950/80 text-red-300 border border-red-500/30 shadow-sm"
                >
                  {String(n).padStart(2, '0')}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-white/60 text-center">
              深陷冰河休眠期或極度超買透支動能之號碼
            </p>
          </div>
        </section>

        {/* 區塊 3: 🎯 尾數精準分析 (0~9尾) */}
        <section className="model-card rounded-xl border border-white/10 shadow-sm overflow-hidden bg-white/5">
          <header className="sticky top-[102px] z-10 bg-[#074a3a] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
              <span>🎯</span>
              <span>尾數精準分析 (0~9尾)</span>
            </h3>
            <span className="text-[11px] text-emerald-200/70">
              近 {selectedPeriod} 期樣本
            </span>
          </header>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {tailStats.map((item) => {
                const isHot = item.count > 0 && item.count === maxTailCount;
                return (
                  <div
                    key={item.tail}
                    className={`rounded-lg p-2 text-center border transition-all ${
                      isHot
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-black/20 border-white/5 text-white/80'
                    }`}
                  >
                    <div className="text-base font-black">{item.tail} 尾</div>
                    <div className="text-[11px] text-white/60 mt-0.5">
                      {item.count} 次
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}