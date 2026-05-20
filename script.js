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
let dust = [];

if (canvas) {
  ctx = canvas.getContext("2d");
  startStars();
  window.addEventListener("resize", restartStars);
  reduceMotion.addEventListener("change", restartStars);
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
  const starCount = Math.max(120, Math.min(300, Math.round(width * height * 0.00022)));
  const dustCount = Math.max(34, Math.min(92, Math.round(width / 15)));

  stars = Array.from({ length: starCount }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.88,
    r: index % 17 === 0 ? 1.7 + Math.random() * 0.8 : 0.45 + Math.random() * 1.1,
    a: 0.28 + Math.random() * 0.72,
    twinkle: 0.35 + Math.random() * 1.2,
    drift: 0.015 + Math.random() * 0.035,
    tint: ["255,255,255", "214,226,255", "255,223,188"][index % 3],
  }));

  dust = Array.from({ length: dustCount }, (_, index) => ({
    x: Math.random() * width,
    y: height * (0.08 + Math.random() * 0.7),
    r: 46 + Math.random() * 132,
    a: 0.012 + Math.random() * 0.032,
    drift: 0.01 + index * 0.0006,
    tint: index % 2 === 0 ? "76,99,158" : "141,76,126",
  }));
}

function animateStars(time) {
  drawStarScene(time * 0.001);
  animationFrame = window.requestAnimationFrame(animateStars);
}

function drawStarScene(t) {
  drawSkyGradient();
  drawNebula(t);
  drawStars(t);
  drawConstellation(t);
  drawMeteor(t);
}

function drawSkyGradient() {
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, "#02030a");
  sky.addColorStop(0.38, "#071020");
  sky.addColorStop(0.68, "#050815");
  sky.addColorStop(1, "#01020a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const horizon = ctx.createRadialGradient(width * 0.72, height * 0.34, 0, width * 0.72, height * 0.34, width * 0.58);
  horizon.addColorStop(0, "rgba(84, 111, 174, 0.18)");
  horizon.addColorStop(0.48, "rgba(36, 59, 110, 0.08)");
  horizon.addColorStop(1, "rgba(36, 59, 110, 0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, width, height);
}

function drawNebula(t) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  dust.forEach((cloud, index) => {
    cloud.x += cloud.drift;
    if (cloud.x - cloud.r > width) cloud.x = -cloud.r;

    const pulse = 0.78 + Math.sin(t * 0.25 + index) * 0.22;
    const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
    gradient.addColorStop(0, `rgba(${cloud.tint}, ${cloud.a * pulse})`);
    gradient.addColorStop(0.46, `rgba(${cloud.tint}, ${cloud.a * 0.38 * pulse})`);
    gradient.addColorStop(1, `rgba(${cloud.tint}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawStars(t) {
  stars.forEach((star, index) => {
    star.x += star.drift;
    if (star.x > width + 4) star.x = -4;

    const alpha = star.a * (0.66 + Math.sin(t * star.twinkle + index) * 0.22);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();

    if (star.r > 1.45) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${star.tint}, ${alpha * 0.28})`;
      ctx.lineWidth = 1;
      ctx.moveTo(star.x - star.r * 3.5, star.y);
      ctx.lineTo(star.x + star.r * 3.5, star.y);
      ctx.moveTo(star.x, star.y - star.r * 3.5);
      ctx.lineTo(star.x, star.y + star.r * 3.5);
      ctx.stroke();
    }
  });
}

function drawConstellation(t) {
  const points = [
    [0.58, 0.22],
    [0.67, 0.17],
    [0.76, 0.24],
    [0.71, 0.34],
    [0.83, 0.4],
  ].map(([x, y], index) => ({
    x: width * x + Math.sin(t * 0.12 + index) * 5,
    y: height * y + Math.cos(t * 0.11 + index) * 4,
  }));

  ctx.save();
  ctx.globalAlpha = width < 700 ? 0.18 : 0.34;
  ctx.strokeStyle = "rgba(224, 232, 255, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawMeteor(t) {
  const cycle = (t * 0.12) % 1;
  if (cycle < 0.18) {
    const progress = cycle / 0.18;
    const x = width * (0.88 - progress * 0.42);
    const y = height * (0.16 + progress * 0.22);
    const trail = 170;

    const meteor = ctx.createLinearGradient(x, y, x + trail, y - trail * 0.46);
    meteor.addColorStop(0, "rgba(255, 255, 255, 0.78)");
    meteor.addColorStop(0.34, "rgba(167, 198, 255, 0.28)");
    meteor.addColorStop(1, "rgba(167, 198, 255, 0)");

    ctx.beginPath();
    ctx.strokeStyle = meteor;
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
    ctx.lineTo(x + trail, y - trail * 0.46);
    ctx.stroke();
  }
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
      partners: ["ZJU"],
      description: "Academic collaborator in Hangzhou.",
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
      partners: ["CUHK(SZ)"],
      description: "Academic collaborator in Shenzhen.",
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
      id: "singapore",
      iso: "SGP",
      regions: ["singapore"],
    },
  ];

  const totalCollaborators = locations.reduce((count, item) => count + item.partners.length, 0);

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
        partners: [`${totalCollaborators} collaborators`, "4 regions", "3 industry labs"],
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
