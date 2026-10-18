import React, { useRef, useState } from 'react';
import { copyEmailToClipboard } from './copyEmail';

const CONTACT_EMAIL = 'your-email@example.com';

interface PersonalHomeProps {
  onEnterSystem: () => void;
}

export const PersonalHome: React.FC<PersonalHomeProps> = ({ onEnterSystem }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const copyInProgress = useRef(false);

  const handleCopyEmail = async () => {
    if (copyInProgress.current) return;

    copyInProgress.current = true;
    setCopyStatus('copying');

    try {
      const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
      const copied = await copyEmailToClipboard(CONTACT_EMAIL, clipboard);
      setCopyStatus(copied ? 'success' : 'error');
    } catch {
      setCopyStatus('error');
    } finally {
      copyInProgress.current = false;
    }
  };

  return (
  <div className="feedback-scope min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <p className="type-body font-semibold text-slate-900">Henry Yan</p>
        <nav aria-label="首頁導覽" className="type-detail flex flex-wrap gap-x-5 gap-y-2 text-emerald-800">
          <a href="#home" className="hover:underline">首頁</a>
          <a href="#about" className="hover:underline">關於我</a>
          <a href="#skills" className="hover:underline">技能</a>
          <a href="#projects" className="hover:underline">作品</a>
          <a href="#contact" className="hover:underline">聯絡</a>
        </nav>
      </div>
    </header>

    <main className="type-body mx-auto w-full max-w-3xl space-y-12 break-words px-6 py-10 leading-relaxed">
      <section id="home" aria-labelledby="home-heading">
        <h1 id="home-heading" className="type-home-title type-page-title text-slate-900">Henry Yan／顏愷均</h1>
        <p className="type-body mt-3 text-slate-600">國立臺灣大學會計學系二年級學生</p>
        <p className="type-body mt-4">以會計與商業思考出發，探索 AI 輔助開發的實務應用。</p>
        <button
          type="button"
          onClick={onEnterSystem}
          className="type-label mt-6 min-h-11 rounded-lg bg-emerald-800 px-5 py-3 text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
        >
          進入庫存系統
        </button>
      </section>

      <section id="about" aria-labelledby="about-heading">
        <h2 id="about-heading" className="type-section-title text-slate-900">關於我</h2>
        <p className="type-body mt-3">我是顏愷均，目前就讀國立臺灣大學會計學系二年級。我關注會計、企業經營與數位工具的結合，希望從實際使用者的需求出發，運用 AI 協助開發，將想法轉化為可以操作的工具。</p>
      </section>

      <section id="skills" aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="type-section-title text-slate-900">技能</h2>
        <ul className="mt-4 space-y-6">
          <li>
            <h3 className="type-item-title text-slate-900">會計基礎</h3>
            <p className="mt-1 type-detail font-medium text-emerald-800">程度：基礎程度</p>
            <p className="type-body mt-2 text-slate-600">已修習初級會計，目前持續學習中級會計與管理會計。</p>
          </li>
          <li>
            <h3 className="type-item-title text-slate-900">需求整理與功能規劃</h3>
            <p className="mt-1 type-detail font-medium text-emerald-800">程度：學習實作中</p>
            <p className="type-body mt-2 text-slate-600">透過課堂專案，練習辨識使用者問題、整理需求及規劃功能。</p>
          </li>
          <li>
            <h3 className="type-item-title text-slate-900">AI 輔助開發</h3>
            <p className="mt-1 type-detail font-medium text-emerald-800">程度：入門程度</p>
            <p className="type-body mt-2 text-slate-600">使用 VS Code 與 Codex，練習將需求轉為開發指令，並依回報逐步調整。</p>
          </li>
          <li>
            <h3 className="type-item-title text-slate-900">程式閱讀與除錯</h3>
            <p className="mt-1 type-detail font-medium text-emerald-800">程度：初學程度</p>
            <p className="type-body mt-2 text-slate-600">目前主要透過 AI 協助理解程式，仍在累積獨立閱讀、測試與除錯的能力。</p>
          </li>
        </ul>
      </section>

      <section id="projects" aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="type-section-title text-slate-900">作品</h2>
        <article className="mt-4 space-y-6">
          <div>
            <h3 className="type-item-title text-slate-900">綠境庫存｜沙龍門市決策與倉管小幫手</h3>
            <p className="type-body mt-2 text-slate-600">以沙龍門市為情境的庫存管理與決策輔助課程原型。</p>
          </div>

          <div>
            <h4 className="type-body font-semibold text-slate-900">目標使用者</h4>
            <p className="type-body mt-2 text-slate-600">沙龍店長、採購與庫管人員，以及現場工作人員。</p>
          </div>

          <div>
            <h4 className="type-body font-semibold text-slate-900">欲解決的問題</h4>
            <p className="type-body mt-2 text-slate-600">希望將商品、庫存異動與採購資訊集中呈現，協助使用者掌握庫存狀況並追蹤紀錄。</p>
          </div>

          <div>
            <h4 className="type-body font-semibold text-slate-900">主要功能</h4>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-600">
              <li>庫存查詢、搜尋與篩選。</li>
              <li>商品、品牌及供應商資料展示。</li>
              <li>領料登記與出入庫帳本。</li>
              <li>採購單與到貨入庫流程展示。</li>
              <li>營運分析及決策建議展示。</li>
            </ul>
          </div>

          <div>
            <h4 className="type-body font-semibold text-slate-900">本人參與</h4>
            <p className="type-body mt-2 text-slate-600">本作品以既有庫存管理專案為基礎。我負責需求整理、修改規劃與開發結果檢視，程式由 Codex 協助實作。</p>
          </div>

          <div>
            <h4 className="type-body font-semibold text-slate-900">目前限制</h4>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-600">
              <li>目前使用模擬資料，屬課程原型。</li>
              <li>核心庫存與採購規則已有自動化檢查，完整畫面操作仍待本人驗收。</li>
              <li>庫存與統計隨目前示範資料更新；AI 建議與部分分析是固定示例。</li>
              <li>站內通知可記錄與標示已讀；LINE／Email 為示範，未實際發送。</li>
              <li>商品、交易、採購、品牌、供應商與人員採本機保存；通知、AI 回饋及目前選取不保存。</li>
              <li>核心資料保存在此瀏覽器；更換瀏覽器、網站來源或清除網站資料後不會共用。這是本機保存，不是雲端備份。</li>
              <li>保存狀態與「重設示範資料」入口位於系統上方；保存失敗時請留意提示。</li>
              <li>角色切換供操作情境展示，目前未提供登入驗證與權限隔離。</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onEnterSystem}
            className="type-label min-h-11 rounded-lg bg-emerald-800 px-5 py-3 text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
          >
            進入系統展示
          </button>
        </article>
      </section>

      <section id="contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="type-section-title text-slate-900">聯絡</h2>
        <p className="type-body mt-3 text-slate-600">歡迎透過電子郵件交流課程作品與學習想法。</p>
        <p className="type-body mt-3 text-slate-600">
          Email：{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="break-all font-medium text-emerald-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCopyEmail}
            disabled={copyStatus === 'copying'}
            aria-busy={copyStatus === 'copying'}
            className="type-label min-h-11 rounded-lg border border-emerald-800 px-4 py-2 text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
          >
            {copyStatus === 'copying' ? '正在複製…' : '複製 Email'}
          </button>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-feedback={copyStatus === 'idle' ? undefined : copyStatus}
            className="type-body mt-3 min-h-12 text-slate-600"
          >
            {copyStatus === 'copying' && '正在複製 Email…'}
            {copyStatus === 'success' && '已複製 Email'}
            {copyStatus === 'error' && '無法自動複製，請手動選取信箱文字複製。'}
          </p>
        </div>
      </section>
    </main>

    <footer className="mt-auto border-t border-slate-200 px-6 py-5 text-center type-detail text-slate-600">
      Henry Yan｜Vibe Coding 課程作品
    </footer>
  </div>
  );
};
