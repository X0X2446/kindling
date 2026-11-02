# Kindling

Kindling is an interactive site for learning to code. Lessons explain one idea, then ask you to write a program and run it. A clear lesson earns XP. A clear without hints is a clean clear. Finish a language and the course points at what to learn next: Qt, machine learning, a backend, games, or a mobile UI.

## Paths

- Frontend: HTML and CSS, JavaScript, HTML5 canvas
- Backend: Python, then routes and JSON
- Mobile: Kotlin and Compose, Dart and Flutter, Swift and SwiftUI
- Software: Python, Java, C#, C++
- Games: Lua, C++ frames, HTML5 canvas

Python, JavaScript, Lua, and HTML run as those languages. Java, C++, C#, Kotlin, Swift, and Dart run in a teaching interpreter in the browser, so a JDK or mobile SDK is not required. The Qt course uses PySide6-shaped Python and draws the widget tree. Each course links the official docs and the videos it was written from.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317) if you start the dev server with `-p 4317`. The default `npm run dev` uses port 3000.

```bash
npx next dev -p 4317
```

Check every lesson solution:

```bash
npm run verify
```

Python lessons are checked with the system `python3`. Lua uses [Fengari](https://github.com/fengari-lua/fengari). In the browser, Python is [Pyodide](https://pyodide.org/), loaded on the first Python run.

Progress, XP, and the streak stay in this browser's local storage.
