import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Role } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Check, 
  Edit2, 
  Lock, 
  CheckCircle2, 
  Store,
  Sparkles,
  Phone,
  UserCheck
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, currentUser, setCurrentUser, addUser, updateUser } = useApp();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<Role>('Staff');
  const [phone, setPhone] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addUser({
      name: name.trim(),
      role,
      title: title || (role === 'Owner' ? '負責人' : role === 'Manager' ? '店主管' : '美髮師'),
      avatar: name.trim().charAt(0).toUpperCase(),
      status: 'Active',
      phone
    });

    setName('');
    setTitle('');
    setPhone('');
    setIsAddUserOpen(false);
  };

  const roleDescriptions: Record<Role, { desc: string; responsibilities: string[] }> = {
    Owner: {
      desc: '職責情境：統籌採購、人員分工與營運資料檢視。',
      responsibilities: ['採購規劃', '採購核准情境', '人員分工', '營運資料檢視']
    },
    Manager: {
      desc: '副店長 / 庫存主管：管理庫存異動、聯繫供應商、建立採購單草稿、查看數據分析。',
      responsibilities: ['庫存與帳本管理', '供應商資料維護', '建立採購單草稿', '查看營運分析']
    },
    Staff: {
      desc: '現場美髮設計師 / 理療助理：查詢即時庫存、現場做客人快速領料登記、員工自用紀錄。',
      responsibilities: ['目前庫存查閱', '現場領料與服務耗用登記', '員工樣品自用登記', '基本帳本明細']
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="type-page-title text-slate-900 tracking-tight">人員與角色情境示範（{users.length} 位）</h1>
          <p className="type-detail text-slate-500 mt-1">
            角色切換供操作情境展示，目前未提供登入驗證與權限隔離。
          </p>
          <p className="type-detail text-slate-500 mt-1">切換會改變操作人顯示及後續紀錄的經手人；新增人員只建立目前的示範檔案，不會建立登入帳號。</p>
        </div>
        <button
          onClick={() => setIsAddUserOpen(true)}
          className="type-label px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <UserPlus size={16} />
          <span>新增門市人員</span>
        </button>
      </div>

      {/* 2. Active User Switcher Box for Prototype Evaluation */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 type-detail">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">
            {currentUser.avatar}
          </div>
          <div>
            <div className="font-bold text-emerald-950 flex items-center gap-2">
              <span>目前操作視角：{currentUser.name}</span>
              <span className="type-detail bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                {currentUser.role}
              </span>
            </div>
            <div className="text-slate-600 type-detail">
              職稱：{currentUser.title} · {roleDescriptions[currentUser.role]?.desc}
            </div>
          </div>
        </div>

        <div className="type-detail text-slate-500 font-mono">
          點選下方卡片「切換至此視角」可體驗不同人員之日常操作
        </div>
      </div>

      {/* 3. User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map(u => {
          const isCurrent = currentUser.id === u.id;
          return (
            <div
              key={u.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isCurrent ? 'border-emerald-700 ring-2 ring-emerald-700/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center type-detail border border-slate-200">
                    {u.avatar}
                  </div>
                  <span className={`type-number  font-mono px-2 py-0.5 rounded ${
 u.role === 'Owner' ? 'bg-purple-50 text-purple-700' :
 u.role === 'Manager' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
 }`}>
                    {u.role}
                  </span>
                </div>

                <h3 className="type-item-title text-slate-900 mb-0.5">{u.name}</h3>
                <p className="type-detail text-slate-500 mb-3">{u.title}</p>

                {u.phone && (
                  <div className="flex items-center gap-1.5 type-detail text-slate-600 mb-4 font-mono">
                    <Phone size={13} className="text-slate-400" />
                    <span>{u.phone}</span>
                  </div>
                )}

                {/* Permissions summary */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 type-detail text-slate-600 space-y-1 mb-4">
                  <div className="font-semibold text-slate-700 type-detail uppercase tracking-wider mb-1">
                    角色職責示意（非權限限制）：
                  </div>
                  {roleDescriptions[u.role]?.responsibilities.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="text-emerald-600">✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between type-detail">
                {isCurrent ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <UserCheck size={14} />
                    <span>當前使用中</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentUser(u)}
                    className="type-label w-full py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    切換至此視角
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="modal-overlay fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="modal-panel bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="type-section-title text-slate-900 mb-1">新增門市人員檔案</h2>
            <p className="type-detail text-slate-500 mb-4">建立目前示範資料中的人員檔案，供選擇經手人；不是登入帳號，也不授予權限。</p>

            <form onSubmit={handleAddSubmit} className="type-detail space-y-4">
              <div>
                <label className="type-label block text-slate-700 mb-1">姓名 (暱稱)</label>
                <input
                  type="text"
                  required
                  placeholder="例：安娜 (Anna)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label block text-slate-700 mb-1">示範角色</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  >
                    <option value="Staff">Staff (現場設計師/技師)</option>
                    <option value="Manager">Manager (店主管/經理)</option>
                    <option value="Owner">Owner (店長/負責人)</option>
                  </select>
                </div>
                <div>
                  <label className="type-label block text-slate-700 mb-1">職稱</label>
                  <input
                    type="text"
                    placeholder="例：資深美髮師"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="type-label block text-slate-700 mb-1">聯絡手機</label>
                <input
                  type="text"
                  placeholder="例：0988-123-456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="type-label px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="type-label px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  建立人員
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
