import type { Lang } from "./emit";
import { mark } from "./icons";
import { fromSpecs, milestone, type Spec } from "./spec";
import type { Course, Milestone } from "./types";

type Flavor = {
  slug: string;
  title: string;
  language: string;
  lang: Lang;
  host: string;
  view: string;
  verb: string;
  noun: string;
  tracks: string[];
  docs: { label: string; href: string }[];
  icon: { icon: string; iconFallback: string };
  note: string;
  blurb: string;
};

function step(id: string, title: string, brief: string, tier: Milestone["tier"], paths: string[], index: number, spec: Omit<Spec, "milestone">): Spec {
  return { ...spec, milestone: milestone(id, title, brief, tier, index, 2, paths) };
}

function courseFor(flavor: Flavor): Course {
  const say = (idea: string, task: string) => [
    `${flavor.title}. ${idea}`,
    task,
    flavor.note,
  ];
  const specs: Spec[] = [
    {
      slug: "view",
      title: `A ${flavor.noun} describes one line`,
      unit: "The shape of the work",
      paragraphs: say(`A ${flavor.noun} is a named piece of the program. Here it is a line of text, because the real toolkit is not running in the browser.`, `Read a name and print ${flavor.view} plus that name.`),
      hints: ["Read the name first.", `The line starts with ${flavor.view} and a space.`],
      cases: [
        { stdin: "Ada\n", expected: `${flavor.view} Ada\n` },
        { stdin: "Lin\n", expected: `${flavor.view} Lin\n` },
      ],
      solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str(`${flavor.view} `), "name"))]),
    },
    {
      slug: "props",
      title: "Two pieces of input",
      unit: "The shape of the work",
      paragraphs: say("Props, fields, and arguments are the values you pass in. The behavior has to follow the values, not a single sample.", "Read a title and a subtitle. Print them joined by a slash."),
      hints: ["Read both lines.", "The middle piece is a space, a slash, and a space."],
      cases: [
        { stdin: "Notes\nToday\n", expected: "Notes / Today\n" },
        { stdin: "Home\nAda\n", expected: "Home / Ada\n" },
      ],
      solve: (e) => e.program([
        e.readStr("title"),
        e.readStr("subtitle"),
        e.print(e.concat("title", e.concat(e.str(" / "), "subtitle"))),
      ]),
    },
    {
      slug: "state",
      title: "State is a number you update",
      unit: "The shape of the work",
      paragraphs: say("State is a value that changes when something happens. A counter is the smallest version.", "Read two numbers and print their sum."),
      hints: ["Read both numbers.", "Print a + b."],
      cases: [
        { stdin: "2\n3\n", expected: "5\n" },
        { stdin: "10\n1\n", expected: "11\n" },
      ],
      solve: (e) => e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
    },
    {
      slug: "list",
      title: "A list, one line each",
      unit: "The shape of the work",
      paragraphs: say("Lists render one child at a time. You walk the items and print each one.", "Read how many items follow, then the items. Print each item on its own line."),
      hints: ["The count comes first.", "Print inside the loop."],
      cases: [
        { stdin: "2\nMilk\nTea\n", expected: "Milk\nTea\n" },
        { stdin: "1\nAda\n", expected: "Ada\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.forRange("i", "1", "n", [e.readStr("item"), e.print("item")].join("\n"))]),
    },
    {
      slug: "branch",
      title: "Show or hide",
      unit: "Decisions",
      paragraphs: say("A conditional render shows one thing or another. The score decides.", "Read a score. Print show at 80 or above, otherwise hide."),
      hints: ["score >= 80.", "Print one word."],
      cases: [
        { stdin: "80\n", expected: "show\n" },
        { stdin: "79\n", expected: "hide\n" },
      ],
      solve: (e) => e.program([e.readNum("score"), e.iff("score >= 80", e.print(e.str("show")), e.print(e.str("hide")))]),
    },
    {
      slug: "handler",
      title: `Handle ${flavor.verb}`,
      unit: "Decisions",
      paragraphs: say(`An event handler runs when its event arrives. The event in this lesson is the word ${flavor.verb}.`, `Read a word. Print handled when it is ${flavor.verb}. Otherwise print skip.`),
      hints: [`Compare to ${flavor.verb}.`, "skip is the else."],
      cases: [
        { stdin: `${flavor.verb}\n`, expected: "handled\n" },
        { stdin: "other\n", expected: "skip\n" },
      ],
      solve: (e) => e.program([
        e.readStr("event"),
        e.iff(`event == ${e.str(flavor.verb)}`, e.print(e.str("handled")), e.print(e.str("skip"))),
      ]),
    },
    {
      slug: "route",
      title: "Home or elsewhere",
      unit: "Decisions",
      paragraphs: say("A route looks at a path and chooses a response. Slash is home.", "Read a path. Print home when it is /, otherwise other."),
      hints: ["Compare the path to a single slash.", "other is the else."],
      cases: [
        { stdin: "/\n", expected: "home\n" },
        { stdin: "/notes\n", expected: "other\n" },
      ],
      solve: (e) => e.program([
        e.readStr("path"),
        e.iff(`path == ${e.str("/")}`, e.print(e.str("home")), e.print(e.str("other"))),
      ]),
    },
    {
      slug: "double",
      title: "A function you can call",
      unit: "Checkpoint",
      paragraphs: say("A function names a calculation so the rest of the program can ask for it.", "Write twice and print twice the number you read."),
      hints: ["Return n * 2 from twice.", "Print the call, not a second copy of the math."],
      cases: [
        { stdin: "4\n", expected: "8\n" },
        { stdin: "0\n", expected: "0\n" },
      ],
      solve: (e) => e.program(
        [e.readNum("n"), e.print(e.call("twice", [{ name: "n", expr: "n" }]))],
        e.fn("twice", ["n"], e.ret("n * 2")),
      ),
    },
    step(`${flavor.slug}-counter`, "Counter", "Add two numbers, then add a list of them.", "Beginner", flavor.tracks, 1, {
      slug: "counter-add",
      title: "Counter: add two",
      unit: "Projects",
      paragraphs: say("A counter starts by adding.", "Read two numbers and print the sum."),
      hints: ["Print a + b."],
      cases: [
        { stdin: "2\n5\n", expected: "7\n" },
        { stdin: "0\n4\n", expected: "4\n" },
      ],
      solve: (e) => e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
    }),
    step(`${flavor.slug}-counter`, "Counter", "Add two numbers, then add a list of them.", "Beginner", flavor.tracks, 2, {
      slug: "counter-list",
      title: "Counter: add a list",
      unit: "Projects",
      paragraphs: say("Now the clicks arrive as a list.", "Read n, then n numbers, and print the sum."),
      hints: ["Start the total at 0."],
      cases: [
        { stdin: "3\n1\n1\n1\n", expected: "3\n" },
        { stdin: "1\n6\n", expected: "6\n" },
      ],
      solve: (e) => e.program([
        e.readNum("n"),
        e.assign("total", "0"),
        e.forRange("i", "1", "n", [e.readNum("value"), e.set("total", "total + value")].join("\n")),
        e.print("total"),
      ]),
    }),
    step(`${flavor.slug}-card`, "Card", "Print a name, then a name and a role.", "Beginner", flavor.tracks, 1, {
      slug: "card-name",
      title: "Card: the name",
      unit: "Projects",
      paragraphs: say(`A card is a small ${flavor.noun}.`, `Read a name and print ${flavor.view} and that name.`),
      hints: [`Start with ${flavor.view}.`],
      cases: [
        { stdin: "Ada\n", expected: `${flavor.view} Ada\n` },
        { stdin: "Lin\n", expected: `${flavor.view} Lin\n` },
      ],
      solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str(`${flavor.view} `), "name"))]),
    }),
    step(`${flavor.slug}-card`, "Card", "Print a name, then a name and a role.", "Beginner", flavor.tracks, 2, {
      slug: "card-role",
      title: "Card: name and role",
      unit: "Projects",
      paragraphs: say("The second line is the role.", "Print name: role."),
      hints: ["The middle text is a colon and a space."],
      cases: [
        { stdin: "Ada\nteacher\n", expected: "Ada: teacher\n" },
        { stdin: "Lin\nstudent\n", expected: "Lin: student\n" },
      ],
      solve: (e) => e.program([
        e.readStr("name"),
        e.readStr("role"),
        e.print(e.concat("name", e.concat(e.str(": "), "role"))),
      ]),
    }),
    step(`${flavor.slug}-filter`, "Filter", "Count the items, then count the ones that match.", "Intermediate", flavor.tracks, 1, {
      slug: "filter-count",
      title: "Filter: how many",
      unit: "Projects",
      paragraphs: say("Before you filter, know how many rows you have.", "Read n, read n items, and print n."),
      hints: ["You can print n after the loop."],
      cases: [
        { stdin: "2\nA\nB\n", expected: "2\n" },
        { stdin: "1\nA\n", expected: "1\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.forRange("i", "1", "n", e.readStr("item")), e.print("n")]),
    }),
    step(`${flavor.slug}-filter`, "Filter", "Count the items, then count the ones that match.", "Intermediate", flavor.tracks, 2, {
      slug: "filter-match",
      title: "Filter: count a word",
      unit: "Projects",
      paragraphs: say("The line after the count is the word to keep.", "Print how many items equal that word."),
      hints: ["Read the query before the items.", "Add 1 on an exact match."],
      cases: [
        { stdin: "3\ntea\nmilk\ntea\ntea\n", expected: "2\n" },
        { stdin: "1\nmilk\ntea\n", expected: "0\n" },
      ],
      solve: (e) => e.program([
        e.readNum("n"),
        e.readStr("query"),
        e.assign("count", "0"),
        e.forRange("i", "1", "n", [e.readStr("item"), e.iff("item == query", e.set("count", "count + 1"))].join("\n")),
        e.print("count"),
      ]),
    }),
    step(`${flavor.slug}-status`, "Status", "Average a list, then show or hide from that average.", "Advanced", flavor.tracks, 1, {
      slug: "status-avg",
      title: "Status: the average",
      unit: "Projects",
      paragraphs: say("A status line can be a whole-number average.", "Read n and n scores. Print the average."),
      hints: ["Divide the total by n.", "Use whole-number division."],
      cases: [
        { stdin: "2\n7\n2\n", expected: "4\n" },
        { stdin: "3\n10\n20\n30\n", expected: "20\n" },
      ],
      solve: (e) => e.program([
        e.readNum("n"),
        e.assign("total", "0"),
        e.forRange("i", "1", "n", [e.readNum("score"), e.set("total", "total + score")].join("\n")),
        e.print(e.div("total", "n")),
      ]),
    }),
    step(`${flavor.slug}-status`, "Status", "Average a list, then show or hide from that average.", "Advanced", flavor.tracks, 2, {
      slug: "status-show",
      title: "Status: show or hide",
      unit: "Projects",
      paragraphs: say("Print the average, then show when it is at least 60 and hide otherwise.", "Same scores, two lines of output."),
      hints: ["Print the average before the word."],
      cases: [
        { stdin: "2\n80\n80\n", expected: "80\nshow\n" },
        { stdin: "2\n40\n40\n", expected: "40\nhide\n" },
      ],
      solve: (e) => e.program([
        e.readNum("n"),
        e.assign("total", "0"),
        e.forRange("i", "1", "n", [e.readNum("score"), e.set("total", "total + score")].join("\n")),
        e.assign("avg", e.div("total", "n")),
        e.print("avg"),
        e.iff("avg >= 60", e.print(e.str("show")), e.print(e.str("hide"))),
      ]),
    }),
  ];
  return {
    slug: flavor.slug,
    title: flavor.title,
    language: flavor.language,
    runner: flavor.lang,
    level: "Framework",
    difficulty: "Intermediate",
    tracks: flavor.tracks,
    ...flavor.icon,
    blurb: flavor.blurb,
    honesty: flavor.note,
    lessons: fromSpecs(flavor.lang, specs),
    resources: flavor.docs.map((doc) => ({ kind: "docs" as const, label: doc.label, href: doc.href })),
    next: [flavor.host],
  };
}

const flavors: Flavor[] = [
  { slug: "react", title: "React", language: "JavaScript", lang: "javascript", host: "javascript", view: "h1", verb: "click", noun: "component", tracks: ["frontend", "fullstack"], icon: mark("react"), blurb: "Components, props, state, and a list. Practiced as JavaScript the browser can run.", note: "React itself is not mounted. A component here is a function that prints a line. The real renderer is in the React docs.", docs: [{ label: "React learn", href: "https://react.dev/learn" }] },
  { slug: "nextjs", title: "Next.js", language: "JavaScript", lang: "javascript", host: "javascript", view: "page", verb: "GET", noun: "page", tracks: ["frontend", "fullstack"], icon: mark("nextjs", "original", "nextdotjs"), blurb: "Pages, paths, and a response line. The App Router is explained, then practiced in JavaScript.", note: "Next.js is not serving this lesson. A page here prints a line. Routing, server components, and deployment live in the Next.js docs.", docs: [{ label: "Next.js docs", href: "https://nextjs.org/docs" }] },
  { slug: "vue", title: "Vue", language: "JavaScript", lang: "javascript", host: "javascript", view: "template", verb: "click", noun: "component", tracks: ["frontend"], icon: mark("vuejs", "original", "vuedotjs"), blurb: "A template line, a piece of state, and a list of children. Vue's compiler is not in the runner.", note: "Vue is not compiling these files. You practice the decisions a Vue component makes, in JavaScript.", docs: [{ label: "Vue guide", href: "https://vuejs.org/guide/introduction.html" }] },
  { slug: "svelte", title: "Svelte", language: "JavaScript", lang: "javascript", host: "javascript", view: "markup", verb: "click", noun: "component", tracks: ["frontend"], icon: mark("svelte"), blurb: "Markup, assignments, and a list. Svelte's compiler stays in its own docs.", note: "Svelte is not compiling this lesson. The runner executes JavaScript that follows the same decisions.", docs: [{ label: "Svelte docs", href: "https://svelte.dev/docs/svelte/overview" }] },
  { slug: "express", title: "Node and Express", language: "JavaScript", lang: "javascript", host: "javascript", view: "res", verb: "GET", noun: "route", tracks: ["backend", "fullstack"], icon: mark("nodejs", "original", "nodedotjs"), blurb: "A route reads a path and answers with a line. Express is not listening on a port.", note: "There is no HTTP server in this lesson. A route prints the response it would send.", docs: [{ label: "Express routing", href: "https://expressjs.com/en/guide/routing.html" }] },
  { slug: "django", title: "Django", language: "Python", lang: "python", host: "python", view: "view", verb: "GET", noun: "view", tracks: ["backend", "fullstack"], icon: mark("django", "plain"), blurb: "A view, a path, and a small status decision. Django is not installed.", note: "Django is not running. A view here is a Python function that prints a line. Models, templates, and the admin are in the Django tutorial.", docs: [{ label: "Django tutorial", href: "https://docs.djangoproject.com/en/stable/intro/tutorial01/" }] },
  { slug: "flask", title: "Flask", language: "Python", lang: "python", host: "python", view: "route", verb: "GET", noun: "route", tracks: ["backend"], icon: mark("flask"), blurb: "One function per route. Flask's development server is not started.", note: "Flask is not imported. You write the decision a route function would make, and Python prints it.", docs: [{ label: "Flask quickstart", href: "https://flask.palletsprojects.com/en/stable/quickstart/" }] },
  { slug: "fastapi", title: "FastAPI", language: "Python", lang: "python", host: "python", view: "path", verb: "GET", noun: "path operation", tracks: ["backend"], icon: mark("fastapi"), blurb: "A path operation reads input and returns a line. The ASGI server is not running.", note: "FastAPI and Pydantic are not imported. The lesson practices the branching a path operation is for.", docs: [{ label: "FastAPI tutorial", href: "https://fastapi.tiangolo.com/tutorial/" }] },
  { slug: "spring", title: "Spring Boot", language: "Java", lang: "java", host: "java", view: "mapping", verb: "GET", noun: "controller", tracks: ["backend"], icon: mark("spring"), blurb: "A controller method decides a response. Spring is not on the classpath.", note: "Spring Boot is not started. The Java here is the decision inside a controller method, run by Kindling's teaching interpreter.", docs: [{ label: "Spring Boot guide", href: "https://spring.io/guides/gs/spring-boot" }] },
  { slug: "aspnet", title: "ASP.NET", language: "C#", lang: "csharp", host: "csharp", view: "action", verb: "GET", noun: "action", tracks: ["backend"], icon: mark("dotnetcore", "original", "dotnet"), blurb: "An action method reads input and prints a result. The ASP.NET host is not running.", note: "ASP.NET Core is not hosting this lesson. You practice the branching an action method would do, in Kindling's C# interpreter.", docs: [{ label: "ASP.NET Core overview", href: "https://learn.microsoft.com/en-us/aspnet/core/introduction-to-aspnet-core" }] },
  { slug: "unity", title: "Unity with C#", language: "C#", lang: "csharp", host: "csharp", view: "scene", verb: "Update", noun: "behaviour", tracks: ["games"], icon: mark("unity", "original", "unity"), blurb: "A behaviour reads a value and prints what the scene would do. The Unity editor is not open.", note: "Unity is not running. There is no GameObject. The C# is the decision an Update method might make, in Kindling's interpreter.", docs: [{ label: "Unity manual", href: "https://docs.unity3d.com/Manual/index.html" }] },
  { slug: "godot", title: "Godot with GDScript", language: "Python", lang: "python", host: "python", view: "node", verb: "pressed", noun: "node", tracks: ["games"], icon: mark("godot"), blurb: "Nodes, signals, and a small scene decision. The lessons run as Python because that syntax is the closest runner to GDScript.", note: "Godot is not open, and this is not GDScript. The lessons borrow GDScript's ideas and run them as Python. The Godot docs are the place to write real GDScript.", docs: [{ label: "GDScript reference", href: "https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html" }] },
  { slug: "roblox", title: "Roblox with Luau", language: "Lua", lang: "lua", host: "lua", view: "script", verb: "Touched", noun: "script", tracks: ["games"], icon: mark("lua", "original", "roblox"), blurb: "A script reacts to a word and a number. Roblox services are not loaded. The runner executes Lua.", note: "Luau and Roblox services are not loaded. These lessons run as Lua, which Luau extends. DataModel, remotes, and Studio stay in the Roblox docs.", docs: [{ label: "Luau", href: "https://luau.org/" }, { label: "Roblox creator docs", href: "https://create.roblox.com/docs/luau" }] },
  { slug: "love", title: "LÖVE with Lua", language: "Lua", lang: "lua", host: "lua", view: "frame", verb: "keypressed", noun: "callback", tracks: ["games"], icon: mark("lua", "original", "lua"), blurb: "A frame callback prints what it would draw. The LÖVE window is not opened.", note: "LÖVE is not running. love.draw is not called. You practice the branching a LÖVE callback would do, in Lua.", docs: [{ label: "LÖVE wiki", href: "https://love2d.org/wiki/Main_Page" }] },
  { slug: "unreal", title: "Unreal with C++", language: "C++", lang: "cpp", host: "cpp", view: "actor", verb: "Tick", noun: "actor", tracks: ["games"], icon: mark("cplusplus", "original", "unrealengine"), blurb: "An actor ticks, reads a number, and prints a decision. Unreal Engine is not installed.", note: "Unreal Engine, Blueprints, and UObject are not here. The C++ compiles with g++. The engine docs are how you leave the lesson.", docs: [{ label: "Unreal C++", href: "https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-programming-and-scripting" }] },
  { slug: "pygame", title: "Pygame", language: "Python", lang: "python", host: "python", view: "frame", verb: "KEYDOWN", noun: "frame", tracks: ["games"], icon: mark("python", "original", "pygame"), blurb: "A frame reads input and prints what it would draw. No window opens.", note: "Pygame is not imported and no window opens. A frame here prints a line. The Pygame docs show the real loop.", docs: [{ label: "Pygame docs", href: "https://www.pygame.org/docs/" }] },
  { slug: "pandas", title: "Pandas and NumPy", language: "Python", lang: "python", host: "python", view: "frame", verb: "mean", noun: "column", tracks: ["data"], icon: mark("pandas"), blurb: "Sums, averages, and a filter. The shapes of a column, practiced in plain Python.", note: "Pandas and NumPy are not imported. You practice the operations a column is for: sum, average, and a filter. The library docs are the next step.", docs: [{ label: "Pandas user guide", href: "https://pandas.pydata.org/docs/user_guide/index.html" }, { label: "NumPy", href: "https://numpy.org/doc/stable/user/absolute_beginners.html" }] },
  { slug: "pytorch", title: "PyTorch basics", language: "Python", lang: "python", host: "python", view: "tensor", verb: "step", noun: "step", tracks: ["data"], icon: mark("pytorch"), blurb: "A tiny training step: a total, an average, a guess. No autograd and no GPU.", note: "PyTorch is not imported. There is no tensor and no gradient. You practice the arithmetic a first training step is made of. The PyTorch tutorials are the real thing.", docs: [{ label: "PyTorch tutorials", href: "https://pytorch.org/tutorials/beginner/basics/intro.html" }] },
  { slug: "laravel", title: "Laravel", language: "PHP", lang: "php", host: "php", view: "route", verb: "GET", noun: "route", tracks: ["backend", "fullstack"], icon: mark("laravel"), blurb: "A route closure decides a line of output. Laravel's HTTP kernel is not booted.", note: "Laravel is not installed. A route here is PHP that prints a decision. Controllers, migrations, and Blade are in the Laravel docs.", docs: [{ label: "Laravel docs", href: "https://laravel.com/docs" }] },
  { slug: "rails", title: "Ruby on Rails", language: "Ruby", lang: "ruby", host: "ruby", view: "action", verb: "GET", noun: "action", tracks: ["backend", "fullstack"], icon: mark("rails", "plain", "rubyonrails"), blurb: "A controller action reads input and prints a response. Rails is not booted.", note: "Rails is not running. There is no Active Record. The Ruby is the decision an action would make.", docs: [{ label: "Rails guides", href: "https://guides.rubyonrails.org/" }] },
];

export function frameworkCourses(): Course[] {
  return flavors.map(courseFor);
}

export const frameworkSlugs = {
  javascript: ["react", "nextjs", "vue", "svelte", "express"],
  typescript: ["react", "nextjs", "express"],
  python: ["django", "flask", "fastapi", "pygame", "pandas", "pytorch"],
  java: ["spring"],
  csharp: ["aspnet", "unity"],
  cpp: ["unreal"],
  lua: ["godot", "roblox", "love"],
  php: ["laravel"],
  ruby: ["rails"],
};
