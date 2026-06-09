import type {
  Book,
  BookReport,
  GoalType,
  PortfolioData,
  ReadingGoal,
  ReadingSession,
  ReportSectionId
} from "@/lib/types";

export const storageKey = "mijn-leesreis-portfolio-v1";

export const emptyData: PortfolioData = {
  books: [],
  sessions: [],
  reports: {},
  goals: []
};

export const statusLabels = {
  "not-started": "Nog niet begonnen",
  reading: "Bezig",
  finished: "Uitgelezen",
  stopped: "Gestopt"
} as const;

export const goalTypeLabels: Record<GoalType, string> = {
  pages: "Pagina's lezen",
  books: "Boeken uitlezen",
  genres: "Genres proberen",
  sessions: "Leesmomenten registreren"
};

export const reportSections: Array<{
  id: ReportSectionId;
  title: string;
  questions: string[];
}> = [
  {
    id: "bookInfo",
    title: "Boekgegevens",
    questions: [
      "Wat is de titel, wie is de auteur en welk genre heeft het boek?",
      "Waarom koos je dit boek?"
    ]
  },
  {
    id: "summary",
    title: "Korte inhoud",
    questions: [
      "Waar gaat het verhaal in het kort over?",
      "Welke gebeurtenis vond je belangrijk voor het verhaal?"
    ]
  },
  {
    id: "characters",
    title: "Personages",
    questions: [
      "Wie zijn de belangrijkste personages?",
      "Wat verandert er bij een personage tijdens het verhaal?"
    ]
  },
  {
    id: "setting",
    title: "Tijd en plaats",
    questions: [
      "Waar speelt het verhaal zich af?",
      "Wanneer speelt het verhaal zich af en merk je dat tijdens het lezen?"
    ]
  },
  {
    id: "theme",
    title: "Thema en boodschap",
    questions: [
      "Welk onderwerp of thema komt vaak terug?",
      "Welke boodschap of les zou de schrijver kunnen bedoelen?"
    ]
  },
  {
    id: "opinion",
    title: "Eigen mening",
    questions: [
      "Wat vond je van het boek en waarom?",
      "Aan wie zou je het boek aanraden?"
    ]
  }
];

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function pagesInSession(session: Pick<ReadingSession, "fromPage" | "toPage">) {
  return Math.max(0, session.toPage - session.fromPage + 1);
}

export function sessionsForBook(sessions: ReadingSession[], bookId: string) {
  return sessions
    .filter((session) => session.bookId === bookId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export function currentPageForBook(book: Book, sessions: ReadingSession[]) {
  const currentPage = sessionsForBook(sessions, book.id).reduce(
    (highest, session) => Math.max(highest, session.toPage),
    0
  );

  return Math.min(book.totalPages, currentPage);
}

export function totalPagesRead(sessions: ReadingSession[]) {
  return sessions.reduce((total, session) => total + pagesInSession(session), 0);
}

export function progressForBook(book: Book, sessions: ReadingSession[]) {
  if (!book.totalPages) {
    return 0;
  }

  return Math.min(100, Math.round((currentPageForBook(book, sessions) / book.totalPages) * 100));
}

export function isReportComplete(report?: BookReport) {
  if (!report) {
    return false;
  }

  return reportSections.every((section) => report.answers?.[section.id]?.trim().length > 0);
}

export function statsForData(data: PortfolioData) {
  const totalReadPages = totalPagesRead(data.sessions);
  const finishedBooks = data.books.filter((book) => book.status === "finished");
  const readingBooks = data.books.filter((book) => book.status === "reading");
  const bookById = new Map(data.books.map((book) => [book.id, book]));
  const readBookIds = new Set(data.sessions.map((session) => session.bookId));
  const readGenres = data.books
    .filter((book) => readBookIds.has(book.id) || book.status === "finished")
    .map((book) => book.genre.trim())
    .filter(Boolean)
    .map((genre) => genre.toLowerCase());

  const pagesByGenre = data.sessions.reduce<Record<string, number>>((counts, session) => {
    const genre = bookById.get(session.bookId)?.genre.trim().toLowerCase();

    if (!genre) {
      return counts;
    }

    counts[genre] = (counts[genre] || 0) + pagesInSession(session);
    return counts;
  }, {});
  const favoriteGenre =
    Object.entries(pagesByGenre).sort((a, b) => b[1] - a[1])[0]?.[0] || "Nog geen genre";
  const averagePages =
    data.sessions.length > 0 ? Math.round(totalReadPages / data.sessions.length) : 0;
  const completedReports = Object.values(data.reports).filter(isReportComplete);

  return {
    totalReadPages,
    finishedBooksCount: finishedBooks.length,
    readingBooksCount: readingBooks.length,
    readingSessionCount: data.sessions.length,
    favoriteGenre,
    averagePages,
    completedReportsCount: completedReports.length,
    triedGenresCount: new Set(readGenres).size
  };
}

function isDateInRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

export function progressForGoal(goal: ReadingGoal, data: PortfolioData) {
  const sessionsInPeriod = data.sessions.filter((session) =>
    isDateInRange(session.date, goal.startDate, goal.endDate)
  );
  const sessionBookIds = new Set(sessionsInPeriod.map((session) => session.bookId));
  const booksInPeriod = data.books.filter(
    (book) =>
      isDateInRange(book.startDate, goal.startDate, goal.endDate) || sessionBookIds.has(book.id)
  );
  const finishedBooksInPeriod = data.books.filter(
    (book) =>
      book.status === "finished" &&
      isDateInRange(book.updatedAt || book.startDate, goal.startDate, goal.endDate)
  );

  const valueByType: Record<GoalType, number> = {
    pages: totalPagesRead(sessionsInPeriod),
    books: finishedBooksInPeriod.length,
    genres: new Set(booksInPeriod.map((book) => book.genre.trim().toLowerCase()).filter(Boolean)).size,
    sessions: sessionsInPeriod.length
  };
  const value = valueByType[goal.type];
  const percentage = goal.target > 0 ? Math.min(100, Math.round((value / goal.target) * 100)) : 0;

  return {
    value,
    percentage
  };
}

export function badgeList(data: PortfolioData) {
  const stats = statsForData(data);

  return [
    {
      name: "Eerste stap",
      description: "Minstens 1 boek toegevoegd.",
      earned: data.books.length > 0
    },
    {
      name: "100 pagina's gelezen",
      description: "Totaal gelezen pagina's is 100 of meer.",
      earned: stats.totalReadPages >= 100
    },
    {
      name: "500 pagina's gelezen",
      description: "Totaal gelezen pagina's is 500 of meer.",
      earned: stats.totalReadPages >= 500
    },
    {
      name: "Boekenstarter",
      description: "Minstens 1 boek uitgelezen.",
      earned: stats.finishedBooksCount >= 1
    },
    {
      name: "Genreverkenner",
      description: "Minstens 3 verschillende genres gelezen.",
      earned: stats.triedGenresCount >= 3
    },
    {
      name: "Verslagmaker",
      description: "Minstens 1 boekverslag voltooid.",
      earned: stats.completedReportsCount >= 1
    },
    {
      name: "Leesritme",
      description: "Minstens 5 leesmomenten toegevoegd.",
      earned: stats.readingSessionCount >= 5
    }
  ];
}

export function normaliseData(value: unknown): PortfolioData {
  if (!value || typeof value !== "object") {
    return emptyData;
  }

  const possible = value as Partial<PortfolioData>;

  const goals = Array.isArray(possible.goals)
    ? possible.goals.map((goal) => {
        const storedGoal = goal as Partial<ReadingGoal> & { type?: string };
        const createdAt = storedGoal.createdAt || new Date().toISOString();
        const startDate = storedGoal.startDate || createdAt.slice(0, 10);
        const endDate = storedGoal.endDate || startDate;
        const rawType = String(storedGoal.type || "pages");
        const type = rawType === "weeklySessions" ? "sessions" : rawType;

        return {
          id: storedGoal.id || createId("doel"),
          title: storedGoal.title || "Leesdoel",
          type: ["pages", "books", "genres", "sessions"].includes(type) ? type : "pages",
          target: storedGoal.target || 1,
          startDate,
          endDate,
          createdAt,
          completed: Boolean(storedGoal.completed),
          completedAt: storedGoal.completedAt
        } as ReadingGoal;
      })
    : [];

  return {
    books: Array.isArray(possible.books) ? possible.books : [],
    sessions: Array.isArray(possible.sessions) ? possible.sessions : [],
    reports: possible.reports && typeof possible.reports === "object" ? possible.reports : {},
    goals
  };
}
