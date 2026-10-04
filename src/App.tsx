import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlarmClock,
  Archive,
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  Clock3,
  Code2,
  Coffee,
  GraduationCap,
  LayoutGrid,
  ListTodo,
  MoreHorizontal,
  Plus,
  Repeat2,
  Sparkles,
  Trash2,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import {
  createCategory,
  createId,
  getCategoryProgress,
  getSubtaskProgress,
  isOverdue,
  loadData,
  removeCategory,
  removeTask,
  saveData,
  toggleSubtaskCompletion,
  toggleTaskCompletion,
  upsertTask,
  type Category,
  type Recurrence,
  type StoredData,
  type Task,
} from "./taskData";

function CategoryIcon({ name, size = 17 }: { name: string; size?: number }) {
  if (name === "Study") return <GraduationCap size={size} />;
  if (name === "Work") return <BriefcaseBusiness size={size} />;
  if (name === "Programming") return <Code2 size={size} />;
  if (name === "Personal") return <Coffee size={size} />;
  return <Circle size={size} />;
}

function formatDeadline(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function App() {
  const [data, setData] = useState<StoredData>(() => loadData(localStorage));
  const [selectedId, setSelectedId] = useState(data.categories[0]?.id ?? "");
  const [showCompleted, setShowCompleted] = useState(true);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [clock, setClock] = useState(Date.now());
  const selectedCategory = data.categories.find((category) => category.id === selectedId);
  const categoryTasks = useMemo(
    () => data.tasks.filter((task) => task.categoryId === selectedId),
    [data.tasks, selectedId],
  );
  const activeTasks = categoryTasks.filter((task) => !task.completed);
  const completedTasks = categoryTasks.filter((task) => task.completed);
  const completion = getCategoryProgress(categoryTasks);

  useEffect(() => {
    saveData(data, localStorage);
  }, [data]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data.categories.some((category) => category.id === selectedId)) {
      setSelectedId(data.categories[0]?.id ?? "");
    }
  }, [data.categories, selectedId]);

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryInput.trim();
    if (!name) return;
    if (data.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      window.alert("A category with that name already exists.");
      return;
    }
    const category = createCategory(name, data.categories);
    setData((current) => ({ ...current, categories: [...current.categories, category] }));
    setSelectedId(category.id);
    setCategoryInput("");
    setCategoryFormOpen(false);
  }

  function deleteCategory(category: Category) {
    if (!window.confirm(`Delete “${category.name}” and all of its tasks?`)) return;
    setData((current) => removeCategory(current, category.id));
  }

  function saveTask(task: Task) {
    setData((current) => upsertTask(current, task, Boolean(editingTask)));
    setTaskModalOpen(false);
    setEditingTask(null);
  }

  function toggleTask(taskId: string) {
    setData((current) => toggleTaskCompletion(current, taskId));
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setData((current) => toggleSubtaskCompletion(current, taskId, subtaskId));
  }

  function deleteTask(taskId: string) {
    setData((current) => removeTask(current, taskId));
  }

  function clearCompleted() {
    if (!completedTasks.length) return;
    if (!window.confirm(`Clear all ${completedTasks.length} completed tasks in ${selectedCategory?.name}?`)) {
      return;
    }
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter(
        (task) => task.categoryId !== selectedId || !task.completed,
      ),
    }));
  }

  function openNewTask() {
    setEditingTask(null);
    setTaskModalOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daymark home">
          <span className="brand-mark"><Check size={18} strokeWidth={3} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">YOUR SPACE</div>
        <button className="all-tasks-link" onClick={() => setSelectedId(data.categories[0]?.id ?? "")}>
          <LayoutGrid size={17} />
          <span>My categories</span>
          <span className="category-count">{data.categories.length}</span>
        </button>

        <div className="category-heading">
          <span>Categories</span>
          <button
            className="icon-button small"
            aria-label="Add category"
            title="Add category"
            onClick={() => setCategoryFormOpen((open) => !open)}
          >
            {categoryFormOpen ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>
        {categoryFormOpen && (
          <form className="category-form" onSubmit={addCategory}>
            <input
              autoFocus
              aria-label="Category name"
              placeholder="Category name"
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              maxLength={32}
            />
            <button type="submit" aria-label="Save category"><Check size={15} /></button>
          </form>
        )}
        <nav className="category-list" aria-label="Categories">
          {data.categories.map((category) => (
            <div
              className={`category-row ${selectedId === category.id ? "selected" : ""}`}
              key={category.id}
            >
              <button className="category-select" onClick={() => setSelectedId(category.id)}>
                <span className="category-icon" style={{ color: category.color }}>
                  <CategoryIcon name={category.name} />
                </span>
                <span className="category-name">{category.name}</span>
                <span className="category-task-count">
                  {data.tasks.filter((task) => task.categoryId === category.id && !task.completed).length}
                </span>
              </button>
              <button
                className="category-delete icon-button"
                aria-label={`Delete ${category.name} category`}
                title={`Delete ${category.name}`}
                onClick={() => deleteCategory(category)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {data.categories.length === 0 && (
            <p className="sidebar-empty">Create a category to get started.</p>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="focus-card">
            <span className="focus-icon"><Sparkles size={16} /></span>
            <p>One thing at a time.</p>
            <span>Make space for what matters.</span>
          </div>
          <div className="profile-row">
            <div className="avatar">D</div>
            <div><strong>Your workspace</strong><span>Personal plan</span></div>
            <MoreHorizontal size={18} className="profile-more" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{selectedCategory?.name ?? "Categories"}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><div className="topbar-avatar">D</div></div>
        </header>

        {selectedCategory ? (
          <section className="workspace">
            <div className="category-overview">
              <div className="category-title-wrap">
                <div className="eyebrow"><span className="eyebrow-dot" style={{ background: selectedCategory.color }} /> CATEGORY</div>
                <h1>{selectedCategory.name}<span className="title-period">.</span></h1>
                <p className="overview-subtitle">{categoryTasks.length === 0 ? "A fresh start. Add a task to begin." : `${activeTasks.length} ${activeTasks.length === 1 ? "task" : "tasks"} to focus on today`}</p>
              </div>
              <div className="progress-card">
                <div className="progress-card-top">
                  <div><span className="progress-label">YOUR PROGRESS</span><div className="progress-number"><span key={completion} className="progress-value">{completion}</span><span className="percent-sign">%</span></div></div>
                  <div className="progress-ring"><span>{completedTasks.length}<small>/{categoryTasks.length}</small></span></div>
                </div>
                <div className="progress-track" role="progressbar" aria-label={`${selectedCategory.name} completion`} aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-fill" style={{ width: `${completion}%`, background: selectedCategory.color }} />
                </div>
                <div className="progress-foot"><span>{completedTasks.length} completed</span><span>{categoryTasks.length} total</span></div>
              </div>
            </div>

            <div className="task-toolbar">
              <div className="section-intro">
                <div className="section-icon"><ListTodo size={18} /></div>
                <div><h2>Your tasks</h2><p>A little progress is still progress.</p></div>
              </div>
              <button className="primary-button" onClick={openNewTask}><Plus size={17} /> Add task</button>
            </div>

            {activeTasks.length > 0 ? (
              <div className="task-list">
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    clock={clock}
                    onToggle={() => toggleTask(task.id)}
                    onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                    onEdit={() => openEditTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration"><Check size={25} /></div>
                <h3>{categoryTasks.length ? "All caught up" : "Make a little room for progress"}</h3>
                <p>{categoryTasks.length ? "Everything on your list is complete. Enjoy the breathing room." : "Add a task to this category and take it one step at a time."}</p>
                <button className="text-button" onClick={openNewTask}><Plus size={15} /> Add your first task</button>
              </div>
            )}

            <section className={`completed-section ${showCompleted ? "is-open" : ""}`}>
              <button className="completed-heading" onClick={() => setShowCompleted((open) => !open)} aria-expanded={showCompleted}>
                <span className="completed-heading-left"><span className="completed-icon"><Archive size={15} /></span><span>Completed</span><span className="completed-count">{completedTasks.length}</span></span>
                <span className="completed-heading-right">
                  {completedTasks.length > 0 && <span className="clear-button" onClick={(event) => { event.stopPropagation(); clearCompleted(); }}>Clear completed</span>}
                  <ChevronDown size={16} className="completed-chevron" />
                </span>
              </button>
              {showCompleted && (
                completedTasks.length ? (
                  <div className="task-list completed-list">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        clock={clock}
                        onToggle={() => toggleTask(task.id)}
                        onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                        onEdit={() => openEditTask(task)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="completed-empty">Finished tasks will find a home here.</p>
                )
              )}
            </section>
            <div className="page-footer"><span>Made for meaningful work</span><span className="footer-sparkle">✳</span></div>
          </section>
        ) : (
          <div className="no-category-state">
            <div className="empty-illustration"><LayoutGrid size={23} /></div>
            <h2>Your space, your pace.</h2>
            <p>Create a category to start organizing your tasks.</p>
            <button className="primary-button" onClick={() => setCategoryFormOpen(true)}><Plus size={17} /> Add a category</button>
          </div>
        )}
      </main>

      {taskModalOpen && (
        <TaskModal
          categoryId={selectedId}
          task={editingTask}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
          onSave={saveTask}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  clock,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
}: {
  task: Task;
  clock: number;
  onToggle: () => void;
  onToggleSubtask: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const subtaskProgress = getSubtaskProgress(task);
  const overdue = isOverdue(task.deadline, task.completed, clock);

  return (
    <article className={`task-card ${task.completed ? "task-completed" : ""}`}>
      <button
        className={`task-checkbox ${task.completed ? "checked" : ""}`}
        aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}
        onClick={onToggle}
      >
        {task.completed && <Check size={13} strokeWidth={3} />}
      </button>
      <div className="task-main">
        <div className="task-title-line">
          <button className="task-title" onClick={() => setExpanded((open) => !open)}>{task.title}</button>
          <div className="task-actions">
            {task.recurrence !== "none" && <span className="recurring-badge" title={`Repeats ${task.recurrence}`}><Repeat2 size={13} /></span>}
            <button className="task-action" aria-label={`Edit ${task.title}`} title="Edit task" onClick={onEdit}><ArrowUpRight size={15} /></button>
            <button className="task-action delete-task" aria-label={`Delete ${task.title}`} title="Delete task" onClick={onDelete}><Trash2 size={14} /></button>
          </div>
        </div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          {task.deadline && (
            <span className={`deadline-badge ${overdue ? "overdue" : ""}`}>
              {overdue ? <AlarmClock size={13} /> : <Clock3 size={13} />}
              {overdue ? "Overdue" : formatDeadline(task.deadline)}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <button className="subtask-meta" onClick={() => setExpanded((open) => !open)}>
              <span className="subtask-completion">{doneSubtasks}/{task.subtasks.length}</span> subtasks
              <span className="mini-track"><span style={{ width: `${subtaskProgress}%` }} /></span>
              <span className="mini-percent">{subtaskProgress}%</span>
            </button>
          )}
        </div>
        {expanded && task.subtasks.length > 0 && (
          <div className="subtask-list">
            {task.subtasks.map((subtask) => (
              <label className={`subtask-row ${subtask.completed ? "subtask-done" : ""}`} key={subtask.id}>
                <input type="checkbox" checked={subtask.completed} onChange={() => onToggleSubtask(subtask.id)} />
                <span className="subtask-check"><Check size={10} /></span>
                <span>{subtask.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function TaskModal({
  categoryId,
  task,
  onClose,
  onSave,
}: {
  categoryId: string;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(task?.recurrence ?? "none");
  const [subtasks, setSubtasks] = useState(
    task?.subtasks.map((subtask) => ({ ...subtask })) ?? [],
  );
  const [subtaskInput, setSubtaskInput] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedTitle = title.trim();
    if (!cleanedTitle) return;
    onSave({
      id: task?.id ?? createId(),
      categoryId,
      title: cleanedTitle,
      description: description.trim(),
      deadline,
      recurrence,
      completed: task?.completed ?? false,
      subtasks,
      createdAt: task?.createdAt ?? Date.now(),
      occurrenceOf: task?.occurrenceOf,
    });
  }

  function addSubtask() {
    const cleanedTitle = subtaskInput.trim();
    if (!cleanedTitle) return;
    setSubtasks((current) => [...current, { id: createId(), title: cleanedTitle, completed: false }]);
    setSubtaskInput("");
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-header">
          <div><span className="modal-eyebrow">{task ? "MAKE A CHANGE" : "NEW TASK"}</span><h2 id="task-modal-title">{task ? "Edit task" : "Add a task"}</h2></div>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="task-title">Task name</label>
          <input id="task-title" className="form-input title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What would you like to get done?" maxLength={120} autoFocus required />
          <label className="field-label" htmlFor="task-description">Description <span>Optional</span></label>
          <textarea id="task-description" className="form-input description-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a few details..." rows={3} maxLength={500} />
          <div className="form-two-col">
            <div><label className="field-label" htmlFor="task-deadline">Due date <span>Optional</span></label><input id="task-deadline" className="form-input" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></div>
            <div><label className="field-label" htmlFor="task-recurrence">Repeat</label><select id="task-recurrence" className="form-input" value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div className="field-label subtask-field-label">Subtasks <span>Optional</span></div>
          {subtasks.length > 0 && (
            <div className="modal-subtasks">
              {subtasks.map((subtask) => (
                <div className="modal-subtask-row" key={subtask.id}>
                  <span className="modal-subtask-dot"><Check size={10} /></span><span>{subtask.title}</span>
                  <button type="button" aria-label={`Remove ${subtask.title}`} onClick={() => setSubtasks((current) => current.filter((item) => item.id !== subtask.id))}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="add-subtask-form">
            <input
              value={subtaskInput}
              onChange={(event) => setSubtaskInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Add a step..."
              maxLength={100}
              aria-label="Subtask name"
            />
            <button type="button" onClick={addSubtask} disabled={!subtaskInput.trim()}><Plus size={15} /> Add</button>
          </div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={!title.trim()}>{task ? "Save changes" : "Create task"} <ArrowUpRight size={15} /></button></div>
        </form>
      </section>
    </div>
  );
}

export default App;
