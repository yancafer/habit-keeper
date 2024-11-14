'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabaseClient';

interface TaskGroup {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const router = useRouter();

  const [taskInputs, setTaskInputs] = useState<{ [groupId: string]: { title: string; status: 'pending' | 'in_progress' | 'completed' | '' } }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    } else if (user) {
      fetchTaskGroups(user.id);
    }
  }, [user, loading, router]);

  const fetchTaskGroups = async (userId: string) => {
    const { data: groupsData, error: groupsError } = await supabase
      .from('taskgroups')
      .select('id, title, description')
      .eq('user_id', userId);

    if (groupsError) {
      console.error('Erro ao buscar grupos de tarefas:', groupsError.message);
      alert('Erro ao buscar grupos de tarefas.');
      return;
    }

    const taskGroupsWithTasks = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status')
          .eq('group_id', group.id);

        if (tasksError) {
          console.error(`Erro ao buscar tarefas para o grupo ${group.id}:`, tasksError.message);
          alert(`Erro ao buscar tarefas para o grupo ${group.id}.`);
          return { ...group, tasks: [] };
        }

        return { ...group, tasks: tasksData || [] };
      })
    );

    setTaskGroups(taskGroupsWithTasks);
  };

  const createTaskGroup = async () => {
    if (!groupTitle.trim()) {
      alert('O título do grupo é obrigatório');
      return;
    }

    if (!user) {
      console.error('Usuário não autenticado');
      return;
    }

    setIsCreatingGroup(true);

    const { data, error } = await supabase
      .from('taskgroups')
      .insert([
        {
          user_id: user.id,
          title: groupTitle.trim(),
          description: groupDescription.trim(),
        },
      ])
      .select('id, title, description');

    setIsCreatingGroup(false);

    if (error) {
      console.error('Erro ao criar grupo de tarefas:', error.message);
      alert('Erro ao criar grupo de tarefas.');
      return;
    }

    if (data && data[0]) {
      setTaskGroups((prevGroups) => [...prevGroups, { ...data[0], tasks: [] }]);
    }

    setGroupTitle('');
    setGroupDescription('');
  };

  const createTask = async (groupId: string) => {
    const taskInput = taskInputs[groupId];
    if (!taskInput?.title.trim()) {
      alert('O título da tarefa é obrigatório');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          group_id: groupId,
          title: taskInput.title.trim(),
          status: taskInput.status,
        },
      ])
      .select('id, title, status');

    if (error) {
      console.error('Erro ao criar tarefa:', error.message);
      alert('Erro ao criar tarefa.');
      return;
    }

    if (data && data[0]) {
      setTaskGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, tasks: [...group.tasks, data[0]] } : group
        )
      );

      setTaskInputs((prevInputs) => ({
        ...prevInputs,
        [groupId]: { title: '', status: 'pending' },
      }));
    }
  };

  const updateTask = async (groupId: string, taskId: string, updatedTitle: string, updatedStatus: 'pending' | 'in_progress' | 'completed') => {
    const { error } = await supabase
      .from('tasks')
      .update({ title: updatedTitle, status: updatedStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao atualizar tarefa:', error.message);
      alert('Erro ao atualizar tarefa.');
      return;
    }

    setTaskGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId ? { ...task, title: updatedTitle, status: updatedStatus } : task
              ),
            }
          : group
      )
    );
  };

  const deleteTask = async (groupId: string, taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao deletar tarefa:', error.message);
      alert('Erro ao deletar tarefa.');
      return;
    }

    setTaskGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? { ...group, tasks: group.tasks.filter((task) => task.id !== taskId) }
          : group
      )
    );
  };

  const handleTaskInputChange = (groupId: string, field: 'title' | 'status', value: string) => {
    setTaskInputs((prevInputs) => ({
      ...prevInputs,
      [groupId]: {
        ...prevInputs[groupId],
        [field]: value,
      },
    }));
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <div>
        <h2>Adicionar Grupo de Tarefas</h2>
        <input
          type="text"
          placeholder="Título do Grupo"
          value={groupTitle}
          onChange={(e) => setGroupTitle(e.target.value)}
        />
        <textarea
          placeholder="Descrição do Grupo"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
        />
        <button onClick={createTaskGroup} disabled={isCreatingGroup}>
          {isCreatingGroup ? 'Adicionando...' : 'Adicionar Grupo'}
        </button>
      </div>

      {taskGroups.map((group) => (
        <div key={group.id} style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h2>{group.title}</h2>
          <p>{group.description}</p>

          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Título da Tarefa"
              value={taskInputs[group.id]?.title || ''}
              onChange={(e) => handleTaskInputChange(group.id, 'title', e.target.value)}
            />
            <select
              value={taskInputs[group.id]?.status || 'pending'}
              onChange={(e) => handleTaskInputChange(group.id, 'status', e.target.value as 'pending' | 'in_progress' | 'completed')}
            >
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Concluído</option>
            </select>
            <button onClick={() => createTask(group.id)}>
              Adicionar Tarefa
            </button>
          </div>

          <div style={{ marginTop: '10px' }}>
            {group.tasks.map((task) => (
              <div key={task.id} style={{ padding: '5px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask(group.id, task.id, e.target.value, task.status)}
                />
                <select
                  value={task.status || 'pending'}
                  onChange={(e) => updateTask(group.id, task.id, task.title, e.target.value as 'pending' | 'in_progress' | 'completed')}
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Progresso</option>
                  <option value="completed">Concluído</option>
                </select>
                <button onClick={() => deleteTask(group.id, task.id)}>Deletar Tarefa</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
