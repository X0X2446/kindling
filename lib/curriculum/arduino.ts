import { mark } from "./icons";
import { milestone, rawLesson } from "./spec";
import type { Course, Milestone } from "./types";

const paths = ["embedded"];
const note = "No board is attached. digitalWrite prints the pin and the level, so you can see the decision. A real Arduino program is compiled and flashed with the official tools.";

function pin(slug: string, title: string, unit: string, paragraphs: string[], hints: string[], body: string, cases: { stdin?: string; expected: string }[], markProject?: Milestone) {
  const solution = `#include <stdio.h>\nint main(void) {\n${body}\n  return 0;\n}\n`;
  return rawLesson({
    slug,
    title,
    unit,
    paragraphs: [...paragraphs, note],
    hints,
    solution,
    starter: `#include <stdio.h>\nint main(void) {\n  printf("%s\\n", "todo");\n  return 0;\n}\n`,
    cases,
    milestone: markProject,
  });
}

export function arduinoCourse(): Course {
  return {
    slug: "arduino",
    title: "Arduino with C",
    language: "C",
    runner: "c",
    level: "Specialization",
    difficulty: "Beginner",
    tracks: paths,
    ...mark("arduino", "original", "arduino", "00979D"),
    blurb: "Read a sensor value and decide which pin to set. The language is C. The board, in this course, is a line of output.",
    honesty: note,
    lessons: [
      pin("led-on", "Turn a pin on", "Pins", ["digitalWrite takes a pin number and a level. 1 is on. 0 is off.", "Turn pin 13 on."], ["Call digitalWrite(13, 1)."], "  digitalWrite(13, 1);", [{ expected: "pin 13 1\n" }, { expected: "pin 13 1\n" }]),
      pin("led-off", "Turn a pin off", "Pins", ["Off is the same call with level 0. Lamps and relays both start from this decision.", "Turn pin 13 off."], ["The second argument is 0."], "  digitalWrite(13, 0);", [{ expected: "pin 13 0\n" }, { expected: "pin 13 0\n" }]),
      pin("two-pins", "Two pins", "Pins", ["A program can set more than one pin. Each call prints its own line.", "Turn pin 13 on and pin 12 off."], ["Write 13 first, then 12."], "  digitalWrite(13, 1);\n  digitalWrite(12, 0);", [{ expected: "pin 13 1\npin 12 0\n" }, { expected: "pin 13 1\npin 12 0\n" }]),
      pin("read-sensor", "Read a sensor", "Decisions", ["scanf reads a number you typed, the stand-in for a sensor.", "Read the value and print it back with printf."], ["scanf(\"%d\", &n) stores the number in n."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "21\n", expected: "21\n" },
        { stdin: "0\n", expected: "0\n" },
      ]),
      pin("threshold", "A threshold", "Decisions", ["If the reading is above 30, the fan pin goes on. Otherwise it stays off.", "Pin 8 follows that rule. Also print fan or idle."], ["Check n > 30 before you write the pin."], "  int n;\n  scanf(\"%d\", &n);\n  if (n > 30) {\n    digitalWrite(8, 1);\n    printf(\"%s\\n\", \"fan\");\n  } else {\n    digitalWrite(8, 0);\n    printf(\"%s\\n\", \"idle\");\n  }", [
        { stdin: "31\n", expected: "pin 8 1\nfan\n" },
        { stdin: "30\n", expected: "pin 8 0\nidle\n" },
        { stdin: "10\n", expected: "pin 8 0\nidle\n" },
      ]),
      pin("night", "Dark means light", "Decisions", ["A light sensor that reads under 20 means the room is dark, so the lamp pin turns on.", "Pin 9 is the lamp. Print lamp or day."], ["The test is n < 20."], "  int n;\n  scanf(\"%d\", &n);\n  if (n < 20) {\n    digitalWrite(9, 1);\n    printf(\"%s\\n\", \"lamp\");\n  } else {\n    digitalWrite(9, 0);\n    printf(\"%s\\n\", \"day\");\n  }", [
        { stdin: "5\n", expected: "pin 9 1\nlamp\n" },
        { stdin: "20\n", expected: "pin 9 0\nday\n" },
      ]),
      pin("blink", "On, then off", "Patterns", ["A blink is two writes in order. First on, then off.", "Blink pin 13."], ["Level 1, then level 0."], "  digitalWrite(13, 1);\n  digitalWrite(13, 0);", [{ expected: "pin 13 1\npin 13 0\n" }, { expected: "pin 13 1\npin 13 0\n" }]),
      pin("range", "Three bands", "Checkpoint", ["Split a reading into low, mid, and high. Low is below 10, high is above 40, and mid is everything else.", "Print the band. Set pin 4 to 1 only for high."], ["Write the high test before the low test, or nest them."], "  int n;\n  scanf(\"%d\", &n);\n  if (n > 40) {\n    digitalWrite(4, 1);\n    printf(\"%s\\n\", \"high\");\n  } else if (n < 10) {\n    digitalWrite(4, 0);\n    printf(\"%s\\n\", \"low\");\n  } else {\n    digitalWrite(4, 0);\n    printf(\"%s\\n\", \"mid\");\n  }", [
        { stdin: "41\n", expected: "pin 4 1\nhigh\n" },
        { stdin: "9\n", expected: "pin 4 0\nlow\n" },
        { stdin: "10\n", expected: "pin 4 0\nmid\n" },
      ]),
      pin("night-read", "Night light: read", "Projects", ["Read the light level and print it. The lamp decision comes in the next step."], ["printf the number you scanned."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "12\n", expected: "12\n" },
        { stdin: "40\n", expected: "40\n" },
      ], milestone("arduino-night", "Night light", "Read a light level, then turn the lamp on when it is dark.", "Beginner", 1, 2, paths)),
      pin("night-lamp", "Night light: the lamp", "Projects", ["Turn pin 9 on when the reading is under 20, and print lamp or day."], ["n < 20 is dark."], "  int n;\n  scanf(\"%d\", &n);\n  if (n < 20) {\n    digitalWrite(9, 1);\n    printf(\"%s\\n\", \"lamp\");\n  } else {\n    digitalWrite(9, 0);\n    printf(\"%s\\n\", \"day\");\n  }", [
        { stdin: "4\n", expected: "pin 9 1\nlamp\n" },
        { stdin: "25\n", expected: "pin 9 0\nday\n" },
      ], milestone("arduino-night", "Night light", "Read a light level, then turn the lamp on when it is dark.", "Beginner", 2, 2, paths)),
      pin("thermo-read", "Thermostat: read", "Projects", ["Read the temperature and print it."], ["Scan into an int and printf it."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "18\n", expected: "18\n" },
        { stdin: "36\n", expected: "36\n" },
      ], milestone("arduino-thermo", "Thermostat", "Read a temperature, then run the fan when it is hot.", "Beginner", 1, 2, paths)),
      pin("thermo-fan", "Thermostat: the fan", "Projects", ["Pin 8 is the fan. On above 30. Print fan or idle."], ["n > 30 turns the pin on."], "  int n;\n  scanf(\"%d\", &n);\n  if (n > 30) {\n    digitalWrite(8, 1);\n    printf(\"%s\\n\", \"fan\");\n  } else {\n    digitalWrite(8, 0);\n    printf(\"%s\\n\", \"idle\");\n  }", [
        { stdin: "35\n", expected: "pin 8 1\nfan\n" },
        { stdin: "12\n", expected: "pin 8 0\nidle\n" },
      ], milestone("arduino-thermo", "Thermostat", "Read a temperature, then run the fan when it is hot.", "Beginner", 2, 2, paths)),
      pin("door-read", "Door: read the switch", "Projects", ["A door switch is 1 when open and 0 when shut. Print the value."], ["printf the scanned int."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "1\n", expected: "1\n" },
        { stdin: "0\n", expected: "0\n" },
      ], milestone("arduino-door", "Door alarm", "Read a switch, then sound the alarm pin when the door is open.", "Beginner", 1, 2, paths)),
      pin("door-alarm", "Door: the alarm", "Projects", ["When the switch is 1, set pin 6 on and print open. Otherwise print shut and set the pin off."], ["Compare n to 1."], "  int n;\n  scanf(\"%d\", &n);\n  if (n == 1) {\n    digitalWrite(6, 1);\n    printf(\"%s\\n\", \"open\");\n  } else {\n    digitalWrite(6, 0);\n    printf(\"%s\\n\", \"shut\");\n  }", [
        { stdin: "1\n", expected: "pin 6 1\nopen\n" },
        { stdin: "0\n", expected: "pin 6 0\nshut\n" },
      ], milestone("arduino-door", "Door alarm", "Read a switch, then sound the alarm pin when the door is open.", "Beginner", 2, 2, paths)),
      pin("moisture-read", "Moisture: read", "Projects", ["Read a moisture value and print it."], ["Scan and printf."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "15\n", expected: "15\n" },
        { stdin: "60\n", expected: "60\n" },
      ], milestone("arduino-moisture", "Plant moisture", "Read moisture, then run the pump when the soil is dry.", "Intermediate", 1, 2, paths)),
      pin("moisture-pump", "Moisture: the pump", "Projects", ["Dry is under 25. Pin 7 is the pump. Print pump or damp."], ["n < 25 starts the pump."], "  int n;\n  scanf(\"%d\", &n);\n  if (n < 25) {\n    digitalWrite(7, 1);\n    printf(\"%s\\n\", \"pump\");\n  } else {\n    digitalWrite(7, 0);\n    printf(\"%s\\n\", \"damp\");\n  }", [
        { stdin: "10\n", expected: "pin 7 1\npump\n" },
        { stdin: "25\n", expected: "pin 7 0\ndamp\n" },
      ], milestone("arduino-moisture", "Plant moisture", "Read moisture, then run the pump when the soil is dry.", "Intermediate", 2, 2, paths)),
      pin("traffic-stop", "Traffic: stop", "Projects", ["A tiny intersection: pin 1 is red, pin 2 is green. Stop means red on and green off. Print stop."], ["Write both pins, then the word."], "  digitalWrite(1, 1);\n  digitalWrite(2, 0);\n  printf(\"%s\\n\", \"stop\");", [
        { expected: "pin 1 1\npin 2 0\nstop\n" },
        { expected: "pin 1 1\npin 2 0\nstop\n" },
      ], milestone("arduino-traffic", "Traffic pair", "Show stop, then choose stop or go from an input.", "Intermediate", 1, 2, paths)),
      pin("traffic-go", "Traffic: stop or go", "Projects", ["Read 1 for go and anything else for stop. Go is green on and red off."], ["Branch on n == 1."], "  int n;\n  scanf(\"%d\", &n);\n  if (n == 1) {\n    digitalWrite(1, 0);\n    digitalWrite(2, 1);\n    printf(\"%s\\n\", \"go\");\n  } else {\n    digitalWrite(1, 1);\n    digitalWrite(2, 0);\n    printf(\"%s\\n\", \"stop\");\n  }", [
        { stdin: "1\n", expected: "pin 1 0\npin 2 1\ngo\n" },
        { stdin: "0\n", expected: "pin 1 1\npin 2 0\nstop\n" },
      ], milestone("arduino-traffic", "Traffic pair", "Show stop, then choose stop or go from an input.", "Intermediate", 2, 2, paths)),
      pin("greenhouse-read", "Greenhouse: read", "Projects", ["Read the temperature and print it."], ["printf the scanned value."], "  int n;\n  scanf(\"%d\", &n);\n  printf(\"%d\\n\", n);", [
        { stdin: "16\n", expected: "16\n" },
        { stdin: "33\n", expected: "33\n" },
      ], milestone("arduino-greenhouse", "Greenhouse", "Read the air, then vent when it is warm.", "Intermediate", 1, 2, paths)),
      pin("greenhouse-vent", "Greenhouse: the vent", "Projects", ["Above 28, open the vent on pin 5 and print vent. Otherwise print hold and set the pin off."], ["n > 28 opens the vent."], "  int n;\n  scanf(\"%d\", &n);\n  if (n > 28) {\n    digitalWrite(5, 1);\n    printf(\"%s\\n\", \"vent\");\n  } else {\n    digitalWrite(5, 0);\n    printf(\"%s\\n\", \"hold\");\n  }", [
        { stdin: "29\n", expected: "pin 5 1\nvent\n" },
        { stdin: "18\n", expected: "pin 5 0\nhold\n" },
      ], milestone("arduino-greenhouse", "Greenhouse", "Read the air, then vent when it is warm.", "Intermediate", 2, 2, paths)),
      pin("counter-one", "Counter: one pulse", "Projects", ["A counter can be a pin pulse. Pulse pin 3 on, then off, and print 1."], ["Two digitalWrite calls, then printf."], "  digitalWrite(3, 1);\n  digitalWrite(3, 0);\n  printf(\"%d\\n\", 1);", [
        { expected: "pin 3 1\npin 3 0\n1\n" },
        { expected: "pin 3 1\npin 3 0\n1\n" },
      ], milestone("arduino-counter", "Pulse counter", "Pulse once, then pulse once for each count you read.", "Advanced", 1, 2, paths)),
      pin("counter-n", "Counter: n pulses", "Projects", ["Read n. For each count from 1 through n, pulse pin 3 on then off. Then print n.", "Keep n small. The loop is a for loop from 1 to n."], ["The pulse pair sits inside the loop."], "  int n;\n  int i;\n  scanf(\"%d\", &n);\n  for (i = 1; i <= n; i++) {\n    digitalWrite(3, 1);\n    digitalWrite(3, 0);\n  }\n  printf(\"%d\\n\", n);", [
        { stdin: "2\n", expected: "pin 3 1\npin 3 0\npin 3 1\npin 3 0\n2\n" },
        { stdin: "1\n", expected: "pin 3 1\npin 3 0\n1\n" },
      ], milestone("arduino-counter", "Pulse counter", "Pulse once, then pulse once for each count you read.", "Advanced", 2, 2, paths)),
      pin("alarm-quiet", "Alarm: quiet", "Projects", ["Pin 11 is a buzzer. Quiet means the pin is off and the word is quiet."], ["digitalWrite(11, 0) and printf quiet."], "  digitalWrite(11, 0);\n  printf(\"%s\\n\", \"quiet\");", [
        { expected: "pin 11 0\nquiet\n" },
        { expected: "pin 11 0\nquiet\n" },
      ], milestone("arduino-alarm", "Buzzer", "Sit quiet, then buzz when a reading crosses 50.", "Advanced", 1, 2, paths)),
      pin("alarm-loud", "Alarm: over fifty", "Projects", ["Read a level. At 50 or below, stay quiet. Above 50, turn pin 11 on and print buzz."], ["n > 50 is the loud branch."], "  int n;\n  scanf(\"%d\", &n);\n  if (n > 50) {\n    digitalWrite(11, 1);\n    printf(\"%s\\n\", \"buzz\");\n  } else {\n    digitalWrite(11, 0);\n    printf(\"%s\\n\", \"quiet\");\n  }", [
        { stdin: "51\n", expected: "pin 11 1\nbuzz\n" },
        { stdin: "50\n", expected: "pin 11 0\nquiet\n" },
      ], milestone("arduino-alarm", "Buzzer", "Sit quiet, then buzz when a reading crosses 50.", "Advanced", 2, 2, paths)),
    ],
    resources: [
      { kind: "docs", label: "Arduino language reference", href: "https://www.arduino.cc/reference/en/" },
      { kind: "docs", label: "digitalWrite", href: "https://docs.arduino.cc/language-reference/en/functions/digital-io/digitalwrite/" },
    ],
    next: [],
  };
}
