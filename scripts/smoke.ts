import { runInterpreted } from "../lib/runtime/engine";

const cases: { name: string; lang: "java" | "cpp" | "csharp" | "kotlin" | "swift" | "dart"; code: string; stdin?: string; out?: string; widget?: string }[] = [
  {
    name: "java hello",
    lang: "java",
    code: `public class Main {
      public static void main(String[] args) {
        System.out.println("Hello, Kindling");
      }
    }`,
    out: "Hello, Kindling\n",
  },
  {
    name: "java math",
    lang: "java",
    code: `public class Main {
      public static void main(String[] args) {
        int a = 8;
        int b = 3;
        System.out.println(a + b);
        System.out.println(a / b);
        System.out.println(-a);
      }
    }`,
    out: "11\n2\n-8\n",
  },
  {
    name: "java if for",
    lang: "java",
    code: `public class Main {
      public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 3; i++) {
          if (i != 2) sum = sum + i;
        }
        System.out.println(sum);
      }
    }`,
    out: "4\n",
  },
  {
    name: "java method array scanner",
    lang: "java",
    code: `public class Main {
      static int twice(int n) { return n * 2; }
      public static void main(String[] args) {
        int[] nums = {1, 2, 4};
        System.out.println(nums[2]);
        System.out.println(nums.length);
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        System.out.println(twice(n));
      }
    }`,
    stdin: "6\n",
    out: "4\n3\n12\n",
  },
  {
    name: "cpp cout cin frames",
    lang: "cpp",
    code: `#include <iostream>
    using namespace std;
    int main() {
      int n;
      cin >> n;
      cout << "n=" << n << endl;
      cout << "[[FRAME]]" << endl;
      cout << "fill 0" << endl;
      cout << "[[END]]" << endl;
      return 0;
    }`,
    stdin: "7 extra",
    out: "n=7\n[[FRAME]]\nfill 0\n[[END]]\n",
  },
  {
    name: "csharp",
    lang: "csharp",
    code: `using System;
    class Program {
      static void Main() {
        string name = Console.ReadLine();
        int n = int.Parse(Console.ReadLine());
        Console.WriteLine("Hi " + name);
        Console.WriteLine(n + 1);
      }
    }`,
    stdin: "Ada\n4\n",
    out: "Hi Ada\n5\n",
  },
  {
    name: "kotlin",
    lang: "kotlin",
    code: `fun greet(name: String): String {
      return "Hi " + name
    }
    fun main() {
      val name = "Ada"
      println(greet(name))
      println("count $name")
      var total = 0
      for (i in 1..3) {
        total = total + i
      }
      println(total)
      setContent(Column(Text("Hello"), Button("Go")))
    }`,
    out: "Hi Ada\ncount Ada\n6\n",
    widget: "column",
  },
  {
    name: "swift",
    lang: "swift",
    code: `func greet(name: String) -> String {
      return "Hi \\(name)"
    }
    func main() {
      let name = "Ada"
      print(greet(name: name))
      var total = 0
      for i in 1...3 {
        total = total + i
      }
      print(total)
      show(VStack(Text("Hello"), Button("Go")))
    }`,
    out: "Hi Ada\n6\n",
    widget: "column",
  },
  {
    name: "dart",
    lang: "dart",
    code: `int twice(int n) {
      return n * 2;
    }
    void main() {
      print(twice(4));
      print(7 / 2);
      print(7 ~/ 2);
      var names = ["Ada", "Lin"];
      print(names[0]);
      runApp(Column(Text("Hi"), Button("Start")));
    }`,
    out: "8\n3.5\n3\nAda\n",
    widget: "column",
  },
];

let failed = 0;
for (const item of cases) {
  const result = runInterpreted(item.lang, item.code, item.stdin ?? "");
  const outOk = item.out === undefined || result.stdout === item.out;
  const widgetOk = item.widget === undefined || result.widgets?.type === item.widget;
  if (result.error || !outOk || !widgetOk) {
    failed++;
    console.log("FAIL", item.name);
    console.log(" error", result.error);
    console.log(" stdout", JSON.stringify(result.stdout));
    console.log(" want  ", JSON.stringify(item.out));
    console.log(" widget", JSON.stringify(result.widgets));
  } else {
    console.log("ok", item.name);
  }
}
process.exit(failed ? 1 : 0);
