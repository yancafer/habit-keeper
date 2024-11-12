// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabaseClient';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    } else if (user) {
      fetchTodos(user.id);
    }
  }, [user, loading, router]);

  const fetchTodos = async (userId: string) => {
    const { data: todosData } = await supabase
      .from('Todos')
      .select('*')
      .eq('user_id', userId);

    setTodos(todosData || []);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>
      {todos.map((todo) => (
        <div key={todo.id}>
          <h2>{todo.title}</h2>
          <p>{todo.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
