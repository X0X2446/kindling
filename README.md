# Kindling

Kindling is an interactive site for learning to code. A lesson explains one idea, then asks you to write a program. The checker runs real test cases. A clear lesson earns XP. A clear without hints is a clean clear. Finish a language and the course points at the frameworks and paths that use it.

Progress, XP, the streak, and the sound toggle stay in this browser's local storage.

## What is in the catalog

Language courses start from a blank file and run deep enough to practice the language: Python, JavaScript, TypeScript, HTML, Java, C, C++, C#, Lua, Kotlin, Swift, Dart, Go, Rust, PHP, Ruby, R, SQL, and Bash.

Paths group those courses: Frontend, Backend, Mobile, Software, Games, Data Science and AI, DevOps and Cloud, Cybersecurity basics, Databases, Web3 basics, Embedded and Arduino, Automation and scripting, and Full-stack web.

Framework follow-ups sit on the host language's runner and say so when the real SDK is not loaded: React, Next.js, Vue, Svelte, Express, Django, Flask, FastAPI, Spring Boot, ASP.NET, Unity, Godot, Roblox, LÖVE, Unreal, Pygame, Pandas, PyTorch, Laravel, and Rails.

Projects have their own page, with filters for language, path, and difficulty. Each project is a short brief plus milestone steps, starter code, hints, and a solution you can reveal.

## Run it locally

```bash
npm install
npx next dev -p 4317
```

Open [http://localhost:4317](http://localhost:4317). `npm run dev` uses port 3000.

Check every lesson solution and starter:

```bash
npm run verify
```

Python lessons are checked with the system `python3`. C++ lessons are compiled with `g++ -std=c++20` and run with a time limit, a memory limit, and no network. On the hosted site that compiler runs in a sandbox. Lua uses [Fengari](https://github.com/fengari-lua/fengari). In the browser, Python is [Pyodide](https://pyodide.org/), loaded on the first Python run. Java, C, C#, Kotlin, Swift, Dart, Go, Rust, PHP, Ruby, and R use a teaching interpreter. SQL and Bash are teaching subsets. Logos come from Devicon, with Simple Icons when a mark is missing.

Check one course, including every C++ solution against g++:

```bash
npx tsx scripts/verify-course.ts cpp
```
