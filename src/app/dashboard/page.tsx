"use client";
import './styles.css';
import Image from 'next/image';
import logouser from '../../../public/user.png';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
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

function Dashboard() {
  const { logout, user } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [taskInputs, setTaskInputs] = useState<{ [groupId: string]: { title: string; status: 'pending' | 'in_progress' | 'completed' | '' } }>({});
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar o nome do usuário:', error.message);
        } else {
          setFullName(data?.full_name || 'Usuário');
        }
      }
    };

    fetchUserName();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTaskGroups(user.id);
    } else {
      router.push('/signin');
    }
  }, [user, router]);

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

  const startEditingGroup = (group: TaskGroup) => {
    setEditingGroupId(group.id);
    setEditingTitle(group.title);
    setEditingDescription(group.description || '');
  };

  const updateTaskGroup = async () => {
    if (!editingGroupId) return;

    const { error } = await supabase
      .from('taskgroups')
      .update({ title: editingTitle.trim(), description: editingDescription.trim() })
      .eq('id', editingGroupId);

    if (error) {
      console.error('Erro ao atualizar grupo de tarefas:', error.message);
      alert('Erro ao atualizar grupo de tarefas.');
      return;
    }

    setTaskGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === editingGroupId ? { ...group, title: editingTitle, description: editingDescription } : group
      )
    );
    setEditingGroupId(null);
    setEditingTitle('');
    setEditingDescription('');
  };

  const deleteTaskGroup = async (groupId: string) => {
    const { error } = await supabase.from('taskgroups').delete().eq('id', groupId);

    if (error) {
      console.error('Erro ao deletar grupo de tarefas:', error.message);
      alert('Erro ao deletar grupo de tarefas.');
      return;
    }

    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId));
  };

  const createTask = async (groupId: string) => {
    const taskInput = taskInputs[groupId];
    if (!taskInput?.title.trim()) {
      alert('O título da tarefa é obrigatório');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ group_id: groupId, title: taskInput.title.trim(), status: taskInput.status }])
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

  return (
    <div className='container-dash'>
      <div className='box-container-1'>
        <div className='profile-menu'>
          <Image
            src={logouser}
            alt="Usuário"
            className="profile-image"
            width={80}
            height={80}
          />
          <h2 className="profile-name">{fullName}</h2>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className='container-taks'>
        <div className='box-container-2'>

          <h2 className='container-2-title-h2'>Adicionar grupo de tarefas</h2>
          <input
            type="text"
            placeholder="Título do Grupo"
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            className='input-group-title'
          />
          <textarea
            placeholder="Descrição do Grupo"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className='input-group-description'
          />
          <button onClick={createTaskGroup} disabled={isCreatingGroup} className='button-tasks-group'>
            {isCreatingGroup ? 'Adicionando...' : 'Adicionar Grupo'}
          </button>

        </div>


        <div className='box-container-3'>
          {taskGroups.map((group) => (
            <div key={group.id} className='container-3-tasks-groups'>
              {editingGroupId === group.id ? (
                <>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                  />
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                  />
                  <button onClick={updateTaskGroup}>Salvar</button>
                  <button onClick={() => setEditingGroupId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                  <button onClick={() => startEditingGroup(group)}>Editar Grupo</button>
                  <button onClick={() => deleteTaskGroup(group.id)}>Deletar Grupo</button>
                </>
              )}

              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Título da Tarefa"
                  value={taskInputs[group.id]?.title || ''}
                  onChange={(e) => handleTaskInputChange(group.id, 'title', e.target.value)}
                />
                <select
                  value={taskInputs[group.id]?.status || 'pending'}
                  onChange={(e) =>
                    handleTaskInputChange(group.id, 'status', e.target.value as 'pending' | 'in_progress' | 'completed')
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Progresso</option>
                  <option value="completed">Concluído</option>
                </select>
                <button onClick={() => createTask(group.id)}>Adicionar Tarefa</button>
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
      </div>
    </div>
  );
}

export default Dashboard;
