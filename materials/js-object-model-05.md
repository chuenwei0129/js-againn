## 引擎实现

前面全部是规范层——ECMAScript 标准定义了对象"应该"如何工作。

引擎层如何实现这些语义？同样的 `obj.x`，引擎不会每次都老老实实地走一遍原型链查找——它会做大量的优化。

这里进入引擎层——V8、SpiderMonkey、JavaScriptCore 如何在规范语义不变的前提下，把对象操作做到极致快。

### Hidden Class / Shape

规范说对象是"属性的动态集合"，但引擎不会真的用哈希表存每个属性。原因很简单：哈希表查找是 O(1) 的常数时间，但常数很大——每次访问都要算哈希、处理冲突、解引用。

引擎的优化思路是：**把属性名和属性值分开存储。** 属性名被提取到一个共享的"形状"（Shape，V8 叫 Hidden Class 或 Map）中，对象本身只存属性值的偏移量。

```js
const alice = { name: 'Alice', age: 25 };
const bob   = { name: 'Bob',   age: 30 };
```

在引擎看来：

```
Shape: { name: offset 0, age: offset 1 }
         ↑ 共享
alice: ['Alice', 25]
bob:   ['Bob',   30]
```

`alice` 和 `bob` 共享同一个 Shape。访问 `alice.name` 时，引擎先查 Shape 得到偏移量 0，然后直接从 alice 的值数组的第 0 个位置取值——这是一次数组索引访问，比哈希查找快一个数量级。

### Shape Transition

对象不是一出生就有完整的 Shape。当你逐步添加属性时，Shape 会随之演变：

```js
const obj = {};
// Shape₀: {}

obj.x = 1;
// Shape₁: { x: offset 0 }
// 从 Shape₀ 转换而来

obj.y = 2;
// Shape₂: { x: offset 0, y: offset 1 }
// 从 Shape₁ 转换而来
```

每次添加属性，引擎会创建一个新的 Shape，新 Shape 继承旧 Shape 的所有映射并添加新的属性。这些 Shape 形成一棵**转换树（Transition Tree）**：

```
Shape₀: {}
  ├── Shape₁: { x: 0 }
  │     └── Shape₂: { x: 0, y: 1 }
  └── Shape₃: { y: 0 }
        └── Shape₄: { y: 0, x: 1 }
```

以相同顺序添加相同属性的对象，会走到同一个 Shape 节点——这就是为什么 `alice` 和 `bob` 共享 Shape。

### Inline Cache

Shape 的真正威力体现在**内联缓存（Inline Cache，简称 IC）** 上。

```js
function getName(obj) {
  return obj.name;
}
```

第一次调用 `getName(alice)` 时，引擎需要在 `obj` 上查找 `name` 属性——这需要一次完整的原型链查找。但引擎不会每次都重新查找，它会在调用点缓存结果：

```
getName 调用点:
  缓存: Shape → offset 0
  下次遇到相同 Shape 的对象 → 直接取 offset 0，跳过查找
```

### Monomorphic / Polymorphic / Megamorphic

内联缓存的效率取决于调用点遇到的对象形状是否一致：

**Monomorphic（单态）**——调用点始终遇到同一种 Shape 的对象，缓存命中率 100%。这是最快的路径：

```js
function getX(obj) { return obj.x; }

const a = { x: 1, y: 2 };
const b = { x: 3, y: 4 };
// a 和 b 共享同一个 Shape → monomorphic
getX(a); // 命中缓存
getX(b); // 命中缓存
```

**Polymorphic（多态）**——调用点遇到 2~4 种不同的 Shape，引擎会维护一个小的缓存列表，逐个匹配。比单态慢，但仍然可以接受：

```js
const c = { x: 5 };        // Shape A: { x: 0 }
const d = { x: 6, y: 7 };  // Shape B: { x: 0, y: 1 }
getX(c); // 匹配 Shape A → 命中
getX(d); // 匹配 Shape B → 命中
```

**Megamorphic（超态）**——调用点遇到太多不同的 Shape，缓存列表装不下了，引擎放弃缓存，退化回完整的属性查找。这会显著拖慢性能：

```js
// 每个对象的 Shape 都不同
function getX(obj) { return obj.x; }
for (let i = 0; i < 100; i++) {
  const obj = {};
  obj.x = i;
  obj['prop' + i] = i; // 每个对象多一个不同的属性 → 不同的 Shape
  getX(obj); // megamorphic → 每次都完整查找
}
```

**实践建议：给同类对象以相同的属性添加顺序，让它们共享 Shape，保持调用点的 monomorphic 状态。**

### delete 的性能陷阱

`delete` 操作是 Shape 系统的天敌：

```js
const obj = { x: 1, y: 2, z: 3 };
// obj 有一个 Shape: { x: 0, y: 1, z: 2 }

delete obj.y;
// Shape 被破坏，obj 被迫进入 Dictionary Mode
```

`delete` 删除了一个属性后，原来的 Shape 就不再适用了（偏移量全部错位），引擎可能会将对象切换到**字典模式（Dictionary Mode）**——从此这个对象的属性用哈希表存储，内联缓存全部失效。不过，是否真正退化由引擎的实现决定，现代引擎在某些情况下会尝试恢复 Shape。

### Dictionary Mode

字典模式是 Shape 系统退化后的降级方案。在字典模式下，对象的属性以哈希表存储，不再共享 Shape，也不再享受内联缓存优化：

```js
// Shape Mode（正常）
const obj = { x: 1, y: 2, z: 3 };
// 属性值存在连续的偏移数组中，访问极快

// Dictionary Mode（退化后）
delete obj.y;
// 属性值存在哈希表中，每次访问都要算哈希
```

哪些操作可能触发字典模式？
- `delete` 操作
- 使用 `Object.defineProperty` 添加属性时，如果插入顺序与 Shape 转换树不匹配
- 大量动态属性导致 Shape 树过于复杂

**实践建议：避免在热路径上 `delete` 属性。如果需要"移除"语义，考虑将属性设为 `undefined` 或 `null`，保持对象的 Shape 稳定。**

---