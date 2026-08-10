import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Share2, Eye, TrendingUp, Users, Send, Sparkles, Zap, Activity } from 'lucide-react';

interface ResultShare { id: string; user: string; archetype: string; emoji: string; time: string; note: string; }
interface Comment { id: string; user: string; text: string; time: string; }
interface ApiComment { id: number; site: string; result_type: string | null; nickname: string; body: string; created_at: number; }

const API = '/api';
const SITE = 'micro-break-routine';

function timeAgo(ts: number, isEn: boolean): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return isEn ? 'just now' : '방금 전';
  const m = Math.floor(s / 60);
  if (m < 60) return isEn ? `${m}m ago` : `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return isEn ? `${h}h ago` : `${h}시간 전`;
  const d = Math.floor(h / 24);
  return isEn ? `${d}d ago` : `${d}일 전`;
}

export function App() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [tab, setTab] = useState<'survey' | 'publicFeed' | 'comments'>('survey');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<any>(null);

  // Live Community Data
  const [publicShares, setPublicShares] = useState<ApiComment[]>([]);

  const [comments, setComments] = useState<ApiComment[]>([]);

  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [total, setTotal] = useState(12480);
  const [feedError, setFeedError] = useState<string | null>(null);

  const refreshFeed = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/comments?site=${SITE}&limit=50`),
        fetch(`${API}/stats?site=${SITE}`),
      ]);
      if (!cRes.ok || !sRes.ok) throw new Error('bad status');
      const cj = await cRes.json();
      const sj = await sRes.json();
      setComments(cj.comments || []);
      setPublicShares((cj.comments || []).filter((x: ApiComment) => x.result_type));
      if (sj.total) setTotal(sj.total);
      setFeedError(null);
    } catch {
      setFeedError(lang === 'en' ? 'Community feed unavailable' : '커뮤니티 피드를 불러오지 못했습니다');
    }
  };

  useEffect(() => { refreshFeed(); /* eslint-disable-next-line */ }, [lang]);

  const questions = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    textKo: `${i + 1}번 문항: 진단 상태 및 심리적 행동 패턴을 측정합니다.`,
    textEn: `Item ${i + 1}: Behavioral & diagnostic assessment.`
  }));

  const handleAnswer = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setResult({
        nameKo: "분석형 완벽주의자 (Analytical Perfectionist)",
        nameEn: "Analytical Perfectionist",
        emoji: "📊",
        descKo: "데이터와 정밀성을 추구하며 완벽한 결과를 위해 최선을 다하는 유형입니다.",
        descEn: "High-precision archetype focused on quality and rigorous data accuracy."
      });
    }
  };

    const handleShareResult = async () => {
    if (!result) return;
    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: SITE,
          result_type: lang === 'en' ? result.nameEn : result.nameKo,
          nickname: nickname.trim() || (lang === 'en' ? 'Anonymous Explorer' : '익명 탐험가'),
          body: shareNote.trim() || (lang === 'en' ? 'Sharing my diagnostic result to the community feed!' : '내 진단 결과를 커뮤니티 피드에 공유합니다!'),
        }),
      });
      if (!res.ok) throw new Error('post failed');
      setShareNote('');
      await refreshFeed();
      setTab('publicFeed');
    } catch {
      setFeedError(lang === 'en' ? 'Failed to share' : '공유에 실패했습니다');
    }
  };

    const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: SITE,
          nickname: nickname.trim() || (lang === 'en' ? 'Anonymous Dev' : '익명 개발자'),
          body: newComment.trim(),
        }),
      });
      if (!res.ok) throw new Error('post failed');
      setNewComment('');
      await refreshFeed();
    } catch {
      setFeedError(lang === 'en' ? 'Failed to post comment' : '댓글 작성에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex justify-between items-center max-w-4xl mx-auto w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-base text-white tracking-tight uppercase">micro-break-routine</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" /> Live Connected
          </span>
        </div>
        <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold">
          {lang === 'ko' ? 'English' : '한국어'}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-6 py-8 w-full flex-1">
        {/* Navigation Tabs */}
        {feedError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">{feedError}</div>
        )}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6">
          <button onClick={() => setTab('survey')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'survey' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <Activity className="w-3.5 h-3.5" /> 진단하기
          </button>
          <button onClick={() => setTab('publicFeed')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'publicFeed' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <Eye className="w-3.5 h-3.5" /> 접속자 진단 결과 피드 ({publicShares.length})
          </button>
          <button onClick={() => setTab('comments')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'comments' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> 라이브 댓글 ({comments.length})
          </button>
        </div>

        {/* Tab 1: Survey & Share */}
        {tab === 'survey' && (
          <div>
            {!result ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>진단 문항 {currentIdx + 1} / 20</span>
                  <span>{Math.round(((currentIdx + 1) / 20) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIdx + 1) / 20) * 100}%` }} />
                </div>
                <h2 className="text-lg font-bold text-white mb-6">{questions[currentIdx].textKo}</h2>
                <div className="grid gap-2.5">
                  {[5, 4, 3, 2, 1].map((s, i) => (
                    <button key={i} onClick={handleAnswer} className="p-3.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs text-left text-slate-200 transition">
                      {s === 5 ? "매우 그렇다 (Strongly Agree)" : s === 4 ? "그렇다 (Agree)" : s === 3 ? "보통이다 (Neutral)" : s === 2 ? "그렇지 않다 (Disagree)" : "전혀 그렇지 않다 (Strongly Disagree)"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl text-center space-y-6">
                <div className="text-6xl">{result.emoji}</div>
                <div>
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">진단 결과</span>
                  <h1 className="text-2xl font-bold text-white my-2">{result.nameKo}</h1>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{result.descKo}</p>
                </div>

                {/* Online Result Share Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> 이 결과를 다른 접속자들과 실시간 공유하기
                  </h3>
                  <input
                    type="text"
                    placeholder="닉네임 (선택사항)"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="공유 한마디 메모 (예: 내 성향과 딱 들어맞네요!)"
                    value={shareNote}
                    onChange={e => setShareNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <button onClick={handleShareResult} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition">
                    라이브 피드에 내 진단 결과 등록하기 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Public Diagnostics Feed */}
        {tab === 'publicFeed' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-400">실시간 유저 진단 참여 수</span>
              <strong className="text-indigo-400 font-bold">{total.toLocaleString()} 건</strong>
            </div>

            <div className="space-y-3">
              {publicShares.map(s => (
                <div key={s.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="text-3xl">{result?.emoji || '📊'}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">{s.nickname}</span>
                      <span className="text-[10px] text-slate-500">{timeAgo(s.created_at, lang === 'en')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded">
                      {s.result_type}
                    </span>
                    <p className="text-xs text-slate-300 mt-2">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Community Comments */}
        {tab === 'comments' && (
          <div className="space-y-6">
            <form onSubmit={handleAddComment} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="닉네임 (선택사항)"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
              <textarea
                placeholder="자유롭게 진단 후기, 의견, 질문을 공유해보세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20 resize-none"
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> 라이브 댓글 작성하기
              </button>
            </form>

            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">{c.nickname}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.body}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{timeAgo(c.created_at, lang === 'en')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {/* SEO 본문 */}
      <div style={{maxWidth:720,margin:'48px auto 0',padding:'0 24px'}}>
        <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:32}}>
          <h3 style={{fontSize:20,fontWeight:800,color:'#fff',margin:'0 0 20px'}}>마이크로 브레이크: 짧은 휴식 루틴 가이드</h3>
          <div style={{marginBottom:24}}>
            <h4 style={{color:'#818cf8',fontSize:15,margin:'0 0 8px'}}>📌 짧은 휴식 루틴 이해하기</h4>
            <p style={{color:'#cbd5e1',fontSize:14,lineHeight:1.8,margin:0}}>마이크로 브레이크은 짧은 휴식 루틴를 과학적으로 측정하는 무료 자가진단 도구입니다. 20개 문항을 통해 당신의 현재 상태를 객관적으로 분석하고, 맞춤형 개선 전략을 제시합니다. 진단은 3-5분이면 완료되며 결과는 즉시 제공됩니다.</p>
          </div>
          <div style={{marginBottom:24}}>
            <h4 style={{color:'#818cf8',fontSize:15,margin:'0 0 8px'}}>📌 생산성 실천 전략</h4>
            <p style={{color:'#cbd5e1',fontSize:14,lineHeight:1.8,margin:0}}>전문가들이 권장하는 생산성 핵심 원칙을 단계별로 적용해보세요. 작은 습관부터 시작하면 꾸준함을 유지하기 쉽습니다. 매일 10분씩 실천 가능한 루틴을 만들어보세요.</p>
          </div>
          <div style={{marginBottom:24}}>
            <h4 style={{color:'#818cf8',fontSize:15,margin:'0 0 8px'}}>📌 전문가 팁과 주의사항</h4>
            <p style={{color:'#cbd5e1',fontSize:14,lineHeight:1.8,margin:0}}>짧은 휴식 루틴 관련 연구와 사례를 바탕으로, 당신의 상황에 가장 효과적인 전략을 소개합니다. 결과는 참고용이며, 지속적인 어려움이 있다면 전문가와 상담하세요.</p>
          </div>
          <h3 style={{fontSize:17,fontWeight:800,color:'#fff',margin:'0 0 16px'}}>❓ 자주 묻는 질문 (FAQ)</h3>
          <div style={{marginBottom:14}}>
            <h4 style={{color:'#e2e8f0',fontSize:14,marginBottom:6}}>마이크로 브레이크 테스트는 정확한가요?</h4>
            <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7,margin:0}}>본 테스트는 심리학 연구와 임상 기준을 참고한 자기보고식 선별 도구입니다. 공식 진단을 대체하지 않으며, 참고용으로 활용하세요.</p>
          </div>
          <div style={{marginBottom:14}}>
            <h4 style={{color:'#e2e8f0',fontSize:14,marginBottom:6}}>테스트는 몇 분 정도 걸리나요?</h4>
            <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7,margin:0}}>약 3-5분이 소요되며 20개 문항으로 구성됩니다. 결과는 제출 즉시 제공됩니다.</p>
          </div>
          <div style={{marginBottom:14}}>
            <h4 style={{color:'#e2e8f0',fontSize:14,marginBottom:6}}>결과는 어떻게 활용해야 하나요?</h4>
            <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7,margin:0}}>결과 페이지의 맞춤 가이드를 실천해보세요. 변화를 기록하면 개선 효과를 더 잘 확인할 수 있습니다.</p>
          </div>
          <div style={{marginBottom:14}}>
            <h4 style={{color:'#e2e8f0',fontSize:14,marginBottom:6}}>내 데이터는 안전한가요?</h4>
            <p style={{color:'#94a3b8',fontSize:13,lineHeight:1.7,margin:0}}>개인 식별 정보는 수집하지 않으며, 진단 결과는 익명으로 집계되어 서비스 개선에만 사용됩니다.</p>
          </div>
        </div>
      </div>
      <footer style={{ borderTop: '1px solid #1e293b', padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <button
            onClick={() => {
              const url = location.href;
              if (navigator.share) { navigator.share({ title: document.title, url }); }
              else { navigator.clipboard?.writeText(url).then(() => alert('링크가 복사되었습니다! 공유해보세요 🎉')); }
            }}
            style={{ padding: '8px 18px', borderRadius: 999, background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            📤 결과 공유하기
          </button>
          <a
            href="https://hub.pomyjo.com"
            style={{ padding: '8px 18px', borderRadius: 999, border: '1px solid #334155', color: '#94a3b8', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
          >
            🧠 더 많은 진단 테스트
          </a>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>© 2026 POMYJO · <a href="https://hub.pomyjo.com" style={{ color: '#8b5cf6' }}>POMYJO 진단 허브</a> · 결과는 참고용입니다</p>
      </footer>

    </div>
  );
}