import React, { useState } from 'react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, CheckCircle, PlusCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [balance, setBalance] = useState(124.50);
  const [amount, setAmount] = useState('25');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 1, desc: 'OpenAI API Call (Idea Validation)', type: 'charge', amount: 0.12, time: '10 mins ago' },
    { id: 2, desc: 'Gemini CodeStudio Component Generation', type: 'charge', amount: 0.08, time: '2 hours ago' },
    { id: 3, desc: 'Weekly API Credit Top-Up Grant', type: 'load', amount: 15.00, time: 'May 30, 2026' },
    { id: 4, desc: 'Anti-Plagiarism Originality Check', type: 'charge', amount: 0.25, time: 'May 28, 2026' },
  ]);

  const handleTopUp = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid credit amount.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setBalance(prev => prev + numericAmount);
      setTransactions(prev => [
        {
          id: Date.now(),
          desc: 'API Credits Purchased (Interactive Sandbox Top-Up)',
          type: 'load',
          amount: numericAmount,
          time: 'Just now'
        },
        ...prev
      ]);
      setIsSubmitting(false);
      toast.success(`Successfully added $${numericAmount.toFixed(2)} to API wallet!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-gray-800">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Developer Wallet & API Ledger
        </h1>
        <p className="text-xs text-gray-500 mt-1">Manage API credits for server validations and sandbox prototyping environments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Card Display & Balance */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Mockup */}
          <div className="relative h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-lg overflow-hidden flex flex-col justify-between">
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] rounded-3xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-200 tracking-wider">InnoCheck Dev Pass</span>
                <h3 className="text-sm font-bold mt-0.5">Student Developer Edition</h3>
              </div>
              <CreditCard size={28} className="text-white/80" />
            </div>

            <div className="z-10">
              <span className="text-[10px] text-indigo-100 font-mono tracking-widest block">CARD HOLDER</span>
              <span className="text-xs font-bold font-mono tracking-wider">MEMBER ACADEMIC</span>
            </div>

            <div className="flex justify-between items-end z-10 border-t border-white/10 pt-3">
              <div>
                <span className="text-[9px] text-indigo-100 font-mono block">WALLET BALANCE</span>
                <span className="text-lg font-black font-mono">${balance.toFixed(2)}</span>
              </div>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">ACTIVE LEDGER</span>
            </div>
          </div>

          {/* Simple Stat indicators */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Wallet Health</span>
              <span className="text-xs font-bold text-emerald-600 mt-0.5">Sufficient Credits</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

        {/* Top-up Credits Form */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PlusCircle size={16} className="text-indigo-600" /> Reload API Credits
          </h3>

          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {['10', '25', '50'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      amount === val
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm'
                        : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-55'
                    }`}
                  >
                    ${val}.00
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Credit ($)</label>
              <input
                type="number"
                placeholder="20.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-extrabold text-xs tracking-wider rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> RELOADING LEDGER...
                </>
              ) : (
                <>
                  RELOAD CREDITS NOW
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Ledger History List */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Transaction Ledger Logs</h3>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {transactions.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-55/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  t.type === 'charge' ? 'bg-red-50/50 border-red-100 text-red-500' : 'bg-emerald-50/50 border-emerald-100 text-emerald-500'
                }`}>
                  {t.type === 'charge' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{t.desc}</h4>
                  <span className="text-[9px] text-gray-400">{t.time}</span>
                </div>
              </div>
              <span className={`font-mono font-bold ${
                t.type === 'charge' ? 'text-red-500' : 'text-emerald-600'
              }`}>
                {t.type === 'charge' ? '-' : '+'}${t.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
