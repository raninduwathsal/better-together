import React, { useState } from 'react';
import type { TodoItem, UserProfile } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Sparkles, 
  Play
} from 'lucide-react';
import './TodoListCard.css';

interface TodoListCardProps {
  todos: TodoItem[];
  currentUser: UserProfile;
  categories: string[];
  onAddTodo: (title: string, category: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onStartTrackingTodo: (todoTitle: string, category: string) => void;
}

export const TodoListCard: React.FC<TodoListCardProps> = ({
  todos,
  currentUser,
  categories,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onStartTrackingTodo,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [selectedCat, setSelectedCat] = useState(categories[0] || 'Study');

  // Filter tasks for current user
  const userTodos = todos.filter(t => t.userId === currentUser.id);
  const pendingTodos = userTodos.filter(t => !t.completed);
  const completedTodos = userTodos.filter(t => t.completed);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTodo(newTitle.trim(), selectedCat);
    setNewTitle('');
  };

  return (
    <div className="todo-list-card">
      <div className="todo-card-header">
        <div className="todo-header-left">
          <div className="todo-icon-wrapper">
            <CheckSquare size={18} className="text-purple" />
          </div>
          <div>
            <h3 className="todo-card-title">Daily Study & Task Plan</h3>
            <p className="todo-card-desc">
              Tasks auto-suggest into the timer & bloom a Calla Lily upon completion.
            </p>
          </div>
        </div>

        <div className="todo-counter-pill">
          <Sparkles size={13} className="text-purple" />
          <span>
            <strong>{pendingTodos.length}</strong> task{pendingTodos.length === 1 ? '' : 's'} remaining
          </span>
        </div>
      </div>

      {/* Add Task Input Row */}
      <form className="add-todo-form" onSubmit={handleCreate}>
        <input
          type="text"
          className="todo-input"
          placeholder="Add a new task (e.g. Finish Raft notes, Math Assignment 4)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <select
          className="todo-cat-select"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="todo-add-btn">
          <Plus size={16} />
          <span>Add</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="todo-items-list">
        {userTodos.length === 0 ? (
          <div className="empty-todos-notice">
            <p>No tasks yet! Add your goals above or pick one when you start your timer.</p>
          </div>
        ) : (
          <>
            {/* Active / Pending Tasks */}
            {pendingTodos.map(todo => (
              <div key={todo.id} className="todo-item-row">
                <button 
                  className="todo-check-btn" 
                  onClick={() => onToggleTodo(todo.id)}
                  title="Mark as completed"
                >
                  <Circle size={19} className="unchecked-icon" />
                </button>

                <div className="todo-content" onClick={() => onToggleTodo(todo.id)}>
                  <span className="todo-title">{todo.title}</span>
                  <span className="todo-tag">{todo.category}</span>
                </div>

                <div className="todo-actions">
                  <button 
                    className="todo-track-btn" 
                    onClick={() => onStartTrackingTodo(todo.title, todo.category)}
                    title="Track time for this task"
                  >
                    <Play size={13} />
                    <span>Track</span>
                  </button>
                  <button 
                    className="todo-del-btn" 
                    onClick={() => onDeleteTodo(todo.id)}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {/* Completed Tasks */}
            {completedTodos.length > 0 && (
              <div className="completed-divider-row">
                <span>Completed Tasks ({completedTodos.length})</span>
              </div>
            )}

            {completedTodos.map(todo => (
              <div key={todo.id} className="todo-item-row completed">
                <button 
                  className="todo-check-btn checked" 
                  onClick={() => onToggleTodo(todo.id)}
                  title="Mark as pending"
                >
                  <CheckCircle2 size={19} className="checked-icon" />
                </button>

                <div className="todo-content">
                  <span className="todo-title done-text">{todo.title}</span>
                  <span className="todo-tag done-tag">{todo.category}</span>
                </div>

                <div className="todo-actions">
                  <button 
                    className="todo-del-btn" 
                    onClick={() => onDeleteTodo(todo.id)}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
