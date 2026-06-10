import { useState, useEffect } from 'react';

// STUDENT TODO: This API_URL works for local development
// For Docker, you may need to configure nginx proxy or use container networking


const API_URL = 'https://backend-group-6.onrender.com';
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
            justifyContent: 'space-between'
          }}>
            <span>{todo.title}</span>
            <small>{todo.completed ? '✅' : '⏳'}</small>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
<h3>COMPLETED TASKS:</h3>
<ul>
  <li>Docker containerization</li>
  <li>Backend bug fixes</li>
  <li>Automated CI/CD pipeline</li>
  <li>PostgreSQL integration</li>
</ul>
      </div>
    </div>
  );
}

export default App;