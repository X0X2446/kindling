import { lesson, type Lesson } from "./types";

const page = (body: string, style = "") => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Kindling</title>
    <style>
      body { background: #14110e; color: #f4efe6; font-family: Georgia, serif; }
      ${style}
    </style>
  </head>
  <body>
${body}
  </body>
</html>
`;

function htmlLesson(input: Omit<Lesson, "minutes" | "xp" | "sample"> & { minutes?: number; xp?: number }): Lesson {
  return { minutes: input.project ? 12 : 8, xp: input.project ? 35 : 25, ...input };
}

export const htmlMore: Lesson[] = [
  htmlLesson({
    slug: "image",
    title: "An image with a description",
    unit: "More of the page",
    project: false,
    paragraphs: [
      "An img tag needs a source and an alt. The alt is the description a screen reader speaks, and the text that shows if the image does not load.",
      "Add an image whose alt is Ember and whose source is ember.png.",
    ],
    starter: page("    <h1>Camp</h1>\n"),
    solution: page("    <h1>Camp</h1>\n    <img src=\"ember.png\" alt=\"Ember\" />\n"),
    hints: ["The tag is img.", "alt=\"Ember\" and src=\"ember.png\" both belong on it."],
    check: { kind: "html", parts: ["<img", "alt=\"Ember\"", "ember.png"] },
  }),
  htmlLesson({
    slug: "button",
    title: "A button with a job",
    unit: "More of the page",
    project: false,
    paragraphs: [
      "A button is for an action. The text between the tags is what a person reads. type=\"button\" keeps it from pretending to submit a form.",
      "Add a button that says Save note.",
    ],
    starter: page("    <h1>Notes</h1>\n"),
    solution: page("    <h1>Notes</h1>\n    <button type=\"button\">Save note</button>\n"),
    hints: ["The tag is button.", "The visible text is Save note."],
    check: { kind: "html", parts: ["<button", "Save note"] },
  }),
  htmlLesson({
    slug: "form",
    title: "A label and a field",
    unit: "More of the page",
    project: false,
    paragraphs: [
      "A label tells a person what a field is for. for on the label matches id on the input, so a click on the label focuses the field.",
      "Add a label Name and a text input whose id is name.",
    ],
    starter: page("    <h1>Sign in</h1>\n"),
    solution: page("    <h1>Sign in</h1>\n    <label for=\"name\">Name</label>\n    <input id=\"name\" type=\"text\" />\n"),
    hints: ["The label's for and the input's id are both name.", "The label's text is Name."],
    check: { kind: "html", parts: ["<label", "for=\"name\"", "Name", "id=\"name\""] },
  }),
  htmlLesson({
    slug: "landmarks",
    title: "A header and a footer",
    unit: "More of the page",
    project: false,
    paragraphs: [
      "header and footer are landmarks. They tell assistive tech where the banner and the closing notes are. They are not just boxes.",
      "Put Kindling in a header and Keep it small in a footer.",
    ],
    starter: page("    <main><h1>Field</h1></main>\n"),
    solution: page("    <header>Kindling</header>\n    <main><h1>Field</h1></main>\n    <footer>Keep it small</footer>\n"),
    hints: ["header wraps Kindling.", "footer wraps Keep it small."],
    check: { kind: "html", parts: ["<header>Kindling</header>", "<footer>Keep it small</footer>"] },
  }),
  htmlLesson({
    slug: "contrast",
    title: "Text you can read",
    unit: "More of the page",
    project: false,
    paragraphs: [
      "Light text on a dark page is a choice you write down. #f4efe6 on #14110e is the pair this lesson wants.",
      "Set the body background and color to those two values.",
    ],
    starter: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Kindling</title>
    <style>
      body { font-family: Georgia, serif; }
    </style>
  </head>
  <body>
    <h1>Read me</h1>
  </body>
</html>
`,
    solution: page("    <h1>Read me</h1>\n"),
    hints: ["Both declarations go on body.", "The color is #f4efe6 and the background is #14110e."],
    check: { kind: "html", parts: ["#14110e", "#f4efe6"] },
  }),
  htmlLesson({
    slug: "recipe",
    title: "Project: a recipe",
    unit: "Projects",
    project: true,
    milestone: { id: "html-recipe", title: "Recipe", brief: "A title, a short method, and a list of ingredients.", tier: "Beginner", paths: ["frontend"], step: 1, steps: 1 },
    paragraphs: [
      "A recipe page is a heading, one sentence, and a list. Use h1, p, and a ul of two ingredients.",
      "The heading is Soup. The sentence is Simmer until done. The ingredients are Onion and Lentil.",
    ],
    starter: page(""),
    solution: page("    <h1>Soup</h1>\n    <p>Simmer until done.</p>\n    <ul><li>Onion</li><li>Lentil</li></ul>\n"),
    hints: ["h1 holds Soup.", "Each ingredient is an li."],
    check: { kind: "html", parts: ["<h1>Soup</h1>", "<p>Simmer until done.</p>", "<li>Onion</li>", "<li>Lentil</li>"] },
  }),
  htmlLesson({
    slug: "nav",
    title: "Project: a navigation bar",
    unit: "Projects",
    project: true,
    milestone: { id: "html-nav", title: "Navigation", brief: "A nav with two links in a row.", tier: "Beginner", paths: ["frontend"], step: 1, steps: 1 },
    paragraphs: [
      "nav wraps a group of links. Flex puts them in a row with a gap.",
      "Link to #lessons with the text Lessons and to #projects with the text Projects. Give the nav a class of bar and display it as flex.",
    ],
    starter: page("    <nav class=\"bar\"></nav>\n"),
    solution: page("    <nav class=\"bar\">\n      <a href=\"#lessons\">Lessons</a>\n      <a href=\"#projects\">Projects</a>\n    </nav>\n", "      .bar { display: flex; gap: 12px; }\n"),
    hints: ["Two anchor tags inside nav.", ".bar { display: flex; gap: 12px; }"],
    check: { kind: "html", parts: ["<nav", "Lessons", "Projects", "display: flex"] },
  }),
  htmlLesson({
    slug: "contact",
    title: "Project: a contact card",
    unit: "Projects",
    project: true,
    milestone: { id: "html-contact", title: "Contact card", brief: "A name, an email link, and a short line.", tier: "Beginner", paths: ["frontend"], step: 1, steps: 1 },
    paragraphs: [
      "A contact card is an article with a name, a sentence, and a mailto link.",
      "The name is Ada Lovelace. The sentence is Write when you are ready. The link text is Email and the href is mailto:ada@example.com.",
    ],
    starter: page(""),
    solution: page("    <article>\n      <h1>Ada Lovelace</h1>\n      <p>Write when you are ready.</p>\n      <a href=\"mailto:ada@example.com\">Email</a>\n    </article>\n"),
    hints: ["article wraps the card.", "mailto: belongs in the href."],
    check: { kind: "html", parts: ["<article>", "Ada Lovelace", "Write when you are ready.", "mailto:ada@example.com"] },
  }),
  htmlLesson({
    slug: "pricing",
    title: "Project: two prices",
    unit: "Projects",
    project: true,
    milestone: { id: "html-pricing", title: "Pricing row", brief: "Two cards in a flex row.", tier: "Intermediate", paths: ["frontend", "fullstack"], step: 1, steps: 1 },
    paragraphs: [
      "Two offers sit side by side. A section with class row uses flex. Each offer is an article.",
      "The offers are Spark at 0 and Hearth at 12. Give the row display flex and a gap of 16px.",
    ],
    starter: page("    <section class=\"row\"></section>\n"),
    solution: page("    <section class=\"row\">\n      <article><h2>Spark</h2><p>0</p></article>\n      <article><h2>Hearth</h2><p>12</p></article>\n    </section>\n", "      .row { display: flex; gap: 16px; }\n"),
    hints: ["Two articles, each with an h2.", "gap: 16px on .row."],
    check: { kind: "html", parts: ["Spark", "Hearth", "display: flex", "gap: 16px"] },
  }),
  htmlLesson({
    slug: "blog",
    title: "Project: a blog teaser",
    unit: "Projects",
    project: true,
    milestone: { id: "html-blog", title: "Blog teaser", brief: "A post title, a date, and one paragraph.", tier: "Intermediate", paths: ["frontend"], step: 1, steps: 1 },
    paragraphs: [
      "A teaser is the part of a post you show in a list. Use an article, an h1, a time element, and a paragraph.",
      "The title is First light. The time is 2026-03-01. The paragraph is Start smaller than you want.",
    ],
    starter: page(""),
    solution: page("    <article>\n      <h1>First light</h1>\n      <time datetime=\"2026-03-01\">2026-03-01</time>\n      <p>Start smaller than you want.</p>\n    </article>\n"),
    hints: ["time holds the date.", "The paragraph is the sentence, not the title."],
    check: { kind: "html", parts: ["<h1>First light</h1>", "<time", "2026-03-01", "Start smaller than you want."] },
  }),
  htmlLesson({
    slug: "gallery",
    title: "Project: a gallery",
    unit: "Projects",
    project: true,
    milestone: { id: "html-gallery", title: "Gallery", brief: "Two images with alt text in a row.", tier: "Intermediate", paths: ["frontend"], step: 1, steps: 1 },
    paragraphs: [
      "A gallery is a row of images. Each image has its own alt. The row is a section with class gallery, display flex, and a gap.",
      "The images are pine.png (alt Pine) and ash.png (alt Ash).",
    ],
    starter: page("    <section class=\"gallery\"></section>\n"),
    solution: page("    <section class=\"gallery\">\n      <img src=\"pine.png\" alt=\"Pine\" />\n      <img src=\"ash.png\" alt=\"Ash\" />\n    </section>\n", "      .gallery { display: flex; gap: 12px; }\n"),
    hints: ["Two img tags.", "alt is Pine and Ash."],
    check: { kind: "html", parts: ["pine.png", "alt=\"Pine\"", "ash.png", "alt=\"Ash\"", "display: flex"] },
  }),
  htmlLesson({
    slug: "newsletter",
    title: "Project: a newsletter form",
    unit: "Projects",
    project: true,
    milestone: { id: "html-newsletter", title: "Newsletter form", brief: "A form with a labeled email field and a submit button.", tier: "Advanced", paths: ["frontend", "fullstack"], step: 1, steps: 1 },
    paragraphs: [
      "A form groups the controls that travel together. method and action can wait. The label, the email field, and the button cannot.",
      "Label the field Email. The input type is email and its id is email. The button says Subscribe.",
    ],
    starter: page("    <form></form>\n"),
    solution: page("    <form>\n      <label for=\"email\">Email</label>\n      <input id=\"email\" type=\"email\" />\n      <button type=\"submit\">Subscribe</button>\n    </form>\n"),
    hints: ["The form wraps all three controls.", "type=\"email\" is the field. The button text is Subscribe."],
    check: { kind: "html", parts: ["<form", "for=\"email\"", "type=\"email\"", "Subscribe"] },
  }),
];
