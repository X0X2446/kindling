import type { Lesson, Milestone } from "./types";
import { emitter, type Emitter, type Lang } from "./emit";

type Built = { starter: string; solution: string; sample: string };

function lessonFrom(
  lang: Lang,
  language: string,
  spec: {
    slug: string;
    title: string;
    unit: string;
    minutes: number;
    xp: number;
    paragraphs: string[];
    hints: string[];
    cases: { stdin: string; expected: string }[];
    milestone?: Milestone;
    build: (e: Emitter) => Built;
  },
): Lesson {
  const built = spec.build(emitter(lang));
  return {
    slug: spec.slug,
    title: spec.title,
    unit: spec.unit,
    minutes: spec.minutes,
    xp: spec.xp,
    project: Boolean(spec.milestone),
    milestone: spec.milestone,
    paragraphs: spec.paragraphs,
    sample: built.sample,
    starter: built.starter,
    solution: built.solution,
    hints: spec.hints,
    stdin: spec.cases[0]?.stdin,
    check: { kind: "cases", cases: spec.cases },
  };
}

function text(language: string, idea: string, detail: string) {
  return [
    idea,
    detail,
    `The tests type different input each time. A program that only prints the sample answer fails the other ${language} cases.`,
  ];
}

export function languageLessons(lang: Lang, language: string, paths: string[]): Lesson[] {
  const milestone = (id: string, title: string, brief: string, tier: Milestone["tier"], step: number, extra: string[] = []): Milestone => ({
    id: `${lang}-${id}`,
    title,
    brief,
    tier,
    paths: [...new Set([...paths, ...extra])],
    step,
    steps: 3,
  });
  const core: Parameters<typeof lessonFrom>[2][] = [
    {
      slug: "greet",
      title: "Greet whatever name comes in",
      unit: "First programs",
      minutes: 6,
      xp: 20,
      paragraphs: text(language, `${language} follows your file from the top. Printing is how a program shows its work.`, "Read one name, then print Hello, and that name. Ada must produce Hello, Ada. Lin must produce Hello, Lin."),
      hints: ["Read the name before you print.", "Join the text Hello, with the name. The comma and space are part of the text."],
      cases: [
        { stdin: "Ada\n", expected: "Hello, Ada\n" },
        { stdin: "Lin\n", expected: "Hello, Lin\n" },
        { stdin: "Sam\n", expected: "Hello, Sam\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readStr("name"), e.print(e.concat(e.str("Hello, "), "name"))]),
        starter: e.program([e.comment("Read a name and print Hello, name"), e.readStr("name"), e.print(e.str("todo"))]),
        solution: e.program([e.readStr("name"), e.print(e.concat(e.str("Hello, "), "name"))]),
      }),
    },
    {
      slug: "add-two",
      title: "Add two numbers",
      unit: "First programs",
      minutes: 7,
      xp: 20,
      paragraphs: text(language, "A variable is a name for a value you just read. Numbers are not text, so convert the line before you do math.", "Read two whole numbers and print their sum. 2 and 3 make 5. 10 and 1 make 11."),
      hints: ["Read both numbers before the print.", "The sum is the first number plus the second."],
      cases: [
        { stdin: "2\n3\n", expected: "5\n" },
        { stdin: "10\n1\n", expected: "11\n" },
        { stdin: "8\n8\n", expected: "16\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
        starter: e.program([e.readNum("a"), e.readNum("b"), e.print("-1")]),
        solution: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
      }),
    },
    {
      slug: "both-results",
      title: "Sum and product",
      unit: "First programs",
      minutes: 7,
      xp: 25,
      paragraphs: text(language, "One program can print more than one line. Each print starts a new line of output.", "Print the sum, then the product, for any pair of numbers."),
      hints: ["The first printed line is a + b.", "The second printed line is a * b."],
      cases: [
        { stdin: "2\n3\n", expected: "5\n6\n" },
        { stdin: "4\n5\n", expected: "9\n20\n" },
        { stdin: "7\n1\n", expected: "8\n7\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b"), e.print("a * b")]),
        starter: e.program([e.readNum("a"), e.readNum("b"), e.print("-1")]),
        solution: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b"), e.print("a * b")]),
      }),
    },
    {
      slug: "pass-fail",
      title: "Pass or retry",
      unit: "Decisions",
      minutes: 8,
      xp: 25,
      paragraphs: text(language, "if runs a block only when a comparison is true. else runs when it is not. Comparisons you will use constantly: >=, <, ==.", "A score of 80 or more prints pass. Anything lower prints retry."),
      hints: ["The comparison is score >= 80.", "Both branches should print, but only one runs."],
      cases: [
        { stdin: "82\n", expected: "pass\n" },
        { stdin: "80\n", expected: "pass\n" },
        { stdin: "79\n", expected: "retry\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("score"), e.iff("score >= 80", e.print(e.str("pass")), e.print(e.str("retry")))]),
        starter: e.program([e.readNum("score"), e.print(e.str("todo"))]),
        solution: e.program([e.readNum("score"), e.iff("score >= 80", e.print(e.str("pass")), e.print(e.str("retry")))]),
      }),
    },
    {
      slug: "sign",
      title: "Negative, zero, or positive",
      unit: "Decisions",
      minutes: 8,
      xp: 25,
      paragraphs: text(language, "else if adds another question after the first comparison fails. The order matters: check negative before you check positive.", "Print negative, zero, or positive."),
      hints: ["Test n < 0 first.", "The remaining branch is positive."],
      cases: [
        { stdin: "-4\n", expected: "negative\n" },
        { stdin: "0\n", expected: "zero\n" },
        { stdin: "6\n", expected: "positive\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.iff("n < 0", e.print(e.str("negative")), e.iff("n == 0", e.print(e.str("zero")), e.print(e.str("positive")))),
        ]),
        starter: e.program([e.readNum("n"), e.print(e.str("todo"))]),
        solution: e.program([
          e.readNum("n"),
          e.iff("n < 0", e.print(e.str("negative")), e.iff("n == 0", e.print(e.str("zero")), e.print(e.str("positive")))),
        ]),
      }),
    },
    {
      slug: "sum-to-n",
      title: "Add 1 through n",
      unit: "Loops",
      minutes: 8,
      xp: 30,
      paragraphs: text(language, "A loop repeats a block. A running total starts at 0 before the loop, and grows by the current number inside it.", "Read n and print the sum of every whole number from 1 through n. For 3, that is 6."),
      hints: ["Start total at 0.", "The print belongs after the loop, not inside it."],
      cases: [
        { stdin: "3\n", expected: "6\n" },
        { stdin: "1\n", expected: "1\n" },
        { stdin: "5\n", expected: "15\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("n"), e.assign("total", "0"), e.forRange("i", "1", "n", e.set("total", "total + i")), e.print("total")]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([e.readNum("n"), e.assign("total", "0"), e.forRange("i", "1", "n", e.set("total", "total + i")), e.print("total")]),
      }),
    },
    {
      slug: "count-evens",
      title: "Count the even numbers",
      unit: "Loops",
      minutes: 9,
      xp: 30,
      paragraphs: text(language, "You do not need to store every number. Keep a count, and add 1 only when the number is even. A number is even when number % 2 == 0.", "The first line is how many numbers follow. Then the numbers themselves."),
      hints: ["Read the count first, then loop that many times.", "% 2 == 0 means even."],
      cases: [
        { stdin: "3\n1\n2\n4\n", expected: "2\n" },
        { stdin: "1\n7\n", expected: "0\n" },
        { stdin: "4\n2\n2\n2\n1\n", expected: "3\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readNum("value"), e.iff("value % 2 == 0", e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
        ]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readNum("value"), e.iff("value % 2 == 0", e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
        ]),
      }),
    },
    {
      slug: "double-it",
      title: "A function that doubles",
      unit: "Functions",
      minutes: 9,
      xp: 30,
      paragraphs: text(language, "A function names a calculation. You pass a number in, and return a number out. Nothing prints until main prints the returned value.", "Write double, then read n and print double(n)."),
      hints: ["Return n * 2 from double.", "Print the call. Do not print inside the function."],
      cases: [
        { stdin: "4\n", expected: "8\n" },
        { stdin: "0\n", expected: "0\n" },
        { stdin: "11\n", expected: "22\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("n"), e.print(e.call("double", [{ name: "n", expr: "n" }]))], e.fn("double", ["n"], e.ret("n * 2"))),
        starter: e.program([e.readNum("n"), e.print("-1")], e.fn("double", ["n"], e.ret("0"))),
        solution: e.program([e.readNum("n"), e.print(e.call("double", [{ name: "n", expr: "n" }]))], e.fn("double", ["n"], e.ret("n * 2"))),
      }),
    },
    {
      slug: "clamp",
      title: "Keep a number in range",
      unit: "Functions",
      minutes: 9,
      xp: 30,
      paragraphs: text(language, "Functions can decide. clamp returns 0 when the number is below 0, 10 when it is above 10, and the number itself otherwise.", "Read one number and print clamp of it."),
      hints: ["Check n < 0 before n > 10.", "The last return is n."],
      cases: [
        { stdin: "-3\n", expected: "0\n" },
        { stdin: "4\n", expected: "4\n" },
        { stdin: "15\n", expected: "10\n" },
      ],
      build: (e) => {
        const body = [e.iff("n < 0", e.ret("0")), e.iff("n > 10", e.ret("10")), e.ret("n")].join("\n");
        return {
          sample: e.program([e.readNum("n"), e.print(e.call("clamp", [{ name: "n", expr: "n" }]))], e.fn("clamp", ["n"], body)),
          starter: e.program([e.readNum("n"), e.print("-1")], e.fn("clamp", ["n"], e.ret("-1"))),
          solution: e.program([e.readNum("n"), e.print(e.call("clamp", [{ name: "n", expr: "n" }]))], e.fn("clamp", ["n"], body)),
        };
      },
    },
    {
      slug: "last-and-sum",
      title: "Last value and the total",
      unit: "Working through data",
      minutes: 9,
      xp: 30,
      paragraphs: text(language, "You can remember the latest value in a variable while a loop is running. When the loop ends, that variable holds the last item.", "Read how many numbers follow, then the numbers. Print the last one, then the sum."),
      hints: ["Update last every time you read a value.", "Print last and total after the loop."],
      cases: [
        { stdin: "3\n4\n5\n6\n", expected: "6\n15\n" },
        { stdin: "1\n9\n", expected: "9\n9\n" },
        { stdin: "2\n1\n8\n", expected: "8\n9\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.assign("last", "0"),
          e.forRange("i", "1", "n", [e.readNum("value"), e.set("last", "value"), e.set("total", "total + value")].join("\n")),
          e.print("last"),
          e.print("total"),
        ]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.assign("last", "0"),
          e.forRange("i", "1", "n", [e.readNum("value"), e.set("last", "value"), e.set("total", "total + value")].join("\n")),
          e.print("last"),
          e.print("total"),
        ]),
      }),
    },
    {
      slug: "maximum",
      title: "The largest number",
      unit: "Working through data",
      minutes: 9,
      xp: 30,
      paragraphs: text(language, "A maximum starts as the first number, not as zero. Zero would be wrong when every number is negative.", "Read n, then n numbers, and print the largest."),
      hints: ["Read the first number before the loop and call it best.", "Inside the loop, replace best when value > best."],
      cases: [
        { stdin: "3\n4\n9\n2\n", expected: "9\n" },
        { stdin: "2\n-5\n-1\n", expected: "-1\n" },
        { stdin: "1\n7\n", expected: "7\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.readNum("best"),
          e.forRange("i", "2", "n", [e.readNum("value"), e.iff("value > best", e.set("best", "value"))].join("\n")),
          e.print("best"),
        ]),
        starter: e.program([e.readNum("n"), e.print("-999")]),
        solution: e.program([
          e.readNum("n"),
          e.readNum("best"),
          e.forRange("i", "2", "n", [e.readNum("value"), e.iff("value > best", e.set("best", "value"))].join("\n")),
          e.print("best"),
        ]),
      }),
    },
    {
      slug: "formal-name",
      title: "Last, First",
      unit: "Working through data",
      minutes: 8,
      xp: 25,
      paragraphs: text(language, "Text joins the same way numbers add, but the result is a sentence. The comma has to be a piece of text you include yourself.", "Read a first name and a last name. Print Last, First."),
      hints: ["Read last after first.", "The middle piece is a comma and a space."],
      cases: [
        { stdin: "Ada\nLovelace\n", expected: "Lovelace, Ada\n" },
        { stdin: "Lin\nZhou\n", expected: "Zhou, Lin\n" },
        { stdin: "Grace\nHopper\n", expected: "Hopper, Grace\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readStr("first"), e.readStr("last"), e.print(e.concat("last", e.concat(e.str(", "), "first")))]),
        starter: e.program([e.readStr("first"), e.readStr("last"), e.print(e.str("todo"))]),
        solution: e.program([e.readStr("first"), e.readStr("last"), e.print(e.concat("last", e.concat(e.str(", "), "first")))]),
      }),
    },
    {
      slug: "grid-sum",
      title: "Sum a tiny grid",
      unit: "Loops",
      minutes: 10,
      xp: 35,
      paragraphs: text(language, "A loop inside a loop visits every pair. For a size of n, both i and j run from 1 through n, and you add i * j.", "For 2, the pairs are 1*1, 1*2, 2*1, and 2*2, which add to 9."),
      hints: ["Put the inner loop inside the outer loop.", "Print the total once, after both loops."],
      cases: [
        { stdin: "1\n", expected: "1\n" },
        { stdin: "2\n", expected: "9\n" },
        { stdin: "3\n", expected: "36\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.forRange("i", "1", "n", e.forRange("j", "1", "n", e.set("total", "total + i * j"))),
          e.print("total"),
        ]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.forRange("i", "1", "n", e.forRange("j", "1", "n", e.set("total", "total + i * j"))),
          e.print("total"),
        ]),
      }),
    },
    {
      slug: "lookup",
      title: "Find a value by name",
      unit: "Working through data",
      minutes: 10,
      xp: 35,
      paragraphs: text(language, "A lookup can happen while you read. Remember the value when the key matches the query, and ignore the rest.", "Each record is a name and a number. After the records, one query name arrives. Print that record's number."),
      hints: ["Compare the name to the query after you have read the query, or save the query first.", "Read the query before the records so you can compare as you go."],
      cases: [
        { stdin: "3\nmilk\ntea\n2\nmilk\n4\nfig\n1\n", expected: "4\n" },
        { stdin: "1\nsolo\nsolo\n7\n", expected: "7\n" },
        { stdin: "2\nb\na\n3\nb\n9\n", expected: "9\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.readStr("query"),
          e.assign("found", "0"),
          e.forRange("i", "1", "n", [e.readStr("key"), e.readNum("value"), e.iff("key == query", e.set("found", "value"))].join("\n")),
          e.print("found"),
        ]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([
          e.readNum("n"),
          e.readStr("query"),
          e.assign("found", "0"),
          e.forRange("i", "1", "n", [e.readStr("key"), e.readNum("value"), e.iff("key == query", e.set("found", "value"))].join("\n")),
          e.print("found"),
        ]),
      }),
    },
    {
      slug: "guard",
      title: "Reject a bad age",
      unit: "Decisions",
      minutes: 7,
      xp: 25,
      paragraphs: text(language, "A guard is a check at the door. If the value is impossible, say so and skip the rest of the work.", "Ages below 0 print invalid. Every other age prints ok."),
      hints: ["age < 0 is the invalid branch.", "ok is the else."],
      cases: [
        { stdin: "-1\n", expected: "invalid\n" },
        { stdin: "0\n", expected: "ok\n" },
        { stdin: "36\n", expected: "ok\n" },
      ],
      build: (e) => ({
        sample: e.program([e.readNum("age"), e.iff("age < 0", e.print(e.str("invalid")), e.print(e.str("ok")))]),
        starter: e.program([e.readNum("age"), e.print(e.str("todo"))]),
        solution: e.program([e.readNum("age"), e.iff("age < 0", e.print(e.str("invalid")), e.print(e.str("ok")))]),
      }),
    },
    {
      slug: "empty-list",
      title: "Nothing to add",
      unit: "Working through data",
      minutes: 8,
      xp: 30,
      paragraphs: text(language, "Zero is a real input. When n is 0 there are no numbers after it, and the total is 0. The loop body simply does not run.", "Print empty when n is 0. Otherwise print the sum of the following numbers."),
      hints: ["Check n == 0 before the loop.", "The sum still starts at 0."],
      cases: [
        { stdin: "0\n", expected: "empty\n" },
        { stdin: "2\n5\n5\n", expected: "10\n" },
        { stdin: "1\n4\n", expected: "4\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.iff(
            "n == 0",
            e.print(e.str("empty")),
            [e.assign("total", "0"), e.forRange("i", "1", "n", [e.readNum("value"), e.set("total", "total + value")].join("\n")), e.print("total")].join("\n"),
          ),
        ]),
        starter: e.program([e.readNum("n"), e.print(e.str("todo"))]),
        solution: e.program([
          e.readNum("n"),
          e.iff(
            "n == 0",
            e.print(e.str("empty")),
            [e.assign("total", "0"), e.forRange("i", "1", "n", [e.readNum("value"), e.set("total", "total + value")].join("\n")), e.print("total")].join("\n"),
          ),
        ]),
      }),
    },
    {
      slug: "average",
      title: "Whole-number average",
      unit: "Checkpoint",
      minutes: 10,
      xp: 35,
      paragraphs: text(language, "An average is the sum divided by how many numbers you saw. This lesson uses whole-number division, so 7 / 2 is 3, not 3.5.", "Read n and n scores. Print the average. Then print pass when that average is at least 60, otherwise retry."),
      hints: ["Divide the total by n after the loop.", "The pass test uses the average, not the total."],
      cases: [
        { stdin: "3\n70\n80\n90\n", expected: "80\npass\n" },
        { stdin: "2\n50\n50\n", expected: "50\nretry\n" },
        { stdin: "2\n7\n2\n", expected: "4\nretry\n" },
      ],
      build: (e) => ({
        sample: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.forRange("i", "1", "n", [e.readNum("score"), e.set("total", "total + score")].join("\n")),
          e.assign("avg", e.div("total", "n")),
          e.print("avg"),
          e.iff("avg >= 60", e.print(e.str("pass")), e.print(e.str("retry"))),
        ]),
        starter: e.program([e.readNum("n"), e.print("-1")]),
        solution: e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.forRange("i", "1", "n", [e.readNum("score"), e.set("total", "total + score")].join("\n")),
          e.assign("avg", e.div("total", "n")),
          e.print("avg"),
          e.iff("avg >= 60", e.print(e.str("pass")), e.print(e.str("retry"))),
        ]),
      }),
    },
    {
      slug: "drill",
      title: "Min, max, and sum",
      unit: "Checkpoint",
      minutes: 10,
      xp: 40,
      paragraphs: text(language, "This checkpoint uses three numbers, not a list. Track the smaller one, the larger one, and the sum as you read.", "Print the minimum, the maximum, and the sum, on three lines."),
      hints: ["Start min and max from the first number.", "Update them for the second and third numbers."],
      cases: [
        { stdin: "3\n9\n4\n", expected: "3\n9\n16\n" },
        { stdin: "5\n5\n5\n", expected: "5\n5\n15\n" },
        { stdin: "-2\n0\n2\n", expected: "-2\n2\n0\n" },
      ],
      build: (e) => {
        const consider = (value: string) =>
          [e.iff(`${value} < low`, e.set("low", value)), e.iff(`${value} > high`, e.set("high", value)), e.set("total", `total + ${value}`)].join("\n");
        return {
          sample: e.program([e.readNum("a"), e.assign("low", "a"), e.assign("high", "a"), e.assign("total", "a"), e.readNum("b"), consider("b"), e.readNum("c"), consider("c"), e.print("low"), e.print("high"), e.print("total")]),
          starter: e.program([e.readNum("a"), e.print("-1")]),
          solution: e.program([e.readNum("a"), e.assign("low", "a"), e.assign("high", "a"), e.assign("total", "a"), e.readNum("b"), consider("b"), e.readNum("c"), consider("c"), e.print("low"), e.print("high"), e.print("total")]),
        };
      },
    },
  ];

  const projects = projectTasks(milestone);
  return [...core, ...projects].map((spec) => {
    if (spec.milestone) {
      spec.milestone = {
        ...spec.milestone,
        id: spec.milestone.id.startsWith(`${lang}-`) ? spec.milestone.id : `${lang}-${spec.milestone.id || spec.slug}`,
        paths: [...new Set([...paths, ...spec.milestone.paths])],
      };
    }
    return lessonFrom(lang, language, spec);
  });
}

function projectTasks(milestone: (id: string, title: string, brief: string, tier: Milestone["tier"], step: number, extra?: string[]) => Milestone): Parameters<typeof lessonFrom>[2][] {
  const calc = "Read an operation and two numbers. add, sub, and mul are the three operations.";
  return [
    {
      slug: "calc-sum",
      title: "Calculator: add",
      unit: "Projects",
      minutes: 8,
      xp: 30,
      paragraphs: ["A calculator starts with one operation that is obviously useful.", "Read two numbers and print the sum.", "Later steps add more operations. This step only adds."],
      hints: ["Read both numbers.", "Print a + b."],
      cases: [
        { stdin: "2\n3\n", expected: "5\n" },
        { stdin: "20\n22\n", expected: "42\n" },
      ],
      milestone: milestone("calculator", "Calculator", "A small calculator for add, subtract, multiply, and safe division.", "Beginner", 1, ["software", "fullstack"]),
      build: (e) => ({
        sample: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
        starter: e.program([e.readNum("a"), e.readNum("b"), e.print("-1")]),
        solution: e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
      }),
    },
    {
      slug: "calc-ops",
      title: "Calculator: three operations",
      unit: "Projects",
      minutes: 12,
      xp: 40,
      paragraphs: ["The first line is the operation: add, sub, or mul.", calc, "Print the result for whichever word arrives."],
      hints: ["Compare the operation to the word add.", "sub is a - b. mul is a * b."],
      cases: [
        { stdin: "add\n2\n3\n", expected: "5\n" },
        { stdin: "sub\n9\n4\n", expected: "5\n" },
        { stdin: "mul\n6\n7\n", expected: "42\n" },
      ],
      milestone: milestone("calculator", "Calculator", "A small calculator for add, subtract, multiply, and safe division.", "Beginner", 2, ["software", "fullstack"]),
      build: (e) => ({
        sample: e.program([
          e.readStr("op"),
          e.readNum("a"),
          e.readNum("b"),
          e.iff("op == \"add\"", e.print("a + b"), e.iff("op == \"sub\"", e.print("a - b"), e.print("a * b"))),
        ]),
        starter: e.program([e.readStr("op"), e.readNum("a"), e.readNum("b"), e.print("-1")]),
        solution: e.program([
          e.readStr("op"),
          e.readNum("a"),
          e.readNum("b"),
          e.iff("op == \"add\"", e.print("a + b"), e.iff("op == \"sub\"", e.print("a - b"), e.print("a * b"))),
        ]),
      }),
    },
    {
      slug: "calc-div",
      title: "Calculator: safe division",
      unit: "Projects",
      minutes: 12,
      xp: 45,
      paragraphs: ["Division by zero is not a result. It is a message.", "Keep add, sub, and mul. When the operation is div and b is 0, print error. Otherwise print the whole-number quotient."],
      hints: ["Check div before you divide.", "b == 0 prints error."],
      cases: [
        { stdin: "div\n8\n2\n", expected: "4\n" },
        { stdin: "div\n8\n0\n", expected: "error\n" },
        { stdin: "add\n1\n2\n", expected: "3\n" },
      ],
      milestone: milestone("calculator", "Calculator", "A small calculator for add, subtract, multiply, and safe division.", "Beginner", 3, ["software", "fullstack"]),
      build: (e) => ({
        sample: e.program([
          e.readStr("op"),
          e.readNum("a"),
          e.readNum("b"),
          e.iff(
            "op == \"add\"",
            e.print("a + b"),
            e.iff("op == \"sub\"", e.print("a - b"), e.iff("op == \"mul\"", e.print("a * b"), e.iff("b == 0", e.print(e.str("error")), e.print(e.div("a", "b"))))),
          ),
        ]),
        starter: e.program([e.readStr("op"), e.readNum("a"), e.readNum("b"), e.print(e.str("todo"))]),
        solution: e.program([
          e.readStr("op"),
          e.readNum("a"),
          e.readNum("b"),
          e.iff(
            "op == \"add\"",
            e.print("a + b"),
            e.iff("op == \"sub\"", e.print("a - b"), e.iff("op == \"mul\"", e.print("a * b"), e.iff("b == 0", e.print(e.str("error")), e.print(e.div("a", "b"))))),
          ),
        ]),
      }),
    },
    task("todo-count", "To-do: count the tasks", "To-do list", "Read a list of task names and print how many arrived.", "Beginner", 1, ["software", "mobile"], ["2\nwash\nmail\n", "2\n"], ["1\nship\n", "1\n"], (e) =>
      e.program([e.readNum("n"), e.forRange("i", "1", "n", e.readStr("task")), e.print("n")]),
    ),
    task("todo-list", "To-do: print every task", "To-do list", "Print each task on its own line, in the order it arrived.", "Beginner", 2, ["software", "mobile"], ["2\nwash\nmail\n", "wash\nmail\n"], ["1\nship\n", "ship\n"], (e) =>
      e.program([e.readNum("n"), e.forRange("i", "1", "n", [e.readStr("task"), e.print("task")].join("\n"))]),
    ),
    task("todo-find", "To-do: is it on the list?", "To-do list", "The line after the count is the query. Then the tasks arrive. Print yes if one matches, otherwise no.", "Beginner", 3, ["software", "mobile"], ["2\nmail\nwash\nmail\n", "yes\n"], ["2\ncode\nwash\nmail\n", "no\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.readStr("query"),
        e.assign("found", "0"),
        e.forRange("i", "1", "n", [e.readStr("task"), e.iff("task == query", e.set("found", "1"))].join("\n")),
        e.iff("found == 1", e.print(e.str("yes")), e.print(e.str("no"))),
      ]),
    ),
    task("guess-match", "Guess: match or nope", "Number guessing", "Read the secret and one guess. Print match or nope.", "Beginner", 1, ["games"], ["7\n7\n", "match\n"], ["7\n2\n", "nope\n"], (e) =>
      e.program([e.readNum("secret"), e.readNum("guess"), e.iff("guess == secret", e.print(e.str("match")), e.print(e.str("nope")))]),
    ),
    task("guess-hint", "Guess: low or high", "Number guessing", "Print match, low, or high so the player knows which way to go.", "Beginner", 2, ["games"], ["7\n4\n", "low\n"], ["7\n9\n", "high\n"], (e) =>
      e.program([
        e.readNum("secret"),
        e.readNum("guess"),
        e.iff("guess == secret", e.print(e.str("match")), e.iff("guess < secret", e.print(e.str("low")), e.print(e.str("high")))),
      ]),
    ),
    task("guess-three", "Guess: three tries", "Number guessing", "Read the secret and then exactly three guesses. Print win if any guess matches, otherwise lose.", "Beginner", 3, ["games"], ["7\n1\n7\n3\n", "win\n"], ["9\n1\n2\n3\n", "lose\n"], (e) =>
      e.program([
        e.readNum("secret"),
        e.assign("won", "0"),
        e.forRange("i", "1", "3", [e.readNum("guess"), e.iff("guess == secret", e.set("won", "1"))].join("\n")),
        e.iff("won == 1", e.print(e.str("win")), e.print(e.str("lose"))),
      ]),
    ),
    task("pass-length", "Password: how long is it?", "Password checker", "Read one word and print how many characters it has. Length is the first check in any password rule.", "Beginner", 1, ["security", "automation"], ["hello\n", "5\n"], ["Kindling\n", "8\n"], (e) =>
      e.program([e.readStr("word"), e.print(e.len("word"))]),
    ),
    task("pass-rule", "Password: long enough?", "Password checker", "Eight characters is the bar for this lesson. Print strong or weak.", "Beginner", 2, ["security", "automation"], ["password\n", "strong\n"], ["short\n", "weak\n"], (e) =>
      e.program([e.readStr("word"), e.iff(`${e.len("word")} >= 8`, e.print(e.str("strong")), e.print(e.str("weak")))]),
    ),
    task("pass-pattern", "Password: build a pattern", "Password checker", "Read a length. Print that many lines, cycling K, then 9, then x. This is a teaching pattern, not a secure generator.", "Beginner", 3, ["security", "automation"], ["4\n", "K\n9\nx\nK\n"], ["1\n", "K\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.forRange(
          "i",
          "0",
          "n - 1",
          e.iff("i % 3 == 0", e.print(e.str("K")), e.iff("i % 3 == 1", e.print(e.str("9")), e.print(e.str("x")))),
        ),
      ]),
    ),
    task("weather-sum", "Weather: total temperature", "Weather report", "Read how many readings follow, then the temperatures. Print the sum.", "Intermediate", 1, ["data", "backend"], ["3\n10\n12\n8\n", "30\n"], ["1\n7\n", "7\n"], (e) =>
      e.program([e.readNum("n"), e.assign("total", "0"), e.forRange("i", "1", "n", [e.readNum("temp"), e.set("total", "total + temp")].join("\n")), e.print("total")]),
    ),
    task("weather-hot", "Weather: hottest reading", "Weather report", "Print the highest temperature. Start from the first reading, not from zero.", "Intermediate", 2, ["data", "backend"], ["3\n10\n12\n8\n", "12\n"], ["2\n-4\n-1\n", "-1\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.readNum("best"),
        e.forRange("i", "2", "n", [e.readNum("temp"), e.iff("temp > best", e.set("best", "temp"))].join("\n")),
        e.print("best"),
      ]),
    ),
    task("weather-city", "Weather: hottest city", "Weather report", "Each reading is a city name and a temperature. Print the name of the hottest city.", "Intermediate", 3, ["data", "backend"], ["2\nOslo\n-2\nCairo\n30\n", "Cairo\n"], ["1\nAda\n18\n", "Ada\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.readStr("bestCity"),
        e.readNum("best"),
        e.forRange("i", "2", "n", [e.readStr("city"), e.readNum("temp"), e.iff("temp > best", [e.set("best", "temp"), e.set("bestCity", "city")].join("\n"))].join("\n")),
        e.print("bestCity"),
      ]),
    ),
    task("notes-save", "Notes: save a title", "Notes", "Read a title and print Saved: followed by that title.", "Intermediate", 1, ["fullstack", "mobile", "frontend"], ["Milk\n", "Saved: Milk\n"], ["Eggs\n", "Saved: Eggs\n"], (e) =>
      e.program([e.readStr("title"), e.print(e.concat(e.str("Saved: "), "title"))]),
    ),
    task("notes-list", "Notes: list titles", "Notes", "Read how many notes follow, then the titles. Print each title.", "Intermediate", 2, ["fullstack", "mobile", "frontend"], ["2\nMilk\nEggs\n", "Milk\nEggs\n"], ["1\nTea\n", "Tea\n"], (e) =>
      e.program([e.readNum("n"), e.forRange("i", "1", "n", [e.readStr("title"), e.print("title")].join("\n"))]),
    ),
    task("notes-body", "Notes: title and body", "Notes", "Each note is a title and a body word. Print title: body for each one.", "Intermediate", 3, ["fullstack", "mobile", "frontend"], ["1\nMilk\nbuy\n", "Milk: buy\n"], ["2\nMilk\nbuy\nEggs\npack\n", "Milk: buy\nEggs: pack\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.forRange("i", "1", "n", [e.readStr("title"), e.readStr("body"), e.print(e.concat("title", e.concat(e.str(": "), "body")))].join("\n")),
      ]),
    ),
    task("logs-count", "Logs: how many lines?", "Log review", "You are counting lines from a log you already own. Read how many words follow, then the words, and print the count.", "Intermediate", 1, ["devops", "security"], ["3\ninfo\nerror\ninfo\n", "3\n"], ["1\nok\n", "1\n"], (e) =>
      e.program([e.readNum("n"), e.forRange("i", "1", "n", e.readStr("line")), e.print("n")]),
    ),
    task("logs-errors", "Logs: count the errors", "Log review", "Print how many words are exactly error. This is a review of your own log, not a scan of someone else's machine.", "Intermediate", 2, ["devops", "security"], ["3\ninfo\nerror\ninfo\n", "1\n"], ["2\nerror\nerror\n", "2\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.assign("count", "0"),
        e.forRange("i", "1", "n", [e.readStr("line"), e.iff("line == \"error\"", e.set("count", "count + 1"))].join("\n")),
        e.print("count"),
      ]),
    ),
    task("logs-status", "Logs: review or quiet", "Log review", "Print the error count, then review when it is above zero and quiet when it is zero.", "Intermediate", 3, ["devops", "security"], ["2\nerror\ninfo\n", "1\nreview\n"], ["1\nok\n", "0\nquiet\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.assign("count", "0"),
        e.forRange("i", "1", "n", [e.readStr("line"), e.iff("line == \"error\"", e.set("count", "count + 1"))].join("\n")),
        e.print("count"),
        e.iff("count > 0", e.print(e.str("review")), e.print(e.str("quiet"))),
      ]),
    ),
    task("price-avg", "Prices: average", "Price baseline", "A baseline predictor starts with the average. Read the prices and print the whole-number average.", "Advanced", 1, ["data"], ["3\n10\n20\n30\n", "20\n"], ["2\n5\n8\n", "6\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.assign("total", "0"),
        e.forRange("i", "1", "n", [e.readNum("price"), e.set("total", "total + price")].join("\n")),
        e.print(e.div("total", "n")),
      ]),
    ),
    task("price-max", "Prices: average and peak", "Price baseline", "Print the average, then the highest price.", "Advanced", 2, ["data"], ["3\n10\n20\n30\n", "20\n30\n"], ["2\n5\n9\n", "7\n9\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.readNum("first"),
        e.assign("total", "first"),
        e.assign("peak", "first"),
        e.forRange("i", "2", "n", [e.readNum("price"), e.set("total", "total + price"), e.iff("price > peak", e.set("peak", "price"))].join("\n")),
        e.print(e.div("total", "n")),
        e.print("peak"),
      ]),
    ),
    task("price-next", "Prices: predict the next one", "Price baseline", "Predict the next price as the average of the ones you have. Print predict and that number. This is a baseline, not a trained model.", "Advanced", 3, ["data"], ["3\n10\n20\n30\n", "predict 20\n"], ["2\n4\n6\n", "predict 5\n"], (e) =>
      e.program([
        e.readNum("n"),
        e.assign("total", "0"),
        e.forRange("i", "1", "n", [e.readNum("price"), e.set("total", "total + price")].join("\n")),
        e.print(e.concat(e.str("predict "), e.div("total", "n"))),
      ]),
    ),
  ];
}

function task(
  slug: string,
  title: string,
  project: string,
  detail: string,
  tier: Milestone["tier"],
  step: number,
  extra: string[],
  sampleCase: [string, string],
  other: [string, string],
  solution: (e: Emitter) => string,
): Parameters<typeof lessonFrom>[2] {
  return {
    slug,
    title,
    unit: "Projects",
    minutes: 10,
    xp: 35,
    paragraphs: [detail, "The same rules have to hold for every test, not only the sample.", "Read the input from top to bottom."],
    hints: ["Sketch the reads in the same order as the input.", "Print only what the lesson asks for."],
    cases: [
      { stdin: sampleCase[0], expected: sampleCase[1] },
      { stdin: other[0], expected: other[1] },
    ],
    milestone: {
      id: project.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: project,
      brief: detail,
      tier,
      paths: extra,
      step,
      steps: 3,
    },
    build: (e) => ({
      sample: solution(e),
      starter: e.program([e.comment(title), e.print(e.str("todo"))]),
      solution: solution(e),
    }),
  };
}
