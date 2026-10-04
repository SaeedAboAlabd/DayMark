export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type Subtask = { id: string; title: string; completed: boolean };
export type Task = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  deadline: string;
  recurrence: Recurrence;
  completed: boolean;
  subtasks: Subtask[];
  createdAt: number;
  occurrenceOf?: string;
};
export type Category = { id: string; name: string; color: string };
export type StoredData = { categories: Category[]; tasks: Task[] };

type DataStorage = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "daymark-data-v1";
const colors = ["#5776d8", "#df8b58", "#48a590", "#a177c5", "#d16e79"];
const starterCategories: Category[] = [
  { id: "study", name: "Study", color: "#5776d8" },
  { id: "work", name: "Work", color: "#df8b58" },
  { id: "programming", name: "Programming", color: "#48a590" },
  { id: "personal", name: "Personal", color: "#a177c5" },
];
const starterTasks: Task[] = [
  {
    id: "welcome-1",
    categoryId: "study",
    title: "Read a little every day",
    description: "Small, steady progress adds up. Pick up where you left off.",
    deadline: "",
    recurrence: "none",
    completed: false,
    subtasks: [
      { id: "welcome-sub-1", title: "Choose your next book", completed: true },
      { id: "welcome-sub-2", title: "Read for 20 minutes", completed: false },
    ],
    createdAt: Date.now(),
  },
  {
    id: "welcome-2",
    categoryId: "study",
    title: "Plan this week's learning",
    description: "",
    deadline: "",
    recurrence: "weekly",
    completed: false,
    subtasks: [],
    createdAt: Date.now(),
  },
  {
    id: "welcome-3",
    categoryId: "study",
    title: "Review yesterday's notes",
    description: "",
    deadline: "",
    recurrence: "none",
    completed: true,
    subtasks: [],
    createdAt: Date.now(),
  },
];

export function createInitialData(): StoredData {
  return { categories: starterCategories, tasks: starterTasks };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.color === "string"
  );
}

function isSubtask(value: unknown): value is Subtask {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.completed === "boolean"
  );
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.categoryId === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.deadline === "string" &&
    (value.recurrence === "none" ||
      value.recurrence === "daily" ||
      value.recurrence === "weekly" ||
      value.recurrence === "monthly") &&
    typeof value.completed === "boolean" &&
    Array.isArray(value.subtasks) &&
    value.subtasks.every(isSubtask) &&
    typeof value.createdAt === "number" &&
    (!("occurrenceOf" in value) || typeof value.occurrenceOf === "string")
  );
}

function isStoredData(value: unknown): value is StoredData {
  return (
    isRecord(value) &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategory) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

// Saved browser data is the source of truth after the first visit; malformed or inaccessible data is reported and falls back to the starter list.
export function loadData(storage: DataStorage): StoredData {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) return createInitialData();
    const parsed: unknown = JSON.parse(saved);
    if (isStoredData(parsed)) return parsed;
    throw new Error("Saved task data has an invalid shape.");
  } catch (error) {
    console.error("Could not load saved tasks.", error);
    return createInitialData();
  }
}

export function saveData(data: StoredData, storage: DataStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save task data.", error);
  }
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCategory(
  name: string,
  existingCategories: Category[],
  id = createId(),
): Category {
  const cleanedName = name.trim();
  if (!cleanedName) throw new Error("Category name cannot be empty.");
  if (existingCategories.some((category) => category.name.toLowerCase() === cleanedName.toLowerCase())) {
    throw new Error("A category with that name already exists.");
  }
  return {
    id,
    name: cleanedName,
    color: colors[existingCategories.length % colors.length],
  };
}

export function removeCategory(data: StoredData, categoryId: string): StoredData {
  return {
    categories: data.categories.filter((category) => category.id !== categoryId),
    tasks: data.tasks.filter((task) => task.categoryId !== categoryId),
  };
}

export function upsertTask(data: StoredData, task: Task, editing: boolean): StoredData {
  return {
    ...data,
    tasks: editing
      ? data.tasks.map((item) => (item.id === task.id ? task : item))
      : [...data.tasks, task],
  };
}

export function removeTask(data: StoredData, taskId: string): StoredData {
  return { ...data, tasks: data.tasks.filter((task) => task.id !== taskId) };
}

// Each completed occurrence schedules one next occurrence; a monthly date is clamped to the target month's final day.
export function nextDeadline(dateString: string, recurrence: Recurrence): string {
  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) return "";
  if (recurrence === "daily") due.setDate(due.getDate() + 1);
  if (recurrence === "weekly") due.setDate(due.getDate() + 7);
  if (recurrence === "monthly") {
    const originalDay = due.getDate();
    due.setDate(1);
    due.setMonth(due.getMonth() + 1);
    const finalDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate();
    due.setDate(Math.min(originalDay, finalDay));
  }
  const offset = due.getTimezoneOffset();
  return new Date(due.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function toggleTaskCompletion(
  data: StoredData,
  taskId: string,
  idFactory = createId,
  now = Date.now(),
): StoredData {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return data;

  const completing = !task.completed;
  let tasks = data.tasks.map((item) =>
    item.id === taskId ? { ...item, completed: completing } : item,
  );
  if (completing && task.recurrence !== "none") {
    const alreadyScheduled = tasks.some((item) => item.occurrenceOf === task.id);
    if (!alreadyScheduled) {
      tasks = [
        ...tasks,
        {
          ...task,
          id: idFactory(),
          deadline: task.deadline ? nextDeadline(task.deadline, task.recurrence) : "",
          completed: false,
          subtasks: task.subtasks.map((subtask) => ({
            ...subtask,
            id: idFactory(),
            completed: false,
          })),
          createdAt: now,
          occurrenceOf: task.id,
        },
      ];
    }
  }
  return { ...data, tasks };
}

export function toggleSubtaskCompletion(
  data: StoredData,
  taskId: string,
  subtaskId: string,
): StoredData {
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, completed: !subtask.completed }
                : subtask,
            ),
          }
        : task,
    ),
  };
}

export function getSubtaskProgress(task: Task): number {
  if (!task.subtasks.length) return 0;
  const completed = task.subtasks.filter((subtask) => subtask.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
}

export function getCategoryProgress(tasks: Task[]): number {
  if (!tasks.length) return 0;
  const completed = tasks.filter((task) => task.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

// A deadline is overdue only after its exact time and while its task remains incomplete.
export function isOverdue(deadline: string, completed: boolean, now: number): boolean {
  return Boolean(deadline) && new Date(deadline).getTime() < now && !completed;
}
