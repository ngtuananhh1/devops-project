import { useState, useEffect } from 'react';

// Pick API URL at runtime: use localhost when developing locally,
// otherwise default to the deployed backend. You can also set
// `REACT_APP_API_URL` at build time if needed.
const API_URL = (() => {
  try {
    const envUrl = process.env.REACT_APP_API_URL;
    if (envUrl) return envUrl;
  } catch (e) {}

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8080';
  return 'https://backend-group-6.onrender.com';
})();
function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/todos`);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo })
      });
      setNewTodo('');
      fetchTodos();
    } catch (err) {
      alert('Failed to add todo');
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');

      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete todo');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🚀 DevOps Todo App</h1>
      <p>Demo: Watch UI update LIVE after CI/CD! ✨</p>

      <div style={{ marginBottom: '20px' }}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo..."
          style={{ padding: '10px', width: '70%', marginRight: '10px' }}
        />
        <button onClick={addTodo} style={{ padding: '10px 20px' }}>
          Add Todo
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {/* Đã thêm kiểm tra mảng an toàn ở đây */}
        {Array.isArray(todos) && todos.map(todo => (
          <li key={todo.id} style={{
            padding: '10px',
            border: '1px solid #ddd',
            marginBottom: '5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>{todo.title}</span>
              <small style={{ color: '#666' }}>{todo.completed ? '✅' : '⏳'}</small>
            </div>
            <div>
              <button onClick={() => deleteTodo(todo.id)} style={{ padding: '6px 10px', marginLeft: '10px' }}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p><strong>STUDENT TODO:</strong></p>

      </div>
    </div>
  );
}

export default App;