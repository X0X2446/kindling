import type { Emitter } from "./emit";
import { mark } from "./icons";
import { fromSpecs, milestone, type Spec } from "./spec";
import type { Course } from "./types";

const securityNote = "These checks sort mail you were given, measure a password, or decide whether a role may do an action. Nothing here scans a network, sends a payload, or breaks into a system.";

function pair(id: string, title: string, brief: string, tier: "Beginner" | "Intermediate" | "Advanced", paths: string[], steps: [Spec, Spec]): Spec[] {
  return steps.map((step, index) => ({
    ...step,
    milestone: milestone(id, title, brief, tier, index + 1, 2, paths),
  }));
}

export function securityCourse(): Course {
  const paths = ["security"];
  const specs: Spec[] = [
    {
      slug: "length",
      title: "How long is the password?",
      unit: "Passwords",
      paragraphs: ["Length is the first honest check. You are measuring a word the test types, not guessing someone else's password.", "Read one word and print how many characters it has.", securityNote],
      hints: ["len or the language's length operation.", "Print only the number."],
      cases: [
        { stdin: "hello\n", expected: "5\n" },
        { stdin: "Kindling\n", expected: "8\n" },
      ],
      solve: (e) => e.program([e.readStr("word"), e.print(e.len("word"))]),
    },
    {
      slug: "long-enough",
      title: "Eight characters",
      unit: "Passwords",
      paragraphs: ["A short password is easier to guess. This lesson draws the line at 8.", "Print strong when the word has at least 8 characters, otherwise weak.", securityNote],
      hints: ["Compare the length to 8.", "strong is the true branch."],
      cases: [
        { stdin: "password\n", expected: "strong\n" },
        { stdin: "short\n", expected: "weak\n" },
      ],
      solve: (e) => e.program([e.readStr("word"), e.iff(`${e.len("word")} >= 8`, e.print(e.str("strong")), e.print(e.str("weak")))]),
    },
    {
      slug: "sort-mail",
      title: "Sort a label you were given",
      unit: "Mail you already have",
      paragraphs: ["Someone handed you a label: phish or note. You file it. You do not send mail and you do not probe a site.", "Print report when the word is phish. Print inbox otherwise.", securityNote],
      hints: ["Compare the word to phish.", "inbox is the else."],
      cases: [
        { stdin: "phish\n", expected: "report\n" },
        { stdin: "note\n", expected: "inbox\n" },
      ],
      solve: (e) => e.program([e.readStr("label"), e.iff(`label == ${e.str("phish")}`, e.print(e.str("report")), e.print(e.str("inbox")))]),
    },
    {
      slug: "role",
      title: "A role, not a person",
      unit: "Least privilege",
      paragraphs: ["Least privilege means a role gets only the access it needs. admin may write. reader may read. Anything else is denied.", "Read a role. Print write, read, or deny."],
      hints: ["Check admin first.", "reader is the next branch."],
      cases: [
        { stdin: "admin\n", expected: "write\n" },
        { stdin: "reader\n", expected: "read\n" },
        { stdin: "guest\n", expected: "deny\n" },
      ],
      solve: (e) => e.program([
        e.readStr("role"),
        e.iff(`role == ${e.str("admin")}`, e.print(e.str("write")), e.iff(`role == ${e.str("reader")}`, e.print(e.str("read")), e.print(e.str("deny")))),
      ]),
    },
    {
      slug: "scheme",
      title: "https or plain",
      unit: "Transport",
      paragraphs: ["https means the page is fetched over an encrypted connection. http does not promise that. You are labeling a scheme, not configuring a server.", "Read a scheme. Print encrypted for https and plain for anything else."],
      hints: ["Compare to the word https.", "plain is the else."],
      cases: [
        { stdin: "https\n", expected: "encrypted\n" },
        { stdin: "http\n", expected: "plain\n" },
      ],
      solve: (e) => e.program([e.readStr("scheme"), e.iff(`scheme == ${e.str("https")}`, e.print(e.str("encrypted")), e.print(e.str("plain")))]),
    },
    {
      slug: "lockout",
      title: "Too many failures",
      unit: "Accounts",
      paragraphs: ["After too many failed sign-in attempts, a careful system locks the account for a while. Five is the line in this lesson.", "Read the failure count. Print locked when it is 5 or more, otherwise open."],
      hints: ["The test is n >= 5.", "Print one word."],
      cases: [
        { stdin: "5\n", expected: "locked\n" },
        { stdin: "4\n", expected: "open\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.iff("n >= 5", e.print(e.str("locked")), e.print(e.str("open")))]),
    },
    {
      slug: "allow",
      title: "Two names on the list",
      unit: "Allow lists",
      paragraphs: ["An allow list names who may enter. Everyone else waits. The list here is ada and lin, on purpose small.", "Read a name. Print allow or wait."],
      hints: ["Check ada, then lin.", "wait is the last else."],
      cases: [
        { stdin: "ada\n", expected: "allow\n" },
        { stdin: "lin\n", expected: "allow\n" },
        { stdin: "bo\n", expected: "wait\n" },
      ],
      solve: (e) => e.program([
        e.readStr("name"),
        e.iff(`name == ${e.str("ada")}`, e.print(e.str("allow")), e.iff(`name == ${e.str("lin")}`, e.print(e.str("allow")), e.print(e.str("wait")))),
      ]),
    },
    {
      slug: "session",
      title: "A session that expired",
      unit: "Checkpoint",
      paragraphs: ["A session should not live forever. After 30 minutes this lesson calls it expired.", "Read the number of minutes. Print expired when it is above 30, otherwise active."],
      hints: ["The test is minutes > 30.", "Equal to 30 is still active."],
      cases: [
        { stdin: "31\n", expected: "expired\n" },
        { stdin: "30\n", expected: "active\n" },
      ],
      solve: (e) => e.program([e.readNum("minutes"), e.iff("minutes > 30", e.print(e.str("expired")), e.print(e.str("active")))]),
    },
    ...pair("sec-pass", "Passphrase", "Measure a passphrase, then decide if it is long enough.", "Beginner", paths, [
      {
        slug: "pass-measure",
        title: "Passphrase: measure",
        unit: "Projects",
        paragraphs: ["Read the passphrase and print its length.", securityNote],
        hints: ["Print the length only."],
        cases: [
          { stdin: "correct-horse\n", expected: "13\n" },
          { stdin: "tiny\n", expected: "4\n" },
        ],
        solve: (e) => e.program([e.readStr("word"), e.print(e.len("word"))]),
      },
      {
        slug: "pass-bar",
        title: "Passphrase: the bar",
        unit: "Projects",
        paragraphs: ["Print strong at 12 characters or more, otherwise short.", securityNote],
        hints: ["12 is the line, not 8."],
        cases: [
          { stdin: "correct-horse\n", expected: "strong\n" },
          { stdin: "short-one\n", expected: "short\n" },
        ],
        solve: (e) => e.program([e.readStr("word"), e.iff(`${e.len("word")} >= 12`, e.print(e.str("strong")), e.print(e.str("short")))]),
      },
    ]),
    ...pair("sec-mail", "Mail sort", "File labels you were given, then count how many say phish.", "Beginner", paths, [
      {
        slug: "mail-one",
        title: "Mail: one label",
        unit: "Projects",
        paragraphs: ["Print report or inbox for a single label.", securityNote],
        hints: ["phish maps to report."],
        cases: [
          { stdin: "phish\n", expected: "report\n" },
          { stdin: "note\n", expected: "inbox\n" },
        ],
        solve: (e) => e.program([e.readStr("label"), e.iff(`label == ${e.str("phish")}`, e.print(e.str("report")), e.print(e.str("inbox")))]),
      },
      {
        slug: "mail-count",
        title: "Mail: count the phish labels",
        unit: "Projects",
        paragraphs: ["Read how many labels follow, then the labels. Print how many are exactly phish.", securityNote],
        hints: ["Start the count at 0.", "Add 1 only on an exact match."],
        cases: [
          { stdin: "3\nnote\nphish\nphish\n", expected: "2\n" },
          { stdin: "1\nnote\n", expected: "0\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readStr("label"), e.iff(`label == ${e.str("phish")}`, e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
        ]),
      },
    ]),
    ...pair("sec-gate", "Role gate", "Decide from a role, then from a role and an action together.", "Intermediate", paths, [
      {
        slug: "gate-role",
        title: "Gate: the role",
        unit: "Projects",
        paragraphs: ["Print write, read, or deny from the role alone."],
        hints: ["admin, then reader, then deny."],
        cases: [
          { stdin: "admin\n", expected: "write\n" },
          { stdin: "guest\n", expected: "deny\n" },
        ],
        solve: (e) => e.program([
          e.readStr("role"),
          e.iff(`role == ${e.str("admin")}`, e.print(e.str("write")), e.iff(`role == ${e.str("reader")}`, e.print(e.str("read")), e.print(e.str("deny")))),
        ]),
      },
      {
        slug: "gate-action",
        title: "Gate: role and action",
        unit: "Projects",
        paragraphs: ["Read a role and an action. admin may read or write. reader may only read. Anything else prints deny.", "This is an allow decision, not an attack."],
        hints: ["admin allows both words you care about.", "reader allows only read."],
        cases: [
          { stdin: "admin\nwrite\n", expected: "allow\n" },
          { stdin: "reader\nread\n", expected: "allow\n" },
          { stdin: "reader\nwrite\n", expected: "deny\n" },
        ],
        solve: (e: Emitter) => e.program([
          e.readStr("role"),
          e.readStr("action"),
          e.iff(
            `role == ${e.str("admin")}`,
            e.print(e.str("allow")),
            e.iff(`role == ${e.str("reader")}`, e.iff(`action == ${e.str("read")}`, e.print(e.str("allow")), e.print(e.str("deny"))), e.print(e.str("deny"))),
          ),
        ]),
      },
    ]),
    ...pair("sec-scheme", "Scheme check", "Label a scheme, then label a port.", "Beginner", paths, [
      {
        slug: "scheme-word",
        title: "Scheme: the word",
        unit: "Projects",
        paragraphs: ["Print encrypted or plain."],
        hints: ["https is encrypted."],
        cases: [
          { stdin: "https\n", expected: "encrypted\n" },
          { stdin: "http\n", expected: "plain\n" },
        ],
        solve: (e) => e.program([e.readStr("scheme"), e.iff(`scheme == ${e.str("https")}`, e.print(e.str("encrypted")), e.print(e.str("plain")))]),
      },
      {
        slug: "scheme-port",
        title: "Scheme: the port",
        unit: "Projects",
        paragraphs: ["Port 443 is the usual https port. Port 80 is the usual http port. Anything else is other.", "You are naming a port, not opening one."],
        hints: ["Check 443, then 80."],
        cases: [
          { stdin: "443\n", expected: "https\n" },
          { stdin: "80\n", expected: "http\n" },
          { stdin: "22\n", expected: "other\n" },
        ],
        solve: (e) => e.program([
          e.readNum("port"),
          e.iff("port == 443", e.print(e.str("https")), e.iff("port == 80", e.print(e.str("http")), e.print(e.str("other")))),
        ]),
      },
    ]),
    ...pair("sec-lock", "Lockout counter", "Count failures, then lock when they pass the line.", "Intermediate", paths, [
      {
        slug: "lock-count",
        title: "Lockout: count failures",
        unit: "Projects",
        paragraphs: ["Read how many words follow. Count the ones that are exactly fail. Print the count."],
        hints: ["Same shape as counting any exact word."],
        cases: [
          { stdin: "3\nfail\nok\nfail\n", expected: "2\n" },
          { stdin: "1\nok\n", expected: "0\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readStr("word"), e.iff(`word == ${e.str("fail")}`, e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
        ]),
      },
      {
        slug: "lock-decide",
        title: "Lockout: decide",
        unit: "Projects",
        paragraphs: ["Read a count. Print locked at 5 or more, otherwise open."],
        hints: ["n >= 5."],
        cases: [
          { stdin: "6\n", expected: "locked\n" },
          { stdin: "0\n", expected: "open\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.iff("n >= 5", e.print(e.str("locked")), e.print(e.str("open")))]),
      },
    ]),
    ...pair("sec-list", "Allow list", "Allow two names, then count how many of a batch are allowed.", "Intermediate", paths, [
      {
        slug: "list-one",
        title: "Allow list: one name",
        unit: "Projects",
        paragraphs: ["ada and lin are allowed. Print allow or wait."],
        hints: ["Two comparisons, then wait."],
        cases: [
          { stdin: "lin\n", expected: "allow\n" },
          { stdin: "bo\n", expected: "wait\n" },
        ],
        solve: (e) => e.program([
          e.readStr("name"),
          e.iff(`name == ${e.str("ada")}`, e.print(e.str("allow")), e.iff(`name == ${e.str("lin")}`, e.print(e.str("allow")), e.print(e.str("wait")))),
        ]),
      },
      {
        slug: "list-batch",
        title: "Allow list: a batch",
        unit: "Projects",
        paragraphs: ["Read n names and print how many are ada or lin."],
        hints: ["Add 1 for either name."],
        cases: [
          { stdin: "3\nada\nbo\nlin\n", expected: "2\n" },
          { stdin: "1\nbo\n", expected: "0\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [
            e.readStr("name"),
            e.iff(`name == ${e.str("ada")}`, e.set("count", "count + 1"), e.iff(`name == ${e.str("lin")}`, e.set("count", "count + 1"))),
          ].join("\n")),
          e.print("count"),
        ]),
      },
    ]),
    ...pair("sec-session", "Session timer", "Mark a session, then warn when it is stale.", "Intermediate", paths, [
      {
        slug: "session-mark",
        title: "Session: active or expired",
        unit: "Projects",
        paragraphs: ["Above 30 minutes is expired."],
        hints: ["30 itself is active."],
        cases: [
          { stdin: "45\n", expected: "expired\n" },
          { stdin: "10\n", expected: "active\n" },
        ],
        solve: (e) => e.program([e.readNum("minutes"), e.iff("minutes > 30", e.print(e.str("expired")), e.print(e.str("active")))]),
      },
      {
        slug: "session-warn",
        title: "Session: warn or fine",
        unit: "Projects",
        paragraphs: ["Above 20 minutes, print warn. Otherwise print fine. The session is not dead yet. It is a reminder."],
        hints: ["minutes > 20."],
        cases: [
          { stdin: "21\n", expected: "warn\n" },
          { stdin: "20\n", expected: "fine\n" },
        ],
        solve: (e) => e.program([e.readNum("minutes"), e.iff("minutes > 20", e.print(e.str("warn")), e.print(e.str("fine")))]),
      },
    ]),
    ...pair("sec-audit", "Audit notes", "Count failures in notes you already have, then say whether to review.", "Advanced", ["security", "devops"], [
      {
        slug: "audit-count",
        title: "Audit: count fails",
        unit: "Projects",
        paragraphs: ["Count words that are exactly fail. This is your own note, not a remote log."],
        hints: ["Exact match only."],
        cases: [
          { stdin: "4\nfail\nok\nfail\nok\n", expected: "2\n" },
          { stdin: "2\nok\nok\n", expected: "0\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readStr("word"), e.iff(`word == ${e.str("fail")}`, e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
        ]),
      },
      {
        slug: "audit-status",
        title: "Audit: review or quiet",
        unit: "Projects",
        paragraphs: ["Print the fail count, then review when it is above zero and quiet when it is zero."],
        hints: ["Print the number before the word."],
        cases: [
          { stdin: "2\nfail\nok\n", expected: "1\nreview\n" },
          { stdin: "1\nok\n", expected: "0\nquiet\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("count", "0"),
          e.forRange("i", "1", "n", [e.readStr("word"), e.iff(`word == ${e.str("fail")}`, e.set("count", "count + 1"))].join("\n")),
          e.print("count"),
          e.iff("count > 0", e.print(e.str("review")), e.print(e.str("quiet"))),
        ]),
      },
    ]),
  ];
  return {
    slug: "security",
    title: "Cybersecurity basics",
    language: "Python",
    runner: "python",
    level: "Specialization",
    difficulty: "Beginner",
    tracks: paths,
    ...mark("linux", "original", "linux", "FCC624"),
    blurb: "Passwords, labels, roles, and sessions. Defensive checks you can explain, practiced in Python.",
    honesty: securityNote,
    lessons: fromSpecs("python", specs),
    resources: [
      { kind: "docs", label: "OWASP authentication cheat sheet", href: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
      { kind: "docs", label: "MDN HTTPS", href: "https://developer.mozilla.org/en-US/docs/Glossary/HTTPS" },
    ],
    next: ["python"],
  };
}

const chainNote = "Balances here are numbers in a lesson, not coins. The checksum is a remainder you compute so you can see the idea. It is not a hash, it does not protect a wallet, and it is not something you send to a real chain.";

export function web3Course(): Course {
  const paths = ["web3"];
  const specs: Spec[] = [
    {
      slug: "balance",
      title: "A balance is a number",
      unit: "A toy ledger",
      paragraphs: ["A ledger remembers who has what. Here that memory is a number you print.", "Read a balance and print it.", chainNote],
      hints: ["Read the number and print it unchanged."],
      cases: [
        { stdin: "10\n", expected: "10\n" },
        { stdin: "0\n", expected: "0\n" },
      ],
      solve: (e) => e.program([e.readNum("balance"), e.print("balance")]),
    },
    {
      slug: "credit",
      title: "Credit adds",
      unit: "A toy ledger",
      paragraphs: ["A credit increases a balance. There is no network. You add two numbers the test types.", "Read a balance and a credit. Print the new balance.", chainNote],
      hints: ["New balance is balance plus credit."],
      cases: [
        { stdin: "10\n3\n", expected: "13\n" },
        { stdin: "0\n5\n", expected: "5\n" },
      ],
      solve: (e) => e.program([e.readNum("balance"), e.readNum("credit"), e.print("balance + credit")]),
    },
    {
      slug: "debit",
      title: "Refuse an overdraft",
      unit: "A toy ledger",
      paragraphs: ["A debit that is larger than the balance does not go through. Print overdraft instead of a negative number.", "Read a balance and a debit.", chainNote],
      hints: ["Compare debit to balance before you subtract."],
      cases: [
        { stdin: "10\n4\n", expected: "6\n" },
        { stdin: "3\n9\n", expected: "overdraft\n" },
      ],
      solve: (e) => e.program([
        e.readNum("balance"),
        e.readNum("debit"),
        e.iff("debit > balance", e.print(e.str("overdraft")), e.print("balance - debit")),
      ]),
    },
    {
      slug: "two-accounts",
      title: "Two accounts",
      unit: "A toy ledger",
      paragraphs: ["A transfer needs two balances. First, just print both so you can see them.", "Read account A and account B. Print A, then B.", chainNote],
      hints: ["Two reads, two prints."],
      cases: [
        { stdin: "8\n2\n", expected: "8\n2\n" },
        { stdin: "0\n5\n", expected: "0\n5\n" },
      ],
      solve: (e) => e.program([e.readNum("a"), e.readNum("b"), e.print("a"), e.print("b")]),
    },
    {
      slug: "transfer",
      title: "Move an amount",
      unit: "A toy ledger",
      paragraphs: ["Move an amount from A to B when A can cover it. Print both balances afterward, or overdraft.", chainNote],
      hints: ["Subtract from A and add to B only when amount is not greater than A."],
      cases: [
        { stdin: "8\n2\n3\n", expected: "5\n5\n" },
        { stdin: "2\n2\n5\n", expected: "overdraft\n" },
      ],
      solve: (e) => e.program([
        e.readNum("a"),
        e.readNum("b"),
        e.readNum("amount"),
        e.iff("amount > a", e.print(e.str("overdraft")), [e.print("a - amount"), e.print("b + amount")].join("\n")),
      ]),
    },
    {
      slug: "checksum",
      title: "A teaching checksum",
      unit: "A remainder, not a hash",
      paragraphs: ["Print the remainder of n divided by 97.", "Call that remainder a teaching checksum. It is not a cryptographic hash, it does not protect a wallet, and you do not send it anywhere.", chainNote],
      hints: ["The operator is % in JavaScript.", "Print only the remainder."],
      cases: [
        { stdin: "100\n", expected: "3\n" },
        { stdin: "97\n", expected: "0\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.print("n % 97")]),
    },
    {
      slug: "nonce",
      title: "The next nonce",
      unit: "A remainder, not a hash",
      paragraphs: ["A nonce is a number that moves forward so a replay of an old message is obvious. Here you only add one.", "Read n and print n + 1.", chainNote],
      hints: ["Print n + 1."],
      cases: [
        { stdin: "4\n", expected: "5\n" },
        { stdin: "0\n", expected: "1\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.print("n + 1")]),
    },
    {
      slug: "fee",
      title: "A fee that must fit",
      unit: "Checkpoint",
      paragraphs: ["A fee comes out of an amount. If the fee is larger than the amount, print error. Otherwise print the amount that remains.", chainNote],
      hints: ["Check the fee before you subtract."],
      cases: [
        { stdin: "10\n2\n", expected: "8\n" },
        { stdin: "2\n5\n", expected: "error\n" },
      ],
      solve: (e) => e.program([
        e.readNum("amount"),
        e.readNum("fee"),
        e.iff("fee > amount", e.print(e.str("error")), e.print("amount - fee")),
      ]),
    },
    ...pair("web3-wallet", "Wallet baseline", "Open a balance, then add a credit.", "Beginner", paths, [
      {
        slug: "wallet-open",
        title: "Wallet: open",
        unit: "Projects",
        paragraphs: ["Print the starting balance.", chainNote],
        hints: ["Print the number you read."],
        cases: [
          { stdin: "12\n", expected: "12\n" },
          { stdin: "1\n", expected: "1\n" },
        ],
        solve: (e) => e.program([e.readNum("balance"), e.print("balance")]),
      },
      {
        slug: "wallet-credit",
        title: "Wallet: credit",
        unit: "Projects",
        paragraphs: ["Add a credit and print the new balance.", chainNote],
        hints: ["balance + credit."],
        cases: [
          { stdin: "12\n3\n", expected: "15\n" },
          { stdin: "0\n8\n", expected: "8\n" },
        ],
        solve: (e) => e.program([e.readNum("balance"), e.readNum("credit"), e.print("balance + credit")]),
      },
    ]),
    ...pair("web3-spend", "Spend", "Subtract a debit, and refuse it when the balance is too small.", "Beginner", paths, [
      {
        slug: "spend-ok",
        title: "Spend: it fits",
        unit: "Projects",
        paragraphs: ["The tests only send debits that fit. Print the remainder.", chainNote],
        hints: ["balance - debit."],
        cases: [
          { stdin: "9\n4\n", expected: "5\n" },
          { stdin: "4\n4\n", expected: "0\n" },
        ],
        solve: (e) => e.program([e.readNum("balance"), e.readNum("debit"), e.print("balance - debit")]),
      },
      {
        slug: "spend-guard",
        title: "Spend: or don't",
        unit: "Projects",
        paragraphs: ["Print overdraft when the debit is greater than the balance.", chainNote],
        hints: ["Compare before you subtract."],
        cases: [
          { stdin: "9\n4\n", expected: "5\n" },
          { stdin: "1\n4\n", expected: "overdraft\n" },
        ],
        solve: (e) => e.program([
          e.readNum("balance"),
          e.readNum("debit"),
          e.iff("debit > balance", e.print(e.str("overdraft")), e.print("balance - debit")),
        ]),
      },
    ]),
    ...pair("web3-move", "Transfer", "Show both accounts, then move an amount when it fits.", "Intermediate", paths, [
      {
        slug: "move-show",
        title: "Transfer: show both",
        unit: "Projects",
        paragraphs: ["Print A then B.", chainNote],
        hints: ["Two prints."],
        cases: [
          { stdin: "5\n5\n", expected: "5\n5\n" },
          { stdin: "3\n1\n", expected: "3\n1\n" },
        ],
        solve: (e) => e.program([e.readNum("a"), e.readNum("b"), e.print("a"), e.print("b")]),
      },
      {
        slug: "move-send",
        title: "Transfer: send",
        unit: "Projects",
        paragraphs: ["Read A, B, and an amount. Print the two new balances, or overdraft.", chainNote],
        hints: ["amount > a is the refusal."],
        cases: [
          { stdin: "9\n1\n4\n", expected: "5\n5\n" },
          { stdin: "1\n1\n2\n", expected: "overdraft\n" },
        ],
        solve: (e) => e.program([
          e.readNum("a"),
          e.readNum("b"),
          e.readNum("amount"),
          e.iff("amount > a", e.print(e.str("overdraft")), [e.print("a - amount"), e.print("b + amount")].join("\n")),
        ]),
      },
    ]),
    ...pair("web3-check", "Teaching checksum", "Print a remainder, then label it. It is not a hash.", "Intermediate", paths, [
      {
        slug: "check-mod",
        title: "Checksum: the remainder",
        unit: "Projects",
        paragraphs: ["Print n % 97. This is a teaching checksum, not a hash and not a wallet.", chainNote],
        hints: ["Use the remainder operator."],
        cases: [
          { stdin: "98\n", expected: "1\n" },
          { stdin: "0\n", expected: "0\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.print("n % 97")]),
      },
      {
        slug: "check-label",
        title: "Checksum: label the line",
        unit: "Projects",
        paragraphs: ["Print check and the remainder on one line, so the output says what it is.", chainNote],
        hints: ["Join the word check with a space and the remainder."],
        cases: [
          { stdin: "98\n", expected: "check 1\n" },
          { stdin: "97\n", expected: "check 0\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.print(e.concat(e.str("check "), "n % 97"))]),
      },
    ]),
    ...pair("web3-books", "Two books", "Add two balances, then print how far apart they are.", "Beginner", paths, [
      {
        slug: "books-sum",
        title: "Books: the sum",
        unit: "Projects",
        paragraphs: ["Print A + B.", chainNote],
        hints: ["One print of the sum."],
        cases: [
          { stdin: "4\n6\n", expected: "10\n" },
          { stdin: "0\n2\n", expected: "2\n" },
        ],
        solve: (e) => e.program([e.readNum("a"), e.readNum("b"), e.print("a + b")]),
      },
      {
        slug: "books-gap",
        title: "Books: the gap",
        unit: "Projects",
        paragraphs: ["Print the positive gap between A and B. If A is larger, print A - B. Otherwise print B - A.", chainNote],
        hints: ["Compare A to B first."],
        cases: [
          { stdin: "8\n3\n", expected: "5\n" },
          { stdin: "2\n5\n", expected: "3\n" },
        ],
        solve: (e) => e.program([
          e.readNum("a"),
          e.readNum("b"),
          e.iff("a > b", e.print("a - b"), e.print("b - a")),
        ]),
      },
    ]),
    ...pair("web3-fee", "Fee", "Take a fee that fits, and refuse one that does not.", "Intermediate", paths, [
      {
        slug: "fee-net",
        title: "Fee: the net",
        unit: "Projects",
        paragraphs: ["The tests send a fee that fits. Print amount - fee.", chainNote],
        hints: ["One subtraction."],
        cases: [
          { stdin: "10\n1\n", expected: "9\n" },
          { stdin: "5\n5\n", expected: "0\n" },
        ],
        solve: (e) => e.program([e.readNum("amount"), e.readNum("fee"), e.print("amount - fee")]),
      },
      {
        slug: "fee-guard",
        title: "Fee: refuse a large fee",
        unit: "Projects",
        paragraphs: ["Print error when the fee is greater than the amount.", chainNote],
        hints: ["fee > amount."],
        cases: [
          { stdin: "10\n1\n", expected: "9\n" },
          { stdin: "1\n4\n", expected: "error\n" },
        ],
        solve: (e) => e.program([
          e.readNum("amount"),
          e.readNum("fee"),
          e.iff("fee > amount", e.print(e.str("error")), e.print("amount - fee")),
        ]),
      },
    ]),
    ...pair("web3-nonce", "Nonce", "Step a nonce forward, and reject a negative one.", "Advanced", paths, [
      {
        slug: "nonce-next",
        title: "Nonce: next",
        unit: "Projects",
        paragraphs: ["Print n + 1.", chainNote],
        hints: ["Add one."],
        cases: [
          { stdin: "7\n", expected: "8\n" },
          { stdin: "0\n", expected: "1\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.print("n + 1")]),
      },
      {
        slug: "nonce-guard",
        title: "Nonce: reject a negative",
        unit: "Projects",
        paragraphs: ["A negative nonce is not a next step. Print reject when n is below 0. Otherwise print n + 1.", chainNote],
        hints: ["n < 0 is the reject branch."],
        cases: [
          { stdin: "-1\n", expected: "reject\n" },
          { stdin: "2\n", expected: "3\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.iff("n < 0", e.print(e.str("reject")), e.print("n + 1")),
        ]),
      },
    ]),
    ...pair("web3-ledger", "Ledger lines", "Count credits, then add them.", "Advanced", paths, [
      {
        slug: "ledger-count",
        title: "Ledger: how many credits",
        unit: "Projects",
        paragraphs: ["Read n and print n. The credits themselves come in the next step.", chainNote],
        hints: ["Print the count you read."],
        cases: [
          { stdin: "3\n", expected: "3\n" },
          { stdin: "1\n", expected: "1\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.print("n")]),
      },
      {
        slug: "ledger-sum",
        title: "Ledger: sum the credits",
        unit: "Projects",
        paragraphs: ["Read n, then n credit amounts. Print the sum.", chainNote],
        hints: ["Start the total at 0."],
        cases: [
          { stdin: "3\n2\n2\n2\n", expected: "6\n" },
          { stdin: "1\n5\n", expected: "5\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.assign("total", "0"),
          e.forRange("i", "1", "n", [e.readNum("credit"), e.set("total", "total + credit")].join("\n")),
          e.print("total"),
        ]),
      },
    ]),
  ];
  return {
    slug: "web3",
    title: "Blockchain basics",
    language: "JavaScript",
    runner: "javascript",
    level: "Specialization",
    difficulty: "Intermediate",
    tracks: paths,
    ...mark("javascript", "original", "ethereum", "3C3C3D"),
    blurb: "Balances, transfers, fees, and a remainder used as a teaching checksum. No wallet, no chain, no coins.",
    honesty: chainNote,
    lessons: fromSpecs("javascript", specs),
    resources: [
      { kind: "docs", label: "Ethereum documentation", href: "https://ethereum.org/en/developers/docs/" },
      { kind: "docs", label: "MDN remainder operator", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder" },
    ],
    next: ["javascript"],
  };
}

const planNote = "Git, Docker, and CI are not installed in this lesson. You print the plan a careful script would follow. Nothing here talks to a registry, a remote, or a pipeline.";

export function devopsCourse(): Course {
  const paths = ["devops"];
  const word = (slug: string, title: string, unit: string, idea: string, task: string, hint: string, left: string, sample: [string, string], other: [string, string], solve: Spec["solve"]): Spec => ({
    slug,
    title,
    unit,
    paragraphs: [idea, task, planNote],
    hints: [hint],
    cases: [
      { stdin: sample[0], expected: sample[1] },
      { stdin: other[0], expected: other[1] },
    ],
    solve,
  });
  const specs: Spec[] = [
    word("status-word", "A status word", "Git, as a plan", "Git status tells you what changed. Here you only repeat a status word you were given, with a label in front.", "Read a word and print status and that word.", "Join the text status  with the word.", "status ", ["clean\n", "status clean\n"], ["dirty\n", "status dirty\n"], (e) => e.program([e.readStr("word"), e.print(e.concat(e.str("status "), "word"))])),
    word("branch-name", "A branch name", "Git, as a plan", "Checking out a branch is a plan until you run it in a real repository. Print the plan, do not run git.", "Read a branch name and print plan and that name.", "The label is plan .", "plan ", ["main\n", "plan main\n"], ["learn\n", "plan learn\n"], (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("plan "), "name"))])),
    word("message-length", "A commit message length", "Git, as a plan", "A message that is too short is hard to trust later. Measure it.", "Read a message word and print its length.", "Print the length.", "", ["fix-typo\n", "8\n"], ["wip\n", "3\n"], (e) => e.program([e.readStr("message"), e.print(e.len("message"))])),
    word("message-bar", "A message that is long enough", "Git, as a plan", "Eight characters is the bar for this exercise. Print ok or short.", "Read the message.", "Compare the length to 8.", "", ["fix-typo\n", "ok\n"], ["wip\n", "short\n"], (e) => e.program([e.readStr("message"), e.iff(`${e.len("message")} >= 8`, e.print(e.str("ok")), e.print(e.str("short")))])),
    {
      slug: "pipeline-steps",
      title: "A pipeline that prints run",
      unit: "CI, as a plan",
      paragraphs: ["A pipeline is a list of steps. This one prints the word run once per step. No job is started.", planNote],
      hints: ["Loop from 1 through n.", "Print run inside the loop."],
      cases: [
        { stdin: "3\n", expected: "run\nrun\nrun\n" },
        { stdin: "1\n", expected: "run\n" },
      ],
      solve: (e) => e.program([e.readNum("n"), e.forRange("i", "1", "n", e.print(e.str("run")))]),
    },
    {
      slug: "image-name",
      title: "An image name",
      unit: "Containers, as a plan",
      paragraphs: ["Docker is not running. An image name is just text until you build it.", "Read a name and print image and that name.", planNote],
      hints: ["The label is image ."],
      cases: [
        { stdin: "app\n", expected: "image app\n" },
        { stdin: "web\n", expected: "image web\n" },
      ],
      solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("image "), "name"))]),
    },
    {
      slug: "port-plan",
      title: "A published port",
      unit: "Containers, as a plan",
      paragraphs: ["Publishing a port is a plan. Print port and the number. Nothing listens.", planNote],
      hints: ["Read the number and print it after the word port."],
      cases: [
        { stdin: "8080\n", expected: "port 8080\n" },
        { stdin: "80\n", expected: "port 80\n" },
      ],
      solve: (e) => e.program([e.readNum("port"), e.print(e.concat(e.str("port "), "port"))]),
    },
    {
      slug: "env-name",
      title: "A name, not a secret",
      unit: "Checkpoint",
      paragraphs: ["Print the name of a setting, never a secret value. The tests only give you names.", "Read a name and print env and that name.", planNote],
      hints: ["Do not invent a value. Print the name."],
      cases: [
        { stdin: "PORT\n", expected: "env PORT\n" },
        { stdin: "NODE_ENV\n", expected: "env NODE_ENV\n" },
      ],
      solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("env "), "name"))]),
    },
    ...pair("ops-status", "Status plan", "Label a status word, then decide if it is clean.", "Beginner", paths, [
      {
        slug: "status-label",
        title: "Status: label it",
        unit: "Projects",
        paragraphs: ["Print status and the word.", planNote],
        hints: ["Join status  and the word."],
        cases: [
          { stdin: "clean\n", expected: "status clean\n" },
          { stdin: "dirty\n", expected: "status dirty\n" },
        ],
        solve: (e) => e.program([e.readStr("word"), e.print(e.concat(e.str("status "), "word"))]),
      },
      {
        slug: "status-clean",
        title: "Status: clean or review",
        unit: "Projects",
        paragraphs: ["Print clean when the word is clean. Otherwise print review.", planNote],
        hints: ["Compare to the word clean."],
        cases: [
          { stdin: "clean\n", expected: "clean\n" },
          { stdin: "dirty\n", expected: "review\n" },
        ],
        solve: (e) => e.program([e.readStr("word"), e.iff(`word == ${e.str("clean")}`, e.print(e.str("clean")), e.print(e.str("review")))]),
      },
    ]),
    ...pair("ops-branch", "Branch plan", "Print a checkout plan, then reject an empty-looking name.", "Beginner", paths, [
      {
        slug: "branch-plan",
        title: "Branch: the plan",
        unit: "Projects",
        paragraphs: ["Print plan and the branch name. Git does not run.", planNote],
        hints: ["The label is plan ."],
        cases: [
          { stdin: "main\n", expected: "plan main\n" },
          { stdin: "fix\n", expected: "plan fix\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("plan "), "name"))]),
      },
      {
        slug: "branch-length",
        title: "Branch: long enough to read",
        unit: "Projects",
        paragraphs: ["A one-letter branch name is legal and miserable. Print ok at 2 characters or more, otherwise short.", planNote],
        hints: ["Measure the name."],
        cases: [
          { stdin: "main\n", expected: "ok\n" },
          { stdin: "a\n", expected: "short\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.iff(`${e.len("name")} >= 2`, e.print(e.str("ok")), e.print(e.str("short")))]),
      },
    ]),
    ...pair("ops-message", "Commit message", "Measure a message, then accept it when it is long enough.", "Beginner", paths, [
      {
        slug: "message-len",
        title: "Message: length",
        unit: "Projects",
        paragraphs: ["Print the length of the message word.", planNote],
        hints: ["Length only."],
        cases: [
          { stdin: "fix-typo\n", expected: "8\n" },
          { stdin: "wip\n", expected: "3\n" },
        ],
        solve: (e) => e.program([e.readStr("message"), e.print(e.len("message"))]),
      },
      {
        slug: "message-ok",
        title: "Message: ok or short",
        unit: "Projects",
        paragraphs: ["Eight characters is the bar. Print ok or short.", planNote],
        hints: ["Compare the length to 8."],
        cases: [
          { stdin: "fix-typo\n", expected: "ok\n" },
          { stdin: "wip\n", expected: "short\n" },
        ],
        solve: (e) => e.program([e.readStr("message"), e.iff(`${e.len("message")} >= 8`, e.print(e.str("ok")), e.print(e.str("short")))]),
      },
    ]),
    ...pair("ops-ci", "CI plan", "Print one run line per step, then stop at zero.", "Intermediate", paths, [
      {
        slug: "ci-runs",
        title: "CI: print the steps",
        unit: "Projects",
        paragraphs: ["Print run once for each step. No job starts.", planNote],
        hints: ["A loop from 1 through n."],
        cases: [
          { stdin: "2\n", expected: "run\nrun\n" },
          { stdin: "1\n", expected: "run\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.forRange("i", "1", "n", e.print(e.str("run")))]),
      },
      {
        slug: "ci-zero",
        title: "CI: nothing to run",
        unit: "Projects",
        paragraphs: ["When n is 0, print idle. Otherwise print run n times.", planNote],
        hints: ["Check n before the loop."],
        cases: [
          { stdin: "0\n", expected: "idle\n" },
          { stdin: "2\n", expected: "run\nrun\n" },
        ],
        solve: (e) => e.program([
          e.readNum("n"),
          e.iff("n == 0", e.print(e.str("idle")), e.forRange("i", "1", "n", e.print(e.str("run")))),
        ]),
      },
    ]),
    ...pair("ops-image", "Image plan", "Name an image, then reject a short name.", "Intermediate", paths, [
      {
        slug: "image-label",
        title: "Image: the name",
        unit: "Projects",
        paragraphs: ["Print image and the name. Docker is not running.", planNote],
        hints: ["The label is image ."],
        cases: [
          { stdin: "app\n", expected: "image app\n" },
          { stdin: "api\n", expected: "image api\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("image "), "name"))]),
      },
      {
        slug: "image-bar",
        title: "Image: a readable name",
        unit: "Projects",
        paragraphs: ["Print ok when the name has at least 3 characters, otherwise short.", planNote],
        hints: ["Measure the name."],
        cases: [
          { stdin: "app\n", expected: "ok\n" },
          { stdin: "a\n", expected: "short\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.iff(`${e.len("name")} >= 3`, e.print(e.str("ok")), e.print(e.str("short")))]),
      },
    ]),
    ...pair("ops-port", "Port plan", "Print a port plan, then call out the two familiar web ports.", "Intermediate", paths, [
      {
        slug: "port-label",
        title: "Port: the plan",
        unit: "Projects",
        paragraphs: ["Print port and the number. Nothing listens.", planNote],
        hints: ["Join the word and the number."],
        cases: [
          { stdin: "8080\n", expected: "port 8080\n" },
          { stdin: "443\n", expected: "port 443\n" },
        ],
        solve: (e) => e.program([e.readNum("port"), e.print(e.concat(e.str("port "), "port"))]),
      },
      {
        slug: "port-web",
        title: "Port: 80, 443, or other",
        unit: "Projects",
        paragraphs: ["Print http for 80, https for 443, and other otherwise. You are naming a port, not binding it.", planNote],
        hints: ["Check 80, then 443."],
        cases: [
          { stdin: "80\n", expected: "http\n" },
          { stdin: "443\n", expected: "https\n" },
          { stdin: "8080\n", expected: "other\n" },
        ],
        solve: (e) => e.program([
          e.readNum("port"),
          e.iff("port == 80", e.print(e.str("http")), e.iff("port == 443", e.print(e.str("https")), e.print(e.str("other")))),
        ]),
      },
    ]),
    ...pair("ops-env", "Setting names", "Print a setting name, then accept only names that look long enough.", "Advanced", paths, [
      {
        slug: "env-label",
        title: "Setting: the name",
        unit: "Projects",
        paragraphs: ["Print env and the name. Do not invent a value.", planNote],
        hints: ["The label is env ."],
        cases: [
          { stdin: "PORT\n", expected: "env PORT\n" },
          { stdin: "HOST\n", expected: "env HOST\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.print(e.concat(e.str("env "), "name"))]),
      },
      {
        slug: "env-bar",
        title: "Setting: a real name",
        unit: "Projects",
        paragraphs: ["Print ok when the name has at least 3 characters, otherwise short.", planNote],
        hints: ["Measure the name."],
        cases: [
          { stdin: "PORT\n", expected: "ok\n" },
          { stdin: "A\n", expected: "short\n" },
        ],
        solve: (e) => e.program([e.readStr("name"), e.iff(`${e.len("name")} >= 3`, e.print(e.str("ok")), e.print(e.str("short")))]),
      },
    ]),
    ...pair("ops-roll", "Rollout plan", "Count the steps, then print go only when there is at least one.", "Advanced", paths, [
      {
        slug: "roll-count",
        title: "Rollout: the count",
        unit: "Projects",
        paragraphs: ["Print the number of steps. Nothing deploys.", planNote],
        hints: ["Print n."],
        cases: [
          { stdin: "4\n", expected: "4\n" },
          { stdin: "0\n", expected: "0\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.print("n")]),
      },
      {
        slug: "roll-go",
        title: "Rollout: go or hold",
        unit: "Projects",
        paragraphs: ["Print go when n is at least 1. Otherwise print hold.", planNote],
        hints: ["n >= 1."],
        cases: [
          { stdin: "2\n", expected: "go\n" },
          { stdin: "0\n", expected: "hold\n" },
        ],
        solve: (e) => e.program([e.readNum("n"), e.iff("n >= 1", e.print(e.str("go")), e.print(e.str("hold")))]),
      },
    ]),
  ];
  return {
    slug: "devops",
    title: "DevOps and cloud basics",
    language: "Bash",
    runner: "bash",
    level: "Specialization",
    difficulty: "Beginner",
    tracks: paths,
    ...mark("docker", "original", "docker", "2496ED"),
    blurb: "Git, containers, and CI as plans you can read. The tools are not installed here. The scripts print what they would do.",
    honesty: planNote,
    lessons: fromSpecs("bash", specs),
    resources: [
      { kind: "docs", label: "Git reference", href: "https://git-scm.com/docs" },
      { kind: "docs", label: "Docker get started", href: "https://docs.docker.com/get-started/" },
      { kind: "docs", label: "GitHub Actions", href: "https://docs.github.com/en/actions" },
    ],
    next: ["bash"],
  };
}
