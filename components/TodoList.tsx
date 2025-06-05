/** @format */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DayTasksSkeleton from './DayTasksSkeleton';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Todo {
  id: string;
  task_id: number;
  task: string;
  status: boolean;
  created_at: string;
  due_date: string | null;
}

interface TodoListProps {
  userId: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupByDate(todos: Todo[]) {
  return todos.reduce((acc, todo) => {
    const dateKey = todo.due_date || formatDate(todo.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);
}

export default function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  async function fetchTodos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setTodos(data);
    setLoading(false);
    setInitialLoad(false);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setLoading(true);
    await supabase.from('todos').insert([
      {
        user_id: userId,
        task: newTask,
        status: false,
        due_date: new Date().toISOString().slice(0, 10),
      },
    ]);
    setNewTask('');
    await fetchTodos();
    setLoading(false);
  }

  async function toggleStatus(todo: Todo) {
    toast.promise(
      (async () => {
        await supabase
          .from('todos')
          .update({ status: !todo.status })
          .eq('id', todo.id);
        await fetchTodos();
      })(),
      {
        loading: 'Updating...',
        success: 'Task updated!',
        error: 'Failed to update task',
      }
    );
  }

  async function deleteTask(id: string) {
    toast.promise(
      (async () => {
        await supabase.from('todos').delete().eq('id', id);
        await fetchTodos();
      })(),
      {
        loading: 'Deleting...',
        success: 'Task deleted!',
        error: 'Failed to delete task',
      }
    );
  }

  const grouped = groupByDate(todos);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return (
    <>
      <div className='space-y-8 pb-20 max-w-2xl'>
        {initialLoad && loading ? (
          <DayTasksSkeleton />
        ) : (
          Object.entries(grouped).map(([date, tasks]) => (
            <div
              key={date}
              className='mb-6'>
              <div className='text-xl font-bold mb-2'>
                {date === today
                  ? `Today (${formatDate(today)})`
                  : date === yesterday
                  ? `Yesterday (${formatDate(yesterday)})`
                  : formatDate(date)}
              </div>
              <div className='space-y-2 '>
                {tasks
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  )
                  .map((task) => (
                    <label
                      key={task.id}
                      className='flex items-center gap-2 justify-between text-sm pb-2 border-b border-gray-200 px-2'>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={task.status}
                          onChange={() => toggleStatus(task)}
                          className='w-4 h-4 accent-black cursor-pointer'
                          disabled={loading}
                        />
                        <span
                          className={
                            task.status
                              ? 'line-through text-gray-400 cursor-pointer'
                              : 'cursor-pointer'
                          }>
                          {task.task}
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={() => deleteTask(task.id)}
                        className='ml-2 text-gray-500 hover:text-red-700'
                        disabled={loading}
                        aria-label='Delete task'>
                        <Trash2 className='w-3.5 h-3.5' />
                      </button>
                    </label>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
      <div className='relative max-w-2xl mx-auto'>
        <form
          onSubmit={addTodo}
          className='fixed bottom-0 left-1/2 -translate-x-1/2 flex gap-2 bg-background border-t p-4 z-50 w-full max-w-2xl'
          style={{ margin: 0 }}>
          <Input
            ref={inputRef}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='Add a new task...'
            disabled={loading}
            className='flex-1'
          />
          <Button
            type='submit'
            disabled={loading}>
            Add
          </Button>
        </form>
      </div>
    </>
  );
}
