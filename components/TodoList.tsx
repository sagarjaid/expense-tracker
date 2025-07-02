/** @format */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DayTasksSkeleton from './DayTasksSkeleton';
import {
  Trash2,
  Camera,
  Edit2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CornerDownRight,
  CornerRightUp,
  Target,
} from 'lucide-react';
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
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { Checkbox } from '@/components/ui/checkbox';
import VoiceInputTodo from './VoiceInputTodo';
import CameraCapture from './CameraCapture';
import Modal from './Modal';

interface Todo {
  id: string;
  task_id: number;
  task: string;
  status: boolean;
  created_at: string;
  due_date: string | null;
  isDefault?: boolean;
  sort_order?: number;
  project_tag?: string;
}

interface TodoListProps {
  userId: string;
}

const PROJECT_TAGS = [
  { label: 'Sagar', color: 'bg-blue-100 text-blue-700' },
  { label: 'Office', color: 'bg-green-100 text-green-700' },
  { label: 'AIPM', color: 'bg-gray-100 text-black' },
  { label: 'CareerAI', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'NeverMissAI', color: 'bg-gray-100 text-gray-700' },
  { label: 'VisaInterviewAI', color: 'bg-gray-100 text-gray-700' },
];

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

const DEFAULT_TASKS = ['Make a To-Do for the day'];

function groupByDate(todos: Todo[]) {
  return todos.reduce((acc, todo) => {
    const dateKey = todo.due_date || formatDate(todo.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);
}

// Sortable Task Component
function SortableTask({
  task,
  onToggle,
  onDelete,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  isEditing,
  editText,
  onEditTextChange,
  loading,
  editProjectTag,
  onEditProjectTagChange,
}: {
  task: Todo;
  onToggle: (task: Todo) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Todo) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  loading: boolean;
  editProjectTag: string;
  onEditProjectTagChange: (tag: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className='flex items-center gap-2 justify-between text-sm py-1 border-b border-gray-200 px-2 bg-blue-50 dark:bg-gray-800 dark:border-gray-700'>
        <div className='flex items-center gap-2 flex-1'>
          <Checkbox
            checked={task.status}
            onCheckedChange={() => onToggle(task)}
            disabled={loading}
          />
          <Input
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            placeholder='Enter task text...'
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            className='flex-1 h-7 bg-white text-sm placeholder:text-sm min-w-0 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-400'
            autoFocus
          />
          <select
            value={editProjectTag}
            onChange={(e) => onEditProjectTagChange(e.target.value)}
            className='w-32 ml-2 text-xs border border-gray-300 rounded px-1 py-1 bg-white dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'
            disabled={loading}>
            <option value=''>Project tag</option>
            {PROJECT_TAGS.map((tag) => (
              <option
                key={tag.label}
                value={tag.label}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            size='sm'
            onClick={onSaveEdit}
            disabled={!editText.trim() || loading}
            className='h-6 px-2 text-xs'>
            Save
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={onCancelEdit}
            disabled={loading}
            className='h-6 px-2 text-xs'>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='flex items-center gap-2 justify-between text-sm py-1 border-b border-gray-200 px-2 cursor-move hover:bg-gray-50 group dark:border-gray-700 dark:hover:bg-gray-800'>
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
      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className='text-gray-500 hover:text-blue-700 opacity-0  group-hover:opacity-100 transition-opacity'
          disabled={loading}
          aria-label='Edit task'>
          <Edit2 className='w-3.5 h-3.5' />
        </button>

        {task.project_tag && (
          <span className='ml-2 font-semibold text-[10px] px-2 py-0.25 rounded-md border border-gray-200 text-gray-700 bg-white dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900'>
            {task.project_tag}
          </span>
        )}

        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className='text-gray-500 hover:text-red-700'
          disabled={loading}
          aria-label='Delete task'>
          <Trash2 className='w-3.5 h-3.5' />
        </button>
      </div>
    </div>
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
      className={`mb-6 ${isOver ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
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
  const [showCamera, setShowCamera] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextEditText, setContextEditText] = useState('');
  const [savingContext, setSavingContext] = useState(false);
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingOrderRef = useRef<{ [date: string]: string[] }>({});
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(
    {}
  );
  const [newProjectTag, setNewProjectTag] = useState('');
  const [editProjectTag, setEditProjectTag] = useState('');
  const [activeProjectTag, setActiveProjectTag] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
  });

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

  useEffect(() => {
    if (showContextModal) {
      if (todayContextTask) {
        setContextEditText(todayContextTask.task.replace(CONTEXT_PREFIX, ''));
      } else {
        setContextEditText(contextText);
      }
    }
    // eslint-disable-next-line
  }, [showContextModal]);

  async function fetchTodos() {
    setLoading(true);
    const today = getTodayDate();

    // Fetch all todos for the user
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Find which default tasks are missing for today
      const todayTasks = data.filter((todo) => todo.due_date === today);
      const missingDefaults = DEFAULT_TASKS.filter(
        (defaultTask) => !todayTasks.some((todo) => todo.task === defaultTask)
      );

      // Insert only missing default tasks
      if (missingDefaults.length > 0) {
        const maxSortOrder =
          todayTasks.length > 0
            ? Math.max(...todayTasks.map((t) => t.sort_order || 0))
            : -1;

        const defaultTasksToAdd = missingDefaults.map((task, index) => ({
          user_id: userId,
          task,
          status: false,
          due_date: today,
          sort_order: maxSortOrder + 1 + index,
        }));
        const { data: insertData, error: insertError } = await supabase
          .from('todos')
          .insert(defaultTasksToAdd);
        console.log('Inserted default tasks:', insertData, insertError);
        // Refetch after insert
        const { data: newData, error: newError } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', userId)
          .order('due_date', { ascending: false })
          .order('sort_order', { ascending: true })
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

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localDate.toISOString().slice(0, 10);

    // Get the highest sort_order for today's tasks
    const todayTasks = todos.filter((todo) => todo.due_date === today);
    const maxSortOrder =
      todayTasks.length > 0
        ? Math.max(...todayTasks.map((t) => t.sort_order || 0))
        : -1;

    // Create optimistic task
    const optimisticTask: Todo = {
      id: `temp-${Date.now()}`,
      task_id: 0,
      task: newTask,
      status: false,
      created_at: new Date().toISOString(),
      due_date: today,
      sort_order: maxSortOrder + 1,
      project_tag: newProjectTag,
    };

    // Optimistic update: Add to UI immediately
    setTodos((prev) => [...prev, optimisticTask]);
    setNewTask('');
    setNewProjectTag('');

    // Make API call in background
    try {
      const { data, error } = await supabase.from('todos').insert([
        {
          user_id: userId,
          task: newTask,
          status: false,
          due_date: today,
          sort_order: maxSortOrder + 1,
          project_tag: newProjectTag,
        },
      ]);

      if (error) throw error;

      // API call successful - refresh to get the real task with proper ID
      await fetchTodos();
      toast.success('Task added!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to add task:', error);
      setTodos((prev) => prev.filter((t) => t.id !== optimisticTask.id));
      setNewTask(newTask);
      setNewProjectTag(newProjectTag);
      toast.error('Failed to add task');
    }
  }

  async function addTodoFromVoice(taskText: string) {
    if (!taskText.trim()) return;

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localDate.toISOString().slice(0, 10);

    // Get the highest sort_order for today's tasks
    const todayTasks = todos.filter((todo) => todo.due_date === today);
    const maxSortOrder =
      todayTasks.length > 0
        ? Math.max(...todayTasks.map((t) => t.sort_order || 0))
        : -1;

    // Create optimistic task
    const optimisticTask: Todo = {
      id: `temp-${Date.now()}`,
      task_id: 0,
      task: taskText,
      status: false,
      created_at: new Date().toISOString(),
      due_date: today,
      sort_order: maxSortOrder + 1,
      project_tag: newProjectTag,
    };

    // Optimistic update: Add to UI immediately
    setTodos((prev) => [...prev, optimisticTask]);

    // Make API call in background
    try {
      const { error } = await supabase.from('todos').insert([
        {
          user_id: userId,
          task: taskText,
          status: false,
          due_date: today,
          sort_order: maxSortOrder + 1,
          project_tag: newProjectTag,
        },
      ]);

      if (error) throw error;

      // API call successful - refresh to get the real task with proper ID
      await fetchTodos();
      toast.success('Task added via voice!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to add voice task:', error);
      setTodos((prev) => prev.filter((t) => t.id !== optimisticTask.id));
      toast.error('Failed to add task');
    }
  }

  async function addTasksFromCamera(tasks: string[]) {
    if (!tasks.length) return;

    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = localDate.toISOString().slice(0, 10);

    // Get the highest sort_order for today's tasks
    const todayTasks = todos.filter((todo) => todo.due_date === today);
    const maxSortOrder =
      todayTasks.length > 0
        ? Math.max(...todayTasks.map((t) => t.sort_order || 0))
        : -1;

    // Create optimistic tasks
    const optimisticTasks: Todo[] = tasks.map((task, index) => ({
      id: `temp-${Date.now()}-${index}`,
      task_id: 0,
      task: task.trim(),
      status: false,
      created_at: new Date().toISOString(),
      due_date: today,
      sort_order: maxSortOrder + 1 + index,
      project_tag: newProjectTag,
    }));

    // Optimistic update: Add to UI immediately
    setTodos((prev) => [...prev, ...optimisticTasks]);

    // Make API call in background
    try {
      const tasksToAdd = tasks.map((task, index) => ({
        user_id: userId,
        task: task.trim(),
        status: false,
        due_date: today,
        sort_order: maxSortOrder + 1 + index,
        project_tag: newProjectTag,
      }));

      const { error } = await supabase.from('todos').insert(tasksToAdd);

      if (error) throw error;

      // API call successful - refresh to get the real tasks with proper IDs
      await fetchTodos();
      toast.success(`${tasks.length} tasks added from notebook!`);
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to add camera tasks:', error);
      const tempIds = optimisticTasks.map((t) => t.id);
      setTodos((prev) => prev.filter((t) => !tempIds.includes(t.id)));
      toast.error('Failed to add tasks');
    }
  }

  async function toggleStatus(todo: Todo) {
    // Optimistic update: Update UI immediately
    const optimisticTodos = todos.map((t) =>
      t.id === todo.id ? { ...t, status: !t.status } : t
    );
    setTodos(optimisticTodos);

    // Make API call in background
    try {
      const { error } = await supabase
        .from('todos')
        .update({ status: !todo.status })
        .eq('id', todo.id);

      if (error) throw error;

      // API call successful - no need to do anything since UI is already updated
      toast.success('Task updated!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to update task:', error);
      await fetchTodos(); // Refresh from database to get original state
      toast.error('Failed to update task');
    }
  }

  async function deleteTask(id: string) {
    // Optimistic update: Remove from UI immediately
    const deletedTask = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((t) => t.id !== id));

    // Make API call in background
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);

      if (error) throw error;

      // API call successful - no need to do anything since UI is already updated
      toast.success('Task deleted!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to delete task:', error);
      if (deletedTask) {
        setTodos((prev) => [...prev, deletedTask]);
      }
      toast.error('Failed to delete task');
    }
  }

  async function updateTaskDate(taskId: string, newDate: string) {
    const task = todos.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic update: Update UI immediately
    const optimisticTodos = [...todos];
    const targetDateTasks = optimisticTodos.filter(
      (todo) => todo.due_date === newDate
    );
    const maxSortOrder =
      targetDateTasks.length > 0
        ? Math.max(...targetDateTasks.map((t) => t.sort_order || 0))
        : -1;

    // Update the task in UI immediately
    const taskToUpdate = optimisticTodos.find((t) => t.id === taskId);
    if (taskToUpdate) {
      taskToUpdate.due_date = newDate;
      taskToUpdate.sort_order = maxSortOrder + 1;
    }

    // Update the UI immediately
    setTodos(optimisticTodos);

    // Make API call in background
    try {
      await supabase
        .from('todos')
        .update({
          due_date: newDate,
          sort_order: maxSortOrder + 1,
        })
        .eq('id', taskId);

      // API call successful - no need to do anything since UI is already updated
      toast.success('Task moved!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to move task:', error);
      await fetchTodos(); // Refresh from database to get original state
      toast.error('Failed to move task');
    }
  }

  async function moveAllPendingToToday() {
    const today = getTodayDate();
    const pendingTasks = todos.filter(
      (todo) => !todo.status && todo.due_date !== today
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

  async function updateTaskOrder(taskIds: string[], date: string) {
    // Save the intended order in the ref (redundant but safe)
    pendingOrderRef.current[date] = taskIds;

    // Find the full task objects for this date in the correct order
    const dateTasks = taskIds.map((id) => todos.find((t) => t.id === id)!);
    // Build the updates array with all NOT NULL fields
    const updates = dateTasks.map((t, i) => ({ ...t, sort_order: i }));

    // Optimistic update: UI is already updated in handleDragEnd
    try {
      await supabase.from('todos').upsert(updates, { onConflict: 'id' });
      toast.success('Tasks reordered!');
      // Do NOT call fetchTodos() here!
    } catch (error) {
      // Only revert if the intended order is still current
      if (
        pendingOrderRef.current[date] &&
        JSON.stringify(pendingOrderRef.current[date]) ===
          JSON.stringify(taskIds)
      ) {
        console.error('Failed to update task order:', error);
        await fetchTodos();
        toast.error('Failed to reorder tasks');
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = todos.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropping on a date section (moving between dates)
    if (Object.keys(groupByDate(todos)).includes(over.id as string)) {
      const targetDate = over.id as string;
      if (activeTask.due_date !== targetDate) {
        updateTaskDate(activeTask.id, targetDate);
      }
      return;
    }

    // Check if dropping on another task (reordering within same date)
    const overTask = todos.find((t) => t.id === over.id);
    if (overTask && activeTask.due_date === overTask.due_date) {
      const date = activeTask.due_date;
      const dateTasks = todos.filter((t) => t.due_date === date);
      const oldIndex = dateTasks.findIndex((t) => t.id === active.id);
      const newIndex = dateTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== newIndex) {
        // Reorder only the dateTasks array
        const reorderedDateTasks = arrayMove(dateTasks, oldIndex, newIndex);
        // Update sort_order for each task in the new order
        reorderedDateTasks.forEach((task, idx) => {
          task.sort_order = idx;
        });
        // Merge back into the full todos list, preserving order for other dates
        const newTodos = todos.map((t) => {
          const idx = reorderedDateTasks.findIndex((dt) => dt.id === t.id);
          return idx !== -1 ? reorderedDateTasks[idx] : t;
        });
        setTodos(newTodos);
        // Save the intended order in the ref
        pendingOrderRef.current[date!] = reorderedDateTasks.map((t) => t.id);
        // Update DB order for only this date's tasks
        updateTaskOrder(
          reorderedDateTasks.map((t) => t.id),
          date!
        );
      }
    }
  }

  async function updateTask(
    taskId: string,
    newTaskText: string,
    newProjectTag: string
  ) {
    // Optimistic update: Update UI immediately
    const optimisticTodos = todos.map((t) =>
      t.id === taskId
        ? { ...t, task: newTaskText, project_tag: newProjectTag }
        : t
    );
    setTodos(optimisticTodos);
    setEditingTask(null);
    setEditTaskText('');
    setEditProjectTag('');

    // Make API call in background
    try {
      const { error } = await supabase
        .from('todos')
        .update({ task: newTaskText, project_tag: newProjectTag })
        .eq('id', taskId);

      if (error) throw error;

      // API call successful - no need to do anything since UI is already updated
      toast.success('Task updated!');
    } catch (error) {
      // API call failed - revert to original state
      console.error('Failed to update task:', error);
      await fetchTodos(); // Refresh from database to get original state
      setEditingTask(null);
      setEditTaskText('');
      setEditProjectTag('');
      toast.error('Failed to update task');
    }
  }

  function handleEditTask(task: Todo) {
    setEditingTask(task);
    setEditTaskText(task.task);
    setEditProjectTag(task.project_tag || '');
  }

  function handleCancelEdit() {
    setEditingTask(null);
    setEditTaskText('');
    setEditProjectTag('');
  }

  function handleSaveEdit() {
    if (editingTask && editTaskText.trim()) {
      updateTask(editingTask.id, editTaskText.trim(), editProjectTag.trim());
    }
  }

  async function moveAllDoneToToday() {
    const today = getTodayDate();
    const todayTasks = todos.filter((todo) => todo.due_date === today);
    const incomplete = todayTasks.filter((t) => !t.status);
    const complete = todayTasks.filter((t) => t.status);
    const newOrder = [...incomplete, ...complete];
    const taskIds = newOrder.map((t) => t.id);

    // Optimistic update
    const optimisticTodos = [...todos];
    let sortIndex = 0;
    for (const id of taskIds) {
      const task = optimisticTodos.find((t) => t.id === id);
      if (task) task.sort_order = sortIndex++;
    }
    setTodos(optimisticTodos);

    // Update DB
    try {
      for (let i = 0; i < taskIds.length; i++) {
        await supabase
          .from('todos')
          .update({ sort_order: i })
          .eq('id', taskIds[i])
          .eq('user_id', userId);
      }
      toast.success('Done tasks moved down!');
    } catch (error) {
      await fetchTodos();
      toast.error('Failed to move done tasks');
    }
  }

  function toggleDayCollapse(date: string) {
    setCollapsedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  }

  // Helper to check if all previous days are collapsed
  const allPreviousCollapsed = Object.entries(groupByDate(todos))
    .filter(([date]) => date !== getTodayDate())
    .every(([date]) => collapsedDays[date]);

  function toggleAllPreviousDays() {
    const newState: Record<string, boolean> = {};
    Object.keys(groupByDate(todos)).forEach((date) => {
      if (date !== getTodayDate()) newState[date] = !allPreviousCollapsed;
    });
    setCollapsedDays((prev) => ({ ...prev, ...newState }));
  }

  // Helper to find today's context task (by prefix)
  const CONTEXT_PREFIX = '[CONTEXT] ';
  const todayContextTask = todos.find(
    (t) => t.due_date === getTodayDate() && t.task.startsWith(CONTEXT_PREFIX)
  );

  // Filter out context tasks from main list
  const todosWithoutContext = todos.filter(
    (t) => !t.task.startsWith(CONTEXT_PREFIX)
  );
  // Filter by active project tag
  const filteredTodos =
    activeProjectTag === 'All'
      ? todosWithoutContext
      : todosWithoutContext.filter((t) => t.project_tag === activeProjectTag);

  // Generate last 12 months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'long' }),
    };
  });

  // Filter todos by selected month
  const todosInMonth = filteredTodos.filter((t) => {
    const date = t.due_date || t.created_at;
    return date.startsWith(selectedMonth);
  });
  const grouped = groupByDate(todosInMonth);

  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const today = localDate.toISOString().slice(0, 10);
  const yesterday = new Date(localDate.getTime() - 86400000)
    .toISOString()
    .slice(0, 10);

  const activeTask = activeId ? todos.find((t) => t.id === activeId) : null;

  const contextText = `Sagar 2025\n\nEnglish Spelling & Speaking: Toastmasters\nDecision Making: Money loss, believability weightage\nVipassana Practice\n\nUpper body workouts\nRunning\n\nJob: ₹33 LPA (salary) - ₹2L in PM/Dev role\nOnly 1 Project Per Year: Sales goal $20 * 10K paid users (AI Scrum Master)\n50% Saving from Salary\n\nClothing according to place\nBuy New Scooty: EMI (3 EMI plans)\n2 BHK Apartment: Rent in Bangalore\n\nMedia Input: 1 hour per day, includes all available books but limits to 2 new books.\n\nDate to Marry\nLakadi\nPeace\nMatch\n20 LPA - IT/ FANG / Big 4/ Doctor/ Software Engg`;

  async function saveContextTask() {
    if (!contextEditText.trim()) return;
    setSavingContext(true);
    const taskText = CONTEXT_PREFIX + contextEditText.trim();
    const todayTasks = todos.filter((todo) => todo.due_date === today);
    const maxSortOrder =
      todayTasks.length > 0
        ? Math.max(...todayTasks.map((t) => t.sort_order || 0))
        : -1;
    try {
      if (todayContextTask) {
        // Update existing
        await supabase
          .from('todos')
          .update({ task: taskText })
          .eq('id', todayContextTask.id);
      } else {
        // Insert new
        await supabase.from('todos').insert([
          {
            user_id: userId,
            task: taskText,
            status: false,
            due_date: today,
            sort_order: maxSortOrder + 1,
          },
        ]);
      }
      await fetchTodos();
      toast.success('Context saved!');
      setShowContextModal(false);
    } catch (error) {
      toast.error('Failed to save context');
    } finally {
      setSavingContext(false);
    }
  }

  return (
    <>
      {/* Project Tag Tabs */}
      <div className='flex gap-1 mb-4 overflow-x-auto no-scrollbar w-full max-w-full pb-1 -mx-2 px-2'>
        <button
          className={`px-3 py-1 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap min-w-fit ${
            activeProjectTag === 'All'
              ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800'
          }`}
          onClick={() => setActiveProjectTag('All')}>
          All
        </button>
        {PROJECT_TAGS.map((tag) => (
          <button
            key={tag.label}
            className={`px-3 py-1 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap min-w-fit ${
              activeProjectTag === tag.label
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveProjectTag(tag.label)}>
            {tag.label}
          </button>
        ))}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className='px-1 rounded-md border border-gray-300 text-xs font-semibold whitespace-nowrap min-w-fit bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'>
          {monthOptions.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className='dark:bg-gray-900 dark:text-gray-200'>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className='space-y-8 pb-32 max-w-2xl w-full mx-auto px-2 sm:px-0'>
        {initialLoad && loading ? (
          <DayTasksSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}>
            {Object.entries(grouped).map(([date, tasks], idx) => (
              <React.Fragment key={date}>
                <DateSection date={date}>
                  <div className='text-lg sm:text-xl font-bold flex flex-wrap flex-col gap-2 md:flex-row justify-between'>
                    <span className='flex items-center gap-2 flex-wrap justify-between w-full'>
                      <div className='flex items-center gap-2'>
                        {date !== today && (
                          <button
                            type='button'
                            onClick={() => toggleDayCollapse(date)}
                            className='focus:outline-none'>
                            {collapsedDays[date] ? (
                              <ChevronRight className='w-5 h-5' />
                            ) : (
                              <ChevronDown className='w-5 h-5' />
                            )}
                          </button>
                        )}
                        {date === today
                          ? `Today (${formatDate(today)})`
                          : date === yesterday
                          ? `Yesterday (${formatDate(yesterday)})`
                          : formatDate(date)}
                      </div>
                      <div className='flex items-center gap-2'>
                        {date === yesterday && (
                          <div
                            className='cursor-pointer'
                            onClick={toggleAllPreviousDays}>
                            {allPreviousCollapsed ? (
                              <ChevronUp className='w-5 h-5 mr-1' />
                            ) : (
                              <ChevronDown className='w-5 h-5 mr-1' />
                            )}
                          </div>
                        )}
                        {date === today && (
                          <>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={fetchTodos}
                              disabled={loading}
                              className='h-7 w-7 p-0'
                              title='Refresh'>
                              <RefreshCw
                                className={`w-3 h-3 ${
                                  loading ? 'animate-spin' : ''
                                }`}
                              />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => moveAllDoneToToday()}
                              className='h-7 w-7 p-0'
                              title='Move done tasks to end'>
                              <CornerDownRight className='w-3 h-3' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={moveAllPendingToToday}
                              className='h-7 w-7 p-0'
                              title='Move pending tasks to today'>
                              <CornerRightUp className='w-3 h-3' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setShowContextModal(true)}
                              className='h-7 w-7 p-0'
                              title='Goals'>
                              <Target className='w-3 h-3' />
                            </Button>
                          </>
                        )}
                      </div>
                    </span>
                  </div>
                  {(collapsedDays[date] || date === today) && (
                    <SortableContext
                      items={tasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}>
                      <div className='pt-4'>
                        {tasks
                          .sort(
                            (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                          )
                          .map((task) =>
                            activeId === task.id ? null : (
                              <SortableTask
                                key={task.id}
                                task={task}
                                onToggle={toggleStatus}
                                onDelete={deleteTask}
                                onEdit={handleEditTask}
                                onSaveEdit={handleSaveEdit}
                                onCancelEdit={handleCancelEdit}
                                isEditing={editingTask === task}
                                editText={editTaskText}
                                onEditTextChange={(text) =>
                                  setEditTaskText(text)
                                }
                                loading={loading}
                                editProjectTag={editProjectTag}
                                onEditProjectTagChange={setEditProjectTag}
                              />
                            )
                          )}
                      </div>
                    </SortableContext>
                  )}
                  {/* Add form right below today's tasks */}
                  {date === today && idx === 0 && (
                    <div className='w-full'>
                      <form
                        onSubmit={addTodo}
                        className='flex items-center gap-2 justify-between text-sm py-1.5 border-b border-gray-200 px-2 bg-gray-50 rounded-md flex-wrap sm:flex-nowrap dark:border-gray-700 dark:bg-gray-900'
                        style={{ margin: 0 }}>
                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                          <Checkbox
                            checked={false}
                            disabled
                            className='opacity-0'
                          />
                          <Input
                            ref={inputRef}
                            value={newTask}
                            onChange={(e) => {
                              const value = e.target.value;
                              setNewTask(
                                value.charAt(0).toUpperCase() + value.slice(1)
                              );
                            }}
                            placeholder='Add a new task...'
                            disabled={loading}
                            className='flex-1 h-7 bg-white text-sm placeholder:text-sm min-w-0 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-400'
                            autoFocus
                          />
                          <select
                            value={newProjectTag}
                            onChange={(e) => setNewProjectTag(e.target.value)}
                            className='w-28 sm:w-32 ml-2 text-xs border border-gray-300 rounded px-1 py-1 bg-white dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'
                            disabled={loading}>
                            <option value=''>Project tag</option>
                            {PROJECT_TAGS.map((tag) => (
                              <option
                                key={tag.label}
                                value={tag.label}>
                                {tag.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='flex items-center gap-1 mt-2 sm:mt-0'>
                          <Button
                            type='submit'
                            size='sm'
                            disabled={loading || !newTask.trim()}
                            className='h-6 px-2 text-xs'>
                            Add
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setNewTask('');
                              setNewProjectTag('');
                            }}
                            disabled={loading || !newTask}
                            className='h-6 px-2 text-xs'>
                            Clear
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </DateSection>
                {/* Only render VoiceInputTodo once, outside the date loop */}
                {date === today && idx === 0 && (
                  <div className='fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xs sm:max-w-md flex justify-center pointer-events-none'>
                    <div className='flex items-center gap-3 pointer-events-auto'>
                      <VoiceInputTodo onResult={addTodoFromVoice} />
                      <div
                        onClick={() => setShowCamera(true)}
                        className='flex flex-col items-center justify-center bg-green-500 rounded-full w-14 h-14 shadow-2xl cursor-pointer'
                        aria-label='Capture notebook tasks'
                        style={{
                          pointerEvents: loading ? 'none' : 'auto',
                          opacity: loading ? 0.6 : 1,
                        }}>
                        <Camera
                          className='text-white'
                          size={22}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            <DragOverlay>
              {activeTask ? (
                <div className='bg-white shadow-lg rounded-md py-1 px-2 border flex items-center gap-2 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200'>
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
      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onTasksExtracted={addTasksFromCamera}
          onClose={() => setShowCamera(false)}
        />
      )}
      {/* Context Modal */}
      <Modal
        isModalOpen={showContextModal}
        setIsModalOpen={setShowContextModal}
        title='Context'
        modalClassName='w-full max-w-full sm:max-w-lg rounded-none sm:rounded-lg p-0 sm:p-6'>
        <textarea
          className='whitespace-pre-line text-base p-2 rounded bg-gray-50 border border-gray-200 w-full min-h-[220px] h-[420px] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200'
          value={contextEditText}
          onChange={(e) => setContextEditText(e.target.value)}
          disabled={savingContext}
        />
        <div className='flex gap-2 mt-4 justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowContextModal(false)}
            disabled={savingContext}>
            Cancel
          </Button>
          <Button
            size='sm'
            onClick={saveContextTask}
            disabled={
              savingContext ||
              !contextEditText.trim() ||
              contextEditText.trim() ===
                (todayContextTask
                  ? todayContextTask.task.replace(CONTEXT_PREFIX, '')
                  : contextText)
            }>
            {savingContext ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
