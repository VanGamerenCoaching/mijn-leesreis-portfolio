import type { Book, ReadingGoal } from "@/types/reading";

export const BOOKS_STORAGE_KEY = "mijn-leesreis-books";
export const GOALS_STORAGE_KEY = "mijn-leesreis-goals";

type StoredBook = Book & {
  updatedAt?: string;
};

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readArrayFromStorage<T>(key: string): T[] {
  const storage = getLocalStorage();

  if (!storage) {
    return [];
  }

  try {
    const value = storage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArrayToStorage<T>(key: string, items: T[]): void {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage can fail in private mode or when storage is full.
  }
}

function toTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getBookSortTimestamp(book: Book): number {
  const storedBook = book as StoredBook;

  return Math.max(
    toTimestamp(storedBook.updatedAt),
    toTimestamp(book.bookReport?.updatedAt),
    toTimestamp(book.finishedAt),
    toTimestamp(book.startedAt)
  );
}

function sortBooks(books: Book[]): Book[] {
  return [...books].sort((bookA, bookB) => getBookSortTimestamp(bookB) - getBookSortTimestamp(bookA));
}

function sortGoals(goals: ReadingGoal[]): ReadingGoal[] {
  return [...goals].sort((goalA, goalB) => toTimestamp(goalA.endDate) - toTimestamp(goalB.endDate));
}

export function getBooks(): Book[] {
  return sortBooks(readArrayFromStorage<Book>(BOOKS_STORAGE_KEY));
}

export function saveBooks(books: Book[]): void {
  writeArrayToStorage(BOOKS_STORAGE_KEY, sortBooks(books));
}

export function addBook(book: Book): void {
  const books = getBooks().filter((storedBook) => storedBook.id !== book.id);
  saveBooks([book, ...books]);
}

export function updateBook(book: Book): void {
  const books = getBooks();
  const bookExists = books.some((storedBook) => storedBook.id === book.id);
  const nextBooks = bookExists
    ? books.map((storedBook) => (storedBook.id === book.id ? book : storedBook))
    : [book, ...books];

  saveBooks(nextBooks);
}

export function deleteBook(bookId: string): void {
  saveBooks(getBooks().filter((book) => book.id !== bookId));
}

export function getBookById(bookId: string): Book | undefined {
  return getBooks().find((book) => book.id === bookId);
}

export function getGoals(): ReadingGoal[] {
  return sortGoals(readArrayFromStorage<ReadingGoal>(GOALS_STORAGE_KEY));
}

export function saveGoals(goals: ReadingGoal[]): void {
  writeArrayToStorage(GOALS_STORAGE_KEY, sortGoals(goals));
}

export function addGoal(goal: ReadingGoal): void {
  const goals = getGoals().filter((storedGoal) => storedGoal.id !== goal.id);
  saveGoals([...goals, goal]);
}

export function updateGoal(goal: ReadingGoal): void {
  const goals = getGoals();
  const goalExists = goals.some((storedGoal) => storedGoal.id === goal.id);
  const nextGoals = goalExists
    ? goals.map((storedGoal) => (storedGoal.id === goal.id ? goal : storedGoal))
    : [...goals, goal];

  saveGoals(nextGoals);
}

export function deleteGoal(goalId: string): void {
  saveGoals(getGoals().filter((goal) => goal.id !== goalId));
}
