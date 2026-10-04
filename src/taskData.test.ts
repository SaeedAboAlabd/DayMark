import { describe, expect, it, vi } from "vitest";
import {
  createCategory,
  getCategoryProgress,
  getSubtaskProgress,
  isOverdue,
  loadData,
  nextDeadline,
  removeCategory,
  removeTask,
  saveData,
  toggleSubtaskCompletion,
  toggleTaskCompletion,
  upsertTask,
  type StoredData,
  type Task,
} from "./taskData";

const emptyData: StoredData = { categories: [], tasks: [] };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    categoryId: "study",
    title: "Read",
    description: "",
    deadline: "",
    recurrence: "none",
    completed: false,
    subtasks: [],
    createdAt: 1,
    ...overrides,
  };
}

describe("categories and tasks", () => {
  it("creates and deletes categories together with their tasks", () => {
    const category = createCategory("  Study  ", [], "study");
    const data = {
      categories: [category],
      tasks: [makeTask(), makeTask({ id: "other", categoryId: "other" })],
    };

    expect(category.name).toBe("Study");
    expect(removeCategory(data, "study")).toEqual({
      categories: [],
      tasks: [makeTask({ id: "other", categoryId: "other" })],
    });
    expect(() => createCategory("study", [category], "duplicate")).toThrow(
      "A category with that name already exists.",
    );
  });

  it("creates, updates, completes, uncompletes, and deletes tasks", () => {
    const task = makeTask();
    const created = upsertTask(emptyData, task, false);
    const completed = toggleTaskCompletion(created, task.id);
    const uncompleted = toggleTaskCompletion(completed, task.id);
    const updated = upsertTask(uncompleted, { ...task, title: "Read more" }, true);

    expect(created.tasks).toEqual([task]);
    expect(completed.tasks[0].completed).toBe(true);
    expect(uncompleted.tasks[0].completed).toBe(false);
    expect(updated.tasks[0].title).toBe("Read more");
    expect(removeTask(updated, task.id).tasks).toEqual([]);
  });

  it("toggles subtasks and reports rounded task progress", () => {
    const task = makeTask({
      subtasks: [
        { id: "one", title: "One", completed: true },
        { id: "two", title: "Two", completed: false },
        { id: "three", title: "Three", completed: false },
      ],
    });
    const data = { ...emptyData, tasks: [task] };
    const updated = toggleSubtaskCompletion(data, task.id, "two");

    expect(updated.tasks[0].subtasks[1].completed).toBe(true);
    expect(getSubtaskProgress(updated.tasks[0])).toBe(67);
    expect(getSubtaskProgress(makeTask())).toBe(0);
  });

  it("calculates category completion including completed tasks only", () => {
    expect(
      getCategoryProgress([
        makeTask({ completed: true }),
        makeTask({ id: "two", completed: false }),
        makeTask({ id: "three", completed: true }),
      ]),
    ).toBe(67);
    expect(getCategoryProgress([])).toBe(0);
  });
});

describe("deadlines and recurring tasks", () => {
  it("marks only past, incomplete deadlines as overdue", () => {
    const now = new Date("2025-05-10T12:00:00").getTime();

    expect(isOverdue("2025-05-10T11:59", false, now)).toBe(true);
    expect(isOverdue("2025-05-10T12:00", false, now)).toBe(false);
    expect(isOverdue("2025-05-10T11:59", true, now)).toBe(false);
    expect(isOverdue("", false, now)).toBe(false);
  });

  it.each([
    ["daily", "2024-02-01T09:30"],
    ["weekly", "2024-02-07T09:30"],
    ["monthly", "2024-02-29T09:30"],
  ] as const)("schedules a fresh %s occurrence", (recurrence, nextDue) => {
    const task = makeTask({
      deadline: "2024-01-31T09:30",
      recurrence,
      subtasks: [{ id: "step", title: "Step", completed: true }],
    });
    let nextId = 0;
    const result = toggleTaskCompletion(
      { ...emptyData, tasks: [task] },
      task.id,
      () => `generated-${nextId++}`,
      100,
    );

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].completed).toBe(true);
    expect(result.tasks[1]).toMatchObject({
      id: "generated-0",
      occurrenceOf: task.id,
      deadline: nextDue,
      completed: false,
      createdAt: 100,
      subtasks: [{ id: "generated-1", title: "Step", completed: false }],
    });
  });

  it("clamps monthly deadlines to the target month's last day", () => {
    expect(nextDeadline("2025-01-31T09:30", "monthly")).toBe("2025-02-28T09:30");
  });

  it("does not duplicate a previously scheduled occurrence", () => {
    const recurringTask = makeTask({ recurrence: "daily" });
    const data = { ...emptyData, tasks: [recurringTask] };
    const scheduled = toggleTaskCompletion(data, recurringTask.id, () => "next");
    const reopened = toggleTaskCompletion(scheduled, recurringTask.id, () => "duplicate");
    const completedAgain = toggleTaskCompletion(reopened, recurringTask.id, () => "duplicate");

    expect(completedAgain.tasks).toHaveLength(2);
    expect(completedAgain.tasks[1].id).toBe("next");
  });
});

describe("LocalStorage persistence", () => {
  it("saves and restores the task data", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const data = { ...emptyData, tasks: [makeTask()] };

    saveData(data, storage);

    expect(loadData(storage)).toEqual(data);
  });

  it("reports malformed saved data and uses starter data", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = {
      getItem: () => JSON.stringify({ categories: [], tasks: [{}] }),
      setItem: () => {},
    };

    expect(loadData(storage).categories.length).toBeGreaterThan(0);
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it("reports storage write failures", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = { getItem: () => null, setItem: () => { throw new Error("quota"); } };

    saveData(emptyData, storage);

    expect(error).toHaveBeenCalledWith("Could not save task data.", expect.any(Error));
    error.mockRestore();
  });
});
