import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TaskCard = ({ task, onUpdate }) => {
  const { actor, user } = useAuth();

  const handleAssign = async () => {
    try {
      await actor.assignTask(task.id);
      onUpdate();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await actor.submitTaskForReview(task.id);
      onUpdate();
    } catch (error) {
      console.error('Error submitting task for review:', error);
    }
  };

  const handleReview = async (approved) => {
    try {
      await actor.reviewTask(task.id, approved);
      onUpdate();
    } catch (error) {
      console.error('Error reviewing task:', error);
    }
  };

  return (
    <div className="p-4">
      <h4 className="text-lg font-semibold">{task.title}</h4>
      <p className="text-sm text-gray-600">{task.description}</p>
      <p className="text-xs text-gray-500 mt-1">Priority: {task.priority}</p>
      <p className="text-xs text-gray-500">Deadline: {new Date(task.deadline / 1000000).toLocaleDateString()}</p>
      {task.status === 'Open' && user.role === 'Subcontractor' && (
        <button onClick={handleAssign} className="mt-2 btn-primary text-sm">
          Assign to me
        </button>
      )}
      {task.status === 'InProgress' && task.assignee === user.id && (
        <button onClick={handleSubmitForReview} className="mt-2 btn-secondary text-sm">
          Submit for Review
        </button>
      )}
      {task.status === 'UnderReview' && user.role === 'Reviewer' && (
        <div className="mt-2 space-x-2">
          <button onClick={() => handleReview(true)} className="btn-primary text-sm">
            Approve
          </button>
          <button onClick={() => handleReview(false)} className="btn-secondary text-sm">
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;