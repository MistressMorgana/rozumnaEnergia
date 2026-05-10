
import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8085/api';

export default function DevicesTab() {
  const [devices, setDevices] = useState([]);
  const [coefs, setCoefs] = useState([]);
  
  // Стан форми
  const [form, setForm] = useState({ name: '', model: '', p_nom: '', p_max: '', coef_id: '' });
  // Якщо null — ми створюємо новий прилад. Якщо число — ми редагуємо існуючий
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = () => {
    fetch(`${API_URL}/equipment`).then(r => r.json()).then(setDevices);
    fetch(`${API_URL}/coefficients`).then(r => r.json()).then(data => { 
      setCoefs(data); 
      // Встановлюємо дефолтний тип, якщо форма порожня
      if (data.length > 0) setForm(f => ({ ...f, coef_id: f.coef_id || data[0].id })); 
    });
  };

  useEffect(() => { fetchData(); }, []);

  // --- ВАЛІДАЦІЯ (Перевірка на дурня) ---
  const validateForm = () => {
    if (!form.name.trim()) return "❌ Помилка: Назва приладу не може бути порожньою!";
    if (Number(form.p_nom) <= 0) return "❌ Помилка: Номінальна потужність має бути більшою за нуль!";
    if (Number(form.p_max) <= 0) return "❌ Помилка: Максимальна потужність має бути більшою за нуль!";
    if (Number(form.p_max) < Number(form.p_nom)) return "❌ Помилка: Максимальна потужність не може бути меншою за номінальну!";
    return null; // Усе добре
  };

  const handleSave = async () => {
    const errorMessage = validateForm();
    if (errorMessage) return alert(errorMessage);

    const payload = { ...form, p_nom: Number(form.p_nom), p_max: Number(form.p_max), coef_id: Number(form.coef_id) };

    if (editingId) {
      // ОНОВЛЕННЯ (PUT)
      await fetch(`${API_URL}/equipment/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // СТВОРЕННЯ (POST)
      await fetch(`${API_URL}/equipment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    fetchData(); 
    handleCancel(); // Очищаємо форму після збереження
  };

  const handleEdit = (dev: any) => {
    setEditingId(dev.id);
    // Шукаємо ID коефіцієнта за його назвою, щоб правильно вибрати його в <select>
    const matchedCoef = coefs.find((c: any) => c.name === dev.type);
    
    setForm({
      name: dev.name,
      model: dev.model || '',
      p_nom: dev.p_nom.toString(),
      p_max: dev.p_max.toString(),
      coef_id: matchedCoef ? matchedCoef.id : coefs[0]?.id
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', model: '', p_nom: '', p_max: '', coef_id: coefs[0]?.id || '' });
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Ви впевнені, що хочете назавжди видалити "${name}"?`)) {
      await fetch(`${API_URL}/equipment/${id}`, { method: 'DELETE' });
      // Якщо ми видаляємо прилад, який зараз редагуємо — скидаємо форму
      if (editingId === id) handleCancel();
      fetchData();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ЛІВА ПАНЕЛЬ: ФОРМА */}
      <div className={`bg-white p-6 rounded-lg shadow border-t-4 ${editingId ? 'border-orange-500' : 'border-green-500'} h-fit`}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {editingId ? "✏️ Редагування приладу" : "➕ Додати новий прилад"}
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Назва приладу <span className="text-red-500">*</span></label>
            <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none" placeholder="напр. ПК, Бойлер" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Модель (опціонально)</label>
            <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none" placeholder="напр. Dell Optiplex" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Потужність номінальна (Вт) <span className="text-red-500">*</span></label>
              <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none" type="number" min="1" placeholder="300" value={form.p_nom} onChange={e => setForm({ ...form, p_nom: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Потужність максимальна (Вт) <span className="text-red-500">*</span></label>
              <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none" type="number" min="1" placeholder="450" value={form.p_max} onChange={e => setForm({ ...form, p_max: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Тип навантаження (Матем. модель)</label>
            <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none" value={form.coef_id} onChange={e => setForm({ ...form, coef_id: e.target.value })}>
              {coefs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button onClick={handleSave} className={`w-full text-white font-bold py-2 rounded shadow ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
            {editingId ? "Зберегти зміни" : "Додати в базу"}
          </button>
          
          {editingId && (
            <button onClick={handleCancel} className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400">
              Скасувати
            </button>
          )}
        </div>
      </div>

      {/* ПРАВА ПАНЕЛЬ: ТАБЛИЦЯ */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Список приладів у базі</h2>
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm border-b-2 border-gray-300">
              <th className="p-3">Назва та Модель</th>
              <th className="p-3 text-center">Потужність ном. (Вт)</th>
              <th className="p-3 text-center">Потужність макс. (Вт)</th>
              <th className="p-3">Тип</th>
              <th className="p-3 text-center">Дії</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d: any) => (
              <tr key={d.id} className={`border-b transition duration-150 ${editingId === d.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                <td className="p-3">
                  <span className="font-bold text-gray-800">{d.name}</span>
                  {d.model && d.model !== "None" && <span className="block text-xs text-gray-500">{d.model}</span>}
                </td>
                <td className="p-3 text-center font-mono text-blue-600">{d.p_nom}</td>
                <td className="p-3 text-center font-mono text-red-500">{d.p_max}</td>
                <td className="p-3 text-sm text-gray-600">{d.type}</td>
                <td className="p-3 text-center space-x-3">
                  <button onClick={() => handleEdit(d)} className="text-blue-500 font-bold hover:text-blue-700">Ред.</button>
                  <button onClick={() => handleDelete(d.id, d.name)} className="text-red-500 font-bold hover:text-red-700">Вид.</button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">База даних порожня. Додайте перший прилад!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}