/** @format */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DayTasksSkeleton from './DayTasksSkeleton';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { Checkbox } from '@/components/ui/checkbox';

interface Todo {
  id: string;
  task_id: number;
  task: string;
  status: boolean;
  created_at: string;
  due_date: string | null;
  isDefault?: boolean;
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
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

function getTodayDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function groupByDate(todos: Todo[]) {
  return todos.reduce((acc, todo) => {
    const dateKey = todo.due_date || formatDate(todo.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);
}

// Draggable Task Component
function DraggableTask({
  task,
  onToggle,
  onDelete,
  loading,
}: {
  task: Todo;
  onToggle: (task: Todo) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  // Don't make default task draggable
  if (task.isDefault) {
    return (
      <div className='flex items-center gap-2 justify-between text-sm py-1 border-b border-gray-200 px-2 text-gray-400'>
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={task.status}
            onCheckedChange={() => onToggle(task)}
            disabled={true}
          />
          <span>{task.task}</span>
        </div>
      </div>
    );
  }

  return (
    <label
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className='flex items-center gap-2 justify-between text-sm py-1 border-b border-gray-200 px-2 cursor-move hover:bg-gray-50'>
      <div className='flex items-center gap-2'>
        <Checkbox
          checked={task.status}
          onCheckedChange={() => onToggle(task)}
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
        onClick={() => onDelete(task.id)}
        className='ml-2 text-gray-500 hover:text-red-700'
        disabled={loading}
        aria-label='Delete task'>
        <Trash2 className='w-3.5 h-3.5' />
      </button>
    </label>
  );
}

// DateSection as droppable area
function DateSection({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date,
  });
  return (
    <div
      ref={setNodeRef}
      className={`mb-6 ${isOver ? 'bg-gray-100' : ''}`}
      data-date={date}>
      {children}
    </div>
  );
}

export default function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    const today = getTodayDate();

    // First fetch existing todos
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Check if we have any 'Add todo for the day' task for today
      const hasTodayDefaultTask = data.some(
        (todo) =>
          todo.due_date === today && todo.task === 'Add to-do for the day'
      );

      // If no default task for today, add it and then refetch
      if (!hasTodayDefaultTask) {
        await supabase.from('todos').insert([
          {
            user_id: userId,
            task: 'Add to-do for the day',
            status: false,
            due_date: today,
          },
        ]);
        // Refetch after insert to avoid duplicates
        const { data: newData, error: newError } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', userId)
          .order('due_date', { ascending: false })
          .order('created_at', { ascending: false });
        if (!newError && newData) {
          setTodos(newData);
        } else {
          setTodos(data);
        }
      } else {
        setTodos(data);
      }
    }
    setLoading(false);
    setInitialLoad(false);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setLoading(true);
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    await supabase.from('todos').insert([
      {
        user_id: userId,
        task: newTask,
        status: false,
        due_date: localDate.toISOString().slice(0, 10),
      },
    ]);
    setNewTask('');
    await fetchTodos();
    setLoading(false);
  }

  async function toggleStatus(todo: Todo) {
    // Don't handle default task in DB
    if (todo.isDefault) return;

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
    // Don't handle default task in DB
    if (id === 'default-task') return;

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

  async function updateTaskDate(taskId: string, newDate: string) {
    toast.promise(
      (async () => {
        await supabase
          .from('todos')
          .update({ due_date: newDate })
          .eq('id', taskId);
        await fetchTodos();
      })(),
      {
        loading: 'Moving task...',
        success: 'Task moved!',
        error: 'Failed to move task',
      }
    );
  }

  async function moveAllPendingToToday() {
    const today = getTodayDate();
    const pendingTasks = todos.filter(
      (todo) => !todo.status && todo.due_date !== today && !todo.isDefault
    );

    if (pendingTasks.length === 0) {
      toast('No pending tasks to move');
      return;
    }

    toast.promise(
      (async () => {
        // Update each task individually to ensure proper update
        for (const task of pendingTasks) {
          await supabase
            .from('todos')
            .update({ due_date: today })
            .eq('id', task.id)
            .eq('user_id', userId);
        }
        await fetchTodos();
      })(),
      {
        loading: 'Moving tasks...',
        success: 'All pending tasks moved to today!',
        error: 'Failed to move tasks',
      }
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const task = todos.find((t) => t.id === active.id);
      const targetDate = over.id as string;

      if (task) {
        updateTaskDate(task.id, targetDate);
      }
    }
  }

  const grouped = groupByDate(todos);
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const today = localDate.toISOString().slice(0, 10);
  const yesterday = new Date(localDate.getTime() - 86400000)
    .toISOString()
    .slice(0, 10);

  const activeTask = activeId ? todos.find((t) => t.id === activeId) : null;

  return (
    <>
      <div className='space-y-8 pb-20 max-w-2xl'>
        {initialLoad && loading ? (
          <DayTasksSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}>
            {Object.entries(grouped).map(([date, tasks]) => (
              <DateSection
                key={date}
                date={date}>
                <div className='text-xl font-bold mb-2 flex items-center justify-between'>
                  <span>
                    {date === today
                      ? `Today (${formatDate(today)})`
                      : date === yesterday
                      ? `Yesterday (${formatDate(yesterday)})`
                      : formatDate(date)}
                  </span>
                  {date === today && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={moveAllPendingToToday}
                      className='text-xs'>
                      Move Pending Tasks
                    </Button>
                  )}
                </div>
                <div className='py-2'>
                  {tasks
                    .sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    )
                    .map((task) =>
                      activeId === task.id ? null : (
                        <DraggableTask
                          key={task.id}
                          task={task}
                          onToggle={toggleStatus}
                          onDelete={deleteTask}
                          loading={loading}
                        />
                      )
                    )}
                </div>
              </DateSection>
            ))}
            <DragOverlay>
              {activeTask ? (
                <div className='bg-white shadow-lg rounded-md py-1 px-2 border flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={activeTask.status}
                    readOnly
                    className='w-4 h-4 accent-black cursor-pointer'
                    disabled
                  />
                  <span
                    className={
                      activeTask.status ? 'line-through text-gray-400' : ''
                    }>
                    {activeTask.task}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      <div className='relative max-w-2xl mx-auto'>
        <form
          onSubmit={addTodo}
          className='fixed bottom-0 left-1/2 -translate-x-1/2 flex gap-2 bg-background border-t p-4 pb-8 z-50 w-full max-w-2xl'
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
