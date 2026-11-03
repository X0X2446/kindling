import type { Lang } from "./emit";
import { frameworkCourses, frameworkSlugs } from "./frameworks";
import { htmlMore } from "./html-more";
import { mark } from "./icons";
import { dart, kotlin, swift } from "./mobile";
import { python } from "./python";
import { sqlCourse } from "./sql-course";
import { arduinoCourse } from "./arduino";
import { pythonBackend, pythonMl, pythonQt } from "./special";
import { cppCourse, cppGamesLessons } from "@/content/cpp";
import { cppGames, csharp, java, lua } from "./systems";
import { languageLessons } from "./track";
import { devopsCourse, securityCourse, web3Course } from "./topics";
import type { Course, Lesson, PathInfo } from "./types";
import { html, html5, javascript } from "./web";

function unitsFor(lessons: Lesson[]) {
  const units: { title: string; slugs: string[] }[] = [];
  for (const lesson of lessons) {
    const title = lesson.unit ?? "Lessons";
    const last = units.at(-1);
    if (!last || last.title !== title) units.push({ title, slugs: [lesson.slug] });
    else last.slugs.push(lesson.slug);
  }
  return units;
}

function finish(course: Course): Course {
  const lessons = course.lessons.map((lesson) => ({ ...lesson, unit: lesson.unit ?? (lesson.project ? "Projects" : "Lessons") }));
  const slugs = lessons.map((lesson) => lesson.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error(`Duplicate lesson slugs in ${course.slug}`);
  return { ...course, lessons, units: unitsFor(lessons) };
}

function deepen(
  course: Course,
  lang: Lang,
  tracks: string[],
  next: string[],
  icon: { icon: string; iconFallback: string },
  ui: string[] = [],
): Course {
  const generated = languageLessons(lang, course.language, tracks);
  const early = course.lessons.filter((lesson) => !ui.includes(lesson.slug)).map((lesson) => ({ ...lesson, unit: lesson.unit ?? "Start here" }));
  const toolkit = course.lessons.filter((lesson) => ui.includes(lesson.slug)).map((lesson) => ({ ...lesson, unit: "The toolkit" }));
  const lessons = [...early, ...generated.filter((lesson) => !lesson.project), ...toolkit, ...generated.filter((lesson) => lesson.project)];
  return finish({ ...course, tracks, next, ...icon, difficulty: "Beginner", lessons });
}

function fresh(course: Omit<Course, "lessons">, lang: Lang): Course {
  return deepen({ ...course, lessons: [] }, lang, course.tracks ?? [], course.next, { icon: course.icon ?? "", iconFallback: course.iconFallback ?? "" });
}

function htmlCourse(): Course {
  const start = html.lessons.filter((lesson) => lesson.slug !== "profile-card").map((lesson) => ({ ...lesson, unit: "Start here" }));
  const profile: Lesson = {
    ...html.lessons.find((lesson) => lesson.slug === "profile-card")!,
    unit: "Projects",
    milestone: {
      id: "html-profile",
      title: "Profile card",
      brief: "A name, a sentence, and a link on a card you could send to someone.",
      tier: "Beginner",
      paths: ["frontend"],
      step: 1,
      steps: 1,
    },
  };
  const moreConcepts = htmlMore.filter((lesson) => !lesson.project);
  const moreProjects = htmlMore.filter((lesson) => lesson.project);
  return finish({
    ...html,
    tracks: ["frontend", "fullstack"],
    next: ["javascript", "typescript", "html5-games"],
    difficulty: "Beginner",
    ...mark("html5"),
    lessons: [...start, ...moreConcepts, profile, ...moreProjects],
  });
}

const icons = {
  python: mark("python"),
  javascript: mark("javascript"),
  typescript: mark("typescript"),
  java: mark("java", "original", "openjdk"),
  cpp: mark("cplusplus"),
  csharp: mark("csharp"),
  lua: mark("lua"),
  kotlin: mark("kotlin"),
  swift: mark("swift"),
  dart: mark("dart"),
  go: mark("go"),
  rust: mark("rust"),
  php: mark("php"),
  ruby: mark("ruby"),
  r: mark("r"),
  c: mark("c"),
  bash: mark("bash", "original", "gnubash"),
  html5: mark("html5"),
};

export const courses: Course[] = [
  deepen(python, "python", ["software", "backend", "data", "automation", "fullstack"], ["python-qt", "python-ml", "python-backend", ...frameworkSlugs.python], icons.python),
  deepen(javascript, "javascript", ["frontend", "fullstack", "web3"], ["typescript", ...frameworkSlugs.javascript, "html5-games"], icons.javascript),
  fresh({
    slug: "typescript",
    title: "TypeScript from scratch",
    language: "TypeScript",
    runner: "typescript",
    level: "Language",
    blurb: "JavaScript with the types written down. Start from a blank file and leave able to read a typed function.",
    honesty: "The runner strips the type annotations and executes the JavaScript underneath. It does not run the TypeScript compiler.",
    resources: [{ kind: "docs", label: "TypeScript handbook", href: "https://www.typescriptlang.org/docs/handbook/intro.html" }],
    next: frameworkSlugs.typescript,
    tracks: ["frontend", "fullstack", "software"],
    ...icons.typescript,
  }, "typescript"),
  htmlCourse(),
  finish({ ...html5, tracks: ["frontend", "games"], difficulty: "Intermediate", ...icons.html5 }),
  deepen(java, "java", ["software", "backend"], ["kotlin", ...frameworkSlugs.java], icons.java),
  finish({
    ...cppCourse,
    tracks: ["software", "games"],
    next: ["c", "cpp-games", ...frameworkSlugs.cpp],
    difficulty: "Beginner",
    ...icons.cpp,
  }),
  fresh({
    slug: "c",
    title: "C from scratch",
    language: "C",
    runner: "c",
    level: "Language",
    blurb: "A small C that prints, decides, and loops. The teaching runner translates it far enough to execute.",
    honesty: "This is a teaching subset of C. It is translated into a small interpreter. It is not a C compiler, and it does not give you pointers as a memory model.",
    resources: [
      { kind: "docs", label: "cppreference C", href: "https://en.cppreference.com/w/c" },
    ],
    next: ["arduino", "cpp"],
    tracks: ["software", "embedded"],
    ...icons.c,
  }, "c"),
  finish({
    ...cppGames,
    blurb: "A game loop, entities, collision, and a one-dimensional coin run, compiled with g++.",
    honesty:
      "Each program is compiled with g++ -std=c++20 and run with a time limit, a memory limit, and no network. SDL and raylib are not linked. A frame is text: fill, rect, circle, and text between [[FRAME]] and [[END]].",
    lessons: cppGamesLessons,
    tracks: ["games"],
    difficulty: "Intermediate",
    ...icons.cpp,
  }),
  deepen(csharp, "csharp", ["software", "backend"], frameworkSlugs.csharp, icons.csharp),
  deepen(lua, "lua", ["games", "software"], ["cpp-games", "html5-games", ...frameworkSlugs.lua], icons.lua),
  deepen(
    { ...kotlin, title: "Kotlin from scratch", blurb: "Kotlin from a blank file. The language first, then a Compose-style screen." },
    "kotlin",
    ["mobile", "software"],
    ["swift", "dart"],
    icons.kotlin,
    ["compose", "steps"],
  ),
  deepen(
    { ...swift, title: "Swift from scratch", blurb: "Swift from a blank file. The language first, then a SwiftUI-style stack." },
    "swift",
    ["mobile"],
    ["kotlin", "dart"],
    icons.swift,
    ["swiftui", "steps"],
  ),
  deepen(
    { ...dart, title: "Dart from scratch", blurb: "Dart from a blank file. The language first, then a Flutter-style column." },
    "dart",
    ["mobile"],
    ["kotlin", "swift"],
    icons.dart,
    ["flutter", "steps"],
  ),
  fresh({
    slug: "go",
    title: "Go from scratch",
    language: "Go",
    runner: "go",
    level: "Language",
    blurb: "Packages, prints, and small functions in Go, starting from nothing.",
    honesty: "The Go lessons run in a teaching interpreter. goroutines, the real fmt package, and the Go toolchains are not loaded. The Tour of Go is the next place to type them.",
    resources: [{ kind: "docs", label: "A Tour of Go", href: "https://go.dev/tour/" }, { kind: "docs", label: "Go documentation", href: "https://go.dev/doc/" }],
    next: [],
    tracks: ["software", "backend"],
    ...icons.go,
  }, "go"),
  fresh({
    slug: "rust",
    title: "Rust from scratch",
    language: "Rust",
    runner: "rust",
    level: "Language",
    blurb: "Rust's shape — functions, decisions, loops — practiced from a blank file.",
    honesty: "This is a teaching subset. Ownership, the borrow checker, and cargo are not running. The Rust book is where those ideas become the real language.",
    resources: [{ kind: "docs", label: "The Rust book", href: "https://doc.rust-lang.org/book/" }],
    next: [],
    tracks: ["software"],
    ...icons.rust,
  }, "rust"),
  fresh({
    slug: "php",
    title: "PHP from scratch",
    language: "PHP",
    runner: "php",
    level: "Language",
    blurb: "PHP from a blank file: read a line, decide, and print.",
    honesty: "The PHP lessons run in a teaching interpreter, not the PHP runtime. Arrays, the web SAPI, and Composer are outside this course.",
    resources: [{ kind: "docs", label: "PHP language reference", href: "https://www.php.net/manual/en/langref.php" }],
    next: frameworkSlugs.php,
    tracks: ["backend", "fullstack"],
    ...icons.php,
  }, "php"),
  fresh({
    slug: "ruby",
    title: "Ruby from scratch",
    language: "Ruby",
    runner: "ruby",
    level: "Language",
    blurb: "Ruby from a blank file. Small programs, then the projects that use them.",
    honesty: "The Ruby lessons run in a teaching interpreter. The real ruby command, gems, and blocks-as-a-library are not loaded.",
    resources: [{ kind: "docs", label: "Ruby documentation", href: "https://www.ruby-lang.org/en/documentation/" }],
    next: frameworkSlugs.ruby,
    tracks: ["backend", "fullstack"],
    ...icons.ruby,
  }, "ruby"),
  fresh({
    slug: "r",
    title: "R from scratch",
    language: "R",
    runner: "r",
    level: "Language",
    blurb: "R from a blank file: values, decisions, and the averages a data script starts with.",
    honesty: "This is a teaching subset of R. The real R interpreter, packages, and plots are not running. CRAN and R for Data Science are the way out of the lesson.",
    resources: [{ kind: "docs", label: "An introduction to R", href: "https://cran.r-project.org/doc/manuals/r-release/R-intro.html" }],
    next: ["pandas", "python-ml"],
    tracks: ["data", "software"],
    ...icons.r,
  }, "r"),
  fresh({
    slug: "bash",
    title: "Bash from scratch",
    language: "Bash",
    runner: "bash",
    level: "Language",
    blurb: "A shell script that reads, decides, and prints. The commands stay inside the lesson.",
    honesty: "The shell runner knows echo, read, variables, tests, while, for-in, and small functions. It does not run your real shell, and it does not touch the filesystem.",
    resources: [{ kind: "docs", label: "GNU Bash manual", href: "https://www.gnu.org/software/bash/manual/bash.html" }],
    next: ["devops"],
    tracks: ["devops", "automation"],
    ...icons.bash,
  }, "bash"),
  finish(sqlCourse()),
  finish({ ...pythonQt, tracks: ["software"], ...mark("qt", "original", "qt") }),
  finish({ ...pythonMl, tracks: ["data"], ...icons.python }),
  finish({ ...pythonBackend, tracks: ["backend", "fullstack"], ...icons.python }),
  finish(securityCourse()),
  finish(web3Course()),
  finish(devopsCourse()),
  finish(arduinoCourse()),
  ...frameworkCourses().map(finish),
];

export const paths: PathInfo[] = [
  { slug: "frontend", title: "Frontend", blurb: "HTML, JavaScript, TypeScript, and the interface frameworks that sit on top of them.", courses: ["html", "javascript", "typescript", "react", "nextjs", "vue", "svelte", "html5-games"] },
  { slug: "backend", title: "Backend", blurb: "A language, then the shape of a route: Python, JavaScript, Java, C#, PHP, Ruby, and Go.", courses: ["python", "python-backend", "javascript", "express", "java", "spring", "csharp", "aspnet", "php", "laravel", "ruby", "rails", "go"] },
  { slug: "mobile", title: "Mobile", blurb: "Kotlin, Swift, and Dart from a blank file, then a screen in the style of Compose, SwiftUI, or Flutter.", courses: ["kotlin", "swift", "dart"] },
  { slug: "software", title: "Software", blurb: "The languages you meet in codebases, each taught from scratch.", courses: ["python", "typescript", "java", "csharp", "cpp", "c", "go", "rust", "php", "ruby", "r"] },
  { slug: "games", title: "Games", blurb: "Scripts, frames, and engines. Lua, C++, C#, and the browser canvas.", courses: ["lua", "love", "roblox", "godot", "pygame", "unity", "unreal", "cpp-games", "html5-games"] },
  { slug: "data", title: "Data Science and AI", blurb: "Averages first, then the shapes of a column and a tiny training step.", courses: ["python", "python-ml", "r", "pandas", "pytorch"] },
  { slug: "devops", title: "DevOps and Cloud", blurb: "Bash, then Git, containers, and CI as plans you can read before the tools are installed.", courses: ["bash", "devops"] },
  { slug: "security", title: "Cybersecurity basics", blurb: "Passwords, roles, schemes, and sessions. Defensive checks only.", courses: ["security", "python"] },
  { slug: "databases", title: "Databases", blurb: "SQL from a first SELECT through filters, counts, and eight small schemas.", courses: ["sql"] },
  { slug: "web3", title: "Web3 basics", blurb: "Balances, transfers, and a teaching checksum. No wallet and no chain.", courses: ["javascript", "web3"] },
  { slug: "embedded", title: "Embedded and Arduino", blurb: "C from scratch, then pins and sensors on a teaching board.", courses: ["c", "arduino"] },
  { slug: "automation", title: "Automation and scripting", blurb: "Python and Bash for the small programs that repeat a job.", courses: ["python", "bash"] },
  { slug: "fullstack", title: "Full-stack web", blurb: "A page, a language, and a route that answers it.", courses: ["html", "javascript", "typescript", "nextjs", "express", "python", "python-backend", "django"] },
];

export type ProjectCard = {
  id: string;
  href: string;
  title: string;
  brief: string;
  tier: "Beginner" | "Intermediate" | "Advanced";
  steps: number;
  language: string;
  course: string;
  courseSlug: string;
  paths: string[];
};

export function allProjects(): ProjectCard[] {
  const seen = new Set<string>();
  const cards: ProjectCard[] = [];
  for (const course of courses) {
    for (const lesson of course.lessons) {
      if (!lesson.project) continue;
      const id = `${course.slug}:${lesson.milestone?.id ?? lesson.slug}`;
      if (seen.has(id)) continue;
      seen.add(id);
      cards.push({
        id,
        href: `/learn/${course.slug}/${lesson.slug}`,
        title: lesson.milestone?.title ?? lesson.title,
        brief: lesson.milestone?.brief ?? lesson.paragraphs[0] ?? "",
        tier: lesson.milestone?.tier ?? "Beginner",
        steps: lesson.milestone?.steps ?? 1,
        language: course.language,
        course: course.title,
        courseSlug: course.slug,
        paths: lesson.milestone?.paths?.length ? lesson.milestone.paths : course.tracks ?? [],
      });
    }
  }
  return cards;
}
