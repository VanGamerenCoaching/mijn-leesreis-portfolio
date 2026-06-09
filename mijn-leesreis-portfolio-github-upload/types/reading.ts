export type BookStatus = "not_started" | "reading" | "finished" | "stopped";

export type ReadingExperience =
  | "easy"
  | "normal"
  | "hard"
  | "fun"
  | "boring"
  | "exciting"
  | "confusing";

export type ReadingGoalType = "pages" | "books" | "genres" | "sessions";

export type BookReportSections = {
  summary: Record<string, string>;
  characters: Record<string, string>;
  setting: Record<string, string>;
  theme: Record<string, string>;
  opinion: Record<string, string>;
};

export type ReadingSession = {
  id: string;
  bookId: string;
  date: string;
  fromPage: number;
  toPage: number;
  experience: ReadingExperience;
  note: string;
};

export type BookReport = {
  bookId: string;
  sections: BookReportSections;
  completed: boolean;
  updatedAt: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  language: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  startedAt: string;
  finishedAt?: string;
  favoriteQuote?: string;
  finalReflection?: string;
  rating?: number;
  readingSessions: ReadingSession[];
  bookReport?: BookReport;
};

export type ReadingGoal = {
  id: string;
  title: string;
  type: ReadingGoalType;
  target: number;
  startDate: string;
  endDate: string;
  completed: boolean;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

export const bookStatusLabels: Record<BookStatus, string> = {
  not_started: "Nog niet begonnen",
  reading: "Bezig",
  finished: "Uitgelezen",
  stopped: "Gestopt"
};

export const readingExperienceLabels: Record<ReadingExperience, string> = {
  easy: "Makkelijk",
  normal: "Normaal",
  hard: "Moeilijk",
  fun: "Leuk",
  boring: "Saai",
  exciting: "Spannend",
  confusing: "Verwarrend"
};

function calculateSessionPages(session: ReadingSession): number {
  return Math.max(0, session.toPage - session.fromPage + 1);
}

export function calculateReadPages(book: Book): number {
  return book.readingSessions.reduce(
    (totalPages, session) => totalPages + calculateSessionPages(session),
    0
  );
}

export function calculateProgress(book: Book): number {
  if (book.totalPages <= 0) {
    return 0;
  }

  const currentPage = Math.min(Math.max(book.currentPage, 0), book.totalPages);
  return Math.round((currentPage / book.totalPages) * 100);
}

export function calculateTotalReadPages(books: Book[]): number {
  return books.reduce((totalPages, book) => totalPages + calculateReadPages(book), 0);
}

export function calculateFinishedBooks(books: Book[]): number {
  return books.filter((book) => book.status === "finished").length;
}

export function calculateMostReadGenre(books: Book[]): string {
  const pagesByGenre = books.reduce<Record<string, number>>((genres, book) => {
    const genre = book.genre.trim();

    if (!genre) {
      return genres;
    }

    genres[genre] = (genres[genre] ?? 0) + calculateReadPages(book);
    return genres;
  }, {});

  return Object.entries(pagesByGenre).sort(([, pagesA], [, pagesB]) => pagesB - pagesA)[0]?.[0] ?? "";
}

export function calculateAveragePagesPerSession(books: Book[]): number {
  const sessions = books.flatMap((book) => book.readingSessions);

  if (sessions.length === 0) {
    return 0;
  }

  const totalPages = sessions.reduce(
    (pageCount, session) => pageCount + calculateSessionPages(session),
    0
  );

  return Math.round(totalPages / sessions.length);
}

export function getBookStatusLabel(status: BookStatus): string {
  return bookStatusLabels[status];
}

export function getExperienceLabel(experience: ReadingExperience): string {
  return readingExperienceLabels[experience];
}
