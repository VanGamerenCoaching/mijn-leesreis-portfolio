"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarPlus,
  Check,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  FileText,
  Flag,
  Home,
  Info,
  Library,
  Plus,
  Printer,
  Save,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import type {
  Book,
  BookStatus,
  GoalType,
  PortfolioData,
  ReadingExperience,
  ReadingGoal,
  ReportSectionId
} from "@/lib/types";
import {
  badgeList,
  createId,
  currentPageForBook,
  emptyData,
  goalTypeLabels,
  isReportComplete,
  normaliseData,
  pagesInSession,
  progressForBook,
  progressForGoal,
  reportSections,
  sessionsForBook,
  statsForData,
  statusLabels,
  storageKey
} from "@/lib/reading";

type View =
  | "dashboard"
  | "books"
  | "add-book"
  | "book-detail"
  | "reading-session"
  | "report"
  | "goals"
  | "stats"
  | "portfolio"
  | "about";

type BookFormState = {
  title: string;
  author: string;
  genre: string;
  language: string;
  totalPages: string;
  startDate: string;
  status: BookStatus;
  favoriteQuote: string;
  reflection: string;
  rating: string;
};

type GoalFormState = {
  title: string;
  type: GoalType;
  target: string;
  startDate: string;
  endDate: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const dateAfterDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const navItems: Array<{ href: string; label: string; icon: typeof Home; view: View }> = [
  { href: "/", label: "Dashboard", icon: Home, view: "dashboard" },
  { href: "/boeken", label: "Mijn boeken", icon: Library, view: "books" },
  { href: "/leesmoment", label: "Leesmoment", icon: CalendarPlus, view: "reading-session" },
  { href: "/boekverslag", label: "Boekverslag", icon: ClipboardList, view: "report" },
  { href: "/leesdoelen", label: "Leesdoelen", icon: Target, view: "goals" },
  { href: "/statistieken", label: "Statistieken", icon: BarChart3, view: "stats" },
  { href: "/portfolio", label: "Portfolio", icon: FileText, view: "portfolio" },
  { href: "/over", label: "Over/privacy", icon: Info, view: "about" }
];

const defaultBookForm: BookFormState = {
  title: "",
  author: "",
  genre: "",
  language: "Nederlands",
  totalPages: "",
  startDate: today(),
  status: "not-started",
  favoriteQuote: "",
  reflection: "",
  rating: ""
};

const defaultGoalForm: GoalFormState = {
  title: "",
  type: "pages",
  target: "",
  startDate: today(),
  endDate: dateAfterDays(30)
};

function usePortfolioData() {
  const [data, setData] = useState<PortfolioData>(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setData(stored ? normaliseData(JSON.parse(stored)) : emptyData);
    } catch {
      setData(emptyData);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [data, loaded]);

  return { data, setData, loaded };
}

export function AppView({ view }: { view: View }) {
  const { data, setData, loaded } = usePortfolioData();

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-leaf text-paper shadow-soft">
              <BookOpen aria-hidden="true" size={26} />
            </span>
            <span>
              <span className="block text-xl font-bold text-ink">Mijn Leesreis Portfolio</span>
              <span className="block text-sm text-ink/70">Lees, denk na en bewaar je groei</span>
            </span>
          </Link>
          <Link
            href="/boeken/nieuw"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-base font-semibold text-paper shadow-soft transition hover:bg-ink/90"
          >
            <Plus aria-hidden="true" size={20} />
            Boek toevoegen
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8">
        <aside className="no-print lg:sticky lg:top-6 lg:self-start">
          <nav className="grid gap-2 rounded-lg border border-ink/10 bg-white p-2 shadow-soft sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.view === view;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-sky text-white" : "text-ink/75 hover:bg-chalk hover:text-ink"
                  }`}
                >
                  <Icon aria-hidden="true" size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>
          {!loaded ? (
            <Panel>
              <p className="text-ink/70">Portfolio laden...</p>
            </Panel>
          ) : (
            <Screen view={view} data={data} setData={setData} />
          )}
        </main>
      </div>
    </div>
  );
}

function Screen({
  view,
  data,
  setData
}: {
  view: View;
  data: PortfolioData;
  setData: (updater: PortfolioData | ((data: PortfolioData) => PortfolioData)) => void;
}) {
  switch (view) {
    case "dashboard":
      return <Dashboard data={data} />;
    case "books":
      return <BooksPage data={data} setData={setData} />;
    case "add-book":
      return <AddBookPage setData={setData} />;
    case "book-detail":
      return <BookDetailPage data={data} setData={setData} />;
    case "reading-session":
      return <ReadingSessionPage data={data} setData={setData} />;
    case "report":
      return <ReportPage data={data} setData={setData} />;
    case "goals":
      return <GoalsPage data={data} setData={setData} />;
    case "stats":
      return <StatsPage data={data} />;
    case "portfolio":
      return <PortfolioPage data={data} />;
    case "about":
      return <AboutPage />;
    default:
      return null;
  }
}

function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="mb-6 flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-berry">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-ink/70">{description}</p>
      </div>
      {action}
    </section>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-ink/10 bg-white p-5 shadow-soft ${className}`}>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-chalk text-ink">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-chalk" aria-label={`${percentage}%`}>
      <div className="h-full rounded-full bg-leaf" style={{ width: `${percentage}%` }} />
    </div>
  );
}

function Dashboard({ data }: { data: PortfolioData }) {
  const stats = statsForData(data);
  const activeBooks = data.books.filter((book) => book.status === "reading").slice(0, 3);
  const activeGoals = data.goals.filter((goal) => !goal.completed).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Welkom bij je leesreis"
        description="Bekijk waar je mee bezig bent, voeg snel een boek of leesmoment toe en zie hoe je portfolio groeit."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="button-primary" href="/boeken/nieuw">
              <Plus aria-hidden="true" size={20} />
              Boek toevoegen
            </Link>
            <Link className="button-secondary" href="/leesmoment">
              <CalendarPlus aria-hidden="true" size={20} />
              Leesmoment
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gelezen pagina's" value={stats.totalReadPages} icon={<BookOpen size={22} />} />
        <StatCard label="Uitgelezen boeken" value={stats.finishedBooksCount} icon={<Check size={22} />} />
        <StatCard label="Leesmomenten" value={stats.readingSessionCount} icon={<CalendarPlus size={22} />} />
        <StatCard label="Meest gelezen genre" value={stats.favoriteGenre} icon={<Library size={22} />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Nu aan het lezen</h2>
            <Link className="text-sm font-bold text-sky hover:underline" href="/boeken">
              Alle boeken
            </Link>
          </div>
          {activeBooks.length ? (
            <div className="grid gap-4">
              {activeBooks.map((book) => (
                <BookMiniRow key={book.id} book={book} data={data} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nog geen actief boek"
              text="Voeg een boek toe of zet de status op bezig om hier voortgang te zien."
            />
          )}
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Leesdoelen</h2>
            <Link className="text-sm font-bold text-sky hover:underline" href="/leesdoelen">
              Naar doelen
            </Link>
          </div>
          {activeGoals.length ? (
            <div className="grid gap-4">
              {activeGoals.map((goal) => {
                const progress = progressForGoal(goal, data);
                return (
                  <div key={goal.id} className="rounded-md border border-ink/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{goal.title}</p>
                        <p className="text-sm text-ink/70">
                          {progress.value} van {goal.target} - {goalTypeLabels[goal.type]}
                        </p>
                      </div>
                      <span className="rounded-full bg-chalk px-3 py-1 text-sm font-bold text-ink">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar percentage={progress.percentage} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nog geen actief doel"
              text="Maak een doel aan om gericht aan je portfolio te werken."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function BookMiniRow({ book, data }: { book: Book; data: PortfolioData }) {
  const progress = progressForBook(book, data.sessions);
  const currentPage = currentPageForBook(book, data.sessions);

  return (
    <Link href={`/boek?id=${book.id}`} className="rounded-md border border-ink/10 p-4 transition hover:border-sky">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{book.title}</p>
          <p className="text-sm text-ink/70">
            {book.author} - {book.genre || "Geen genre"}
          </p>
        </div>
        <span className="rounded-full bg-sky/10 px-3 py-1 text-sm font-bold text-sky">
          {statusLabels[book.status]}
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar percentage={progress} />
        <p className="mt-2 text-sm text-ink/70">
          Pagina {currentPage} van {book.totalPages} ({progress}%)
        </p>
      </div>
    </Link>
  );
}

function BooksPage({
  data,
  setData
}: {
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Mijn boeken"
        title="Je boekenplank"
        description="Alle boeken die je toevoegt verschijnen hier als kaarten met status, voortgang en snelle acties."
        action={
          <Link className="button-primary" href="/boeken/nieuw">
            <Plus aria-hidden="true" size={20} />
            Boek toevoegen
          </Link>
        }
      />

      {data.books.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.books.map((book) => (
            <BookCard key={book.id} book={book} data={data} setData={setData} />
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState
            title="Je boekenplank is nog leeg"
            text="Voeg je eerste boek toe om je leesreis te starten."
          />
        </Panel>
      )}
    </>
  );
}

function BookCard({
  book,
  data,
  setData
}: {
  book: Book;
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const progress = progressForBook(book, data.sessions);
  const currentPage = currentPageForBook(book, data.sessions);

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">{book.title}</h2>
          <p className="mt-1 text-sm text-ink/70">{book.author}</p>
        </div>
        <span className="rounded-full bg-chalk px-3 py-1 text-sm font-bold text-ink">
          {statusLabels[book.status]}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-semibold text-ink/60">Genre</dt>
          <dd className="text-ink">{book.genre || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink/60">Taal</dt>
          <dd className="text-ink">{book.language || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink/60">Startdatum</dt>
          <dd className="text-ink">{book.startDate || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink/60">Pagina</dt>
          <dd className="text-ink">
            {currentPage}/{book.totalPages}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <ProgressBar percentage={progress} />
        <p className="mt-2 text-sm font-semibold text-ink/70">{progress}% gelezen</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className="button-secondary flex-1" href={`/boek?id=${book.id}`}>
          <BookOpen aria-hidden="true" size={18} />
          Details
        </Link>
        <button
          type="button"
          className="icon-button text-berry"
          aria-label={`${book.title} verwijderen`}
          onClick={() => removeBook(book.id, setData)}
        >
          <Trash2 aria-hidden="true" size={19} />
        </button>
      </div>
    </article>
  );
}

function removeBook(
  bookId: string,
  setData: (updater: (data: PortfolioData) => PortfolioData) => void
) {
  const confirmed = window.confirm(
    "Weet je zeker dat je dit boek wilt verwijderen? Leesmomenten en verslagantwoorden bij dit boek worden ook verwijderd."
  );

  if (!confirmed) {
    return;
  }

  setData((current) => {
    const reports = { ...current.reports };
    delete reports[bookId];

    return {
      books: current.books.filter((book) => book.id !== bookId),
      sessions: current.sessions.filter((session) => session.bookId !== bookId),
      reports,
      goals: current.goals
    };
  });
}

function AddBookPage({
  setData
}: {
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const [form, setForm] = useState<BookFormState>(defaultBookForm);
  const [message, setMessage] = useState("");

  return (
    <>
      <PageHeader
        eyebrow="Boek toevoegen"
        title="Nieuw boek op je plank"
        description="Vul de basisgegevens in. Je huidige pagina wordt straks automatisch berekend uit je leesmomenten."
      />
      <BookForm
        form={form}
        setForm={setForm}
        submitLabel="Boek opslaan"
        message={message}
        onSubmit={() => {
          const validation = validateBookForm(form);
          if (validation) {
            setMessage(validation);
            return;
          }

          const now = new Date().toISOString();
          const book: Book = {
            id: createId("boek"),
            title: form.title.trim(),
            author: form.author.trim(),
            genre: form.genre.trim(),
            language: form.language.trim(),
            totalPages: Number(form.totalPages),
            startDate: form.startDate,
            status: form.status,
            favoriteQuote: form.favoriteQuote.trim(),
            reflection: form.reflection.trim(),
            rating: form.rating ? Number(form.rating) : undefined,
            createdAt: now,
            updatedAt: now
          };

          setData((current) => ({
            ...current,
            books: [book, ...current.books]
          }));
          setForm({ ...defaultBookForm, startDate: today() });
          setMessage("Boek opgeslagen. Je kunt nu leesmomenten toevoegen.");
        }}
      />
    </>
  );
}

function BookDetailPage({
  data,
  setData
}: {
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id") || "";
  const book = data.books.find((item) => item.id === bookId);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<BookFormState>(defaultBookForm);

  useEffect(() => {
    if (book) {
      setForm(bookToForm(book));
      setMessage("");
      setEditing(false);
    }
  }, [book?.id]);

  if (!book) {
    return (
      <PageHeader
        eyebrow="Boekdetail"
        title="Boek niet gevonden"
        description="Kies een boek vanaf je boekenplank om de details te bekijken."
        action={
          <Link className="button-primary" href="/boeken">
            <Library aria-hidden="true" size={20} />
            Naar mijn boeken
          </Link>
        }
      />
    );
  }

  const bookSessions = sessionsForBook(data.sessions, book.id);
  const currentPage = currentPageForBook(book, data.sessions);
  const progress = progressForBook(book, data.sessions);
  const report = data.reports[book.id];

  return (
    <>
      <PageHeader
        eyebrow="Boekdetail"
        title={book.title}
        description={`${book.author} - ${book.genre || "geen genre"} - ${statusLabels[book.status]}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="button-primary" href={`/leesmoment?book=${book.id}`}>
              <CalendarPlus aria-hidden="true" size={20} />
              Leesmoment
            </Link>
            <button type="button" className="button-secondary" onClick={() => setEditing((value) => !value)}>
              <Edit3 aria-hidden="true" size={19} />
              {editing ? "Sluiten" : "Bewerken"}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-6">
          <Panel>
            <h2 className="text-xl font-bold text-ink">Voortgang</h2>
            <div className="mt-4">
              <ProgressBar percentage={progress} />
              <p className="mt-3 text-sm font-semibold text-ink/70">
                Pagina {currentPage} van {book.totalPages} - {progress}% gelezen
              </p>
            </div>
          </Panel>

          {editing ? (
            <BookForm
              form={form}
              setForm={setForm}
              submitLabel="Wijzigingen opslaan"
              message={message}
              onSubmit={() => {
                const validation = validateBookForm(form);
                if (validation) {
                  setMessage(validation);
                  return;
                }

                setData((current) => ({
                  ...current,
                  books: current.books.map((item) =>
                    item.id === book.id
                      ? {
                          ...item,
                          title: form.title.trim(),
                          author: form.author.trim(),
                          genre: form.genre.trim(),
                          language: form.language.trim(),
                          totalPages: Number(form.totalPages),
                          startDate: form.startDate,
                          status: form.status,
                          favoriteQuote: form.favoriteQuote.trim(),
                          reflection: form.reflection.trim(),
                          rating: form.rating ? Number(form.rating) : undefined,
                          updatedAt: new Date().toISOString()
                        }
                      : item
                  )
                }));
                setMessage("Wijzigingen opgeslagen.");
                setEditing(false);
              }}
            />
          ) : null}

          <Panel>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-ink">Leeslogboek</h2>
              <Link className="button-secondary" href={`/leesmoment?book=${book.id}`}>
                <Plus aria-hidden="true" size={18} />
                Moment toevoegen
              </Link>
            </div>
            {bookSessions.length ? (
              <div className="grid gap-3">
                {bookSessions.map((session) => (
                  <div key={session.id} className="rounded-md border border-ink/10 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-ink">
                          {session.date} - pagina {session.fromPage} t/m {session.toPage}
                        </p>
                        <p className="text-sm text-ink/70">
                          {pagesInSession(session)} pagina's - {session.experience}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-button text-berry"
                        aria-label="Leesmoment verwijderen"
                        onClick={() =>
                          setData((current) => ({
                            ...current,
                            sessions: current.sessions.filter((item) => item.id !== session.id)
                          }))
                        }
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                    {session.note ? <p className="mt-3 text-sm leading-6 text-ink/75">{session.note}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nog geen leesmomenten"
                text="Voeg een leesmoment toe om je huidige pagina en voortgang te berekenen."
              />
            )}
          </Panel>
        </div>

        <div className="grid gap-6 self-start">
          <Panel>
            <h2 className="text-xl font-bold text-ink">Boekgegevens</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <InfoRow label="Titel" value={book.title} />
              <InfoRow label="Auteur" value={book.author} />
              <InfoRow label="Genre" value={book.genre || "-"} />
              <InfoRow label="Taal" value={book.language || "-"} />
              <InfoRow label="Startdatum" value={book.startDate || "-"} />
              <InfoRow label="Status" value={statusLabels[book.status]} />
            </dl>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold text-ink">Portfolio bouwstenen</h2>
            <p className="mt-2 text-sm text-ink/70">
              Boekverslag: {isReportComplete(report) ? "afgerond" : "nog niet afgerond"}
            </p>
            {book.favoriteQuote ? (
              <blockquote className="mt-4 rounded-md bg-chalk p-4 text-sm leading-6 text-ink/80">
                "{book.favoriteQuote}"
              </blockquote>
            ) : null}
            {book.reflection ? <p className="mt-4 text-sm leading-6 text-ink/80">{book.reflection}</p> : null}
          </Panel>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 pb-2">
      <dt className="font-semibold text-ink/60">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

function BookForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  message
}: {
  form: BookFormState;
  setForm: (form: BookFormState) => void;
  onSubmit: () => void;
  submitLabel: string;
  message: string;
}) {
  return (
    <Panel>
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Titel" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
          <TextField
            label="Auteur"
            value={form.author}
            onChange={(value) => setForm({ ...form, author: value })}
            required
          />
          <TextField label="Genre" value={form.genre} onChange={(value) => setForm({ ...form, genre: value })} />
          <TextField label="Taal" value={form.language} onChange={(value) => setForm({ ...form, language: value })} />
          <TextField
            label="Totaal aantal pagina's"
            value={form.totalPages}
            onChange={(value) => setForm({ ...form, totalPages: digitsOnly(value) })}
            inputMode="numeric"
            required
          />
          <TextField
            label="Startdatum"
            type="date"
            value={form.startDate}
            onChange={(value) => setForm({ ...form, startDate: value })}
            required
          />
          <label className="grid gap-2">
            <span className="text-sm font-bold text-ink">Status</span>
            <select
              className="input-field"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as BookStatus })}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextArea
          label="Favoriete quote"
          value={form.favoriteQuote}
          onChange={(value) => setForm({ ...form, favoriteQuote: value })}
          rows={3}
        />
        <TextArea
          label="Reflectie"
          value={form.reflection}
          onChange={(value) => setForm({ ...form, reflection: value })}
          rows={4}
        />
        <TextField
          label="Rating (1-5)"
          value={form.rating}
          onChange={(value) => setForm({ ...form, rating: digitsOnly(value).slice(0, 1) })}
          inputMode="numeric"
        />
        {message ? <p className="rounded-md bg-chalk px-4 py-3 text-sm font-semibold text-ink">{message}</p> : null}
        <div>
          <button type="submit" className="button-primary">
            <Save aria-hidden="true" size={20} />
            {submitLabel}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function validateBookForm(form: BookFormState) {
  if (!form.title.trim() || !form.author.trim()) {
    return "Vul ten minste titel en auteur in.";
  }

  if (!/^\d+$/.test(form.totalPages) || Number(form.totalPages) <= 0) {
    return "Het totaal aantal pagina's moet uit cijfers bestaan en groter zijn dan 0.";
  }

  if (form.rating && (Number(form.rating) < 1 || Number(form.rating) > 5)) {
    return "Rating moet een cijfer van 1 tot en met 5 zijn.";
  }

  return "";
}

function bookToForm(book: Book): BookFormState {
  return {
    title: book.title,
    author: book.author,
    genre: book.genre,
    language: book.language,
    totalPages: String(book.totalPages),
    startDate: book.startDate,
    status: book.status,
    favoriteQuote: book.favoriteQuote,
    reflection: book.reflection,
    rating: book.rating ? String(book.rating) : ""
  };
}

function ReadingSessionPage({
  data,
  setData
}: {
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const searchParams = useSearchParams();
  const requestedBook = searchParams.get("book") || "";
  const [bookId, setBookId] = useState(requestedBook);
  const [date, setDate] = useState(today());
  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState("");
  const [experience, setExperience] = useState<ReadingExperience>("fijn");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const book = data.books.find((item) => item.id === bookId);

  useEffect(() => {
    if (requestedBook) {
      setBookId(requestedBook);
    } else if (!bookId && data.books[0]) {
      setBookId(data.books[0].id);
    }
  }, [requestedBook, data.books, bookId]);

  const currentPage = book ? currentPageForBook(book, data.sessions) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Leesmoment toevoegen"
        title="Leg je leestijd vast"
        description="Na elk leesmoment rekent de app automatisch je gelezen pagina's, huidige pagina en voortgang uit."
      />

      <Panel>
        {data.books.length ? (
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!book) {
                setMessage("Kies eerst een boek.");
                return;
              }

              const validation = validateSession(fromPage, toPage, book.totalPages);
              if (validation) {
                setMessage(validation);
                return;
              }

              const from = Number(fromPage);
              const to = Number(toPage);
              const session = {
                id: createId("leesmoment"),
                bookId: book.id,
                date,
                fromPage: from,
                toPage: to,
                experience,
                note: note.trim(),
                createdAt: new Date().toISOString()
              };

              setData((current) => ({
                ...current,
                sessions: [session, ...current.sessions],
                books: current.books.map((item) => {
                  if (item.id !== book.id) {
                    return item;
                  }

                  const nextStatus =
                    to >= item.totalPages ? "finished" : item.status === "stopped" ? "stopped" : "reading";

                  return {
                    ...item,
                    status: nextStatus,
                    updatedAt: new Date().toISOString()
                  };
                })
              }));
              setFromPage("");
              setToPage("");
              setNote("");
              setMessage(`Leesmoment opgeslagen: ${to - from + 1} pagina's gelezen.`);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Boek</span>
                <select className="input-field" value={bookId} onChange={(event) => setBookId(event.target.value)}>
                  {data.books.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} - {item.author}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Datum" type="date" value={date} onChange={setDate} required />
              <TextField
                label="Van pagina"
                value={fromPage}
                onChange={(value) => setFromPage(digitsOnly(value))}
                inputMode="numeric"
                required
              />
              <TextField
                label="Tot pagina"
                value={toPage}
                onChange={(value) => setToPage(digitsOnly(value))}
                inputMode="numeric"
                required
              />
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Leeservaring</span>
                <select
                  className="input-field"
                  value={experience}
                  onChange={(event) => setExperience(event.target.value as ReadingExperience)}
                >
                  <option value="fijn">Fijn</option>
                  <option value="lastig">Lastig</option>
                  <option value="spannend">Spannend</option>
                  <option value="leerzaam">Leerzaam</option>
                  <option value="anders">Anders</option>
                </select>
              </label>
            </div>
            <TextArea label="Notitie" value={note} onChange={setNote} rows={4} />
            {book ? (
              <div className="rounded-md bg-chalk px-4 py-3 text-sm text-ink/75">
                Nu bekend: pagina {currentPage} van {book.totalPages}. Dit formulier accepteert alleen cijfers en controleert de paginagrenzen.
              </div>
            ) : null}
            {message ? <p className="rounded-md bg-chalk px-4 py-3 text-sm font-semibold text-ink">{message}</p> : null}
            <div>
              <button type="submit" className="button-primary">
                <Save aria-hidden="true" size={20} />
                Leesmoment opslaan
              </button>
            </div>
          </form>
        ) : (
          <EmptyState
            title="Voeg eerst een boek toe"
            text="Een leesmoment hoort altijd bij een boek op je boekenplank."
            action={
              <Link className="button-primary" href="/boeken/nieuw">
                <Plus aria-hidden="true" size={20} />
                Boek toevoegen
              </Link>
            }
          />
        )}
      </Panel>
    </>
  );
}

function validateSession(fromPage: string, toPage: string, totalPages: number) {
  if (!/^\d+$/.test(fromPage) || !/^\d+$/.test(toPage)) {
    return "Pagina's moeten cijfers zijn.";
  }

  const from = Number(fromPage);
  const to = Number(toPage);

  if (from <= 0 || to <= 0) {
    return "Pagina's moeten groter zijn dan 0.";
  }

  if (to < from) {
    return "Tot pagina mag niet lager zijn dan van pagina.";
  }

  if (to > totalPages) {
    return "Tot pagina mag niet hoger zijn dan het totaal aantal pagina's van het boek.";
  }

  return "";
}

function ReportPage({
  data,
  setData
}: {
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const [bookId, setBookId] = useState(data.books[0]?.id || "");
  const book = data.books.find((item) => item.id === bookId);
  const report = book ? data.reports[book.id] : undefined;
  const [activeSection, setActiveSection] = useState<ReportSectionId>("bookInfo");

  useEffect(() => {
    if (!bookId && data.books[0]) {
      setBookId(data.books[0].id);
    }
  }, [bookId, data.books]);

  const bookNotes = book ? sessionsForBook(data.sessions, book.id).filter((session) => session.note.trim()) : [];

  return (
    <>
      <PageHeader
        eyebrow="Boekverslag-helper"
        title="Bereid je boekverslag voor"
        description="De app schrijft niets voor je. Je vult vaste vragen in en gebruikt je eigen antwoorden later als bouwstenen."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel>
          {data.books.length ? (
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-ink">Kies een boek</span>
                <select
                  className="input-field"
                  value={bookId}
                  onChange={(event) => {
                    setBookId(event.target.value);
                    setActiveSection("bookInfo");
                  }}
                >
                  {data.books.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} - {item.author}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {reportSections.map((section) => (
                  <button
                    type="button"
                    key={section.id}
                    className={`min-h-12 rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
                      activeSection === section.id
                        ? "border-sky bg-sky text-white"
                        : "border-ink/10 bg-white text-ink hover:bg-chalk"
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </div>

              {book ? (
                <ReportSectionEditor
                  sectionId={activeSection}
                  value={report?.answers?.[activeSection] || ""}
                  onChange={(value) =>
                    setData((current) => {
                      const existing = current.reports[book.id];
                      return {
                        ...current,
                        reports: {
                          ...current.reports,
                          [book.id]: {
                            bookId: book.id,
                            answers: {
                              bookInfo: existing?.answers?.bookInfo || "",
                              summary: existing?.answers?.summary || "",
                              characters: existing?.answers?.characters || "",
                              setting: existing?.answers?.setting || "",
                              theme: existing?.answers?.theme || "",
                              opinion: existing?.answers?.opinion || "",
                              [activeSection]: value
                            },
                            updatedAt: new Date().toISOString()
                          }
                        }
                      };
                    })
                  }
                />
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="Voeg eerst een boek toe"
              text="Daarna kun je de vaste boekverslagvragen invullen."
              action={
                <Link className="button-primary" href="/boeken/nieuw">
                  <Plus aria-hidden="true" size={20} />
                  Boek toevoegen
                </Link>
              }
            />
          )}
        </Panel>

        <Panel className="self-start">
          <h2 className="text-xl font-bold text-ink">Geheugensteun</h2>
          {book ? (
            <>
              <dl className="mt-4 grid gap-3 text-sm">
                <InfoRow label="Titel" value={book.title} />
                <InfoRow label="Auteur" value={book.author} />
                <InfoRow label="Genre" value={book.genre || "-"} />
                <InfoRow label="Status" value={statusLabels[book.status]} />
              </dl>
              <div className="mt-5">
                <p className="mb-3 text-sm font-bold text-ink">Leesnotities</p>
                {bookNotes.length ? (
                  <div className="grid gap-3">
                    {bookNotes.map((session) => (
                      <div key={session.id} className="rounded-md bg-chalk p-3 text-sm leading-6 text-ink/75">
                        <p className="font-bold text-ink">
                          {session.date}, pagina {session.fromPage}-{session.toPage}
                        </p>
                        <p>{session.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-ink/70">Nog geen leesnotities bij dit boek.</p>
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink/70">Kies een boek om notities te zien.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

function ReportSectionEditor({
  sectionId,
  value,
  onChange
}: {
  sectionId: ReportSectionId;
  value: string;
  onChange: (value: string) => void;
}) {
  const section = reportSections.find((item) => item.id === sectionId) || reportSections[0];

  return (
    <div className="rounded-lg border border-ink/10 p-4">
      <h2 className="text-xl font-bold text-ink">{section.title}</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/70">
        {section.questions.map((question) => (
          <li key={question} className="rounded-md bg-chalk px-3 py-2">
            {question}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <TextArea label="Mijn antwoorden" value={value} onChange={onChange} rows={9} />
      </div>
      <p className="mt-3 text-sm font-semibold text-leaf">Antwoorden worden automatisch lokaal opgeslagen.</p>
    </div>
  );
}

function GoalsPage({
  data,
  setData
}: {
  data: PortfolioData;
  setData: (updater: (data: PortfolioData) => PortfolioData) => void;
}) {
  const [form, setForm] = useState<GoalFormState>(defaultGoalForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setForm(defaultGoalForm);
    setEditingId("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Leesdoelen"
        title="Kies je volgende stap"
        description="Maak doelen voor pagina's, boeken, genres of leesmomenten. De voortgang wordt automatisch berekend uit je boeken en leesmomenten binnen de gekozen periode."
      />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <Panel className="self-start">
          <h2 className="text-xl font-bold text-ink">{editingId ? "Doel bewerken" : "Doel aanmaken"}</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.title.trim()) {
                setMessage("Geef je doel een titel.");
                return;
              }

              if (!/^\d+$/.test(form.target) || Number(form.target) <= 0) {
                setMessage("Het doelgetal moet uit cijfers bestaan en groter zijn dan 0.");
                return;
              }

              if (!form.startDate || !form.endDate || form.endDate < form.startDate) {
                setMessage("Kies een geldige periode: de einddatum mag niet voor de startdatum liggen.");
                return;
              }

              if (editingId) {
                setData((current) => ({
                  ...current,
                  goals: current.goals.map((goal) =>
                    goal.id === editingId
                      ? {
                          ...goal,
                          title: form.title.trim(),
                          type: form.type,
                          target: Number(form.target),
                          startDate: form.startDate,
                          endDate: form.endDate
                        }
                      : goal
                  )
                }));
                setMessage("Doel bijgewerkt.");
              } else {
                const goal: ReadingGoal = {
                  id: createId("doel"),
                  title: form.title.trim(),
                  type: form.type,
                  target: Number(form.target),
                  startDate: form.startDate,
                  endDate: form.endDate,
                  createdAt: new Date().toISOString(),
                  completed: false
                };
                setData((current) => ({
                  ...current,
                  goals: [goal, ...current.goals]
                }));
                setMessage("Doel aangemaakt.");
              }

              resetForm();
            }}
          >
            <TextField label="Titel" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <label className="grid gap-2">
              <span className="text-sm font-bold text-ink">Doeltype</span>
              <select
                className="input-field"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as GoalType })}
              >
                {Object.entries(goalTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Doelgetal"
              value={form.target}
              onChange={(value) => setForm({ ...form, target: digitsOnly(value) })}
              inputMode="numeric"
            />
            <TextField
              label="Startdatum"
              type="date"
              value={form.startDate}
              onChange={(value) => setForm({ ...form, startDate: value })}
            />
            <TextField
              label="Einddatum"
              type="date"
              value={form.endDate}
              onChange={(value) => setForm({ ...form, endDate: value })}
            />
            {message ? <p className="rounded-md bg-chalk px-4 py-3 text-sm font-semibold text-ink">{message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="button-primary">
                <Save aria-hidden="true" size={20} />
                Opslaan
              </button>
              {editingId ? (
                <button type="button" className="button-secondary" onClick={resetForm}>
                  Annuleren
                </button>
              ) : null}
            </div>
          </form>
        </Panel>

        <div className="grid gap-4">
          {data.goals.length ? (
            [...data.goals].sort((a, b) => a.endDate.localeCompare(b.endDate)).map((goal) => {
              const progress = progressForGoal(goal, data);
              const isComplete = goal.completed || progress.percentage >= 100;

              return (
                <article key={goal.id} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-ink">{goal.title}</h2>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            isComplete ? "bg-leaf/10 text-leaf" : "bg-chalk text-ink"
                          }`}
                        >
                          {isComplete ? "Afgerond" : "Bezig"}
                        </span>
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm text-ink/70 sm:grid-cols-2">
                        <div>
                          <dt className="font-bold text-ink">Periode</dt>
                          <dd>
                            {goal.startDate} t/m {goal.endDate}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold text-ink">Doeltype</dt>
                          <dd>{goalTypeLabels[goal.type]}</dd>
                        </div>
                        <div>
                          <dt className="font-bold text-ink">Huidige voortgang</dt>
                          <dd>
                            {progress.value} van {goal.target}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold text-ink">Percentage</dt>
                          <dd>{progress.percentage}%</dd>
                        </div>
                      </dl>
                    </div>
                    <span className="rounded-full bg-chalk px-3 py-1 text-sm font-bold text-ink">
                      {progress.percentage}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar percentage={progress.percentage} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setEditingId(goal.id);
                        setForm({
                          title: goal.title,
                          type: goal.type,
                          target: String(goal.target),
                          startDate: goal.startDate,
                          endDate: goal.endDate
                        });
                      }}
                    >
                      <Edit3 aria-hidden="true" size={18} />
                      Bewerken
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          goals: current.goals.map((item) =>
                            item.id === goal.id
                              ? {
                                  ...item,
                                  completed: !item.completed,
                                  completedAt: !item.completed ? new Date().toISOString() : undefined
                                }
                              : item
                          )
                        }))
                      }
                    >
                      <Check aria-hidden="true" size={18} />
                      {goal.completed ? "Heropenen" : "Afronden"}
                    </button>
                    <button
                      type="button"
                      className="icon-button text-berry"
                      aria-label="Doel verwijderen"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          goals: current.goals.filter((item) => item.id !== goal.id)
                        }))
                      }
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <Panel>
              <EmptyState title="Nog geen doelen" text="Maak een leesdoel aan om voortgang te volgen." />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function StatsPage({ data }: { data: PortfolioData }) {
  const stats = statsForData(data);
  const badges = badgeList(data);

  return (
    <>
      <PageHeader
        eyebrow="Statistieken"
        title="Je leesgroei in cijfers"
        description="Deze cijfers komen alleen uit je lokaal opgeslagen boeken, leesmomenten, verslagen en doelen."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Totaal gelezen pagina's" value={stats.totalReadPages} icon={<BookOpen size={22} />} />
        <StatCard label="Aantal uitgelezen boeken" value={stats.finishedBooksCount} icon={<Check size={22} />} />
        <StatCard label="Aantal boeken bezig" value={stats.readingBooksCount} icon={<Library size={22} />} />
        <StatCard label="Aantal leesmomenten" value={stats.readingSessionCount} icon={<CalendarPlus size={22} />} />
        <StatCard label="Meest gelezen genre" value={stats.favoriteGenre} icon={<Library size={22} />} />
        <StatCard label="Gemiddelde pagina's per leesmoment" value={stats.averagePages} icon={<BarChart3 size={22} />} />
        <StatCard label="Aantal afgeronde boekverslagen" value={stats.completedReportsCount} icon={<ClipboardList size={22} />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-bold text-ink">Voortgang richting doelen</h2>
          <div className="mt-4 grid gap-4">
            {data.goals.length ? (
              data.goals.map((goal) => {
                const progress = progressForGoal(goal, data);
                return (
                  <div key={goal.id} className="rounded-md border border-ink/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{goal.title}</p>
                        <p className="text-sm text-ink/70">
                          {progress.value} van {goal.target} - {goalTypeLabels[goal.type]}
                        </p>
                      </div>
                      <span className="rounded-full bg-chalk px-3 py-1 text-sm font-bold text-ink">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar percentage={progress.percentage} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="Nog geen doelen" text="Maak doelen aan om hier voortgang te zien." />
            )}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-ink">Badges</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`rounded-md border p-4 ${
                  badge.earned ? "border-leaf/30 bg-leaf/10" : "border-ink/10 bg-chalk/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      badge.earned ? "bg-leaf text-white" : "bg-white text-ink/40"
                    }`}
                  >
                    {badge.earned ? <Check size={18} /> : <Flag size={18} />}
                  </span>
                  <div>
                    <p className="font-bold text-ink">{badge.name}</p>
                    <p className="mt-1 text-sm leading-5 text-ink/70">{badge.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function PortfolioPage({ data }: { data: PortfolioData }) {
  const portfolioText = useMemo(() => makePortfolioText(data), [data]);
  const stats = statsForData(data);
  const finishedBooks = data.books.filter((book) => book.status === "finished");
  const reportsWithAnswers = Object.values(data.reports).filter(
    (report) => answeredReportSections(report).length > 0
  );
  const earnedBadges = badgeList(data).filter((badge) => badge.earned);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Portfolio-overzicht"
        title="Je leesportfolio"
        description="Bekijk je leesontwikkeling met alleen lokaal berekende cijfers en wat je zelf hebt ingevuld."
        action={
          <div className="no-print flex flex-col gap-2 sm:flex-row">
            <button type="button" className="button-primary" onClick={() => window.print()}>
              <Printer aria-hidden="true" size={20} />
              Print portfolio
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(portfolioText);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              }}
            >
              <Copy aria-hidden="true" size={20} />
              {copied ? "Gekopieerd" : "Kopieer portfolio"}
            </button>
            <button type="button" className="button-secondary" onClick={() => downloadText(portfolioText)}>
              <Download aria-hidden="true" size={20} />
              Download .txt
            </button>
          </div>
        }
      />

      <article className="print-area rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
        <div className="border-b border-ink/10 pb-6">
          <h2 className="text-3xl font-bold text-ink">Mijn Leesreis Portfolio</h2>
          <p className="mt-2 text-ink/70">Gemaakt op {today()}</p>
        </div>

        <PortfolioSection title="Algemene samenvatting">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile label="Totaal gelezen pagina's" value={stats.totalReadPages} />
            <SummaryTile label="Uitgelezen boeken" value={stats.finishedBooksCount} />
            <SummaryTile label="Leesmomenten" value={stats.readingSessionCount} />
            <SummaryTile label="Meest gelezen genre" value={stats.favoriteGenre} />
          </div>
        </PortfolioSection>

        <PortfolioSection title="Uitgelezen boeken">
          {finishedBooks.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {finishedBooks.map((book) => (
                <div key={book.id} className="print-break-inside-avoid rounded-md border border-ink/10 p-4">
                  <h3 className="text-lg font-bold text-ink">{book.title}</h3>
                  <dl className="mt-2 grid gap-2 text-sm text-ink/75">
                    <InfoLine label="Auteur" value={book.author} />
                    <InfoLine label="Genre" value={book.genre} />
                    {book.rating ? <InfoLine label="Rating" value={`${book.rating}/5`} /> : null}
                  </dl>
                  {book.reflection ? (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-ink">Eindreflectie</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink/75">{book.reflection}</p>
                    </div>
                  ) : null}
                  {book.favoriteQuote ? (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-ink">Favoriete quote</p>
                      <blockquote className="mt-1 rounded-md bg-chalk p-3 text-sm text-ink/75">
                        "{book.favoriteQuote}"
                      </blockquote>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink/70">Nog geen uitgelezen boeken.</p>
          )}
        </PortfolioSection>

        <PortfolioSection title="Boekverslagen">
          {reportsWithAnswers.length ? (
            <div className="grid gap-5">
              {reportsWithAnswers.map((report) => {
                const book = data.books.find((item) => item.id === report.bookId);
                const sections = answeredReportSections(report);

                return (
                  <div key={report.bookId} className="print-break-inside-avoid rounded-md border border-ink/10 p-4">
                    <h3 className="text-lg font-bold text-ink">{book?.title || "Onbekend boek"}</h3>
                    <div className="mt-3 grid gap-3">
                      {sections.map(({ section, answer }) => (
                        <div key={section.id}>
                          <p className="text-sm font-bold text-ink">{section.title}</p>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-ink/75">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-ink/70">Nog geen ingevulde boekverslagonderdelen.</p>
          )}
        </PortfolioSection>

        <PortfolioSection title="Leesdoelen">
          {data.goals.length ? (
            <div className="grid gap-3">
              {data.goals.map((goal) => {
                const progress = progressForGoal(goal, data);
                const isComplete = goal.completed || progress.percentage >= 100;

                return (
                  <div key={goal.id} className="print-break-inside-avoid rounded-md border border-ink/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">{goal.title}</p>
                        <p className="text-sm text-ink/70">
                          {goalTypeLabels[goal.type]} - {progress.value} van {goal.target}
                        </p>
                        <p className="mt-1 text-sm font-bold text-ink">
                          {isComplete ? "Afgerond" : "Niet afgerond"}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-ink">{progress.percentage}%</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar percentage={progress.percentage} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-ink/70">Nog geen leesdoelen.</p>
          )}
        </PortfolioSection>

        <PortfolioSection title="Badges">
          {earnedBadges.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {earnedBadges.map((badge) => (
                <div key={badge.name} className="print-break-inside-avoid rounded-md border border-leaf/30 bg-leaf/10 p-4">
                  <p className="font-bold text-ink">{badge.name}</p>
                  <p className="mt-1 text-sm leading-5 text-ink/70">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink/70">Nog geen badges verdiend.</p>
          )}
        </PortfolioSection>
      </article>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-ink/10 bg-chalk/60 p-4">
      <p className="text-sm font-bold text-ink/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 pb-1">
      <dt className="font-bold text-ink">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function answeredReportSections(report: { answers?: Partial<Record<ReportSectionId, string>> }) {
  return reportSections
    .map((section) => ({
      section,
      answer: report.answers?.[section.id]?.trim() || ""
    }))
    .filter(({ answer }) => answer.length > 0);
}

function PortfolioSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function makePortfolioText(data: PortfolioData) {
  const stats = statsForData(data);
  const finishedBooks = data.books.filter((book) => book.status === "finished");
  const reportsWithAnswers = Object.values(data.reports).filter(
    (report) => answeredReportSections(report).length > 0
  );
  const earnedBadges = badgeList(data).filter((badge) => badge.earned);
  const lines = ["Mijn Leesreis Portfolio", `Gemaakt op ${today()}`, ""];

  lines.push("Algemene samenvatting");
  lines.push(`- Totaal gelezen pagina's: ${stats.totalReadPages}`);
  lines.push(`- Uitgelezen boeken: ${stats.finishedBooksCount}`);
  lines.push(`- Leesmomenten: ${stats.readingSessionCount}`);
  lines.push(`- Meest gelezen genre: ${stats.favoriteGenre}`);

  lines.push("Uitgelezen boeken");
  if (finishedBooks.length) {
    finishedBooks.forEach((book) => {
      lines.push("");
      lines.push(`- ${book.title}`);
      if (book.author) lines.push(`  Auteur: ${book.author}`);
      if (book.genre) lines.push(`  Genre: ${book.genre}`);
      if (book.rating) lines.push(`  Rating: ${book.rating}/5`);
      if (book.reflection) lines.push(`  Eindreflectie: ${book.reflection}`);
      if (book.favoriteQuote) lines.push(`  Favoriete quote: "${book.favoriteQuote}"`);
    });
  } else {
    lines.push("- Nog geen uitgelezen boeken.");
  }

  lines.push("", "Boekverslagen");
  if (reportsWithAnswers.length) {
    reportsWithAnswers.forEach((report) => {
      const book = data.books.find((item) => item.id === report.bookId);
      const sections = answeredReportSections(report);

      lines.push("");
      lines.push(`- ${book?.title || "Onbekend boek"}`);
      sections.forEach(({ section, answer }) => {
        lines.push(`  ${section.title}: ${answer}`);
      });
    });
  } else {
    lines.push("- Nog geen ingevulde boekverslagonderdelen.");
  }

  lines.push("", "Leesdoelen");
  if (data.goals.length) {
    data.goals.forEach((goal) => {
      const progress = progressForGoal(goal, data);
      const status = goal.completed || progress.percentage >= 100 ? "Afgerond" : "Niet afgerond";
      lines.push(`- ${goal.title}: ${progress.value}/${goal.target} (${progress.percentage}%) - ${status}`);
    });
  } else {
    lines.push("- Nog geen leesdoelen.");
  }

  lines.push("", "Badges");
  if (earnedBadges.length) {
    earnedBadges.forEach((badge) => {
      lines.push(`- ${badge.name}: ${badge.description}`);
    });
  } else {
    lines.push("- Nog geen badges verdiend.");
  }

  return lines.join("\n");
}

function downloadText(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mijn-leesreis-portfolio.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Over/privacy"
        title="Lokaal, rustig en zonder AI"
        description="Mijn Leesreis Portfolio is gemaakt voor leerlingen die hun eigen leeswerk willen bewaren zonder accounts of externe systemen."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-bold text-ink">Wat deze app niet doet</h2>
          <ul className="mt-4 grid gap-3 text-ink/70">
            <li className="rounded-md bg-chalk p-3">De app gebruikt geen AI.</li>
            <li className="rounded-md bg-chalk p-3">De app gebruikt geen OpenAI API, AI SDK of API-key.</li>
            <li className="rounded-md bg-chalk p-3">De app heeft geen backend en geen database.</li>
            <li className="rounded-md bg-chalk p-3">De app doet geen externe API-calls.</li>
          </ul>
        </Panel>

        <Panel>
          <h2 className="text-xl font-bold text-ink">Waar je data blijft</h2>
          <p className="mt-4 leading-7 text-ink/70">
            Alles wordt lokaal in de browser opgeslagen met localStorage. Data blijft na refresh bewaard op hetzelfde apparaat en in dezelfde browser, maar wordt niet naar een server gestuurd.
          </p>
          <p className="mt-4 rounded-md bg-marigold/10 p-4 font-semibold leading-7 text-ink">
            Voer geen gevoelige persoonsgegevens in. Gebruik alleen informatie die nodig is voor je leesportfolio.
          </p>
        </Panel>
      </div>
    </>
  );
}

function EmptyState({
  title,
  text,
  action
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-ink/20 bg-chalk/50 p-6 text-center">
      <Sparkles aria-hidden="true" className="mx-auto text-marigold" size={34} />
      <h2 className="mt-3 text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/70">{text}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "numeric";
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        className="input-field"
        type={type}
        value={value}
        inputMode={inputMode}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-ink">{label}</span>
      <textarea
        className="input-field resize-y"
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}
