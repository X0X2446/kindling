import { mark } from "./icons";
import { milestone, rawLesson } from "./spec";
import type { Course } from "./types";

const paths = ["databases"];

function table(name: string, columns: string, rows: string[][]) {
  const inserts = rows.map((row) => `INSERT INTO ${name} VALUES (${row.map((value) => (typeof value === "number" || /^-?\d+$/.test(value) ? value : `'${value}'`)).join(", ")});`).join("\n");
  return `CREATE TABLE ${name} (${columns});\n${inserts}`;
}

function q(slug: string, title: string, unit: string, paragraphs: string[], hints: string[], query: string, cases: { before: string; expected: string }[], extra?: Parameters<typeof rawLesson>[0]["milestone"]) {
  return rawLesson({
    slug,
    title,
    unit,
    paragraphs,
    hints,
    solution: `${query}\n`,
    starter: "SELECT todo;\n",
    cases,
    milestone: extra,
  });
}

export function sqlCourse(): Course {
  const roster = (rows: [string, string][]) => table("people", "name text, city text", rows);
  const shop = (rows: [string, string][]) => table("item", "name text, price int", rows);
  const grades = (rows: [string, string][]) => table("grade", "name text, score int", rows);
  const books = (rows: [string, string][]) => table("book", "title text, author text", rows);
  const orders = (rows: [string, string][]) => table("orders", "item text, qty int", rows);
  const logs = (rows: [string][]) => table("log", "lvl text", rows);
  const budget = (rows: [string, string][]) => table("line", "label text, amount int", rows);
  const tracks = (rows: [string, string][]) => table("track", "title text, n int", rows);
  return {
    slug: "sql",
    title: "SQL from scratch",
    language: "SQL",
    runner: "sql",
    level: "Language",
    difficulty: "Beginner",
    tracks: paths,
    ...mark("mysql", "original", "sqlite", "003B57"),
    blurb: "Ask a table a question. Select columns, filter rows, count them, and put them in order.",
    honesty: "This runner understands CREATE TABLE, INSERT, and SELECT, including WHERE, AND, COUNT, and ORDER BY. It is a teaching subset of SQLite, not a database server.",
    lessons: [
      q("one-column", "One column", "First queries", ["A table stores rows. SELECT names the columns you want back.", "The people table has name and city. Return only the names."], ["SELECT name FROM people."], "SELECT name FROM people", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "name\nAda\nLin\n" },
        { before: roster([["Grace", "New York"]]), expected: "name\nGrace\n" },
      ]),
      q("two-columns", "Two columns", "First queries", ["A comma in the select list returns more than one column. The result prints a header, then each row.", "Return name and city."], ["Separate the column names with a comma."], "SELECT name, city FROM people", [
        { before: roster([["Ada", "London"]]), expected: "name | city\nAda | London\n" },
        { before: roster([["Lin", "Oslo"], ["Grace", "New York"]]), expected: "name | city\nLin | Oslo\nGrace | New York\n" },
      ]),
      q("where-text", "Keep matching text", "Filters", ["WHERE keeps rows that pass a test. Text values belong in single quotes.", "Return the names of people whose city is Oslo."], ["Compare city to 'Oslo'."], "SELECT name FROM people WHERE city = 'Oslo'", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "name\nLin\n" },
        { before: roster([["Nori", "Oslo"], ["Ada", "London"], ["Bo", "Oslo"]]), expected: "name\nNori\nBo\n" },
      ]),
      q("where-number", "Keep large numbers", "Filters", ["Numbers are compared without quotes. A price filter is the same shape as a text filter.", "Return item names whose price is greater than 5."], ["The column is price. The operator is >."], "SELECT name FROM item WHERE price > 5", [
        { before: shop([["tea", "4"], ["mug", "9"]]), expected: "name\nmug\n" },
        { before: shop([["pen", "2"], ["lamp", "12"], ["book", "8"]]), expected: "name\nlamp\nbook\n" },
      ]),
      q("and-filter", "Both conditions", "Filters", ["AND keeps a row only when every condition is true.", "Return names in Oslo with a score of at least 80."], ["city = 'Oslo' AND score >= 80."], "SELECT name FROM grade WHERE city = 'Oslo' AND score >= 80", [
        { before: table("grade", "name text, city text, score int", [["Lin", "Oslo", "90"], ["Ada", "Oslo", "70"], ["Bo", "London", "95"]]), expected: "name\nLin\n" },
        { before: table("grade", "name text, city text, score int", [["Nori", "Oslo", "80"], ["Bo", "Oslo", "79"]]), expected: "name\nNori\n" },
      ]),
      q("count-all", "Count the rows", "Aggregates", ["COUNT(*) answers how many rows match. The header of this result is count.", "Count every person."], ["SELECT COUNT(*) FROM people."], "SELECT COUNT(*) FROM people", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "count\n2\n" },
        { before: roster([["Grace", "New York"]]), expected: "count\n1\n" },
      ]),
      q("count-where", "Count a subset", "Aggregates", ["A count can wear a WHERE. You are counting your own rows, not scanning anyone else's system.", "Count people in London."], ["COUNT(*) and WHERE city = 'London'."], "SELECT COUNT(*) FROM people WHERE city = 'London'", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"], ["Bo", "London"]]), expected: "count\n2\n" },
        { before: roster([["Nori", "Oslo"]]), expected: "count\n0\n" },
      ]),
      q("order-asc", "Smallest first", "Order", ["ORDER BY sorts the rows you selected. The default direction is ascending.", "Return item names ordered by price, smallest first."], ["ORDER BY price."], "SELECT name FROM item ORDER BY price", [
        { before: shop([["mug", "9"], ["tea", "4"]]), expected: "name\ntea\nmug\n" },
        { before: shop([["lamp", "12"], ["pen", "2"], ["book", "8"]]), expected: "name\npen\nbook\nlamp\n" },
      ]),
      q("order-desc", "Largest first", "Order", ["DESC reverses the sort. Largest price, then the next.", "Return item names ordered by price, largest first."], ["ORDER BY price DESC."], "SELECT name FROM item ORDER BY price DESC", [
        { before: shop([["tea", "4"], ["mug", "9"]]), expected: "name\nmug\ntea\n" },
        { before: shop([["pen", "2"], ["lamp", "12"]]), expected: "name\nlamp\npen\n" },
      ]),
      q("not-equal", "Leave one out", "Filters", ["<> means not equal. Use it to drop a value you do not want.", "Return every city except London."], ["WHERE city <> 'London'."], "SELECT name FROM people WHERE city <> 'London'", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "name\nLin\n" },
        { before: roster([["Bo", "London"], ["Nori", "Oslo"], ["Ada", "London"]]), expected: "name\nNori\n" },
      ]),
      q("select-star", "Every column", "First queries", ["A star means every column, in the order the table defined them. Name the columns when you can. The star is for looking around.", "Return every column from the book table."], ["SELECT * FROM book."], "SELECT * FROM book", [
        { before: books([["Frankenstein", "Shelley"]]), expected: "title | author\nFrankenstein | Shelley\n" },
        { before: books([["Kindred", "Butler"], ["Dune", "Herbert"]]), expected: "title | author\nKindred | Butler\nDune | Herbert\n" },
      ]),
      q("order-filter", "Filter, then sort", "Checkpoint", ["WHERE chooses rows. ORDER BY arranges the ones that remain.", "Return names in Oslo, highest score first."], ["Filter on city, then ORDER BY score DESC."], "SELECT name FROM grade WHERE city = 'Oslo' ORDER BY score DESC", [
        { before: table("grade", "name text, city text, score int", [["Lin", "Oslo", "70"], ["Nori", "Oslo", "90"], ["Ada", "London", "100"]]), expected: "name\nNori\nLin\n" },
        { before: table("grade", "name text, city text, score int", [["Bo", "Oslo", "80"]]), expected: "name\nBo\n" },
      ]),
      q("roster-names", "Roster: names", "Projects", ["A roster is a list of people you already have. Start by returning every name."], ["SELECT name FROM people."], "SELECT name FROM people", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "name\nAda\nLin\n" },
        { before: roster([["Grace", "New York"]]), expected: "name\nGrace\n" },
      ], milestone("sql-roster", "Roster", "List people, then keep one city.", "Beginner", 1, 2, paths)),
      q("roster-city", "Roster: one city", "Projects", ["Now keep a single city. The checker changes which city is loaded, so the query has to say Oslo."], ["WHERE city = 'Oslo'."], "SELECT name FROM people WHERE city = 'Oslo'", [
        { before: roster([["Ada", "London"], ["Lin", "Oslo"]]), expected: "name\nLin\n" },
        { before: roster([["Nori", "Oslo"], ["Bo", "London"]]), expected: "name\nNori\n" },
      ], milestone("sql-roster", "Roster", "List people, then keep one city.", "Beginner", 2, 2, paths)),
      q("shop-prices", "Shop: list the stock", "Projects", ["A shop table is name and price. Return both columns."], ["SELECT name, price FROM item."], "SELECT name, price FROM item", [
        { before: shop([["tea", "4"], ["mug", "9"]]), expected: "name | price\ntea | 4\nmug | 9\n" },
        { before: shop([["pen", "2"]]), expected: "name | price\npen | 2\n" },
      ], milestone("sql-shop", "Shop stock", "List prices, then keep the expensive ones.", "Beginner", 1, 2, paths)),
      q("shop-dear", "Shop: above five", "Projects", ["Keep items whose price is greater than 5."], ["WHERE price > 5."], "SELECT name FROM item WHERE price > 5", [
        { before: shop([["tea", "4"], ["mug", "9"]]), expected: "name\nmug\n" },
        { before: shop([["pen", "2"], ["lamp", "12"]]), expected: "name\nlamp\n" },
      ], milestone("sql-shop", "Shop stock", "List prices, then keep the expensive ones.", "Beginner", 2, 2, paths)),
      q("grades-all", "Grades: every score", "Projects", ["Return the student and the score."], ["Two columns: name and score."], "SELECT name, score FROM grade", [
        { before: grades([["Ada", "90"], ["Lin", "70"]]), expected: "name | score\nAda | 90\nLin | 70\n" },
        { before: grades([["Bo", "80"]]), expected: "name | score\nBo | 80\n" },
      ], milestone("sql-grades", "Grade book", "List scores, then count who passed.", "Intermediate", 1, 2, ["databases", "data"])),
      q("grades-pass", "Grades: who passed", "Projects", ["A pass here is a score of at least 80. Count those rows."], ["COUNT(*) WHERE score >= 80."], "SELECT COUNT(*) FROM grade WHERE score >= 80", [
        { before: grades([["Ada", "90"], ["Lin", "70"], ["Bo", "80"]]), expected: "count\n2\n" },
        { before: grades([["Nori", "50"]]), expected: "count\n0\n" },
      ], milestone("sql-grades", "Grade book", "List scores, then count who passed.", "Intermediate", 2, 2, ["databases", "data"])),
      q("library-titles", "Library: titles", "Projects", ["Return every title."], ["SELECT title FROM book."], "SELECT title FROM book", [
        { before: books([["Dune", "Herbert"], ["Kindred", "Butler"]]), expected: "title\nDune\nKindred\n" },
        { before: books([["Emma", "Austen"]]), expected: "title\nEmma\n" },
      ], milestone("sql-library", "Library", "List titles, then keep one author.", "Beginner", 1, 2, paths)),
      q("library-author", "Library: one author", "Projects", ["Return titles by Butler."], ["WHERE author = 'Butler'."], "SELECT title FROM book WHERE author = 'Butler'", [
        { before: books([["Kindred", "Butler"], ["Dune", "Herbert"]]), expected: "title\nKindred\n" },
        { before: books([["Parable", "Butler"], ["Emma", "Austen"], ["Fledgling", "Butler"]]), expected: "title\nParable\nFledgling\n" },
      ], milestone("sql-library", "Library", "List titles, then keep one author.", "Beginner", 2, 2, paths)),
      q("orders-lines", "Orders: the lines", "Projects", ["Return the item and the quantity."], ["SELECT item, qty FROM orders."], "SELECT item, qty FROM orders", [
        { before: orders([["tea", "2"], ["mug", "1"]]), expected: "item | qty\ntea | 2\nmug | 1\n" },
        { before: orders([["pen", "4"]]), expected: "item | qty\npen | 4\n" },
      ], milestone("sql-orders", "Orders", "List order lines, then the large ones.", "Intermediate", 1, 2, ["databases", "backend"])),
      q("orders-bulk", "Orders: quantity over one", "Projects", ["Keep lines whose quantity is greater than 1, largest first."], ["WHERE qty > 1 ORDER BY qty DESC."], "SELECT item FROM orders WHERE qty > 1 ORDER BY qty DESC", [
        { before: orders([["tea", "2"], ["mug", "5"], ["pen", "1"]]), expected: "item\nmug\ntea\n" },
        { before: orders([["book", "3"]]), expected: "item\nbook\n" },
      ], milestone("sql-orders", "Orders", "List order lines, then the large ones.", "Intermediate", 2, 2, ["databases", "backend"])),
      q("logs-lines", "Logs: your own lines", "Projects", ["This table is a log you already own. Return every level. You are not scanning another machine."], ["SELECT lvl FROM log."], "SELECT lvl FROM log", [
        { before: logs([["info"], ["error"], ["info"]]), expected: "lvl\ninfo\nerror\ninfo\n" },
        { before: logs([["info"]]), expected: "lvl\ninfo\n" },
      ], milestone("sql-logs", "Log review", "Read your own log, then count the error rows.", "Intermediate", 1, 2, ["databases", "security", "devops"])),
      q("logs-errors", "Logs: count errors", "Projects", ["Count rows whose level is exactly error."], ["WHERE lvl = 'error'."], "SELECT COUNT(*) FROM log WHERE lvl = 'error'", [
        { before: logs([["info"], ["error"], ["info"]]), expected: "count\n1\n" },
        { before: logs([["error"], ["error"]]), expected: "count\n2\n" },
      ], milestone("sql-logs", "Log review", "Read your own log, then count the error rows.", "Intermediate", 2, 2, ["databases", "security", "devops"])),
      q("budget-lines", "Budget: the lines", "Projects", ["Return the label and the amount."], ["SELECT label, amount FROM line."], "SELECT label, amount FROM line", [
        { before: budget([["rent", "20"], ["tea", "4"]]), expected: "label | amount\nrent | 20\ntea | 4\n" },
        { before: budget([["book", "8"]]), expected: "label | amount\nbook | 8\n" },
      ], milestone("sql-budget", "Budget", "List amounts, then the ones over ten.", "Intermediate", 1, 2, ["databases", "data"])),
      q("budget-large", "Budget: over ten", "Projects", ["Return labels whose amount is greater than 10, largest first."], ["WHERE amount > 10 ORDER BY amount DESC."], "SELECT label FROM line WHERE amount > 10 ORDER BY amount DESC", [
        { before: budget([["tea", "4"], ["rent", "20"], ["desk", "15"]]), expected: "label\nrent\ndesk\n" },
        { before: budget([["pen", "2"]]), expected: "label\n" },
      ], milestone("sql-budget", "Budget", "List amounts, then the ones over ten.", "Intermediate", 2, 2, ["databases", "data"])),
      q("playlist-titles", "Playlist: titles", "Projects", ["A playlist is a title and a track number. Return the titles."], ["SELECT title FROM track."], "SELECT title FROM track", [
        { before: tracks([["Ember", "2"], ["Spark", "1"]]), expected: "title\nEmber\nSpark\n" },
        { before: tracks([["Hearth", "1"]]), expected: "title\nHearth\n" },
      ], milestone("sql-playlist", "Playlist", "List tracks, then play them in order.", "Beginner", 1, 2, paths)),
      q("playlist-order", "Playlist: track order", "Projects", ["Return titles ordered by the track number."], ["ORDER BY n."], "SELECT title FROM track ORDER BY n", [
        { before: tracks([["Ember", "2"], ["Spark", "1"]]), expected: "title\nSpark\nEmber\n" },
        { before: tracks([["Hearth", "3"], ["Ash", "1"], ["Coal", "2"]]), expected: "title\nAsh\nCoal\nHearth\n" },
      ], milestone("sql-playlist", "Playlist", "List tracks, then play them in order.", "Beginner", 2, 2, paths)),
    ],
    resources: [
      { kind: "docs", label: "SQLite SELECT", href: "https://www.sqlite.org/lang_select.html" },
      { kind: "docs", label: "SQLite language reference", href: "https://www.sqlite.org/lang.html" },
    ],
    next: ["python-backend"],
  };
}
