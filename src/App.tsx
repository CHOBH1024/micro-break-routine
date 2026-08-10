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
  // User answers for diagnostic (0‑5 scale)
  const [answers, setAnswers] = useState<number[]>(Array(20).fill(0));
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

  const computeResult = (scores: number[]) => {
    const total = scores.reduce((a, b) => a + b, 0);
    // Simple tiered mapping (you can extend with more nuanced logic)
    if (total >= 80) {
      return {
        nameKo: "분석형 완벽주의자 (Analytical Perfectionist)",
        nameEn: "Analytical Perfectionist",
        emoji: "📊",
        descKo: "데이터와 정밀성을 추구하며 완벽한 결과를 위해 최선을 다하는 유형입니다.",
        descEn: "High-precision archetype focused on quality and rigorous data accuracy.",
        insightsKo: "당신은 높은 자기 기준과 세밀한 분석을 선호합니다. 이는 업무 정확도에 강점이지만, 과도한 완벽주의가 스트레스를 초래할 수 있습니다.",
        strategiesKo: [
          "짧은 마이크로 브레이크를 5분마다 설정해 과도한 집중을 완화하세요.",
          "‘80/20 법칙’을 적용해 가장 영향력 있는 작업에만 완벽을 추구하세요.",
          "운동이나 스트레칭을 통한 신체 리셋을 일상에 포함하세요.",
          "결과를 동료와 공유해 피드백을 받아 과도한 자기 판단을 완화하세요."
        ]
      };
    } else if (total >= 60) {
      return {
        nameKo: "균형형 생산성 탐구자 (Balanced Productivity Explorer)",
        nameEn: "Balanced Productivity Explorer",
        emoji: "⚖️",
        descKo: "효율과 휴식 사이의 균형을 추구하는 유형으로, 지속 가능한 업무 방식을 선호합니다.",
        descEn: "Seeks a sustainable balance between focus and recovery.",
        insightsKo: "당신은 업무와 휴식의 균형을 잘 맞추지만, 가끔 목표 설정이 모호해질 수 있습니다.",
        strategiesKo: [
          "포모도로 기법(25분 작업+5분 휴식)을 기본 루틴으로 도입하세요.",
          "매일 가장 중요한 3가지 목표를 설정하고, 완료 후 마이크로 브레이크를 보상으로 활용하세요.",
          "시각적 타이머와 부드러운 애니메이션으로 진행 상황을 가시화하세요.",
          "동료와 주간 공유 세션을 열어 서로의 진단을 비교하고 아이디어를 교환하세요."
        ]
      };
    } else {
      return {
        nameKo: "리프레시형 회복 탐색자 (Refresh-Focused Rest Seeker)",
        nameEn: "Refresh-Focused Rest Seeker",
        emoji: "💧",
        descKo: "짧은 휴식과 재충전에 큰 가치를 두는 타입이며, 과도한 작업으로 인한 피로를 쉽게 느낍니다.",
        descEn: "Values frequent micro-breaks and recovery, prone to fatigue from long work stretches.",
        insightsKo: "당신은 작업 중 피로를 빨리 느끼며, 짧은 휴식이 필요합니다. 이는 장기 생산성 향상에 핵심 요소입니다.",
        strategiesKo: [
          "2‑3분 마이크로 브레이크를 20분 작업마다 반드시 실행하세요.",
          "눈 깜빡이기와 목 스트레칭을 루틴에 포함해 신체 피로를 최소화하세요.",
          "‘하이킹’ 혹은 ‘짧은 산책’ 같은 가벼운 활동으로 혈액 순환을 촉진하세요.",
          "진단 결과를 SNS나 팀 채널에 공유해 서로 격려하는 문화를 만들세요."
        ]
      };
    }
  };

  const handleAnswer = (score: number) => {
    // record answer
    setAnswers(prev => {
      const next = [...prev];
      next[currentIdx] = score;
      return next;
    });
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const res = computeResult(answers);
      setResult(res);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg px-6 py-4 flex justify-between items-center max-w-4xl mx-auto w-full sticky top-0 z-50">
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
                    <button key={i} onClick={() => handleAnswer(s)} className="p-3.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs text-left text-slate-200 transition">
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
                  <div className="mt-4 text-sm text-slate-200">
                    <h3 className="font-semibold mb-2">🔎 인사이트</h3>
                    <p>{result.insightsKo}</p>
                  </div>
                  <div className="mt-4 text-sm text-slate-200">
                    <h3 className="font-semibold mb-2">💡 실천 전략</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.strategiesKo.map((st: string, idx: number) => (<li key={idx}>{st}</li>))}
                    </ul>
                  </div>
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
                    내 생산성 비법을 공유하고, 함께 성장하기 🚀
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
          <h3 style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:16}}>❓ 자주 묻는 질문 (FAQ)</h3>
          <section style={{marginBottom:16}}>
            <h4 style={{color:'#e2e8f0',fontSize:15,marginBottom:6}}>마이크로 브레이크 테스트는 얼마나 정확한가요?</h4>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.7}}>
              본 도구는 최신 심리학 연구와 임상 기준을 토대로 설계된 자기보고식 선별 검사이며, 공식 진단을 대체하지는 않습니다. 개인화된 인사이트와 실천 전략을 제공하는 보조 도구로 활용해주세요.
            </p>
          </section>
          <section style={{marginBottom:16}}>
            <h4 style={{color:'#e2e8f0',fontSize:15,marginBottom:6}}>테스트 소요 시간은 얼마나 되나요?</h4>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.7}}>
              20개의 문항을 답변하는 데 약 3~5분 정도 소요됩니다. 빠른 응답을 위해 라디오 버튼 대신 클릭형 스케일을 채택했습니다.
            </p>
          </section>
          <section style={{marginBottom:16}}>
            <h4 style={{color:'#e2e8f0',fontSize:15,marginBottom:6}}>결과를 어떻게 활용하면 좋을까요?</h4>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.7}}>
              결과 페이지에 제공되는 맞춤형 실천 전략을 즉시 적용하고, 1주일간 수행 로그를 기록해 변화를 관찰하세요. 필요 시 전략을 조정하거나 커뮤니티 피드에서 다른 사용자 경험을 참고할 수 있습니다.
            </p>
          </section>
          <section style={{marginBottom:16}}>
            <h4 style={{color:'#e2e8f0',fontSize:15,marginBottom:6}}>내 데이터는 안전한가요?</h4>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.7}}>
              개인 식별 정보는 수집하지 않으며, 모든 진단 결과는 익명으로 집계됩니다. 데이터는 서비스 개선과 연구 목적에만 사용되며, 외부에 공유되지 않습니다.
            </p>
          </section>
        </div>
      </div>inBottom:14}}>

      </div>
    </div>
  );
}