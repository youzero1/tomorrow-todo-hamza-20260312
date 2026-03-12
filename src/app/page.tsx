'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditState {
  id: string;
  title: string;
  description: string;
}

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data: Todo[] = await res.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddError('Title is required');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create todo');
      }
      const created: Todo = await res.json();
      setTodos((prev) => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const handleEditStart = (todo: Todo) => {
    setEditState({
      id: todo.id,
      title: todo.title,
      description: todo.description || '',
    });
  };

  const handleEditCancel = () => {
    setEditState(null);
  };

  const handleEditSave = async () => {
    if (!editState || !editState.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/todos/${editState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editState.title.trim(),
          description: editState.description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save todo');
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save todo');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>📝 Todo App</h1>
          <p className={styles.subtitle}>Stay organized and productive</p>
        </header>

        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Add New Todo</h2>
          <form onSubmit={handleAddTodo} className={styles.form}>
            <div className={styles.formGroup}>
              <input
                type="text"
                placeholder="What needs to be done? *"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={styles.input}
                disabled={adding}
              />
            </div>
            <div className={styles.formGroup}>
              <textarea
                placeholder="Add a description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={styles.textarea}
                rows={2}
                disabled={adding}
              />
            </div>
            {addError && <p className={styles.errorText}>{addError}</p>}
            <button
              type="submit"
              className={styles.addButton}
              disabled={adding}
            >
              {adding ? 'Adding...' : '+ Add Todo'}
            </button>
          </form>
        </section>

        <section className={styles.listSection}>
          <h2 className={styles.sectionTitle}>
            Todos{' '}
            <span className={styles.count}>
              ({todos.filter((t) => !t.completed).length} remaining)
            </span>
          </h2>

          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className={styles.dismissBtn}>
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <p>Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>🎉</p>
              <p>No todos yet! Add one above to get started.</p>
            </div>
          ) : (
            <ul className={styles.todoList}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`${styles.todoItem} ${
                    todo.completed ? styles.completed : ''
                  }`}
                >
                  {editState && editState.id === todo.id ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editState.title}
                        onChange={(e) =>
                          setEditState((prev) =>
                            prev ? { ...prev, title: e.target.value } : prev
                          )
                        }
                        className={styles.editInput}
                        disabled={saving}
                      />
                      <textarea
                        value={editState.description}
                        onChange={(e) =>
                          setEditState((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : prev
                          )
                        }
                        className={styles.editTextarea}
                        rows={2}
                        placeholder="Description (optional)"
                        disabled={saving}
                      />
                      <div className={styles.editActions}>
                        <button
                          onClick={handleEditSave}
                          className={styles.saveButton}
                          disabled={saving || !editState.title.trim()}
                        >
                          {saving ? 'Saving...' : '✓ Save'}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className={styles.cancelButton}
                          disabled={saving}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.todoContent}>
                      <div className={styles.todoLeft}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggle(todo)}
                          className={styles.checkbox}
                          id={`todo-${todo.id}`}
                        />
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={styles.todoLabel}
                        >
                          <span className={styles.todoTitle}>{todo.title}</span>
                          {todo.description && (
                            <span className={styles.todoDescription}>
                              {todo.description}
                            </span>
                          )}
                          <span className={styles.todoDate}>
                            Created: {formatDate(todo.createdAt)}
                          </span>
                        </label>
                      </div>
                      <div className={styles.todoActions}>
                        <button
                          onClick={() => handleEditStart(todo)}
                          className={styles.editButton}
                          title="Edit todo"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className={styles.deleteButton}
                          title="Delete todo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className={styles.footer}>
          <p>Built with Next.js 14 & TypeORM</p>
        </footer>
      </div>
    </main>
  );
}
