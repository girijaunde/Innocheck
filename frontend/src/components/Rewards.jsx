import React, { useState } from 'react';
import { Trophy, Gift, Award, Flame, CheckCircle, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Rewards() {
  const [points, setPoints] = useState(2450);
  const [claimedRewards, setClaimedRewards] = useState({});

  const badges = [
    { id: 1, name: 'First Validation', desc: 'Validated first project idea.', icon: Zap, color: 'text-amber-500 bg-amber-50' },
    { id: 2, name: 'Code Builder', desc: 'Generated components in CodeStudio.', icon: Flame, color: 'text-red-500 bg-red-50' },
    { id: 3, name: 'Original Scholar', desc: 'Scored >90% on plagiarism check.', icon: Award, color: 'text-indigo-500 bg-indigo-50' },
    { id: 4, name: 'Consistency', desc: 'Maintained 5-day active streak.', icon: Star, color: 'text-purple-500 bg-purple-50' },
  ];

  const rewardList = [
    {
      id: 'api_tokens',
      title: '10,000 API Tokens',
      desc: 'Free credit token grant for dynamic Gemini/OpenAI API generation.',
      cost: 500,
      code: 'GEMINI-FREE-CREDITS-2026'
    },
    {
      id: 'vercel_voucher',
      title: 'Vercel Pro hosting Voucher',
      desc: '1 Month free Vercel Pro code to deploy compiled CodeStudio prototypes.',
      cost: 1200,
      code: 'VERCEL-INNOCHECK-PRO-XP9'
    },
    {
      id: 'copilot_sub',
      title: 'GitHub Copilot 1-Month Pass',
      desc: 'Unlock Copilot student license helper subscription voucher.',
      cost: 2000,
      code: 'COPILOT-STUDENT-PASS-M12'
    }
  ];

  const handleClaim = (reward) => {
    if (points < reward.cost) {
      toast.error('Insufficient reward points! Complete more tasks to earn points.');
      return;
    }
    setPoints(prev => prev - reward.cost);
    setClaimedRewards(prev => ({ ...prev, [reward.id]: reward.code }));
    toast.success(`Successfully claimed ${reward.title}!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Student Innovator Rewards
          </h1>
          <p className="text-xs text-gray-500 mt-1">Earn validation points, unlock badges, and redeem premium vouchers for your dev stack.</p>
        </div>

        {/* Dynamic points balance indicator */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-2xl shadow-sm">
          <Trophy size={18} className="animate-bounce" />
          <span className="text-sm font-black tracking-wider">{points} XP / Points</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Streak and Tier Panel */}
        <div className="lg:col-span-1 bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Current Standing</h3>
            
            {/* User Level Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl"></div>
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">Standing Tier</span>
              <h4 className="text-lg font-black mt-1">Gold Scholar Rank</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Level 4 Innovator. You are in the top 5% of student hackathon validators.</p>
            </div>

            {/* Streak Tracker */}
            <div className="border border-gray-150 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                <Flame size={24} className="animate-pulse" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-gray-900">5-Day Active Streak</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">Keep validating ideas daily to trigger the XP multipliers!</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Earned Badges</h4>
            <div className="grid grid-cols-4 gap-2">
              {badges.map(b => {
                const Icon = b.icon;
                return (
                  <div key={b.id} className="group relative flex flex-col items-center">
                    <div className={`p-2.5 rounded-xl border border-gray-100 hover:scale-105 transition-transform cursor-pointer ${b.color}`}>
                      <Icon size={20} />
                    </div>
                    {/* Tiny badge tooltip */}
                    <span className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all bg-gray-900 text-white text-[8px] p-1.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {b.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Claimable Vouchers list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900">Available Reward Redemptions</h3>
          <div className="space-y-3.5">
            {rewardList.map((reward) => {
              const code = claimedRewards[reward.id];
              return (
                <div key={reward.id} className="p-4 bg-gray-50/50 border border-gray-150 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-indigo-600" />
                      <h4 className="font-bold text-xs text-gray-900">{reward.title}</h4>
                      <span className="text-[9px] bg-amber-50 border border-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                        {reward.cost} XP
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 max-w-md leading-relaxed">{reward.desc}</p>
                  </div>

                  <div className="shrink-0 font-mono">
                    {code ? (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <CheckCircle size={12} /> CODE: {code}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(reward)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          points >= reward.cost
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        Claim Reward
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
