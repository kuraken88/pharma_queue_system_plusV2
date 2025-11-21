
import React, { useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { QueueItem, Gender, AgeRange } from '../types';
import { 
  Megaphone, 
  BellRing, 
  BellOff, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Volume2, 
  VolumeX,
  Edit2,
  Save,
  ExternalLink,
  Monitor,
  EyeOff
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { 
    queue, 
    currentNumber, 
    blinkingNumberId,
    soundEnabled,
    addNumber, 
    callNumber, 
    startBlink, 
    stopBlink, 
    completeNumber, 
    deleteNumber,
    clearAll,
    toggleSound,
    updateComment
  } = useQueue();

  const [newNumber, setNewNumber] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange | null>(null);

  const genders: Gender[] = ['男性', '女性'];
  const ageRanges: AgeRange[] = ['００代','１０代','２０代','３０代','４０代','５０代','６０代','７０代','８０代','９０代'];

  // Google Sheets integration settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [settingsSaved, setSettingsSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pharmacy_google_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setWebhookUrl(parsed.webhookUrl || '');
        setSheetId(parsed.sheetId || '');
        setSheetName(parsed.sheetName || '');
        setSecretToken(parsed.token || '');
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveIntegrationSettings = () => {
    try {
      setSettingsSaved('saving');
      const payload = {
        webhookUrl,
        sheetId,
        sheetName,
        token: secretToken,
      };
      localStorage.setItem('pharmacy_google_settings', JSON.stringify(payload));
      setSettingsSaved('saved');
      setTimeout(() => setSettingsSaved('idle'), 1500);
    } catch {
      setSettingsSaved('error');
      setTimeout(() => setSettingsSaved('idle'), 2500);
    }
  };

  // Autosave settings (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      saveIntegrationSettings();
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookUrl, sheetId, sheetName, secretToken]);

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const formatDateTime = (ms: number) => {
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    return `${y}/${m}/${day} ${hh}:${mm}:${ss}`;
  };

  // Auto-increment suggestion helper
  const getNextNumber = () => {
    if (queue.length === 0 && !currentNumber) return '101';
    // Simple logic to find max number and add 1, assuming numeric
    const allNumbers = [...queue, currentNumber].filter(Boolean).map(q => parseInt(q?.number || '0'));
    const max = Math.max(...allNumbers, 0);
    return max > 0 ? (max + 1).toString() : '101';
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    if (!selectedGender || !selectedAgeRange) return;
    // Prepare payload before mutating local state
    const payloadNumber = newNumber.trim();
    const payloadComment = newComment.trim();
    const payloadGender = selectedGender;
    const payloadAgeRange = selectedAgeRange;
    const payloadTimestamp = formatDateTime(Date.now());

    addNumber(payloadNumber, payloadComment, payloadGender, payloadAgeRange);
    setNewNumber('');
    setNewComment('');
    setSelectedGender(null);
    setSelectedAgeRange(null);

    // Fire-and-forget webhook call (optional)
    if (webhookUrl && sheetId) {
      try {
        const body = {
          token: secretToken || undefined,
          sheetId,
          sheetName: sheetName || undefined,
          number: payloadNumber,
          timestamp: payloadTimestamp,
          gender: payloadGender,
          ageRange: payloadAgeRange,
          comment: payloadComment,
        };
        // Do not await; avoid blocking UI
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          mode: 'no-cors' // ensure request goes out even if CORS headers are missing
        }).catch(() => {});
      } catch {
        // ignore network errors
      }
    }
  };

  const handleAutoFill = () => {
    setNewNumber(getNextNumber());
  };

  const startEditing = (item: QueueItem) => {
    setEditingId(item.id);
    setEditValue(item.comment);
  };

  const saveEditing = (id: string) => {
    updateComment(id, editValue);
    setEditingId(null);
  };

  const openDisplayWindow = () => {
    // Open in a popup window suitable for moving to a second monitor
    window.open(
      '#/display', 
      'QueueDisplay', 
      'width=800,height=600,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">薬局呼び出し管理画面</h1>
            <p className="text-sm text-gray-500 mt-1">現在の呼び出し状況と待ち行列の管理</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
             <button 
              onClick={toggleSound}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                soundEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span>呼び出し音 {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button 
              onClick={openDisplayWindow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <ExternalLink size={18} />
              <span>表示画面を開く</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Add Number & Current Status */}
          <div className="space-y-6">
            
            {/* Active Call Card (Confidence Monitor) */}
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm ring-1 ring-blue-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    モニター表示プレビュー
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <EyeOff size={12} />
                    患者メモはモニターには表示されません
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">On Air</span>
              </div>
              
              {/* Mini Display Screen Preview */}
              <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 mb-6 flex flex-col items-center justify-center min-h-[180px] relative overflow-hidden">
                {currentNumber ? (
                  <>
                    <div className={`text-7xl font-black tracking-tighter leading-none transition-all duration-300 ${blinkingNumberId === currentNumber.id ? 'text-red-600 animate-pulse scale-105' : 'text-gray-900'}`}>
                      {currentNumber.number}
                    </div>
                    <div className="mt-2 text-gray-500 font-bold">
                      ただいまの番号
                    </div>
                  </>
                ) : (
                  <div className="text-gray-300 font-bold text-xl">Waiting...</div>
                )}
              </div>

              {/* Controls for Current Number */}
              {currentNumber ? (
                <div className="space-y-3">
                   {currentNumber.comment && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center mb-4 relative">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                        管理者のみ表示
                      </div>
                      <span className="text-lg text-gray-800 font-medium">{currentNumber.comment}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => blinkingNumberId === currentNumber.id ? stopBlink() : startBlink(currentNumber.id)}
                      className={`py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                        blinkingNumberId === currentNumber.id 
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {blinkingNumberId === currentNumber.id ? <BellOff size={18} /> : <BellRing size={18} />}
                      {blinkingNumberId === currentNumber.id ? '点滅停止' : '点滅開始'}
                    </button>
                    <button 
                      onClick={() => completeNumber(currentNumber.id)}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-sm border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                    >
                      <CheckCircle size={18} />
                      完了
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-gray-400">
                  呼び出し中の番号はありません
                </div>
              )}
            </div>

            {/* Add Number Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
                <Plus className="w-5 h-5" /> 番号追加
              </h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">番号</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                      placeholder="例: 105"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                    />
                    <button 
                      type="button"
                      onClick={handleAutoFill}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      次の番号
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">性別選択（必須）</label>
                  <div className="grid grid-cols-2 gap-2">
                    {genders.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGender(g)}
                        className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                          selectedGender === g
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">年代選択（必須）</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ageRanges.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setSelectedAgeRange(a)}
                        className={`px-3 py-2 rounded-lg font-medium border text-sm transition-colors ${
                          selectedAgeRange === a
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">コメント（患者メモ）</label>
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="例: 佐藤さん、眼科、赤い服"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newNumber || !selectedGender || !selectedAgeRange}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                  <Plus size={18} />
                  追加する
                </button>
              </form>
            </div>

            {/* Integration Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-700">連携設定（Google スプレッドシート）</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Webhook URL（Apps Script）</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/xxx/exec"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Spreadsheet ID</label>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="1mWXZXVS432ok_LwnwS7hit-gy7vV6L8osHi5w1BuMDU"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">シート名（任意）</label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="シート1 など"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">トークン（任意・セキュリティ用）</label>
                  <input
                    type="text"
                    value={secretToken}
                    onChange={(e) => setSecretToken(e.target.value)}
                    placeholder="共有シークレット"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveIntegrationSettings}
                    className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    設定を保存
                  </button>
                </div>
                {settingsSaved === 'saved' && (
                  <div className="text-green-600 text-sm">保存しました</div>
                )}
                {settingsSaved === 'error' && (
                  <div className="text-red-600 text-sm">保存に失敗しました。ブラウザ設定をご確認ください。</div>
                )}
                <p className="text-xs text-gray-400">
                  追加時に A:番号 / B:日時 / C:性別 / D:年代 / E:コメント の順で追記します。
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Queue List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                待ち行列一覧 
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{queue.length}</span>
              </h2>
              {queue.length > 0 && (
                <button 
                  onClick={() => {
                    if(window.confirm('本当にすべての番号を削除しますか？')) clearAll();
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  すべてクリア
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto max-h-[75vh]">
              {queue.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center text-gray-400">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <CheckCircle size={32} className="text-gray-300" />
                  </div>
                  <p>待ち番号はありません</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-semibold">番号</th>
                      <th className="px-6 py-3 font-semibold">コメント</th>
                      <th className="px-6 py-3 font-semibold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-2xl font-bold text-gray-800 tabular-nums">{item.number}</span>
                        </td>
                        <td className="px-6 py-4">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                              <input 
                                type="text" 
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="border border-blue-300 ring-2 ring-blue-100 rounded px-3 py-1.5 text-sm w-full focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(item.id)}
                              />
                              <button onClick={() => saveEditing(item.id)} className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors">
                                <Save size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">
                                {`${formatDateTime(item.timestamp)} ${item.gender ?? '---'} - ${item.ageRange ?? '---'} - ${item.comment || 'なし'}`}
                              </span>
                              <button 
                                onClick={() => startEditing(item)} 
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition-all"
                                title="コメントを編集"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => callNumber(item.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                            >
                              <Megaphone size={16} />
                              呼び出し
                            </button>
                            <button 
                              onClick={() => deleteNumber(item.id)}
                              className="bg-white border border-gray-300 text-gray-400 hover:text-red-600 hover:border-red-200 px-3 py-2 rounded-lg transition-colors hover:bg-red-50"
                              title="削除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
