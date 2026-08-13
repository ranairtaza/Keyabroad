"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@keyabroad/auth/legacy';
import { Card, CardContent } from '@keyabroad/ui/components/card';
import { CheckCircle2, Circle } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (data) setTasks(data);
      if (error) console.error(error);
    }
    fetchTasks();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>
      <div className="space-y-4">
        {tasks.map(task => (
          <Card key={task.id}>
            <CardContent className="p-4 flex items-center gap-4">
              {task.status === 'completed' ? (
                <CheckCircle2 className="text-green-500" />
              ) : (
                <Circle className="text-slate-300" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-slate-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
              </div>
              <div className="text-sm font-medium uppercase px-2 py-1 bg-slate-100 rounded">
                {task.priority}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
