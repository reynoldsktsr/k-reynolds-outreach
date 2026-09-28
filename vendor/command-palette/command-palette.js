import { jsx as c, jsxs as x, Fragment as L } from "react/jsx-runtime";
import { useState as I, useRef as C, useMemo as D, useEffect as p, useCallback as g } from "react";
const N = {
  matched: !1,
  score: 0,
  matchedIndices: []
};
function S(n, r) {
  if (!r)
    return { matched: !0, score: 0, matchedIndices: [] };
  if (!n)
    return N;
  const a = n.toLowerCase(), l = r.toLowerCase(), e = [];
  let i = 0, s = 0, f = 0, d = 0, u = -1;
  for (; s < a.length && f < l.length; ) {
    if (a[s] === l[f]) {
      e.push(s), d = u === s - 1 ? d + 1 : 1, i += 10 + d * 5;
      const w = s > 0 ? n[s - 1] : "";
      (s === 0 || /[\s\-_/]/.test(w)) && (i += 8), i += Math.max(0, 3 - s * 0.1), u = s, f += 1;
    }
    s += 1;
  }
  return f < l.length ? N : (i -= a.length * 0.05, a.includes(l) && (i += 15), { matched: !0, score: i, matchedIndices: e });
}
function _(n, r) {
  if (!r)
    return { matched: !0, score: 0, matchedIndices: [], candidateIndex: 0 };
  let a = {
    ...N,
    candidateIndex: -1
  };
  return n.forEach((l, e) => {
    const i = S(l, r);
    i.matched && i.score > a.score && (a = { ...i, candidateIndex: e });
  }), a;
}
function Q(n = {}) {
  const { defaultOpen: r = !1, shortcutKey: a = "k" } = n, [l, e] = I(r), i = g(() => e(!0), []), s = g(() => e(!1), []), f = g(() => e((d) => !d), []);
  return p(() => {
    function d(u) {
      const b = u.key.toLowerCase();
      (u.metaKey || u.ctrlKey) && b === a.toLowerCase() && (u.preventDefault(), f());
    }
    return window.addEventListener("keydown", d), () => window.removeEventListener("keydown", d);
  }, [a, f]), { open: l, setOpen: e, openPalette: i, closePalette: s, togglePalette: f };
}
function z(n, r) {
  const a = r.trim();
  if (!a)
    return n.map((e) => ({ command: e, matchedIndices: [], score: 0 }));
  const l = [];
  for (const e of n) {
    const i = [e.label, ...e.keywords ?? [], e.group ?? ""], s = _(i, a);
    s.matched && l.push({
      command: e,
      // Highlighting only makes sense for the label; the score may
      // come from a keyword match instead.
      matchedIndices: s.candidateIndex === 0 ? s.matchedIndices : [],
      score: s.score
    });
  }
  return l.sort((e, i) => i.score - e.score);
}
function F(n) {
  const r = /* @__PURE__ */ new Map();
  for (const a of n) {
    const l = a.command.group ?? "", e = r.get(l);
    e ? e.push(a) : r.set(l, [a]);
  }
  return r;
}
function R({ label: n, matchedIndices: r }) {
  if (r.length === 0)
    return /* @__PURE__ */ c(L, { children: n });
  const a = new Set(r);
  return /* @__PURE__ */ c(L, { children: n.split("").map((l, e) => /* @__PURE__ */ c(
    "span",
    {
      className: a.has(e) ? "text-neutral-900 dark:text-white font-semibold" : void 0,
      children: l
    },
    e
  )) });
}
function H({
  open: n,
  onClose: r,
  commands: a,
  placeholder: l = "Type a command or search...",
  emptyMessage: e = "No matching commands.",
  className: i
}) {
  const [s, f] = I(""), [d, u] = I(0), b = C(null), w = C(null), k = C(/* @__PURE__ */ new Map()), m = D(() => z(a, s), [a, s]), A = D(() => F(m), [m]);
  p(() => {
    if (n) {
      f(""), u(0);
      const t = window.requestAnimationFrame(() => {
        var o;
        return (o = b.current) == null ? void 0 : o.focus();
      });
      return () => window.cancelAnimationFrame(t);
    }
  }, [n]), p(() => {
    u(0);
  }, [s]), p(() => {
    d > m.length - 1 && u(Math.max(0, m.length - 1));
  }, [d, m.length]), p(() => {
    if (!n) return;
    function t(o) {
      o.key === "Escape" && r();
    }
    return window.addEventListener("keydown", t), () => window.removeEventListener("keydown", t);
  }, [n, r]), p(() => {
    if (!n) return;
    function t(o) {
      w.current && !w.current.contains(o.target) && r();
    }
    return document.addEventListener("mousedown", t), () => document.removeEventListener("mousedown", t);
  }, [n, r]), p(() => {
    const t = m[d];
    if (!t) return;
    const o = k.current.get(t.command.id);
    o == null || o.scrollIntoView({ block: "nearest" });
  }, [d, m]);
  const y = g(
    (t) => {
      r(), window.setTimeout(() => t.action(), 0);
    },
    [r]
  ), P = g(
    (t) => {
      if (t.key === "ArrowDown")
        t.preventDefault(), u((o) => Math.min(o + 1, m.length - 1));
      else if (t.key === "ArrowUp")
        t.preventDefault(), u((o) => Math.max(o - 1, 0));
      else if (t.key === "Enter") {
        t.preventDefault();
        const o = m[d];
        o && y(o.command);
      }
    },
    [d, m, y]
  );
  if (!n)
    return null;
  let v = -1;
  return /* @__PURE__ */ c(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] bg-black/50 backdrop-blur-sm animate-overlay-in",
      role: "presentation",
      children: /* @__PURE__ */ x(
        "div",
        {
          ref: w,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Command palette",
          className: [
            "w-full max-w-xl overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800",
            "bg-white dark:bg-neutral-900 shadow-2xl shadow-black/20 animate-palette-in",
            i ?? ""
          ].join(" "),
          children: [
            /* @__PURE__ */ x("div", { className: "flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 px-4", children: [
              /* @__PURE__ */ x(
                "svg",
                {
                  "aria-hidden": "true",
                  viewBox: "0 0 24 24",
                  className: "h-4 w-4 flex-shrink-0 text-neutral-400",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2,
                  children: [
                    /* @__PURE__ */ c("circle", { cx: "11", cy: "11", r: "7" }),
                    /* @__PURE__ */ c("path", { d: "m21 21-4.3-4.3", strokeLinecap: "round" })
                  ]
                }
              ),
              /* @__PURE__ */ c(
                "input",
                {
                  ref: b,
                  value: s,
                  onChange: (t) => f(t.target.value),
                  onKeyDown: P,
                  placeholder: l,
                  "aria-label": "Search commands",
                  autoComplete: "off",
                  spellCheck: !1,
                  className: "h-12 w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                }
              ),
              /* @__PURE__ */ c("kbd", { className: "hidden sm:inline-flex select-none items-center rounded border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400", children: "ESC" })
            ] }),
            /* @__PURE__ */ x("ul", { role: "listbox", "aria-label": "Commands", className: "max-h-80 overflow-y-auto p-2", children: [
              m.length === 0 && /* @__PURE__ */ c("li", { className: "px-3 py-8 text-center text-sm text-neutral-400", children: e }),
              Array.from(A.entries()).map(([t, o]) => /* @__PURE__ */ x("li", { children: [
                t && /* @__PURE__ */ c("div", { className: "px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-neutral-400 first:pt-1", children: t }),
                /* @__PURE__ */ c("ul", { role: "group", children: o.map(({ command: h, matchedIndices: K }) => {
                  v += 1;
                  const M = v === d, j = v;
                  return /* @__PURE__ */ c(
                    "li",
                    {
                      ref: (E) => {
                        E ? k.current.set(h.id, E) : k.current.delete(h.id);
                      },
                      role: "option",
                      "aria-selected": M,
                      children: /* @__PURE__ */ x(
                        "button",
                        {
                          type: "button",
                          onClick: () => y(h),
                          onMouseEnter: () => u(j),
                          className: [
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            M ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50" : "text-neutral-600 dark:text-neutral-300"
                          ].join(" "),
                          children: [
                            h.icon && /* @__PURE__ */ c("span", { className: "flex h-4 w-4 flex-shrink-0 items-center justify-center text-neutral-400", children: h.icon }),
                            /* @__PURE__ */ x("span", { className: "flex min-w-0 flex-1 flex-col", children: [
                              /* @__PURE__ */ c("span", { className: "truncate", children: /* @__PURE__ */ c(R, { label: h.label, matchedIndices: K }) }),
                              h.description && /* @__PURE__ */ c("span", { className: "truncate text-xs text-neutral-400", children: h.description })
                            ] }),
                            h.shortcut && /* @__PURE__ */ c("kbd", { className: "flex-shrink-0 select-none rounded border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400", children: h.shortcut })
                          ]
                        }
                      )
                    },
                    h.id
                  );
                }) })
              ] }, t || "__ungrouped__"))
            ] })
          ]
        }
      )
    }
  );
}
export {
  H as CommandPalette,
  _ as bestFuzzyMatch,
  S as fuzzyMatch,
  Q as useCommandPalette
};
