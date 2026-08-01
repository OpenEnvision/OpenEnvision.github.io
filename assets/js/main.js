const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const navDropdowns = [...document.querySelectorAll("[data-nav-dropdown]")];
const currentPage = document.body.dataset.page;

if (currentPage) {
  navLinks.forEach((link) => {
    if (link.dataset.pageLink === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

navDropdowns.forEach((dropdown) => {
  dropdown.classList.toggle(
    "is-current",
    Boolean(dropdown.querySelector('[aria-current="page"]')),
  );

  dropdown.addEventListener("toggle", () => {
    if (!dropdown.open) return;
    navDropdowns.forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) otherDropdown.removeAttribute("open");
    });
  });
});

document.addEventListener("click", (event) => {
  navDropdowns.forEach((dropdown) => {
    if (dropdown.open && !dropdown.contains(event.target)) dropdown.removeAttribute("open");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const openDropdown = navDropdowns.find((dropdown) => dropdown.open);
  if (openDropdown) {
    openDropdown.removeAttribute("open");
    openDropdown.querySelector("summary")?.focus();
    return;
  }

  if (navToggle?.getAttribute("aria-expanded") === "true") {
    navToggle.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
    header?.classList.remove("nav-active");
    document.body.classList.remove("nav-open");
    navToggle.focus();
  }
});

function setHeaderState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
    header.classList.toggle("nav-active", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
    if (isOpen) navDropdowns.forEach((dropdown) => dropdown.removeAttribute("open"));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      header.classList.remove("nav-active");
      document.body.classList.remove("nav-open");
      navDropdowns.forEach((dropdown) => dropdown.removeAttribute("open"));
    });
  });
}

const canvas = document.getElementById("starfield");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let ctx = null;
let width = 0;
let height = 0;
let animationFrame = null;
let stars = [];

initNewsMonthAnimations();
initJoinPage();
initForesightPage();
initSiteReveals();

if (canvas) {
  ctx = canvas.getContext("2d");
  startStars();
  window.addEventListener("resize", restartStars);
  reduceMotion.addEventListener("change", restartStars);
}

function initNewsMonthAnimations() {
  const months = [...document.querySelectorAll(".news-month")];
  if (!months.length) return;

  months.forEach((month) => {
    const summary = month.querySelector(".news-month-summary");
    const list = month.querySelector(".news-month-list");
    if (!summary || !list) return;

    list.style.overflow = "hidden";

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (month.dataset.animating === "true") return;
      animateNewsMonth(month, list, !month.classList.contains("is-open"));
    });
  });
}

function initJoinPage() {
  const revealItems = [...document.querySelectorAll("[data-join-reveal]")];
  const network = document.querySelector("[data-join-network]");
  if (!revealItems.length && !network) return;

  document.body.classList.add("join-motion-ready");

  const revealEverything = () => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  };

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealEverything();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px 4%", threshold: 0.05 },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  if (!network || reduceMotion.matches || !window.matchMedia("(pointer: fine)").matches) return;

  network.addEventListener("pointermove", (event) => {
    const bounds = network.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    network.style.setProperty("--join-shift-x", `${(x * 9).toFixed(2)}px`);
    network.style.setProperty("--join-shift-y", `${(y * 7).toFixed(2)}px`);
  });

  network.addEventListener("pointerleave", () => {
    network.style.setProperty("--join-shift-x", "0px");
    network.style.setProperty("--join-shift-y", "0px");
  });
}

function initForesightPage() {
  initCareerDirectory();
  initConferenceTracker();
  initWorkshopTracker();

  const filterButtons = [...document.querySelectorAll("[data-resource-filter]")];
  const resourceRows = [...document.querySelectorAll("[data-resource-kind]")];
  const status = document.querySelector("[data-resource-status]");
  if (!filterButtons.length || !resourceRows.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.resourceFilter;

      filterButtons.forEach((candidate) => {
        const isSelected = candidate === button;
        candidate.classList.toggle("is-selected", isSelected);
        candidate.setAttribute("aria-pressed", String(isSelected));
      });

      let visibleCount = 0;
      resourceRows.forEach((row) => {
        const isVisible = filter === "all" || row.dataset.resourceKind === filter;
        row.hidden = !isVisible;
        if (!isVisible) row.removeAttribute("open");
        if (isVisible) visibleCount += 1;
      });

      if (status) {
        const category = button.textContent.trim();
        status.textContent = `Showing ${visibleCount} ${category === "All" ? "resource categories" : category + " resource category"}.`;
      }
    });
  });
}

function initCareerDirectory() {
  const grid = document.querySelector("[data-career-list]");
  if (!grid) return;

  const companies = [
    {
      name: "OpenAI",
      mark: "OA",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Builds frontier models and products with teams spanning fundamental research, applied AI, safety, and large-scale systems.",
      focus: ["Research", "Applied AI", "Safety", "Infrastructure"],
      locations: "San Francisco · New York · London · Singapore · global offices",
      url: "https://openai.com/careers/search/",
    },
    {
      name: "Google DeepMind",
      mark: "GDM",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Research and engineering across Gemini, multimodal models, robotics, AI for science, responsibility, and distributed systems.",
      focus: ["Research", "Gemini", "Robotics", "AI for Science"],
      locations: "London · Bay Area · Bangalore · Montréal · Paris · Tokyo · Zürich",
      url: "https://deepmind.google/careers/",
    },
    {
      name: "Anthropic",
      mark: "AN",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Develops reliable frontier AI with active work in pretraining, reinforcement learning, interpretability, safeguards, and ML systems.",
      focus: ["Pretraining", "RL", "Interpretability", "ML Systems"],
      locations: "San Francisco · New York · Seattle · London · Zürich · selected remote",
      url: "https://www.anthropic.com/careers/jobs",
    },
    {
      name: "xAI",
      mark: "xAI",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Recruits model builders and infrastructure engineers for training, post-training, multimodal understanding, voice, and inference.",
      focus: ["Model Training", "Multimodal", "Voice", "ML Infrastructure"],
      locations: "Palo Alto · Seattle · New York · Austin · London · Memphis",
      url: "https://x.ai/careers/open-roles",
    },
    {
      name: "Mistral AI",
      mark: "MI",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Independent frontier-model company hiring across model science, product engineering, inference platforms, and enterprise solutions.",
      focus: ["Model Science", "Inference", "Product", "Enterprise AI"],
      locations: "Paris · London · Palo Alto · global offices",
      url: "https://mistral.ai/careers",
    },
    {
      name: "Cohere",
      mark: "CO",
      type: "frontier",
      typeLabel: "Frontier Lab",
      description: "Builds foundation models and secure enterprise AI, with opportunities across research, model engineering, platform, and applied teams.",
      focus: ["Foundation Models", "Research", "Platform", "Applied AI"],
      locations: "Toronto · New York · London · San Francisco · Montréal · Paris · Seoul",
      url: "https://cohere.com/careers",
    },
    {
      name: "Meta AI",
      mark: "META",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "AI roles across Llama, multimodal assistants, on-device intelligence, wearables, recommendation, and hyperscale infrastructure.",
      focus: ["Llama", "Multimodal", "On-device AI", "AI Infrastructure"],
      locations: "North America · Europe · Asia-Pacific · global offices",
      url: "https://www.metacareers.com/teams/technology?tab=AI",
    },
    {
      name: "Microsoft Research",
      mark: "MSR",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "Researcher, research engineer, applied scientist, postdoctoral, and internship paths across AI, systems, vision, and science.",
      focus: ["Research", "AI Systems", "Computer Vision", "Internships"],
      locations: "Redmond · Beijing · Shanghai · New York · Cambridge · global labs",
      url: "https://www.microsoft.com/en-us/research/careers/open-positions/",
    },
    {
      name: "Apple ML Research",
      mark: "APL",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "Research and engineering opportunities for private and on-device intelligence, vision, language, speech, and intelligent experiences.",
      focus: ["On-device ML", "Vision", "Language", "Internships"],
      locations: "United States · Europe · Asia-Pacific · role-dependent",
      url: "https://machinelearning.apple.com/work-with-us",
    },
    {
      name: "Amazon Science",
      mark: "AMZ",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "Applied science and engineering roles spanning generative AI, robotics, computer vision, recommendation, search, and custom silicon.",
      focus: ["Applied Science", "GenAI", "Robotics", "ML Accelerators"],
      locations: "United States · Europe · India · Israel · Japan · global offices",
      url: "https://www.amazon.science/careers",
    },
    {
      name: "Adobe",
      mark: "ADB",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "Research and engineering across Firefly, creative generative AI, document intelligence, responsible AI, and experience personalization.",
      focus: ["Firefly", "Creative AI", "Adobe Research", "Responsible AI"],
      locations: "United States · Europe · India · Asia-Pacific · global offices",
      url: "https://careers.adobe.com/us/en/gen-ai",
    },
    {
      name: "Canva",
      mark: "CNV",
      type: "big-tech",
      typeLabel: "Big Tech",
      description: "Builds visual communication products with Magic Studio, multimodal generation, applied machine learning, search, and large-scale AI platforms.",
      focus: ["Magic Studio", "Multimodal", "Applied ML", "AI Platform"],
      locations: "Australia · United States · United Kingdom · China · global hubs",
      url: "https://www.canva.com/careers/",
    },
    {
      name: "Perplexity",
      mark: "PX",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Develops an answer engine and agentic research products grounded in live web search, retrieval, model orchestration, and high-scale inference.",
      focus: ["AI Search", "Agents", "Retrieval", "Model Systems"],
      locations: "San Francisco · Palo Alto · New York · London · role-dependent",
      url: "https://www.perplexity.ai/hub/careers",
    },
    {
      name: "Runway",
      mark: "RW",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Builds multimodal world simulators and creative AI, with active research across foundation models, video generation, robotics, and physical AI.",
      focus: ["World Models", "Video Generation", "Multimodal", "Physical AI"],
      locations: "New York · San Francisco · Seattle · London · Paris · Tokyo · remote",
      url: "https://runwayml.com/careers",
    },
    {
      name: "ElevenLabs",
      mark: "11L",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Advances expressive speech, audio generation, multilingual dubbing, voice agents, and developer infrastructure for conversational AI.",
      focus: ["Audio AI", "Speech", "Voice Agents", "Multilingual"],
      locations: "New York · London · Warsaw · remote-first across 30+ countries",
      url: "https://elevenlabs.io/careers",
    },
    {
      name: "World Labs",
      mark: "WL",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Builds spatial-intelligence foundation models that perceive, generate, reason about, and interact with persistent 3D worlds.",
      focus: ["Spatial Intelligence", "World Models", "3D Vision", "Robot Learning"],
      locations: "San Francisco · primarily on-site",
      url: "https://job-boards.greenhouse.io/worldlabs",
    },
    {
      name: "Sierra",
      mark: "SR",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Creates enterprise customer-service agents, combining agent architecture, voice, data platforms, evaluation, and production deployment.",
      focus: ["AI Agents", "Voice", "Agent Platform", "Enterprise AI"],
      locations: "San Francisco · New York · London · Singapore · Tokyo · global offices",
      url: "https://sierra.ai/careers",
    },
    {
      name: "Harvey",
      mark: "HVY",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Develops domain-specific generative AI for legal and professional services, spanning applied research, product engineering, and secure AI systems.",
      focus: ["Legal AI", "Applied AI", "Knowledge Systems", "Enterprise"],
      locations: "San Francisco · New York · London · Singapore · Sydney · global offices",
      url: "https://www.harvey.ai/careers",
    },
    {
      name: "Cursor · Anysphere",
      mark: "CRS",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Builds AI-native software development tools with work across coding agents, model routing, evaluations, ML research, and infrastructure.",
      focus: ["Coding Agents", "ML Research", "Evaluations", "Inference"],
      locations: "San Francisco · New York · London · Singapore · selected remote",
      url: "https://cursor.com/careers",
    },
    {
      name: "Sakana AI",
      mark: "SKN",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Tokyo research lab exploring nature-inspired foundation models, recursive self-improvement, autonomous agents, and multi-agent systems.",
      focus: ["Foundation Models", "AI Scientist", "Agents", "Multi-agent"],
      locations: "Tokyo · hybrid and role-dependent",
      url: "https://sakana.ai/careers/",
    },
    {
      name: "Glean",
      mark: "GLN",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Builds enterprise search, assistants, agent orchestration, contextual retrieval, and governed AI infrastructure for work.",
      focus: ["Enterprise Search", "AI Agents", "Retrieval", "AI Platform"],
      locations: "San Francisco · Palo Alto · New York · London · Bengaluru · role-dependent",
      url: "https://www.glean.com/careers",
    },
    {
      name: "Luma AI",
      mark: "LMA",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Develops multimodal foundation models for video, images, world simulation, agents, and embodied interaction grounded in real-world physics.",
      focus: ["World Models", "Video AI", "Foundation Models", "Simulation"],
      locations: "Redwood City · New York · Los Angeles · London · role-dependent",
      url: "https://lumalabs.ai/careers",
    },
    {
      name: "Evolvent AI",
      mark: "EVO",
      type: "startup",
      typeLabel: "AI Startup",
      description: "Builds adaptive data infrastructure for evolving AI systems, with work spanning multi-turn agent data, living-world benchmarks, evaluation routing, and agent authorization.",
      focus: ["Agent Data", "AI Infrastructure", "Evaluation", "Benchmarks"],
      locations: "Contact via official site · location not publicly listed",
      url: "https://evolvent.co/en",
      portalLabel: "Official site",
      linkLabel: "Visit site",
    },
    {
      name: "NVIDIA",
      mark: "NV",
      type: "infrastructure",
      typeLabel: "AI Systems",
      description: "Works across accelerated computing, foundation-model systems, inference, simulation, robotics, autonomous vehicles, and AI hardware.",
      focus: ["AI Systems", "CUDA", "Robotics", "AI Hardware"],
      locations: "North America · Europe · Israel · India · Taiwan · global offices",
      url: "https://www.nvidia.com/en-us/about-nvidia/careers/",
    },
    {
      name: "Scale AI",
      mark: "SCALE",
      type: "infrastructure",
      typeLabel: "AI Systems",
      description: "Builds data, evaluation, reinforcement-learning, and deployment infrastructure for frontier models and high-stakes applications.",
      focus: ["Data Engine", "RLHF", "Evaluation", "Applied AI"],
      locations: "San Francisco · New York · Washington DC · selected US offices",
      url: "https://scale.com/careers",
    },
    {
      name: "Waymo",
      mark: "WM",
      type: "embodied",
      typeLabel: "Embodied AI",
      description: "Autonomous-driving careers across AI foundations, perception, simulation, planning, ML platforms, hardware, and safety.",
      focus: ["Autonomy", "AI Foundations", "Simulation", "Hardware"],
      locations: "Bay Area · Phoenix · Los Angeles · Austin · selected US offices",
      url: "https://careers.withwaymo.com/",
    },
    {
      name: "Tesla AI & Robotics",
      mark: "TSLA",
      type: "embodied",
      typeLabel: "Embodied AI",
      description: "Live roles across Optimus, self-driving, world models, reinforcement learning, computer vision, inference, and AI hardware.",
      focus: ["Optimus", "Self-driving", "World Models", "AI Hardware"],
      locations: "Palo Alto · Austin · Fremont · selected global sites",
      url: "https://www.tesla.com/careers/search/?department=5",
    },
    {
      name: "Physical Intelligence",
      mark: "π",
      type: "embodied",
      typeLabel: "Embodied AI",
      description: "General-purpose robot foundation models with openings across VLA research, ML infrastructure, controls, robotics, and deployment.",
      focus: ["VLA", "Robot Learning", "ML Infrastructure", "Controls"],
      locations: "San Francisco · primarily on-site",
      url: "https://jobs.ashbyhq.com/physicalintelligence",
    },
    {
      name: "Figure AI",
      mark: "FIG",
      type: "embodied",
      typeLabel: "Embodied AI",
      description: "Humanoid robotics roles across Helix, perception, video pretraining, reinforcement learning, robot learning, and manufacturing.",
      focus: ["Helix", "Perception", "Robot Learning", "RL"],
      locations: "San Jose, California · primarily on-site",
      url: "https://www.figure.ai/careers",
    },
    {
      name: "ByteDance",
      mark: "BD",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Global technology hiring across foundation models, multimodal generation, recommendation, search, speech, and AI infrastructure.",
      focus: ["Foundation Models", "Multimodal", "Recommendation", "AI Systems"],
      locations: "China · Singapore · United States · Europe · global offices",
      url: "https://jobs.bytedance.com/en/position?category=6704215913488451847",
    },
    {
      name: "Alibaba Group",
      mark: "ALI",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "AI and cloud opportunities across Qwen, multimodal models, agents, search and recommendation, infrastructure, and applied research.",
      focus: ["Qwen", "Cloud AI", "Agents", "Search & Recommendation"],
      locations: "Hangzhou · Beijing · Shanghai · Shenzhen · global offices",
      url: "https://talent.alibaba.com/",
    },
    {
      name: "Tencent",
      mark: "TX",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Research and engineering across Hunyuan models, multimodal intelligence, AI infrastructure, games, advertising, and Tencent Cloud.",
      focus: ["Hunyuan", "Multimodal", "AI Infrastructure", "Cloud AI"],
      locations: "Shenzhen · Beijing · Shanghai · Guangzhou · global offices",
      url: "https://careers.tencent.com/",
    },
    {
      name: "Kuaishou · Kling AI",
      mark: "KL",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Kuaishou’s generative-media team develops Kling video and image models, with hiring across multimodal foundations, generation, graphics, and AI systems.",
      focus: ["Kling", "Video Generation", "Multimodal", "AI Systems"],
      locations: "Beijing · role-dependent across Kuaishou offices",
      url: "https://zhaopin.kuaishou.cn/",
    },
    {
      name: "Microsoft Research Asia",
      mark: "MSR",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Fundamental research across AI foundations and systems, spatial intelligence, human-centered AI, industry innovation, and AI for science.",
      focus: ["AI Foundations", "AI Systems", "Spatial Intelligence", "AI for Science"],
      locations: "Beijing · Shanghai · Singapore · Tokyo",
      url: "https://www.microsoft.com/en-us/research/lab/microsoft-research-asia/",
    },
    {
      name: "Ant Group",
      mark: "ANT",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Research and engineering across BaiLing foundation models, agent applications, AI infrastructure, trustworthy AI, and embodied intelligence.",
      focus: ["BaiLing", "AI Agents", "AI Infrastructure", "Trustworthy AI"],
      locations: "Hangzhou · Shanghai · Beijing · Shenzhen · role-dependent",
      url: "https://talent.antgroup.com/",
    },
    {
      name: "Shanghai AI Laboratory",
      mark: "SAI",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Public research laboratory recruiting for foundation models, physical intelligence, AI for science, trustworthy AI, evaluation, and computing platforms.",
      focus: ["Foundation Models", "Physical AI", "AI for Science", "Trustworthy AI"],
      locations: "Shanghai · Beijing",
      url: "https://www.shlab.org.cn/joinus",
    },
    {
      name: "Baidu",
      mark: "BDU",
      type: "china-asia",
      typeLabel: "China & Asia",
      description: "Current graduate and experienced hiring across ERNIE, multimodal models, agents, heterogeneous AI compute, search, and autonomous driving.",
      focus: ["ERNIE", "Multimodal", "Agents", "AI Compute"],
      locations: "Beijing · Shanghai · Shenzhen · Guangzhou · Hangzhou · Chengdu",
      url: "https://talent.baidu.com/jobs/list",
    },
  ];

  grid.innerHTML = companies
    .map(
      (company, index) => `
        <article class="foresight-career-card" data-career-type="${company.type}">
          <header>
            <span>${company.typeLabel}</span>
            <span>${company.portalLabel || "Official portal"}</span>
          </header>
          <div class="foresight-career-copy">
            <span aria-hidden="true">${company.mark}</span>
            <div>
              <small>${String(index + 1).padStart(2, "0")}</small>
              <h3>${company.name}</h3>
              <p>${company.description}</p>
            </div>
          </div>
          <div class="foresight-career-tags" aria-label="${company.name} current AI hiring areas">
            ${company.focus.map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="foresight-career-location">
            <small>Hiring footprint</small>
            <strong>${company.locations}</strong>
          </div>
          <footer>
            <span>Checked 01 Aug 2026</span>
            <a href="${company.url}" target="_blank" rel="noreferrer" aria-label="Open ${company.name} official portal">
              <span>${company.linkLabel || "Explore roles"}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </footer>
        </article>
      `,
    )
    .join("");

  const count = document.querySelector("[data-career-count]");
  const result = document.querySelector("[data-career-result]");
  const filterButtons = [...document.querySelectorAll("[data-career-filter]")];
  const cards = [...grid.querySelectorAll("[data-career-type]")];
  if (count) count.textContent = String(cards.length);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.careerFilter;
      filterButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });

      let visibleCount = 0;
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.careerType === filter;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (result) {
        const label = button.textContent.trim();
        const noun = visibleCount === 1 ? "portal" : "portals";
        result.textContent = label === "All"
          ? `Showing all ${visibleCount} verified career ${noun}.`
          : `Showing ${visibleCount} ${label} career ${noun}.`;
      }
    });
  });
}

function initConferenceTracker() {
  const grid = document.querySelector("[data-conference-grid]");
  if (!grid) return;

  const conferences = [
    {
      name: "AAAI",
      edition: "2027",
      fullName: "AAAI Conference on Artificial Intelligence",
      category: "ml",
      categoryLabel: "AI / ML",
      target: "2026-08-01T11:59:59Z",
      deadlineType: "Supplemental deadline",
      deadlineLabel: "31 Jul 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "Montréal · 16–23 Feb 2027",
      url: "https://aaai.org/conference/aaai/aaai-27/",
    },
    {
      name: "EMNLP",
      edition: "2026",
      fullName: "Empirical Methods in Natural Language Processing",
      category: "nlp",
      categoryLabel: "NLP",
      target: "2026-08-03T11:59:59Z",
      deadlineType: "ARR commitment",
      deadlineLabel: "02 Aug 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "Budapest · 24–29 Oct 2026",
      url: "https://2026.emnlp.org/",
    },
    {
      name: "EACL",
      edition: "2027",
      fullName: "European Chapter of the ACL",
      category: "nlp",
      categoryLabel: "NLP",
      target: "2026-08-04T11:59:59Z",
      deadlineType: "ARR submission",
      deadlineLabel: "03 Aug 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "Athens · 9–14 Mar 2027",
      url: "https://2027.eacl.org/",
    },
    {
      name: "3DV",
      edition: "2027",
      fullName: "International Conference on 3D Vision",
      category: "vision",
      categoryLabel: "Vision",
      target: "2026-08-28T18:00:00Z",
      deadlineType: "Paper deadline",
      deadlineLabel: "28 Aug 2026",
      timezone: "UTC−7",
      confidence: "official",
      venue: "Thessaloniki · 6–9 Apr 2027",
      url: "https://3dvconf.github.io/2027/call-for-papers/",
    },
    {
      name: "WACV",
      edition: "2027",
      fullName: "Winter Conference on Applications of Computer Vision",
      category: "vision",
      categoryLabel: "Vision",
      target: "2026-08-29T11:59:59Z",
      deadlineType: "Round 2 paper",
      deadlineLabel: "28 Aug 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "Florida · 4–8 Jan 2027",
      url: "https://wacv.thecvf.com/Conferences/2027/CallForPapers",
    },
    {
      name: "ICRA",
      edition: "2027",
      fullName: "International Conference on Robotics and Automation",
      category: "robotics",
      categoryLabel: "Robotics",
      target: "2026-09-16T06:59:59Z",
      deadlineType: "Contributed paper",
      deadlineLabel: "15 Sep 2026",
      timezone: "UTC−7",
      confidence: "official",
      venue: "Seoul · 24–28 May 2027",
      url: "https://2027.ieee-icra.org/announcements/call-for-technical-papers/",
    },
    {
      name: "MMSys",
      edition: "2027",
      fullName: "ACM International Conference on Multimedia Systems",
      category: "systems",
      categoryLabel: "Multimedia Systems",
      target: "2026-09-18T11:59:59Z",
      deadlineType: "Research paper",
      deadlineLabel: "17 Sep 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "Ghent · 30 Mar–2 Apr 2027",
      url: "https://2027.acmmmsys.org/deadlines.html",
    },
    {
      name: "ICLR",
      edition: "2027",
      fullName: "International Conference on Learning Representations",
      category: "ml",
      categoryLabel: "Machine Learning",
      target: "2026-09-26T11:59:59Z",
      deadlineType: "Paper deadline",
      deadlineLabel: "25 Sep 2026",
      timezone: "AoE",
      confidence: "tracked",
      venue: "San Francisco · Dates TBA",
      url: "https://iclr.cc/Conferences/2027",
    },
    {
      name: "AISTATS",
      edition: "2027",
      fullName: "Artificial Intelligence and Statistics",
      category: "ml",
      categoryLabel: "Machine Learning",
      target: "2026-10-02T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "01 Oct 2026",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Montréal · Dates TBA",
      url: "https://virtual.aistats.org/",
    },
    {
      name: "WWW",
      edition: "2027",
      fullName: "The Web Conference",
      category: "web",
      categoryLabel: "Web",
      target: "2026-10-08T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "07 Oct 2026",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.thewebconf.org/",
    },
    {
      name: "NAACL",
      edition: "2027",
      fullName: "Nations of the Americas Chapter of the ACL",
      category: "nlp",
      categoryLabel: "NLP",
      target: "2026-10-13T11:59:59Z",
      deadlineType: "ARR submission",
      deadlineLabel: "12 Oct 2026",
      timezone: "AoE",
      confidence: "official",
      venue: "San Francisco · 1–5 Jun 2027",
      url: "https://2027.naacl.org/",
    },
    {
      name: "CVPR",
      edition: "2027",
      fullName: "Computer Vision and Pattern Recognition",
      category: "vision",
      categoryLabel: "Vision",
      target: "2026-11-13T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "12 Nov 2026",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://cvpr.thecvf.com/",
    },
    {
      name: "ACL",
      edition: "2027",
      fullName: "Annual Meeting of the ACL",
      category: "nlp",
      categoryLabel: "NLP",
      target: "2027-01-11T11:59:59Z",
      deadlineType: "Estimated ARR cycle",
      deadlineLabel: "10 Jan 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Kyoto · 17–22 Aug 2027",
      url: "https://2027.aclweb.org/",
    },
    {
      name: "IJCAI",
      edition: "2027",
      fullName: "International Joint Conference on Artificial Intelligence",
      category: "ml",
      categoryLabel: "AI / ML",
      target: "2027-01-20T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "19 Jan 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.ijcai.org/",
    },
    {
      name: "SIGGRAPH",
      edition: "2027",
      fullName: "ACM SIGGRAPH Annual Conference",
      category: "graphics",
      categoryLabel: "Graphics",
      target: "2027-01-21T22:00:00Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "21 Jan 2027",
      timezone: "UTC",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.siggraph.org/",
    },
    {
      name: "ICML",
      edition: "2027",
      fullName: "International Conference on Machine Learning",
      category: "ml",
      categoryLabel: "Machine Learning",
      target: "2027-01-29T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "28 Jan 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://icml.cc/",
    },
    {
      name: "RSS",
      edition: "2027",
      fullName: "Robotics: Science and Systems",
      category: "robotics",
      categoryLabel: "Robotics",
      target: "2027-01-30T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "29 Jan 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://roboticsconference.org/",
    },
    {
      name: "UAI",
      edition: "2027",
      fullName: "Conference on Uncertainty in Artificial Intelligence",
      category: "ml",
      categoryLabel: "AI / ML",
      target: "2027-02-26T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "25 Feb 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.auai.org/",
    },
    {
      name: "IROS",
      edition: "2027",
      fullName: "Intelligent Robots and Systems",
      category: "robotics",
      categoryLabel: "Robotics",
      target: "2027-03-02T07:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "01 Mar 2027",
      timezone: "UTC−8",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.ieee-ras.org/conferences-workshops/financially-co-sponsored/iros",
    },
    {
      name: "ICCV",
      edition: "2027",
      fullName: "International Conference on Computer Vision",
      category: "vision",
      categoryLabel: "Vision",
      target: "2027-03-08T09:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "08 Mar 2027",
      timezone: "UTC",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://iccv.thecvf.com/",
    },
    {
      name: "COLM",
      edition: "2027",
      fullName: "Conference on Language Modeling",
      category: "nlp",
      categoryLabel: "NLP",
      target: "2027-04-01T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "31 Mar 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://colmweb.org/",
    },
    {
      name: "ACM MM",
      edition: "2027",
      fullName: "ACM International Conference on Multimedia",
      category: "graphics",
      categoryLabel: "Multimedia",
      target: "2027-04-02T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "01 Apr 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Hong Kong · Dates TBA",
      url: "https://www.acmmm.org/",
    },
    {
      name: "NeurIPS",
      edition: "2027",
      fullName: "Neural Information Processing Systems",
      category: "ml",
      categoryLabel: "Machine Learning",
      target: "2027-05-07T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "06 May 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://neurips.cc/",
    },
    {
      name: "SIGGRAPH Asia",
      edition: "2027",
      fullName: "ACM SIGGRAPH Conference in Asia",
      category: "graphics",
      categoryLabel: "Graphics",
      target: "2027-05-21T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "20 May 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://asia.siggraph.org/",
    },
    {
      name: "CoRL",
      edition: "2027",
      fullName: "Conference on Robot Learning",
      category: "robotics",
      categoryLabel: "Robotics",
      target: "2027-05-28T11:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "27 May 2027",
      timezone: "AoE",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://www.corl.org/",
    },
    {
      name: "BMVC",
      edition: "2027",
      fullName: "British Machine Vision Conference",
      category: "vision",
      categoryLabel: "Vision",
      target: "2027-05-28T23:59:59Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "28 May 2027",
      timezone: "UTC",
      confidence: "estimated",
      venue: "Next edition · Details TBA",
      url: "https://britishmachinevisionassociation.github.io/bmvc",
    },
    {
      name: "ECCV",
      edition: "2028",
      fullName: "European Conference on Computer Vision",
      category: "vision",
      categoryLabel: "Vision",
      target: "2028-03-02T22:00:00Z",
      deadlineType: "Estimated paper",
      deadlineLabel: "02 Mar 2028",
      timezone: "UTC−8",
      confidence: "estimated",
      venue: "Biennial · Next edition TBA",
      url: "https://eccv.ecva.net/",
    },
  ];

  const now = Date.now();
  conferences.sort((a, b) => {
    const aTime = Date.parse(a.target);
    const bTime = Date.parse(b.target);
    const aPast = aTime <= now;
    const bPast = bTime <= now;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aTime - bTime;
  });

  const confidenceLabels = {
    official: "Official",
    tracked: "Tracked",
    estimated: "Estimated",
  };

  grid.innerHTML = conferences
    .map(
      (conference) => `
        <article
          class="foresight-conference-card"
          data-conference-category="${conference.category}"
          data-conference-deadline="${conference.target}"
          data-conference-confidence="${conference.confidence}"
        >
          <header>
            <span>${conference.categoryLabel}</span>
            <span class="foresight-countdown-source is-${conference.confidence}">${confidenceLabels[conference.confidence]}</span>
          </header>
          <div class="foresight-conference-name">
            <span>${conference.edition}</span>
            <h3>${conference.name}</h3>
            <p>${conference.fullName}</p>
          </div>
          <div class="foresight-live-countdown" aria-hidden="true">
            <span><strong data-countdown-days>000</strong><small>Days</small></span>
            <span><strong data-countdown-hours>00</strong><small>Hours</small></span>
            <span><strong data-countdown-minutes>00</strong><small>Mins</small></span>
            <span><strong data-countdown-seconds>00</strong><small>Secs</small></span>
          </div>
          <div class="foresight-conference-deadline">
            <div>
              <small>${conference.deadlineType}</small>
              <strong>${conference.deadlineLabel} · ${conference.timezone}</strong>
            </div>
            <span data-countdown-state>Calculating</span>
          </div>
          <footer>
            <span>${conference.venue}</span>
            <a href="${conference.url}" target="_blank" rel="noreferrer" aria-label="Open ${conference.name} ${conference.edition} official website">
              <span>Official site</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </footer>
        </article>
      `,
    )
    .join("");

  const count = document.querySelector("[data-conference-count]");
  const result = document.querySelector("[data-conference-result]");
  const filterButtons = [...document.querySelectorAll("[data-conference-filter]")];
  const cards = [...grid.querySelectorAll("[data-conference-category]")];
  if (count) count.textContent = String(cards.length);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.conferenceFilter;
      filterButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });

      let visibleCount = 0;
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.conferenceCategory === filter;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (result) {
        const label = button.textContent.trim();
        const conferenceNoun = visibleCount === 1 ? "conference" : "conferences";
        const categoryLabel = label === "All" ? "tracked " : `${label} `;
        result.textContent = `Showing ${visibleCount} ${categoryLabel}${conferenceNoun}.`;
      }
    });
  });

  const pad = (value, length = 2) => String(value).padStart(length, "0");
  const updateCountdowns = () => {
    const currentTime = Date.now();
    cards.forEach((card) => {
      const deadline = Date.parse(card.dataset.conferenceDeadline);
      const remaining = Math.max(0, deadline - currentTime);
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      card.querySelector("[data-countdown-days]").textContent = pad(days, 3);
      card.querySelector("[data-countdown-hours]").textContent = pad(hours);
      card.querySelector("[data-countdown-minutes]").textContent = pad(minutes);
      card.querySelector("[data-countdown-seconds]").textContent = pad(seconds);

      const state = card.querySelector("[data-countdown-state]");
      const isClosed = deadline <= currentTime;
      const isUrgent = !isClosed && remaining <= 7 * 86400000;
      const isSoon = !isClosed && remaining <= 30 * 86400000;
      card.classList.toggle("is-closed", isClosed);
      card.classList.toggle("is-urgent", isUrgent);
      card.classList.toggle("is-soon", isSoon && !isUrgent);
      state.textContent = isClosed ? "Closed" : isUrgent ? "Closing soon" : isSoon ? "Within 30 days" : "Counting down";
    });
  };

  updateCountdowns();
  window.setInterval(updateCountdowns, 1000);
}

function initWorkshopTracker() {
  const list = document.querySelector("[data-workshop-list]");
  if (!list) return;

  const workshops = [
    {
      shortName: "3DWM",
      name: "3D in the Era of World Models",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["world-models", "vision"],
      topicLabels: ["World Models", "Computer Vision"],
      description: "Explicit 3D structure, spatial intelligence, video generation, and physical reasoning for scalable world models.",
      institutions: "UT Austin · Stanford · Adobe · Google DeepMind · NVIDIA",
      organizers: "Qixing Huang · Leonidas Guibas · Kalyan Sunkavalli · Zhengqi Li",
      deadline: "2026-08-16T11:59:59Z",
      program: "2026-09-09T07:00:00Z",
      timeline: [
        { label: "Submission", value: "15 Aug 2026 · AoE" },
        { label: "Notification", value: "24 Aug 2026" },
        { label: "Workshop", value: "09 Sep 2026" },
      ],
      format: "Non-archival · OpenReview · full day",
      url: "https://eccv2026-3d-world-models.github.io/",
    },
    {
      shortName: "WM–PAI",
      name: "World Models in Physical AI",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["world-models", "vision", "agents", "embodied"],
      topicLabels: ["World Models", "Computer Vision", "Agents", "Embodied AI"],
      description: "Physically grounded world models for robotics, autonomous driving, generative simulation, planning, and control.",
      institutions: "NVIDIA · UT Austin",
      organizers: "Jenny Schmalfuss · German Ros · Roberto Martín-Martín · Jose M. Alvarez",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-12T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "29 Sep 2026" },
        { label: "Workshop", value: "12 / 13 Dec 2026" },
      ],
      format: "Non-archival · OpenReview · one day",
      url: "https://www.worldmodels-physicalai.com/",
    },
    {
      shortName: "PTA",
      name: "From Pretrained Representations to Acting Agents",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["agents", "world-models", "multimodal", "embodied"],
      topicLabels: ["Agents", "World Models", "Multimodal AI", "Embodied AI"],
      description: "Connects multimodal pretraining and world representations to planning, control, and reliable sequential decision making.",
      institutions: "Google DeepMind · Georgia Tech · TU Darmstadt · UW / NVIDIA",
      organizers: "Kuang-Huei Lee · Bo Dai · Georgia Chalvatzaki · Karen Leung",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-11T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "29 Sep 2026" },
        { label: "Workshop", value: "11 / 12 Dec 2026" },
      ],
      format: "NeurIPS format · OpenReview · full day",
      url: "https://ptaworkshop.github.io/",
    },
    {
      shortName: "OD–Agents",
      name: "Efficient and On-Device AI Agents",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["agents", "efficient"],
      topicLabels: ["Agents", "Efficient AI"],
      description: "Efficient architectures, local reasoning, privacy, and multi-agent coordination on mobile and edge hardware.",
      institutions: "Qualcomm AI Research · IBM Research · SJTU · Tsinghua",
      organizers: "Davide Belli · Asim Munawar · Weiwen Liu · Yuanchun Li",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-11T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "26 Sep 2026" },
        { label: "Workshop", value: "11 / 12 Dec 2026" },
      ],
      format: "Non-archival · OpenReview · full day",
      url: "https://efficient-ondevice-ai-agents.github.io/",
    },
    {
      shortName: "RTCA",
      name: "Real-Time Conversational Agents",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["multimodal", "agents"],
      topicLabels: ["Multimodal AI", "Agents"],
      description: "Streaming speech, video, language, avatars, and tool use for natural low-latency multimodal interaction.",
      institutions: "Tavus · King’s College London · QMUL · University of Verona",
      organizers: "Niki Foteinopoulou · Oya Celiktutan · Cigdem Beyan · Ioannis Patras",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-11T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "29 Sep 2026" },
        { label: "Workshop", value: "11 / 12 Dec 2026" },
      ],
      format: "Non-archival · papers + demos · full day",
      url: "https://rtcaneurips26.github.io/",
    },
    {
      shortName: "MMDA",
      name: "Multimodal Digital Agents",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["multimodal", "vision", "agents"],
      topicLabels: ["Multimodal AI", "Computer Vision", "Agents"],
      description: "Vision-centric agents that perceive, reason, and act across web, desktop, and mobile interfaces.",
      institutions: "Ai2 · University of Washington",
      organizers: "Ranjay Krishna · Tanmay Gupta · Piper Wolters · Yue Yang",
      deadline: "2026-07-30T11:59:59Z",
      program: "2026-09-08T07:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Jul 2026 · AoE" },
        { label: "Program", value: "Full day" },
        { label: "Workshop", value: "08 Sep 2026" },
      ],
      format: "Non-archival · full papers + abstracts",
      url: "https://mda-workshop.allen.ai/",
    },
    {
      shortName: "WMEAI",
      name: "How to Build Effective World Models for Embodied AI",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["world-models", "multimodal", "vision", "agents", "embodied"],
      topicLabels: ["World Models", "Multimodal AI", "Computer Vision", "Agents", "Embodied AI"],
      description: "World-model design, multimodal training, physical representation learning, evaluation, planning, and sim-to-real transfer.",
      institutions: "Meta · Noah’s Ark Lab · Université de Montréal · Waterloo",
      organizers: "Amir Rasouli · Mahmoud Assran · Liam Paull · Krzysztof Czarnecki",
      deadline: "2026-07-28T11:59:59Z",
      program: "2026-09-09T07:00:00Z",
      timeline: [
        { label: "Submission", value: "27 Jul 2026 · AoE" },
        { label: "Notification", value: "07 Aug 2026" },
        { label: "Workshop", value: "09 Sep 2026" },
      ],
      format: "Archival + non-archival · OpenReview",
      url: "https://eccv26wmeai.github.io/",
    },
    {
      shortName: "RLW",
      name: "8th Robot Learning Workshop: Is Physical AI Going Zero-Shot?",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["embodied", "agents", "world-models", "multimodal"],
      topicLabels: ["Embodied AI", "Agents", "World Models", "Multimodal AI"],
      description: "Zero-shot physical intelligence, vision-language-action policies, cross-embodiment generalization, robot data, and safe deployment.",
      institutions: "Microsoft Research · Google DeepMind · TU Dresden · NVIDIA",
      organizers: "Andrey Kolobov · Alex Bewley · Roberto Calandra · Moritz Reuss",
      deadline: "2026-08-23T11:59:59Z",
      program: "2026-12-11T00:00:00Z",
      timeline: [
        { label: "Submission", value: "22 Aug 2026 · AoE" },
        { label: "Notification", value: "29 Sep 2026" },
        { label: "Workshop", value: "NeurIPS · Sydney" },
      ],
      format: "8th edition · non-archival · papers + demos",
      url: "https://www.robot-learning.ml/2026/",
    },
    {
      shortName: "X–REASON",
      name: "Visual Perception and Reasoning in the Interactable World",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["embodied", "vision", "multimodal", "agents"],
      topicLabels: ["Embodied AI", "Computer Vision", "Multimodal AI", "Agents"],
      description: "Actionable 3D representations, active perception, spatial reasoning, and multimodal fusion for navigation and manipulation.",
      institutions: "Stanford · UC Berkeley · MIT · Toyota Research Institute",
      organizers: "Jitendra Malik · Leonidas Guibas · Katie Z. Luo · Vitor Guizilini",
      deadline: "2026-08-05T00:00:00Z",
      program: "2026-09-08T07:00:00Z",
      timeline: [
        { label: "Submission", value: "04 Aug 2026 · 12:00 AoE" },
        { label: "Notification", value: "19 Aug 2026" },
        { label: "Workshop", value: "08 Sep 2026" },
      ],
      format: "Non-archival · OpenReview · full day",
      url: "https://xreason-workshop.github.io/",
    },
    {
      shortName: "EMR",
      name: "Embodied Multimodal Reasoning in Physical Environments",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["embodied", "multimodal", "vision", "agents"],
      topicLabels: ["Embodied AI", "Multimodal AI", "Computer Vision", "Agents"],
      description: "Robot-centric sensing, physically grounded reasoning, interaction, navigation, manipulation, and long-horizon planning.",
      institutions: "Google / TUM · Naver Labs Europe · A*STAR · University of Adelaide",
      organizers: "Federico Tombari · Christian Wolf · Shijie Li · Qi Wu",
      deadline: "2026-07-20T11:59:59Z",
      program: "2026-09-09T07:00:00Z",
      timeline: [
        { label: "Full paper", value: "19 Jul 2026 · AoE" },
        { label: "Abstract", value: "24 Jul 2026 · AoE" },
        { label: "Workshop", value: "09 Sep 2026" },
      ],
      format: "Archival + non-archival · OpenReview · challenge",
      url: "https://emr-workshop.github.io/",
    },
    {
      shortName: "ODI",
      name: "On-Device Intelligence: Foundation Models under Real-World Constraints",
      host: "NeurIPS 2026",
      location: "Sydney, Australia",
      topics: ["efficient", "embodied", "multimodal"],
      topicLabels: ["Efficient AI", "Embodied AI", "Multimodal AI"],
      description: "Algorithms, systems, hardware, adaptation, and reliability for foundation models operating beyond the cloud.",
      institutions: "ETH Zurich · MPI-IS · MIT · ELLIS Institute Tübingen",
      organizers: "Niao He · Daniela Rus · Michael Muehlebach · Melanie Zeilinger",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-11T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "29 Sep 2026" },
        { label: "Workshop", value: "11 / 12 Dec 2026" },
      ],
      format: "OpenReview · talks + posters + panel",
      url: "https://odi2026.github.io/",
    },
    {
      shortName: "CoDA",
      name: "Closed-Loop Co-Design for Efficient Agentic AI",
      host: "NeurIPS 2026",
      location: "Sydney · Paris · Atlanta",
      topics: ["efficient", "agents"],
      topicLabels: ["Efficient AI", "Agents"],
      description: "Model, runtime, compiler, memory, and hardware co-design for persistent agents, plus agents that optimize AI systems.",
      institutions: "AMD · NVIDIA · Alibaba · Huawei Noah’s Ark Lab",
      organizers: "Vikram Appia · Mohammadmahdi Kamani · Niyu Ge · Boxing Chen",
      deadline: "2026-08-30T11:59:59Z",
      program: "2026-12-12T00:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Aug 2026 · AoE" },
        { label: "Notification", value: "22 Sep 2026" },
        { label: "Workshop", value: "12 / 13 Dec 2026" },
      ],
      format: "Non-archival · papers + demos + benchmarks",
      url: "https://coda-neurips2026.github.io/",
    },
    {
      shortName: "CDEL",
      name: "Curated Data for Efficient Learning",
      host: "ECCV 2026",
      location: "Malmö, Sweden",
      topics: ["efficient"],
      topicLabels: ["Efficient AI"],
      description: "Dataset pruning, distillation, synthetic data, and sampling strategies that reduce training cost without discarding signal.",
      institutions: "MIT · Princeton · NUS · Carnegie Mellon",
      organizers: "George Cazenavette · Xindi Wu · Jun-Yan Zhu · Kai Wang",
      deadline: "2026-07-30T11:59:59Z",
      program: "2026-09-09T07:00:00Z",
      timeline: [
        { label: "Submission", value: "29 Jul 2026 · AoE" },
        { label: "Notification", value: "07 Aug 2026" },
        { label: "Workshop", value: "09 Sep 2026" },
      ],
      format: "2nd edition · archival + non-archival · OpenReview",
      url: "https://curateddata.github.io/",
    },
  ];

  list.innerHTML = workshops
    .map(
      (workshop) => `
        <article
          class="foresight-workshop-card"
          data-workshop-topics="${workshop.topics.join(" ")}"
          data-workshop-deadline="${workshop.deadline}"
          data-workshop-program="${workshop.program}"
        >
          <header>
            <div>
              <span>${workshop.host}</span>
              <small>${workshop.location}</small>
            </div>
            <span class="foresight-workshop-status" data-workshop-status>Checking timeline</span>
          </header>
          <div class="foresight-workshop-copy">
            <span>${workshop.shortName}</span>
            <div>
              <div class="foresight-workshop-tags">${workshop.topicLabels.map((topic) => `<span>${topic}</span>`).join("")}</div>
              <h3>${workshop.name}</h3>
              <p>${workshop.description}</p>
            </div>
          </div>
          <div class="foresight-workshop-organizers">
            <small>Organizer signal</small>
            <strong>${workshop.institutions}</strong>
            <span>${workshop.organizers}</span>
          </div>
          <div class="foresight-workshop-timeline" aria-label="${workshop.name} timeline">
            ${workshop.timeline
              .map(
                (item, index) => `
                  <div>
                    <span>0${index + 1}</span>
                    <small>${item.label}</small>
                    <strong>${item.value}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
          <footer>
            <span>${workshop.format}</span>
            <a href="${workshop.url}" target="_blank" rel="noreferrer" aria-label="Open ${workshop.name} official website">
              <span>Official site</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </footer>
        </article>
      `,
    )
    .join("");

  const count = document.querySelector("[data-workshop-count]");
  const result = document.querySelector("[data-workshop-result]");
  const filterButtons = [...document.querySelectorAll("[data-workshop-filter]")];
  const cards = [...list.querySelectorAll("[data-workshop-topics]")];
  if (count) count.textContent = String(cards.length);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.workshopFilter;
      filterButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });

      let visibleCount = 0;
      cards.forEach((card) => {
        const visible = filter === "all" || card.dataset.workshopTopics.split(" ").includes(filter);
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (result) {
        const label = button.textContent.trim();
        const workshopNoun = visibleCount === 1 ? "workshop" : "workshops";
        const topicLabel = label === "All" ? "vetted " : `${label} `;
        result.textContent = `Showing ${visibleCount} ${topicLabel}${workshopNoun}.`;
      }
    });
  });

  const updateWorkshopStatus = () => {
    const currentTime = Date.now();
    cards.forEach((card) => {
      const deadline = Date.parse(card.dataset.workshopDeadline);
      const program = Date.parse(card.dataset.workshopProgram);
      const status = card.querySelector("[data-workshop-status]");
      const isOpen = deadline > currentTime;
      const isUpcoming = !isOpen && program > currentTime;
      card.classList.toggle("is-open", isOpen);
      card.classList.toggle("is-program-upcoming", isUpcoming);
      card.classList.toggle("is-complete", !isOpen && !isUpcoming);

      if (isOpen) {
        const days = Math.max(1, Math.ceil((deadline - currentTime) / 86400000));
        status.textContent = `${days} ${days === 1 ? "day" : "days"} to submit`;
      } else if (isUpcoming) {
        const days = Math.max(1, Math.ceil((program - currentTime) / 86400000));
        status.textContent = `Program in ${days} ${days === 1 ? "day" : "days"}`;
      } else {
        status.textContent = "Completed";
      }
    });
  };

  updateWorkshopStatus();
  window.setInterval(updateWorkshopStatus, 60000);
}

function initSiteReveals() {
  const revealSelectors = [
    ".statement > *",
    ".metric-strip > *",
    ".section-head > *",
    ".preview-card",
    ".home-system-copy",
    ".home-system-flow article",
    ".resources-band > *",
    ".research-focus-head > *",
    ".research-focus-card",
    ".research-method-copy",
    ".research-loop-list > div",
    ".publication-section-head > *",
    ".publication-featured-card",
    ".publication-index-row",
    ".resource-section-head > *",
    ".resource-type-card",
    ".worldfoundry-panel",
    ".release-workflow-copy",
    ".release-steps > div",
    ".release-standards-grid > div",
    ".team-title-block > *",
    ".team-member",
    ".news-feed-head > *",
    ".news-month",
    "[data-foresight-reveal]",
  ];
  const revealItems = [...document.querySelectorAll(revealSelectors.join(","))].filter(
    (item) => !item.hasAttribute("data-join-reveal"),
  );

  if (!revealItems.length) return;

  revealItems.forEach((item, index) => {
    item.setAttribute("data-site-reveal", "");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 45}ms`);
  });
  document.documentElement.classList.add("motion-ready");

  const revealEverything = () => {
    revealItems.forEach((item) => item.classList.add("is-site-visible"));
  };

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealEverything();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-site-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -7%", threshold: 0.08 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function animateNewsMonth(month, list, shouldOpen) {
  if (reduceMotion.matches) {
    setNewsMonthState(month, shouldOpen);
    resetNewsMonthList(list);
    return;
  }

  list.getAnimations().forEach((animation) => animation.cancel());
  month.dataset.animating = "true";
  month.classList.add("is-animating");

  if (shouldOpen) {
    setNewsMonthState(month, true);
    const targetHeight = list.scrollHeight;
    runNewsMonthAnimation(month, list, true, 0, targetHeight);
    return;
  }

  runNewsMonthAnimation(month, list, false, list.offsetHeight, 0);
}

function runNewsMonthAnimation(month, list, shouldStayOpen, fromHeight, toHeight) {
  const duration = Math.max(820, Math.min(1200, Math.round(Math.max(fromHeight, toHeight) * 1.8)));
  list.style.height = `${fromHeight}px`;
  list.style.opacity = shouldStayOpen ? "0" : "1";
  list.style.transform = shouldStayOpen ? "translateY(-10px)" : "translateY(0)";

  const animation = list.animate(
    [
      {
        height: `${fromHeight}px`,
        opacity: shouldStayOpen ? 0 : 1,
        transform: shouldStayOpen ? "translateY(-10px)" : "translateY(0)",
      },
      {
        height: `${toHeight}px`,
        opacity: shouldStayOpen ? 1 : 0,
        transform: shouldStayOpen ? "translateY(0)" : "translateY(-10px)",
      },
    ],
    {
      duration,
      easing: "cubic-bezier(0.33, 0, 0.2, 1)",
      fill: "forwards",
    },
  );

  animation.finished
    .then(() => {
      setNewsMonthState(month, shouldStayOpen);
      delete month.dataset.animating;
      month.classList.remove("is-animating");
      resetNewsMonthList(list);
    })
    .catch(() => {
      delete month.dataset.animating;
      month.classList.remove("is-animating");
      resetNewsMonthList(list);
    });
}

function resetNewsMonthList(list) {
  list.style.height = "";
  list.style.opacity = "";
  list.style.transform = "";
}

function setNewsMonthState(month, isOpen) {
  month.classList.toggle("is-open", isOpen);
  const summary = month.querySelector(".news-month-summary");
  if (summary) summary.setAttribute("aria-expanded", String(isOpen));
}

function restartStars() {
  stopStars();
  startStars();
}

function startStars() {
  resizeStars();
  seedStars();
  drawStarScene(0);
  if (!reduceMotion.matches) {
    animationFrame = window.requestAnimationFrame(animateStars);
  }
}

function stopStars() {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function resizeStars() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function seedStars() {
  const fieldStarCount = Math.max(90, Math.min(240, Math.round(width * height * 0.00013)));
  const galaxyStarCount = Math.max(260, Math.min(760, Math.round(width * height * 0.00042)));
  const bandWidth = getGalaxyBandWidth();

  const fieldStars = Array.from({ length: fieldStarCount }, (_, index) => ({
    band: false,
    x: Math.random() * width,
    y: Math.random() * height * 0.94,
    r: index % 31 === 0 ? 1.55 + Math.random() * 0.8 : 0.22 + Math.random() * 0.88,
    a: 0.18 + Math.random() * 0.58,
    twinkle: 0.34 + Math.random() * 1.34,
    drift: 0.004 + Math.random() * 0.018,
    depth: 0.38 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    halo: index % 27 === 0,
    tint: ["255,255,255", "213,229,255", "255,228,190", "198,214,255"][index % 4],
  }));

  const galaxyStars = Array.from({ length: galaxyStarCount }, (_, index) => {
    const u = (Math.random() - 0.5) * width * 1.62;
    const laneOffset = Math.sin(u * 0.006) * bandWidth * 0.14;
    const v = bellRandom() * bandWidth * (0.42 + Math.random() * 0.86);
    const lane = Math.abs(v - laneOffset) < bandWidth * 0.09 && Math.random() > 0.28;
    const core = 1 - Math.min(1, Math.abs(v) / (bandWidth * 1.32));
    const point = projectGalaxyPoint(u, v);

    return {
      band: true,
      x: point.x,
      y: point.y,
      r: 0.18 + Math.random() * 0.74 + core * 0.28,
      a: lane ? 0.04 + core * 0.1 : 0.14 + core * 0.6 + Math.random() * 0.16,
      twinkle: 0.18 + Math.random() * 0.82,
      drift: 0.012 + Math.random() * 0.026,
      depth: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      halo: core > 0.62 && index % 34 === 0,
      tint: ["255,248,224", "225,235,255", "181,204,255", "246,198,224", "149,180,255"][index % 5],
    };
  });

  stars = [...fieldStars, ...galaxyStars];
}

function animateStars(time) {
  drawStarScene(time * 0.001);
  animationFrame = window.requestAnimationFrame(animateStars);
}

function drawStarScene(t) {
  ctx.clearRect(0, 0, width, height);
  drawStars(t);
}

function drawStars(t) {
  stars.forEach((star, index) => {
    let x = star.x;
    let y = star.y;

    if (star.band) {
      const basis = getGalaxyBasis();
      const driftAlong = Math.sin(t * star.drift + star.phase) * star.depth * 5.6;
      const driftAcross = Math.cos(t * star.drift * 0.7 + star.phase) * star.depth * 1.8;
      x += driftAlong * basis.cos - driftAcross * basis.sin;
      y += driftAlong * basis.sin + driftAcross * basis.cos;
    } else {
      star.x += star.drift * star.depth;
      if (star.x > width + 8) star.x = -8;
      x = star.x;
      y += Math.sin(t * 0.16 + star.phase + index) * star.depth * 1.3;
    }

    const alpha = star.a * (0.72 + Math.sin(t * star.twinkle + star.phase + index) * 0.22);

    if (star.halo) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, star.r * 7);
      glow.addColorStop(0, `rgba(${star.tint}, ${alpha * 0.22})`);
      glow.addColorStop(1, `rgba(${star.tint}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, star.r * 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();

    if (star.r > 1.45 || star.halo) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${star.tint}, ${alpha * 0.22})`;
      ctx.lineWidth = 1;
      ctx.moveTo(x - star.r * 3.5, y);
      ctx.lineTo(x + star.r * 3.5, y);
      ctx.moveTo(x, y - star.r * 3.5);
      ctx.lineTo(x, y + star.r * 3.5);
      ctx.stroke();
    }
  });
}

function bellRandom() {
  return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
}

function getGalaxyAngle() {
  return width < 640 ? -0.72 : -0.5;
}

function getGalaxyBandWidth() {
  return Math.max(120, Math.min(260, height * (width < 640 ? 0.23 : 0.19)));
}

function getGalaxyBasis() {
  const angle = getGalaxyAngle();
  return {
    cos: Math.cos(angle),
    sin: Math.sin(angle),
  };
}

function projectGalaxyPoint(u, v) {
  const basis = getGalaxyBasis();
  const centerX = width * (width < 640 ? 0.61 : 0.64);
  const centerY = height * (width < 640 ? 0.58 : 0.46);

  return {
    x: centerX + u * basis.cos - v * basis.sin,
    y: centerY + u * basis.sin + v * basis.cos,
  };
}

const collaborationMap = document.getElementById("collab-map");

if (collaborationMap) {
  initCollaborationMap();
}

function initCollaborationMap() {
  const nameEl = document.querySelector("[data-partner-name]");
  const locationEl = document.querySelector("[data-partner-location]");
  const descriptionEl = document.querySelector("[data-partner-description]");
  const filterButtons = [...document.querySelectorAll("[data-map-filter]")];
  const logoCards = [...document.querySelectorAll(".partner-logo-card[data-region]")];

  if (!nameEl || !locationEl || !descriptionEl) return;

  const locations = [
    {
      id: "hong-kong",
      city: "Hong Kong SAR",
      region: "hong-kong",
      lat: 22.3193,
      lng: 114.1694,
      partners: ["HKU", "CUHK", "HKUST"],
      description: "Academic collaborators in Hong Kong SAR.",
    },
    {
      id: "beijing",
      city: "Beijing",
      region: "mainland-china",
      lat: 39.9042,
      lng: 116.4074,
      partners: ["PKU", "THU", "ByteDance Seed"],
      description: "University and industry collaborators in Beijing.",
    },
    {
      id: "hangzhou",
      city: "Hangzhou",
      region: "mainland-china",
      lat: 30.2741,
      lng: 120.1551,
      partners: ["ZJU", "Qwen"],
      description: "Academic and industry collaborators in Hangzhou.",
    },
    {
      id: "shanghai",
      city: "Shanghai",
      region: "mainland-china",
      lat: 31.2304,
      lng: 121.4737,
      partners: ["SJTU"],
      description: "Academic collaborator in Shanghai.",
    },
    {
      id: "guangzhou",
      city: "Guangzhou",
      region: "mainland-china",
      lat: 23.1291,
      lng: 113.2644,
      partners: ["HKUST(GZ)"],
      description: "Academic collaborator in Guangzhou.",
    },
    {
      id: "shenzhen",
      city: "Shenzhen",
      region: "mainland-china",
      lat: 22.5431,
      lng: 114.0579,
      partners: ["CUHK(SZ)", "Tencent Hunyuan"],
      description: "Academic and industry collaborators in Shenzhen.",
    },
    {
      id: "princeton",
      city: "Princeton, NJ",
      region: "united-states",
      lat: 40.3431,
      lng: -74.6551,
      partners: ["PrincetonU"],
      description: "Academic collaborator in Princeton.",
    },
    {
      id: "pittsburgh",
      city: "Pittsburgh, PA",
      region: "united-states",
      lat: 40.4406,
      lng: -79.9959,
      partners: ["CMU"],
      description: "Academic collaborator in Pittsburgh.",
    },
    {
      id: "san-diego",
      city: "San Diego, CA",
      region: "united-states",
      lat: 32.8801,
      lng: -117.234,
      partners: ["UCSD"],
      description: "Academic collaborator in San Diego.",
    },
    {
      id: "champaign",
      city: "Urbana-Champaign, IL",
      region: "united-states",
      lat: 40.102,
      lng: -88.2272,
      partners: ["UIUC"],
      description: "Academic collaborator in Urbana-Champaign.",
    },
    {
      id: "new-york",
      city: "New York, NY",
      region: "united-states",
      lat: 40.73,
      lng: -73.995,
      partners: ["NYU"],
      description: "Academic collaborator in New York.",
    },
    {
      id: "evanston",
      city: "Evanston, IL",
      region: "united-states",
      lat: 42.0565,
      lng: -87.6753,
      partners: ["Northwestern"],
      description: "Academic collaborator in Evanston.",
    },
    {
      id: "new-haven",
      city: "New Haven, CT",
      region: "united-states",
      lat: 41.3163,
      lng: -72.9223,
      partners: ["Yale"],
      description: "Academic collaborator in New Haven.",
    },
    {
      id: "san-jose",
      city: "San Jose, CA",
      region: "united-states",
      lat: 37.3382,
      lng: -121.8863,
      partners: ["Adobe"],
      description: "Industry collaborator in California.",
    },
    {
      id: "menlo-park",
      city: "Menlo Park, CA",
      region: "united-states",
      lat: 37.453,
      lng: -122.1817,
      partners: ["Meta"],
      description: "Industry collaborator in California.",
    },
    {
      id: "santa-clara",
      city: "Santa Clara, CA",
      region: "united-states",
      lat: 37.3541,
      lng: -121.9552,
      partners: ["Nvidia"],
      description: "Industry collaborator in California.",
    },
    {
      id: "oxford",
      city: "Oxford",
      region: "united-kingdom",
      lat: 51.752,
      lng: -1.2577,
      partners: ["Oxford"],
      description: "Academic collaborator in Oxford.",
    },
    {
      id: "singapore",
      city: "Singapore",
      region: "singapore",
      lat: 1.3521,
      lng: 103.8198,
      partners: ["NTU", "NUS"],
      description: "Academic collaborators in Singapore.",
    },
  ];

  const regionLabels = {
    all: "OpenEnvision Network",
    "hong-kong": "Hong Kong SAR",
    "mainland-china": "Mainland China",
    "united-states": "United States",
    "united-kingdom": "United Kingdom",
    singapore: "Singapore",
  };
  const regionBounds = {
    "hong-kong": {
      bounds: [
        [21.74, 113.72],
        [22.74, 114.55],
      ],
      zoom: 8.2,
    },
    "mainland-china": {
      bounds: [
        [20.8, 109.4],
        [41.8, 123.8],
      ],
      zoom: 4,
    },
    "united-states": {
      bounds: [
        [31.5, -124.8],
        [42.5, -72.1],
      ],
      zoom: 4,
    },
    "united-kingdom": {
      bounds: [
        [49.8, -8.6],
        [58.8, 2],
      ],
      zoom: 5.4,
    },
    singapore: {
      bounds: [
        [1.14, 103.56],
        [1.5, 104.06],
      ],
      zoom: 9.6,
    },
  };
  const countrySources = [
    {
      id: "china",
      iso: "CHN",
      regions: ["hong-kong", "mainland-china"],
    },
    {
      id: "united-states",
      iso: "USA",
      regions: ["united-states"],
    },
    {
      id: "united-kingdom",
      iso: "GBR",
      regions: ["united-kingdom"],
    },
    {
      id: "singapore",
      iso: "SGP",
      regions: ["singapore"],
    },
  ];

  const totalRegions = new Set(locations.map((item) => item.region)).size;

  if (!window.L) {
    collaborationMap.classList.add("map-fallback");
    collaborationMap.textContent = "Interactive map loading requires Leaflet.";
    return;
  }

  const map = L.map(collaborationMap, {
    attributionControl: true,
    minZoom: 0.75,
    scrollWheelZoom: false,
    worldCopyJump: true,
    zoomDelta: 0.5,
    zoomControl: false,
    zoomSnap: 0.25,
  }).setView(defaultCenter(), defaultZoom());

  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18,
    minZoom: 0,
  }).addTo(map);

  map.createPane("countryHighlightPane");
  map.getPane("countryHighlightPane").style.zIndex = 360;
  const countryLayers = [];
  const countryGeoJSON = window.OpenEnvisionCountryGeoJSON;

  if (countryGeoJSON?.features?.length) {
    countrySources.forEach((source) => {
      const feature = countryGeoJSON.features.find((item) => item.properties?.iso === source.iso);
      if (!feature) return;
      const layer = L.geoJSON(feature, {
        pane: "countryHighlightPane",
        interactive: false,
        style: countryStyle(source, "all"),
      }).addTo(map);
      countryLayers.push({ layer, source });
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.mapFilter || "all"));
  });

  updateInfo(regionSummary("all", locations));
  applyFilter("all", false);
  setTimeout(() => map.invalidateSize(), 150);

  function applyFilter(region, fit = true) {
    filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mapFilter === region);
    });

    logoCards.forEach((card) => {
      const isMatch = region === "all" || card.dataset.region === region;
      card.classList.toggle("is-muted", !isMatch);
      card.classList.toggle("is-highlighted", region !== "all" && isMatch);
    });

    const selected = region === "all" ? locations : locations.filter((item) => item.region === region);
    countryLayers.forEach(({ layer, source }) => {
      layer.setStyle(countryStyle(source, region));
    });

    if (fit) {
      if (region === "all") {
        map.setView(defaultCenter(), defaultZoom(), { animate: true });
      } else if (regionBounds[region]) {
        const target = regionBounds[region];
        if (region === "hong-kong" || region === "singapore") {
          map.setView(L.latLngBounds(target.bounds).getCenter(), target.zoom, { animate: true });
        } else {
          map.fitBounds(target.bounds, { animate: true, maxZoom: target.zoom, padding: [46, 46] });
        }
      } else {
        map.fitBounds(
          L.latLngBounds(selected.map((item) => [item.lat, item.lng])),
          { animate: true, maxZoom: 5, padding: [46, 46] },
        );
      }
    }

    updateInfo(regionSummary(region, selected));
  }

  function countryStyle(source, region) {
    const isSelected = region === "all" || source.regions.includes(region);
    return {
      className: "country-highlight",
      color: isSelected ? "rgba(255, 255, 255, 0.64)" : "rgba(255, 255, 255, 0.12)",
      fillColor: "#e53a32",
      fillOpacity: isSelected ? (region === "all" ? 0.2 : 0.3) : 0.025,
      opacity: isSelected ? 0.7 : 0.12,
      weight: isSelected ? 1.3 : 0.7,
    };
  }

  function regionSummary(region, selected) {
    if (region === "all") {
      return {
        city: "OpenEnvision Network",
        partners: ["50+ collaborators", `${totalRegions} regions`, "6 industry labs"],
        description:
          "A growing collaboration network linking open vision research, evaluation, and public artifact releases.",
      };
    }

    const partners = selected.flatMap((item) => item.partners);
    return {
      city: regionLabels[region],
      partners,
      description: `${partners.length} collaborators in ${regionLabels[region]}.`,
    };
  }

  function updateInfo(item) {
    nameEl.textContent = item.city;
    locationEl.textContent = item.partners.join(" · ");
    descriptionEl.textContent = item.description;
  }

  function defaultCenter() {
    return window.innerWidth < 640 ? [18, 8] : [24, 12];
  }

  function defaultZoom() {
    return window.innerWidth < 640 ? 0.85 : 1.95;
  }
}
