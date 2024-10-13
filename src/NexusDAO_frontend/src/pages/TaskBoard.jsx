import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TaskCard from '../components/TaskCard';

const TaskBoard = () => {
  const { actor } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const allTasks = await actor.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const tasksByStatus = {
    Open: tasks.filter((task) => task.status === 'Open'),
    InProgress: tasks.filter((task) => task.status === 'InProgress'),
    UnderReview: tasks.filter((task) => task.status === 'UnderReview'),
    Completed: tasks.filter((task) => task.status === 'Completed'),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Object.entries(tasksByStatus).map(([status, tasks]) => (
        <div key={status} className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{status}</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li key={task.id}>
                  <TaskCard task={task} onUpdate={fetchTasks} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;