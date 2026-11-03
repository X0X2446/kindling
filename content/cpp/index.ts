import type { Course } from "@/lib/curriculum/types";
import { lessons as unit01 } from "./unit-01";
import { lessons as unit02 } from "./unit-02";
import { lessons as unit03 } from "./unit-03";
import { lessons as unit04 } from "./unit-04";
import { lessons as unit05 } from "./unit-05";
import { lessons as unit06 } from "./unit-06";
import { lessons as unit07 } from "./unit-07";
import { lessons as unit08 } from "./unit-08";
import { lessons as unit09 } from "./unit-09";
import { lessons as unit10 } from "./unit-10";
import { lessons as unit11 } from "./unit-11";
import { lessons as unit12 } from "./unit-12";
import { lessons as unit13 } from "./unit-13";
import { lessons as unit14 } from "./unit-14";
import { lessons as unit15 } from "./unit-15";
import { lessons as unit16 } from "./unit-16";
import { lessons as unit17 } from "./unit-17";
import { lessons as unit18 } from "./unit-18";
import { lessons as unit19 } from "./unit-19";
import { lessons as unit20 } from "./unit-20";
import { lessons as unit21 } from "./unit-21";

export const cppLessons = [
  ...unit01,
  ...unit02,
  ...unit03,
  ...unit04,
  ...unit05,
  ...unit06,
  ...unit07,
  ...unit08,
  ...unit09,
  ...unit10,
  ...unit11,
  ...unit12,
  ...unit13,
  ...unit14,
  ...unit15,
  ...unit16,
  ...unit17,
  ...unit18,
  ...unit19,
  ...unit20,
  ...unit21,
];

export { lessons as cppGamesLessons } from "./games";

export const cppCourse: Course = {
  slug: "cpp",
  title: "C++ from scratch",
  language: "C++",
  runner: "cpp",
  level: "Language",
  blurb: "Real C++, compiled with g++. Pointers, types, the standard library, and a bank at the end.",
  honesty:
    "Each program is compiled with g++ -std=c++20 and run with a time limit, a memory limit, and no network. Compiler errors are g++ errors, and the line numbers match the editor. On Kindling's servers the compiler runs in a sandbox.",
  lessons: cppLessons,
  resources: [
    { kind: "docs", label: "LearnCpp.com", href: "https://www.learncpp.com/" },
    { kind: "docs", label: "cppreference", href: "https://en.cppreference.com/w/cpp" },
    { kind: "video", label: "freeCodeCamp \u2014 C++", href: "https://www.youtube.com/watch?v=vLnPwxZdW4Y" },
    { kind: "video", label: "Bro Code \u2014 C++", href: "https://www.youtube.com/watch?v=-TkoO8Z07hI" },
  ],
  next: ["c", "cpp-games", "unreal"],
};
