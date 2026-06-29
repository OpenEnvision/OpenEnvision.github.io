const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const currentPage = document.body.dataset.page;

if (currentPage) {
  navLinks.forEach((link) => {
    if (link.dataset.pageLink === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

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
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      header.classList.remove("nav-active");
      document.body.classList.remove("nav-open");
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

  const totalCollaborators = locations.reduce((count, item) => count + item.partners.length, 0);
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
        partners: [`${totalCollaborators} collaborators`, `${totalRegions} regions`, "5 industry labs"],
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
