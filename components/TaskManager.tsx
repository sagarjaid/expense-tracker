"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Task {
  id: string;
  user_id: string;
  task_id: number;
  task: string; // task title/description
  status: boolean; // true = completed, false = not completed
  created_at: string;
  due_date: string | null; // date string, null for backlog items
  sort_order: number;
  project_tag: string | null;
}

export default function TaskManager() {
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [backlogTaskTitle, setBacklogTaskTitle] = useState("");
  const [backlogProjectTag, setBacklogProjectTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [splitPosition, setSplitPosition] = useState(33.33); // percentage for backlog width
  const [isResizing, setIsResizing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLargeScreen(
      typeof window !== "undefined" && window.innerWidth >= 1024
    );

    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const newPosition = Math.min(
        Math.max((mouseX / containerWidth) * 100, 20),
        60
      ); // Limit between 20% and 60%
      setSplitPosition(newPosition);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const fetchTasks = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch todos - backlog items have null due_date, today's items have today's date
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching todos:", error);
        toast.error("Failed to load tasks");
        setLoading(false);
        return;
      }

      const tasks = data || [];

      // Backlog: items with null due_date or due_date in the past/future (not today)
      // Today's tasks: items with due_date matching today
      const backlog = tasks.filter(
        (task) => !task.due_date || task.due_date !== today
      );
      const todayTasks = tasks.filter((task) => task.due_date === today);

      setBacklogTasks(backlog);
      setTodayTasks(todayTasks);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load tasks");
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!backlogTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to add tasks");
        return;
      }

      setAddingTask(true);

      // Get max sort_order for this user to set the next one
      const { data: existingTasks } = await supabase
        .from("todos")
        .select("sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder =
        existingTasks?.sort_order !== undefined
          ? existingTasks.sort_order + 1
          : 0;

      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            task: backlogTaskTitle.trim(),
            status: false, // not completed
            due_date: null, // backlog item (no due date)
            project_tag: backlogProjectTag.trim() || null,
            user_id: user.id,
            sort_order: nextSortOrder,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error adding task:", error);
        toast.error("Failed to add task");
        setAddingTask(false);
        return;
      }

      setBacklogTasks([...backlogTasks, data]);
      setBacklogTaskTitle("");
      setBacklogProjectTag("");
      toast.success("Task added successfully");
      setAddingTask(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add task");
      setAddingTask(false);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .update({ status: !task.status })
        .eq("id", task.id);

      if (error) {
        console.error("Error updating task:", error);
        toast.error("Failed to update task");
        return;
      }

      const updatedTask = { ...task, status: !task.status };
      const today = new Date().toISOString().split("T")[0];
      const isToday = task.due_date === today;

      if (isToday) {
        setTodayTasks(
          todayTasks.map((t) => (t.id === task.id ? updatedTask : t))
        );
      } else {
        setBacklogTasks(
          backlogTasks.map((t) => (t.id === task.id ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId: string, isToday: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("todos").delete().eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
        return;
      }

      if (isToday) {
        setTodayTasks(todayTasks.filter((t) => t.id !== taskId));
      } else {
        setBacklogTasks(backlogTasks.filter((t) => t.id !== taskId));
      }

      toast.success("Task deleted");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete task");
    }
  };

  const moveToToday = async (task: Task) => {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const { error } = await supabase
        .from("todos")
        .update({ due_date: today })
        .eq("id", task.id);

      if (error) {
        console.error("Error moving task:", error);
        toast.error("Failed to move task");
        return;
      }

      const updatedTask: Task = { ...task, due_date: today };
      setBacklogTasks(backlogTasks.filter((t) => t.id !== task.id));
      setTodayTasks([...todayTasks, updatedTask]);
      toast.success("Task moved to today");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to move task");
    }
  };

  const moveToBacklog = async (task: Task) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .update({ due_date: null })
        .eq("id", task.id);

      if (error) {
        console.error("Error moving task:", error);
        toast.error("Failed to move task");
        return;
      }

      const updatedTask: Task = { ...task, due_date: null };
      setTodayTasks(todayTasks.filter((t) => t.id !== task.id));
      setBacklogTasks([...backlogTasks, updatedTask]);
      toast.success("Task moved to backlog");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to move task");
    }
  };

  const clearAllTasks = async (isToday: boolean) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const tasksToDelete = isToday ? todayTasks : backlogTasks;
      const taskIds = tasksToDelete.map((t) => t.id);

      const { error } = await supabase.from("todos").delete().in("id", taskIds);

      if (error) {
        console.error("Error clearing tasks:", error);
        toast.error("Failed to clear tasks");
        return;
      }

      if (isToday) {
        setTodayTasks([]);
      } else {
        setBacklogTasks([]);
      }

      toast.success("All tasks cleared");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to clear tasks");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row gap-1 min-h-screen py-4 relative"
    >
      {/* Backlog Sidebar */}
      <div
        className="w-full flex-shrink-0"
        style={{
          width: isLargeScreen ? `${splitPosition}%` : "100%",
        }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="p-4 flex-shrink-0">
            <CardTitle className="text-base font-bold">Goals backlog</CardTitle>
            <div className="flex items-center gap-2 mt-4">
              <Input
                placeholder="Task title"
                value={backlogTaskTitle}
                onChange={(e) => setBacklogTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTask();
                  }
                }}
                className="flex-1 text-sm"
              />
              <Button onClick={addTask} disabled={addingTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Project tag (optional)"
              value={backlogProjectTag}
              onChange={(e) => setBacklogProjectTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTask();
                }
              }}
              className="mt-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to add
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {backlogTasks.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Your backlog</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllTasks(false)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {backlogTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No backlog tasks. Add one above!
                </p>
              ) : (
                backlogTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTaskCompletion}
                    onDelete={deleteTask}
                    onMoveToToday={moveToToday}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resizer */}
      {isLargeScreen && (
        <div
          className={`w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0 group ${
            isResizing ? "bg-primary" : ""
          }`}
          onMouseDown={handleMouseDown}
          style={{ minHeight: "100%" }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
        >
          <div className="w-full h-full group-hover:bg-primary/30 transition-colors" />
        </div>
      )}

      {/* Today's Tasks */}
      <div
        className="w-full lg:flex-1"
        style={{
          width: isLargeScreen ? `${100 - splitPosition}%` : "100%",
        }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">
                What are your goals for today?
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {format(new Date(), "EEE, MMM d, yyyy")}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {todayTasks.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Today&apos;s tasks</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllTasks(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete all
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No tasks for today. Add one above or move from backlog!
                </p>
              ) : (
                todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTaskCompletion}
                    onDelete={deleteTask}
                    onMoveToBacklog={moveToBacklog}
                    isToday={true}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string, isToday: boolean) => void;
  onMoveToToday?: (task: Task) => void;
  onMoveToBacklog?: (task: Task) => void;
  isToday?: boolean;
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onMoveToToday,
  onMoveToBacklog,
  isToday = false,
}: TaskItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border bg-card ${
        task.status ? "opacity-60" : ""
      }`}
    >
      <Checkbox
        checked={task.status}
        onCheckedChange={() => onToggle(task)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`flex-1 text-sm ${
              task.status
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {task.task}
          </p>
        </div>
        {task.project_tag && (
          <div className="flex items-center gap-1 mt-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {task.project_tag}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!isToday && onMoveToToday && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveToToday(task)}
            className="h-8 w-8 p-0"
            title="Move to today"
          >
            →
          </Button>
        )}
        {isToday && onMoveToBacklog && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveToBacklog(task)}
            className="h-8 w-8 p-0"
            title="Move to backlog"
          >
            ←
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.id, isToday)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
