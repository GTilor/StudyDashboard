const STATE_KEY = "study_dash_state_v1";
const CURRENT_VERSION = 5;

const legacyRoadmapTitles = [
  "⚙️ 4-5月：架构筑基与高频特征",
  "🧠 6-7月：Alpha因子与自适应学习",
  "📈 8-9月：组合优化与风控体系",
  "🏆 10-11月：系统实盘化与求职面霸",
];

const legacyMetricNames = [
  "LeetCode Sprint (300)",
  "AI Masters Plan",
  "Fractional Control",
];

const defaultMasterProtocol = {
  ai: [
    { id: "ai1", text: "LeetCode Medium 1-2题，保持题感和手写速度" },
    { id: "ai2", text: "C++ / Python 核心语法或算法专题推进 1 个模块" },
    { id: "ai3", text: "项目 / 八股 / PyTorch 输出一个可记录结果" },
  ],
  math: [
    { id: "m1", text: "推导最优化 / 控制里的一个核心公式（如 KKT / Lyapunov）" },
    { id: "m2", text: "精读导师论文或数学资料 1 小节，并写下直觉解释" },
    { id: "m3", text: "做一次 Python / Fractional-SGD / 仿真实验验证" },
  ],
};

const defaultRoadmap = [
  {
    phase: "Phase 01",
    window: "4-6月",
    title: "语言与算法筑基",
    description: "C++ / Python、LeetCode、SQL、OS，先把写代码这件事变成肌肉记忆。",
    proof: "目标信号：LeetCode 100+、BFS/DFS/DP 手写、练习仓库开始成形。",
    theme: "foundation",
  },
  {
    phase: "Phase 02",
    window: "7-9月",
    title: "ML 理论与 PyTorch 实战",
    description: "手推 LR / SVM / EM / BP，做完整项目与 Kaggle，把理解变成作品。",
    proof: "目标信号：完整 PyTorch 仓库、实验图、Kaggle 排名、研究收尾。",
    theme: "growth",
  },
  {
    phase: "Phase 03",
    window: "10-12月",
    title: "简历、面试与投递冲刺",
    description: "整理项目表达、保持算法手感、做模拟面试并启动多梯队投递。",
    proof: "目标信号：20+ 投递、5+ 面试复盘、至少 1 个 Offer 或清晰下一步。",
    theme: "sprint",
  },
  {
    phase: "Parallel",
    window: "4-8月",
    title: "并行数学线",
    description: "最优化、稳定性理论、分数阶控制持续增强你的研究和 AI 差异化。",
    proof: "目标信号：KKT / Lyapunov / Fractional-SGD 的推导、代码与研究笔记。",
    theme: "math",
  },
];

const defaultMetrics = [
  {
    id: "metric-leetcode",
    name: "LeetCode Sprint (300)",
    current: 2,
    max: 300,
    type: "count",
    color: "foundation-grad",
  },
  {
    id: "metric-ml",
    name: "ML + PyTorch Depth",
    current: 0,
    max: 100,
    type: "percent",
    color: "growth-grad",
  },
  {
    id: "metric-math",
    name: "Math Parallel Track",
    current: 0,
    max: 100,
    type: "percent",
    color: "math-grad",
  },
  {
    id: "metric-output",
    name: "Resume + Output Stack",
    current: 0,
    max: 100,
    type: "percent",
    color: "sprint-grad",
  },
];

const defaultIdeas = [];

const defaultOutcomes = [
  {
    label: "Code Base",
    title: "3 个完整 GitHub 仓库",
    note: "练习代码、PyTorch 项目、研究实验分别承担不同证明作用。",
  },
  {
    label: "Competition",
    title: "2 次 Kaggle 或公开实验结果",
    note: "把模型能力变成公开可展示、可比较的证据。",
  },
  {
    label: "Research",
    title: "Adaptive-FULD / Fractional-SGD 技术表达",
    note: "研究、博客和实验图共同构成你的技术识别度。",
  },
  {
    label: "Interview",
    title: "1 页简历 + 5 次面试复盘",
    note: "所有积累最终都要落到清晰表达和真实反馈上。",
  },
];

let state = {
  version: CURRENT_VERSION,
  lastDateStr: "",
  roadmap: clone(defaultRoadmap),
  masterProtocol: clone(defaultMasterProtocol),
  metrics: clone(defaultMetrics),
  ideas: clone(defaultIdeas),
  outcomes: clone(defaultOutcomes),
  tasks: { ai: [], math: [] },
  focusTask: "选一个真正能推进的任务，然后开启番茄钟。",
  timerMinutes: 25,
  timerSeconds: 0,
  timerRunning: false,
};

let timerInterval = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function init() {
  loadState();
  checkDateAndResetTasks();
  updateCountdowns();
  renderRoadmap();
  renderCurrentPhase();
  renderMetrics();
  renderIdeaBoard();
  renderTasks();
  renderFocusTask();
  updateTimerDisplay();
  updatePresetButtons(state.timerMinutes);
  setupEventListeners();
  if (window.lucide) lucide.createIcons();
}

function setupEventListeners() {
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("确定要重置今天的任务勾选状态吗？")) {
        syncDailyTasksFromProtocol();
        saveState();
        renderTasks();
      }
    });
  }

  document.getElementById("timer-start").addEventListener("click", toggleTimer);
  document.getElementById("timer-pause").addEventListener("click", pauseTimer);
  document.getElementById("timer-reset").addEventListener("click", resetTimer);

  const addIdeaBtn = document.getElementById("add-idea-btn");
  const ideaTitleInput = document.getElementById("idea-title-input");
  const ideaNoteInput = document.getElementById("idea-note-input");
  const exportIdeasBtn = document.getElementById("export-ideas-btn");
  const importIdeasBtn = document.getElementById("import-ideas-btn");
  const ideaImportInput = document.getElementById("idea-import-input");

  if (addIdeaBtn) {
    addIdeaBtn.addEventListener("click", captureIdea);
  }

  if (exportIdeasBtn) {
    exportIdeasBtn.addEventListener("click", exportIdeasBackup);
  }

  if (importIdeasBtn && ideaImportInput) {
    importIdeasBtn.addEventListener("click", () => ideaImportInput.click());
    ideaImportInput.addEventListener("change", importIdeasBackup);
  }

  if (ideaTitleInput) {
    ideaTitleInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        captureIdea();
      }
    });
  }

  if (ideaNoteInput) {
    ideaNoteInput.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        captureIdea();
      }
    });
  }
}

function loadState() {
  const saved = localStorage.getItem(STATE_KEY);
  if (!saved) {
    syncDailyTasksFromProtocol();
    saveState();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state = { ...state, ...parsed };
    migrateState(parsed);
  } catch (error) {
    console.error("Failed to parse saved state", error);
    syncDailyTasksFromProtocol();
    saveState();
  }
}

function migrateState(parsed) {
  const version = parsed.version || 0;
  let mutated = false;

  if (version < CURRENT_VERSION) {
    if (isLegacyRoadmap(parsed.roadmap)) {
      state.roadmap = clone(defaultRoadmap);
      mutated = true;
    } else if (Array.isArray(parsed.roadmap)) {
      state.roadmap = parsed.roadmap.map(normalizeRoadmapItem);
      mutated = true;
    }

    if (isLegacyProtocol(parsed.masterProtocol)) {
      state.masterProtocol = clone(defaultMasterProtocol);
      mutated = true;
    }

    if (isLegacyMetrics(parsed.metrics)) {
      state.metrics = clone(defaultMetrics);
      mutated = true;
    } else if (Array.isArray(parsed.metrics)) {
      state.metrics = parsed.metrics.map(normalizeMetric);
      mutated = true;
    }

    if (!Array.isArray(parsed.ideas)) {
      state.ideas = clone(defaultIdeas);
      mutated = true;
    } else {
      state.ideas = parsed.ideas.map(normalizeIdea);
      mutated = true;
    }

    if (!Array.isArray(parsed.outcomes) || parsed.outcomes.length === 0) {
      state.outcomes = clone(defaultOutcomes);
      mutated = true;
    } else {
      state.outcomes = parsed.outcomes.map(normalizeOutcome);
      mutated = true;
    }

    if (
      !parsed.focusTask ||
      parsed.focusTask === "SELECT A TASK TO INITIATE" ||
      parsed.focusTask === "INITIATE SESSION"
    ) {
      state.focusTask = "选一个真正能推进的任务，然后开启番茄钟。";
      mutated = true;
    }

    if (!parsed.tasks || !parsed.tasks.ai?.length || !parsed.tasks.math?.length) {
      syncDailyTasksFromProtocol();
      mutated = true;
    }

    state.version = CURRENT_VERSION;
    mutated = true;
  }

  if (!Array.isArray(state.ideas)) {
    state.ideas = clone(defaultIdeas);
    mutated = true;
  } else {
    state.ideas = state.ideas.map(normalizeIdea);
  }

  state.timerRunning = false;

  if (mutated) {
    saveState();
  }
}

function isLegacyRoadmap(roadmap) {
  if (!Array.isArray(roadmap) || roadmap.length === 0) {
    return true;
  }

  const firstTitle = roadmap[0]?.title || "";
  return legacyRoadmapTitles.includes(firstTitle);
}

function isLegacyProtocol(protocol) {
  if (!protocol?.ai?.length || !protocol?.math?.length) {
    return true;
  }

  return protocol.ai[0].text === "LeetCode 1-2题 (Medium优先)";
}

function isLegacyMetrics(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return true;
  }

  return legacyMetricNames.includes(metrics[0]?.name || "");
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function checkDateAndResetTasks() {
  const today = getTodayStr();
  document.getElementById("current-date").innerText = today;

  if (state.lastDateStr && state.lastDateStr !== today) {
    syncDailyTasksFromProtocol();
  }

  if (!state.tasks.ai.length || !state.tasks.math.length) {
    syncDailyTasksFromProtocol();
  }

  state.lastDateStr = today;
  saveState();
}

function syncDailyTasksFromProtocol() {
  state.tasks = {
    ai: state.masterProtocol.ai.map((task, index) => ({
      id: task.id || `ai-${index}`,
      text: task.text,
      done: false,
    })),
    math: state.masterProtocol.math.map((task, index) => ({
      id: task.id || `math-${index}`,
      text: task.text,
      done: false,
    })),
  };
}

function normalizeRoadmapItem(item, index) {
  const fallback = defaultRoadmap[index] || defaultRoadmap[defaultRoadmap.length - 1];
  return {
    phase: item.phase || fallback.phase,
    window: item.window || fallback.window,
    title: item.title || fallback.title,
    description: item.description || fallback.description,
    proof: item.proof || fallback.proof,
    theme: item.theme || fallback.theme,
  };
}

function normalizeMetric(metric, index) {
  const fallback = defaultMetrics[index] || defaultMetrics[defaultMetrics.length - 1];
  return {
    id: metric.id || fallback.id || `metric-${index}`,
    name: metric.name || fallback.name,
    current: Number.isFinite(metric.current) ? metric.current : fallback.current,
    max: Number.isFinite(metric.max) ? metric.max : fallback.max,
    type: metric.type || fallback.type,
    color: metric.color || fallback.color,
  };
}

function normalizeIdea(idea, index) {
  const createdAt =
    typeof idea?.createdAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(idea.createdAt)
      ? idea.createdAt
      : getTodayStr();

  return {
    id: idea?.id || `idea-${Date.now()}-${index}`,
    title: (idea?.title || idea?.text || "").trim() || `灵感 ${index + 1}`,
    note: (idea?.note || "").trim(),
    status: ["captured", "next", "done"].includes(idea?.status) ? idea.status : "captured",
    createdAt,
  };
}

function normalizeOutcome(outcome, index) {
  const fallback = defaultOutcomes[index] || defaultOutcomes[defaultOutcomes.length - 1];
  return {
    label: outcome.label || fallback.label,
    title: outcome.title || fallback.title,
    note: outcome.note || fallback.note,
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function getMonthRange(windowLabel) {
  const match = String(windowLabel).match(/(\d+)-(\d+)月/);
  if (!match) {
    return null;
  }

  return {
    start: parseInt(match[1], 10),
    end: parseInt(match[2], 10),
  };
}

function getActiveRoadmapItems() {
  const currentMonth = new Date().getMonth() + 1;
  return state.roadmap.filter((item) => {
    const range = getMonthRange(item.window);
    if (!range) {
      return false;
    }
    return currentMonth >= range.start && currentMonth <= range.end;
  });
}

function getPrimaryPhase() {
  const active = getActiveRoadmapItems();
  return (
    active.find((item) => item.theme !== "math") ||
    active[0] ||
    state.roadmap[0]
  );
}

function getParallelPhase() {
  return getActiveRoadmapItems().find((item) => item.theme === "math");
}

function renderRoadmap() {
  const container = document.getElementById("roadmap-timeline");
  if (!container) return;

  const active = getActiveRoadmapItems();
  const activeTitles = new Set(active.map((item) => item.title));

  container.innerHTML = state.roadmap
    .map((item) => {
      const isActive = activeTitles.has(item.title);
      return `
        <div class="timeline-item ${isActive ? "active" : ""} theme-${item.theme}">
          <div class="tl-meta">
            <span class="tl-window">${item.window}</span>
            <span class="tl-phase">${item.phase}</span>
          </div>
          <div class="tl-content">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </div>
          <div class="tl-proof">${item.proof}</div>
        </div>
      `;
    })
    .join("");
}

function renderCurrentPhase() {
  const primary = getPrimaryPhase();
  const parallel = getParallelPhase();
  const titleNode = document.getElementById("current-phase-title");
  const descNode = document.getElementById("current-phase-description");
  const focusNode = document.getElementById("focus-phase-tag");
  const parallelNode = document.getElementById("parallel-track-note");

  if (titleNode) {
    titleNode.innerText = `${primary.phase} · ${primary.title}`;
  }

  if (descNode) {
    descNode.innerText = `${primary.window}：${primary.description}`;
  }

  if (focusNode) {
    focusNode.innerText = `${primary.window} / ${primary.title}`;
  }

  if (parallelNode) {
    parallelNode.innerText = parallel
      ? `${parallel.window} 的并行数学线仍在运行：${parallel.title}，目标是让研究与 AI 形成真正差异化。`
      : "当前主线之外，数学并行线仍要持续补底层理论和实验能力。";
  }
}

function getIdeaMeta(status) {
  const map = {
    captured: {
      label: "Captured",
      badgeClass: "idea-badge-captured",
    },
    next: {
      label: "Next Up",
      badgeClass: "idea-badge-next",
    },
    done: {
      label: "Shipped",
      badgeClass: "idea-badge-done",
    },
  };

  return map[status] || map.captured;
}

function getIdeaAgeInDays(createdAt) {
  const start = new Date(`${createdAt}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
}

function isIdeaStale(idea) {
  return idea.status !== "done" && getIdeaAgeInDays(idea.createdAt) >= 7;
}

function buildIdeaSummary() {
  const pendingCount = state.ideas.filter((idea) => idea.status !== "done").length;
  const staleCount = state.ideas.filter((idea) => isIdeaStale(idea)).length;
  const shippedCount = state.ideas.filter((idea) => idea.status === "done").length;

  return { pendingCount, staleCount, shippedCount };
}

function normalizeNextIdeas() {
  let seenNext = false;

  state.ideas = state.ideas.map((idea) => {
    if (idea.status !== "next") {
      return idea;
    }

    if (!seenNext) {
      seenNext = true;
      return idea;
    }

    return {
      ...idea,
      status: "captured",
    };
  });
}

function sortIdeasByDate(items) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function renderIdeaBoard() {
  const container = document.getElementById("idea-list");
  const summary = document.getElementById("idea-summary-pills");

  if (!container || !summary) return;

  const { pendingCount, staleCount, shippedCount } = buildIdeaSummary();
  summary.innerHTML = `
    <span class="idea-pill">
      <strong>${pendingCount}</strong>
      待实现
    </span>
    <span class="idea-pill ${staleCount ? "alert" : ""}">
      <strong>${staleCount}</strong>
      久未推进
    </span>
    <span class="idea-pill">
      <strong>${shippedCount}</strong>
      已实现
    </span>
  `;

  container.innerHTML = "";

  if (!state.ideas.length) {
    container.innerHTML = `
      <div class="idea-empty">
        <strong>把灵感先存进来。</strong>
        <p>Demo 想法、研究题目、自动化脚本、页面改造点都可以放这里。先留下痕迹，再决定什么时候推进。</p>
      </div>
    `;
    return;
  }

  normalizeNextIdeas();

  const nextIdeas = sortIdeasByDate(state.ideas.filter((idea) => idea.status === "next"));
  const backlogIdeas = sortIdeasByDate(state.ideas.filter((idea) => idea.status === "captured"));
  const doneIdeas = sortIdeasByDate(state.ideas.filter((idea) => idea.status === "done"));

  container.appendChild(
    createIdeaLane({
      title: "Current Build",
      count: nextIdeas.length,
      note: "这里只放你当前决定要推进的一条灵感，它会同步到中间执行区。",
      items: nextIdeas,
      emptyText: "还没有指定当前推进项。先在 backlog 里收集，再挑一条拉进执行。",
      tone: "next",
    })
  );

  container.appendChild(
    createIdeaLane({
      title: "Idea Backlog",
      count: backlogIdeas.length,
      note: "这里就是未实现灵感池。可以长期积累很多条，之后按优先级慢慢消化。",
      items: backlogIdeas,
      emptyText: "目前 backlog 还是空的。你之后记下的灵感会一直累计在这里。",
      tone: "backlog",
    })
  );

  container.appendChild(
    createIdeaLane({
      title: "Shipped Archive",
      count: doneIdeas.length,
      note: "已经落地的想法不删除，留在这里当证据和回顾材料。",
      items: doneIdeas,
      emptyText: "还没有已实现灵感。等你把 backlog 里的东西做出来，这里会慢慢长出来。",
      tone: "done",
    })
  );
}

function createIdeaLane({ title, count, note, items, emptyText, tone }) {
  const section = document.createElement("section");
  section.className = `idea-lane tone-${tone}`;

  const header = document.createElement("div");
  header.className = "idea-lane-header";

  const headerCopy = document.createElement("div");
  headerCopy.className = "idea-lane-copy";

  const headerTitle = document.createElement("h3");
  headerTitle.className = "idea-lane-title";
  headerTitle.innerText = title;
  headerCopy.appendChild(headerTitle);

  const headerNote = document.createElement("p");
  headerNote.className = "idea-lane-note";
  headerNote.innerText = note;
  headerCopy.appendChild(headerNote);

  const countBadge = document.createElement("span");
  countBadge.className = "idea-lane-count";
  countBadge.innerText = `${count} 条`;

  header.appendChild(headerCopy);
  header.appendChild(countBadge);
  section.appendChild(header);

  const body = document.createElement("div");
  body.className = "idea-lane-body";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "idea-lane-empty";
    empty.innerText = emptyText;
    body.appendChild(empty);
  } else {
    items.forEach((idea) => body.appendChild(createIdeaElement(idea)));
  }

  section.appendChild(body);
  return section;
}

function createIdeaElement(idea) {
  const article = document.createElement("article");
  article.className = `idea-item status-${idea.status}${isIdeaStale(idea) ? " is-stale" : ""}`;

  const kicker = document.createElement("div");
  kicker.className = "idea-kicker";

  const badges = document.createElement("div");
  badges.className = "idea-badges";

  const status = getIdeaMeta(idea.status);
  const statusBadge = document.createElement("span");
  statusBadge.className = `idea-status-badge ${status.badgeClass}`;
  statusBadge.innerText = status.label;
  badges.appendChild(statusBadge);

  const reminderBadge = document.createElement("span");
  const ageInDays = getIdeaAgeInDays(idea.createdAt);
  reminderBadge.className = `idea-reminder-badge ${
    idea.status === "done" ? "is-done" : isIdeaStale(idea) ? "is-alert" : ""
  }`;

  if (idea.status === "done") {
    reminderBadge.innerText = "已落地";
  } else if (ageInDays === 0) {
    reminderBadge.innerText = "今天记录";
  } else if (isIdeaStale(idea)) {
    reminderBadge.innerText = `${ageInDays}天未实现`;
  } else {
    reminderBadge.innerText = `${ageInDays}天前记录`;
  }

  badges.appendChild(reminderBadge);
  kicker.appendChild(badges);

  const recordedAt = document.createElement("span");
  recordedAt.className = "idea-recorded-at";
  recordedAt.innerText = idea.createdAt;
  kicker.appendChild(recordedAt);

  const title = document.createElement("h3");
  title.innerText = idea.title;
  article.appendChild(kicker);
  article.appendChild(title);

  if (idea.note) {
    const note = document.createElement("p");
    note.innerText = idea.note;
    article.appendChild(note);
  }

  const footer = document.createElement("div");
  footer.className = "idea-item-footer";

  const hint = document.createElement("span");
  hint.className = "idea-action-hint";
  hint.innerText =
    idea.status === "done" ? "已实现的灵感会保留在这里，方便回看。"
    : "需要推进时，把它拉进当前执行区。";
  footer.appendChild(hint);

  const actions = document.createElement("div");
  actions.className = "idea-item-actions";

  const focusButton = document.createElement("button");
  focusButton.className = "idea-inline-btn primary";
  focusButton.innerText = idea.status === "done" ? "重新打开" : "拉进执行";
  focusButton.addEventListener("click", () => activateIdea(idea.id));
  actions.appendChild(focusButton);

  const statusButton = document.createElement("button");
  statusButton.className = `idea-inline-btn ${idea.status === "done" ? "" : "done"}`;
  statusButton.innerText = idea.status === "done" ? "撤回完成" : "标记完成";
  statusButton.addEventListener("click", () => toggleIdeaDone(idea.id));
  actions.appendChild(statusButton);

  footer.appendChild(actions);
  article.appendChild(footer);

  return article;
}

function captureIdea() {
  const titleInput = document.getElementById("idea-title-input");
  const noteInput = document.getElementById("idea-note-input");
  if (!titleInput || !noteInput) return;

  const title = titleInput.value.trim();
  const note = noteInput.value.trim();

  if (!title) {
    titleInput.focus();
    return;
  }

  state.ideas.unshift({
    id: `idea-${Date.now()}`,
    title,
    note,
    status: "captured",
    createdAt: getTodayStr(),
  });

  titleInput.value = "";
  noteInput.value = "";
  saveState();
  renderIdeaBoard();
  titleInput.focus();
}

function activateIdea(ideaId) {
  const idea = state.ideas.find((item) => item.id === ideaId);
  if (!idea) return;

  state.ideas.forEach((item) => {
    if (item.status === "next") {
      item.status = "captured";
    }
  });

  idea.status = "next";
  setFocusTask(idea.title);
  saveState();
  renderIdeaBoard();
}

function toggleIdeaDone(ideaId) {
  const idea = state.ideas.find((item) => item.id === ideaId);
  if (!idea) return;

  idea.status = idea.status === "done" ? "captured" : "done";
  saveState();
  renderIdeaBoard();
}

function exportIdeasBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "StudyDashboard",
    ideas: state.ideas,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `study-dashboard-ideas-${getTodayStr()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importIdeasBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const incomingIdeas = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.ideas)
        ? parsed.ideas
        : [];

      if (!incomingIdeas.length) {
        alert("导入文件里没有可用的 idea 数据。");
        return;
      }

      const existing = new Set(
        state.ideas.map((idea) => `${idea.title}::${idea.note}::${idea.createdAt}`)
      );

      const mergedIdeas = incomingIdeas
        .map((idea, index) => normalizeIdea(idea, index))
        .filter((idea) => {
          const fingerprint = `${idea.title}::${idea.note}::${idea.createdAt}`;
          if (existing.has(fingerprint)) {
            return false;
          }

          existing.add(fingerprint);
          return true;
        });

      state.ideas = [...mergedIdeas, ...state.ideas];
      saveState();
      renderIdeaBoard();
      alert(`已导入 ${mergedIdeas.length} 条 idea。`);
    } catch (error) {
      console.error("Failed to import ideas", error);
      alert("导入失败，文件格式不是有效的 JSON。");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

window.openIdeaEditor = function openIdeaEditor() {
  showModal(
    "Edit Idea Inbox",
    `
      <div id="idea-edit-list">
        ${
          state.ideas.length
            ? state.ideas
                .map(
                  (idea, index) => `
                    <div class="form-group" style="border-bottom: 1px solid rgba(21,17,15,0.08); padding-bottom: 12px;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label>Idea ${index + 1}</label>
                        <button class="icon-btn" onclick="removeIdea(${index})" style="color:#d35c2d;"><i data-lucide="minus-circle" style="width:14px;"></i></button>
                      </div>
                      <label>Title</label>
                      <input type="text" id="idea-title-${index}" value="${escapeHtml(idea.title)}">
                      <label>Note</label>
                      <textarea id="idea-note-${index}">${escapeHtml(idea.note)}</textarea>
                      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                        <div style="flex:1;">
                          <label>Status</label>
                          <select id="idea-status-${index}">
                            <option value="captured" ${idea.status === "captured" ? "selected" : ""}>Captured</option>
                            <option value="next" ${idea.status === "next" ? "selected" : ""}>Next Up</option>
                            <option value="done" ${idea.status === "done" ? "selected" : ""}>Shipped</option>
                          </select>
                        </div>
                        <div style="flex:1;">
                          <label>Captured At</label>
                          <input type="date" id="idea-date-${index}" value="${idea.createdAt}">
                        </div>
                      </div>
                    </div>
                  `
                )
                .join("")
            : '<p class="card-footnote">还没有灵感项，先点下面新增一条。</p>'
        }
      </div>
      <button class="ctrl-btn" onclick="addIdea()" style="width:100%;">+ Add Idea</button>
    `,
    () => {
      state.ideas = state.ideas
        .map((idea, index) => {
          const title = document.getElementById(`idea-title-${index}`)?.value.trim() || "";
          const note = document.getElementById(`idea-note-${index}`)?.value.trim() || "";
          const status = document.getElementById(`idea-status-${index}`)?.value || "captured";
          const createdAt = document.getElementById(`idea-date-${index}`)?.value || getTodayStr();

          if (!title && !note) {
            return null;
          }

          return normalizeIdea(
            {
              ...idea,
              title: title || note.slice(0, 18) || "未命名灵感",
              note,
              status,
              createdAt,
            },
            index
          );
        })
        .filter(Boolean);

      normalizeNextIdeas();
      saveState();
      renderIdeaBoard();
      closeModal();
    }
  );
};

window.addIdea = function addIdea() {
  state.ideas.push({
    id: `idea-${Date.now()}`,
    title: "新的灵感",
    note: "",
    status: "captured",
    createdAt: getTodayStr(),
  });
  openIdeaEditor();
};

window.removeIdea = function removeIdea(index) {
  state.ideas.splice(index, 1);
  openIdeaEditor();
};

window.openRoadmapEditor = function openRoadmapEditor() {
  showModal(
    "Edit Strategic Roadmap",
    `
      <div id="roadmap-edit-list">
        ${state.roadmap
          .map(
            (item, index) => `
              <div class="form-group" style="border-bottom: 1px solid rgba(21,17,15,0.08); padding-bottom: 12px;">
                <label>Window / ${item.phase}</label>
                <input type="text" id="rm-window-${index}" value="${item.window}">
                <label>Title</label>
                <input type="text" id="rm-title-${index}" value="${item.title}">
                <label>Description</label>
                <textarea id="rm-desc-${index}">${item.description}</textarea>
                <label>Proof / Signal</label>
                <textarea id="rm-proof-${index}">${item.proof}</textarea>
              </div>
            `
          )
          .join("")}
      </div>
    `,
    () => {
      state.roadmap = state.roadmap.map((item, index) => ({
        ...item,
        window: document.getElementById(`rm-window-${index}`).value,
        title: document.getElementById(`rm-title-${index}`).value,
        description: document.getElementById(`rm-desc-${index}`).value,
        proof: document.getElementById(`rm-proof-${index}`).value,
      }));
      saveState();
      renderRoadmap();
      renderCurrentPhase();
      closeModal();
    }
  );
};

window.openProtocolEditor = function openProtocolEditor() {
  const renderList = (category) =>
    state.masterProtocol[category]
      .map(
        (task, index) => `
          <div class="task-edit-row">
            <input type="text" id="proto-${category}-${index}" value="${task.text}">
            <button class="icon-btn" onclick="removeProtoTask('${category}', ${index})"><i data-lucide="minus-circle"></i></button>
          </div>
        `
      )
      .join("");

  showModal(
    "Master Protocol Editor",
    `
      <div class="form-group">
        <label>Morning / Core Execution</label>
        <div id="proto-ai-list">${renderList("ai")}</div>
        <button class="ctrl-btn" onclick="addProtoTask('ai')">+ Add Task</button>
      </div>
      <div class="form-group">
        <label>Night / Math Spine</label>
        <div id="proto-math-list">${renderList("math")}</div>
        <button class="ctrl-btn" onclick="addProtoTask('math')">+ Add Task</button>
      </div>
    `,
    () => {
      ["ai", "math"].forEach((category) => {
        state.masterProtocol[category] = state.masterProtocol[category].map((task, index) => ({
          id: task.id || `${category}-${Date.now()}-${index}`,
          text: document.getElementById(`proto-${category}-${index}`).value,
        }));
      });

      saveState();
      if (confirm("更改主协议后，是否立即重置今日任务？")) {
        syncDailyTasksFromProtocol();
        saveState();
      }
      renderTasks();
      closeModal();
    }
  );
};

window.addProtoTask = function addProtoTask(category) {
  state.masterProtocol[category].push({
    id: `${category}-${Date.now()}`,
    text: "New Task",
  });
  openProtocolEditor();
};

window.removeProtoTask = function removeProtoTask(category, index) {
  state.masterProtocol[category].splice(index, 1);
  openProtocolEditor();
};

window.openMetricsEditor = function openMetricsEditor() {
  showModal(
    "Edit Core Metrics",
    `
      <div id="metrics-edit-list">
        ${state.metrics
          .map(
            (metric, index) => `
              <div class="form-group" style="border-bottom: 1px solid rgba(21,17,15,0.08); padding-bottom: 12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label>Metric ${index + 1}</label>
                  <button class="icon-btn" onclick="removeMetric(${index})" style="color:#d35c2d;"><i data-lucide="minus-circle" style="width:14px;"></i></button>
                </div>
                <input type="text" id="metric-name-${index}" value="${metric.name}" placeholder="Metric Name">
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                  <div style="flex:1;"><label>Current</label><input type="number" id="metric-cur-${index}" value="${metric.current}"></div>
                  <div style="flex:1;"><label>Max</label><input type="number" id="metric-max-${index}" value="${metric.max}"></div>
                </div>
                <div style="margin-top:0.5rem;">
                  <label>Color</label>
                  <select id="metric-color-${index}">
                    <option value="foundation-grad" ${metric.color === "foundation-grad" ? "selected" : ""}>Foundation / Orange</option>
                    <option value="growth-grad" ${metric.color === "growth-grad" ? "selected" : ""}>Growth / Blue</option>
                    <option value="math-grad" ${metric.color === "math-grad" ? "selected" : ""}>Math / Green</option>
                    <option value="sprint-grad" ${metric.color === "sprint-grad" ? "selected" : ""}>Sprint / Burnt Orange</option>
                  </select>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      <button class="ctrl-btn" onclick="addMetric()" style="width:100%;">+ Add Metric</button>
    `,
    () => {
      state.metrics = state.metrics.map((metric, index) => ({
        ...metric,
        name: document.getElementById(`metric-name-${index}`).value,
        current: parseInt(document.getElementById(`metric-cur-${index}`).value, 10) || 0,
        max: parseInt(document.getElementById(`metric-max-${index}`).value, 10) || 100,
        color: document.getElementById(`metric-color-${index}`).value,
      }));
      saveState();
      renderMetrics();
      closeModal();
    }
  );
};

window.addMetric = function addMetric() {
  state.metrics.push({
    id: `metric-${Date.now()}`,
    name: "New Metric",
    current: 0,
    max: 100,
    type: "percent",
    color: "growth-grad",
  });
  openMetricsEditor();
};

window.removeMetric = function removeMetric(index) {
  state.metrics.splice(index, 1);
  openMetricsEditor();
};

function showModal(title, bodyHtml, onSave) {
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;

  const overlay = document.getElementById("modal-overlay");
  overlay.style.display = "flex";

  const oldSaveBtn = document.getElementById("modal-save-btn");
  const newSaveBtn = oldSaveBtn.cloneNode(true);
  oldSaveBtn.parentNode.replaceChild(newSaveBtn, oldSaveBtn);
  newSaveBtn.addEventListener("click", onSave);

  if (window.lucide) lucide.createIcons();
}

window.closeModal = function closeModal() {
  document.getElementById("modal-overlay").style.display = "none";
};

function updateCountdowns() {
  const now = new Date();
  const enrollmentDate = new Date("2026-09-01T00:00:00");
  const huntingDate = new Date("2026-11-01T00:00:00");
  const enrollmentDiff = Math.ceil((enrollmentDate - now) / (1000 * 60 * 60 * 24));
  const huntingDiff = Math.ceil((huntingDate - now) / (1000 * 60 * 60 * 24));

  document.getElementById("cd-enrollment").innerText = `${Math.max(0, enrollmentDiff)}天`;
  document.getElementById("cd-hunting").innerText = `${Math.max(0, huntingDiff)}天`;
}

window.updateMetric = function updateMetric(index, amount) {
  const metric = state.metrics[index];
  if (!metric) return;

  metric.current = Math.min(metric.max, Math.max(0, metric.current + amount));
  saveState();
  renderMetrics();
};

function renderMetrics() {
  const container = document.getElementById("metrics-container");
  if (!container) return;

  container.innerHTML = state.metrics
    .map((metric, index) => {
      const percent = Math.min(100, (metric.current / metric.max) * 100);
      const displayValue =
        metric.type === "count" ? `${metric.current}/${metric.max}` : `${metric.current}%`;
      const addValues = metric.type === "count" ? [1, 5] : [2, 5];
      const addLabels = metric.type === "count" ? ["+1", "+5"] : ["+2%", "+5%"];

      return `
        <div class="progress-item">
          <div class="p-info"><span>${metric.name}</span><span>${displayValue}</span></div>
          <div class="bar-bg"><div class="bar-fill ${metric.color}" style="width:${percent}%"></div></div>
          <div class="p-actions">
            <button onclick="updateMetric(${index}, ${addValues[0]})">${addLabels[0]}</button>
            <button onclick="updateMetric(${index}, ${addValues[1]})">${addLabels[1]}</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderFocusTask() {
  document.getElementById("active-task-display").innerText = state.focusTask;
}

function setFocusTask(text) {
  state.focusTask = text;
  saveState();
  renderFocusTask();
}

window.setTimer = function setTimer(minutes) {
  pauseTimer();
  state.timerMinutes = minutes;
  state.timerSeconds = 0;
  updateTimerDisplay();
  updatePresetButtons(minutes);
  document.getElementById("timer-start").innerText = "START";
};

function updatePresetButtons(minutes) {
  document.querySelectorAll(".preset-btn").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.minutes) === Number(minutes));
  });
}

function updateTimerDisplay() {
  const minutes = String(state.timerMinutes).padStart(2, "0");
  const seconds = String(state.timerSeconds).padStart(2, "0");
  document.getElementById("timer-display").innerText = `${minutes}:${seconds}`;
}

function toggleTimer() {
  if (state.timerRunning) return;

  state.timerRunning = true;
  document.getElementById("timer-start").innerText = "IN SESSION";

  timerInterval = setInterval(() => {
    if (state.timerSeconds === 0) {
      if (state.timerMinutes === 0) {
        clearInterval(timerInterval);
        state.timerRunning = false;
        alert("Time Up!");
        resetTimer();
        return;
      }

      state.timerMinutes -= 1;
      state.timerSeconds = 59;
    } else {
      state.timerSeconds -= 1;
    }

    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  state.timerRunning = false;
  document.getElementById("timer-start").innerText = "CONTINUE";
}

function resetTimer() {
  pauseTimer();
  state.timerMinutes = 25;
  state.timerSeconds = 0;
  document.getElementById("timer-start").innerText = "START";
  updatePresetButtons(25);
  updateTimerDisplay();
}

function renderTasks() {
  const aiList = document.getElementById("ai-task-list");
  const mathList = document.getElementById("math-task-list");
  aiList.innerHTML = "";
  mathList.innerHTML = "";

  state.tasks.ai.forEach((task, index) => aiList.appendChild(createTaskElement("ai", index, task)));
  state.tasks.math.forEach((task, index) =>
    mathList.appendChild(createTaskElement("math", index, task))
  );

  if (window.lucide) lucide.createIcons();
}

function createTaskElement(category, index, taskData) {
  const li = document.createElement("li");
  li.className = `task-item ${taskData.done ? "completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = taskData.done;
  checkbox.addEventListener("change", (event) => {
    state.tasks[category][index].done = event.target.checked;
    li.classList.toggle("completed", event.target.checked);
    saveState();
  });

  const text = document.createElement("span");
  text.className = "task-text";
  text.innerText = taskData.text;

  const focusBtn = document.createElement("button");
  focusBtn.className = "focus-btn";
  focusBtn.innerHTML = '<i data-lucide="target"></i>';
  focusBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setFocusTask(taskData.text);
  });

  li.appendChild(checkbox);
  li.appendChild(text);
  li.appendChild(focusBtn);

  li.addEventListener("click", (event) => {
    if (event.target !== checkbox && event.target !== focusBtn) {
      checkbox.click();
    }
  });

  return li;
}

init();
