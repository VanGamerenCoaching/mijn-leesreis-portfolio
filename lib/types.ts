export type BookStatus = "not-started" | "reading" | "finished" | "stopped";

export type ReadingExperience = "fijn" | "lastig" | "spannend" | "leerzaam" | "anders";

export type GoalType = "pages" | "books" | "genres" | "sessions";

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  language: string;
  totalPages: number;
  startDate: string;
  status: BookStatus;
  favoriteQuote: string;
  reflection: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
};

export type ReadingSession = {
  id: string;
  bookId: string;
  date: string;
  fromPage: number;
  toPage: number;
  experience: ReadingExperience;
  note: string;
  createdAt: string;
};

export type ReportSectionId =
  | "bookInfo"
  | "summary"
  | "characters"
  | "setting"
  | "theme"
  | "opinion";

export type BookReport = {
  bookId: string;
  answers: Record<ReportSectionId, string>;
  updatedAt: string;
};

export type ReadingGoal = {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
};

export type PortfolioData = {
  books: Book[];
  sessions: ReadingSession[];
  reports: Record<string, BookReport>;
  goals: ReadingGoal[];
};
