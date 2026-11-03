import { compileAndRunCpp } from "../lib/runtime/cpp-compile";

const source = `#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

template <typename T>
T twice(T value) { return value + value; }

class Box {
public:
  explicit Box(int value) : value_(value) {}
  int get() const { return value_; }
private:
  int value_;
};

int main() {
  int input = 0;
  std::cin >> input;
  int* pointer = &input;
  std::vector<int> numbers{*pointer, 2, 3};
  auto owned = std::make_unique<Box>(numbers.front());
  std::function<int(int)> next = [](int n) { return n + 1; };
  std::cout << twice(owned->get()) << " " << next(1) << "\\n";
  return 0;
}
`;

const broken = `#include <iostream>
int main() {
  int* missing = nullptr;
  std::cout << missing
}
`;

const ok = compileAndRunCpp(source, "21\n");
if (ok.error || ok.stdout.trim() !== "42 2") {
  console.error("SMOKE FAIL", ok);
  process.exit(1);
}

const err = compileAndRunCpp(broken, "");
if (!err.error || !err.error.includes("main.cpp:4:23")) {
  console.error("LINE FAIL", err);
  process.exit(1);
}

console.log("smoke ok");
console.log(ok.stdout.trim());
console.log(err.error.split("\n")[0]);
