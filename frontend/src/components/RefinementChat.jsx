import React from 'react';

const RefinementChat = ({ history = [], instruction, setInstruction, onSend, isSending }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-[420px] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white">💬 Refinement Chat</p>
          <p className="text-xs text-gray-400">Talk to the assistant and refine code iteratively.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {history.length === 0 ? (
          <div className="text-sm text-gray-400">Start with an instruction like "Add dark mode" or "Make buttons rounded."</div>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl p-3 ${item.role === 'assistant' ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-gray-950 border border-gray-800 text-gray-200'}`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-blue-400 mb-1">{item.role}</p>
              <p className="text-sm leading-6">{item.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-3">
        <textarea
          className="w-full h-24 rounded-2xl bg-gray-950 border border-gray-800 p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Type your refinement request..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <button
          className="w-full mt-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={onSend}
          disabled={isSending || !instruction.trim()}
        >
          {isSending ? 'Sending…' : 'Send Refinement'}
        </button>
      </div>
    </div>
  );
};

export default RefinementChat;
