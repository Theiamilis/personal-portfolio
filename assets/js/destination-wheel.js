(() => {
  const wheel = document.querySelector("#destination-wheel");
  const contentPane = document.querySelector("#content-pane");
  const viewStatus = document.querySelector("#view-status");
  const destinationCount = document.querySelector("#destination-count");
  if (!wheel || !contentPane || !viewStatus || !destinationCount) return;

  const stops = [...wheel.querySelectorAll(".wheel-stop")];
  const views = [...contentPane.querySelectorAll("[data-wheel-view]")];
  if (!stops.length || !views.length) return;

  const initialIndex = stops.findIndex((stop) => stop.getAttribute("href") === window.location.hash);
  const markedIndex = stops.findIndex((stop) => stop.getAttribute("aria-current") === "location");
  let activeIndex = initialIndex >= 0 ? initialIndex : Math.max(0, markedIndex);
  let wheelIndex = activeIndex;
  let orbitAngle = (activeIndex * 360) / stops.length;
  let isRotating = false;
  let queuedWheelIndex = null;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = motionPreference.matches;
  const spinDuration = prefersReducedMotion ? 0 : 580;
  const delay = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
  const entranceSelectors = {
    links: [".section-number", "#links-title", ".links-intro", ".featured-link-card", ".link-collection > h3", ".hub-link", ".links-note"],
    profil: [".section-marker", ".profile-details > h2", ".profile-details > .empty-copy", ".profile-facts", ".cv-row", ".skills-section > .section-heading", ".skill-card", ".achievements-section > .section-heading", ".milestone-card"],
    riwayat: [".history-section > .section-heading", ".history-column > h3", ".history-entry"],
    portofolio: [".portfolio-section > .section-heading", ".project-card"],
    contact: [".contact-heading", ".contact-links > h3", ".contact-note", ".contact-list > div"]
  };
  let entranceSequence = 0;
  let passTimer = null;
  let titleTimer = null;
  let queueTimer = null;
  let entranceObserver = null;
  let holoLayer = null;
  let holoField = null;
  let entranceQueue = [];
  let queuedItems = new Set();
  let animationListeners = new Map();

  const getEntranceItems = (view) => {
    const selectors = entranceSelectors[view.dataset.wheelView] || [];
    const items = selectors.flatMap((selector) => [...view.querySelectorAll(selector)]);
    const uniqueItems = [...new Set(items)];
    uniqueItems.forEach((item) => item.setAttribute("data-arrival-item", ""));
    const orderedItems = uniqueItems.sort((left, right) => {
      if (left === right) return 0;
      return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    const heading = view.querySelector("h2");
    const headingItem = orderedItems.find((item) => item === heading || item.contains(heading));
    if (headingItem) {
      orderedItems.splice(orderedItems.indexOf(headingItem), 1);
      orderedItems.unshift(headingItem);
    }
    return orderedItems;
  };

  const clearViewEntrance = () => {
    entranceSequence += 1;
    [passTimer, titleTimer, queueTimer].forEach((timer) => {
      if (timer !== null) window.clearTimeout(timer);
    });
    passTimer = null;
    titleTimer = null;
    queueTimer = null;
    if (entranceObserver) {
      entranceObserver.disconnect();
      entranceObserver = null;
    }
    animationListeners.forEach((listener, item) => item.removeEventListener("animationend", listener));
    animationListeners.clear();
    entranceQueue = [];
    queuedItems = new Set();
    contentPane.querySelectorAll("[data-arrival-item]").forEach((item) => {
      item.classList.remove("is-pending", "is-building", "is-title-arriving", "is-arriving");
    });
    if (holoLayer) {
      holoLayer.remove();
      holoLayer = null;
      holoField = null;
    }
    return entranceSequence;
  };

  const ensureHoloField = () => {
    if (holoField) return holoField;
    holoLayer = document.createElement("div");
    holoLayer.className = "holo-layer";
    holoLayer.setAttribute("aria-hidden", "true");
    holoField = document.createElement("div");
    holoField.className = "holo-field";
    holoLayer.append(holoField);
    contentPane.prepend(holoLayer);
    return holoField;
  };

  const addHoloBeam = (field, className, beamInfo) => {
    const beam = document.createElement("span");
    beam.className = `content-holo-beam ${className}`;
    beam.style.setProperty("--flight-top", `${beamInfo.top}px`);
    beam.style.setProperty("--flight-left", `${beamInfo.left}px`);
    beam.style.setProperty("--beam-width", `${beamInfo.width}px`);
    beam.style.setProperty("--beam-height", `${beamInfo.height}px`);
    beam.style.setProperty("--beam-travel", `${beamInfo.travel || 0}px`);
    beam.style.setProperty("--flight-delay", `${beamInfo.delay}ms`);
    field.append(beam);
    beam.addEventListener("animationend", (event) => {
      if (event.target === beam && event.animationName === "holo-scan") beam.remove();
    });
    return beam;
  };

  const watchItemAnimation = (item, animationName, callback) => {
    const listener = (event) => {
      if (event.target !== item || event.animationName !== animationName) return;
      item.removeEventListener("animationend", listener);
      animationListeners.delete(item);
      callback();
    };
    animationListeners.set(item, listener);
    item.addEventListener("animationend", listener);
  };

  const revealTitle = (item) => {
    if (!item || !item.classList.contains("is-pending")) return;
    item.classList.remove("is-pending");
    item.classList.add("is-title-arriving");
    watchItemAnimation(item, "holo-content-reveal", () => item.classList.remove("is-title-arriving"));
  };

  const itemIsVisible = (item, root) => {
    const itemRect = item.getBoundingClientRect();
    const rootRect = root ? root.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
    return itemRect.bottom > rootRect.top && itemRect.top < rootRect.bottom && itemRect.right > rootRect.left && itemRect.left < rootRect.right;
  };

  const buildItem = (item, sequence) => {
    if (sequence !== entranceSequence || !item.classList.contains("is-pending") || !holoField) return;
    const itemRect = item.getBoundingClientRect();
    const fieldRect = holoField.getBoundingClientRect();
    const left = itemRect.left - fieldRect.left - 22;
    const top = itemRect.top - fieldRect.top;
    const beamWidth = Math.min(60, Math.max(28, itemRect.width * 0.1));
    addHoloBeam(holoField, "content-holo-beam--builder", {
      top,
      left,
      width: beamWidth,
      height: itemRect.height,
      travel: Math.max(18, itemRect.width - beamWidth + 18),
      delay: 0
    });
    item.classList.remove("is-pending");
    item.classList.add("is-building");
    watchItemAnimation(item, "holo-content-reveal", () => item.classList.remove("is-building"));
  };

  const startViewEntrance = (view, sequence) => {
    if (!view || motionPreference.matches) return;
    const items = getEntranceItems(view);
    if (!items.length) return;
    const titleItem = items[0];
    const itemOrder = new Map(items.map((item, index) => [item, index]));
    let passStarted = false;
    let passComplete = false;
    let observationRoot = window.matchMedia("(max-width: 800px)").matches ? null : contentPane;

    items.forEach((item) => item.classList.add("is-pending"));

    const pumpQueue = () => {
      if (!passComplete || queueTimer !== null || sequence !== entranceSequence) return;
      entranceQueue = entranceQueue.filter((item) => item.classList.contains("is-pending"));
      while (entranceQueue.length && !itemIsVisible(entranceQueue[0], observationRoot)) {
        const skipped = entranceQueue.shift();
        queuedItems.delete(skipped);
      }
      if (!entranceQueue.length) return;
      const item = entranceQueue.shift();
      buildItem(item, sequence);
      queueTimer = window.setTimeout(() => {
        queueTimer = null;
        pumpQueue();
      }, 215);
    };

    const startOpeningPass = () => {
      if (passStarted || sequence !== entranceSequence) return;
      passStarted = true;
      const field = ensureHoloField();
      const fieldHeight = window.innerHeight;
      const beamWidth = window.matchMedia("(max-width: 800px)").matches ? 42 : 58;
      addHoloBeam(field, "content-holo-beam--pass", {
        top: 0,
        left: -beamWidth,
        width: beamWidth,
        height: fieldHeight,
        travel: contentPane.clientWidth + beamWidth,
        delay: 0
      });

      passTimer = window.setTimeout(() => {
        passTimer = null;
        if (sequence !== entranceSequence) return;
        revealTitle(titleItem);
        titleTimer = window.setTimeout(() => {
          titleTimer = null;
          if (sequence !== entranceSequence) return;
          passComplete = true;
          pumpQueue();
        }, 520);
      }, 1560);
    };

    const queueVisibleItem = (item) => {
      if (item === titleItem || !item.classList.contains("is-pending") || queuedItems.has(item)) return;
      queuedItems.add(item);
      entranceQueue.push(item);
      entranceQueue.sort((left, right) => itemOrder.get(left) - itemOrder.get(right));
      pumpQueue();
    };

    if ("IntersectionObserver" in window) {
      entranceObserver = new IntersectionObserver((entries) => {
        if (sequence !== entranceSequence) return;
        const visibleEntries = entries.filter((entry) => entry.isIntersecting).sort((left, right) => itemOrder.get(left.target) - itemOrder.get(right.target));
        if (visibleEntries.length) startOpeningPass();
        visibleEntries.forEach((entry) => queueVisibleItem(entry.target));
        entries.filter((entry) => !entry.isIntersecting).forEach((entry) => {
          const queueIndex = entranceQueue.indexOf(entry.target);
          if (queueIndex >= 0) {
            entranceQueue.splice(queueIndex, 1);
            queuedItems.delete(entry.target);
          }
        });
      }, { root: observationRoot, threshold: 0.08, rootMargin: "0px 0px -48px 0px" });
      items.forEach((item) => entranceObserver.observe(item));
      const initiallyVisible = items.filter((item) => itemIsVisible(item, observationRoot));
      if (initiallyVisible.length) {
        startOpeningPass();
        initiallyVisible.forEach(queueVisibleItem);
      }
    } else {
      startOpeningPass();
      items.filter((item) => item !== titleItem && itemIsVisible(item, observationRoot)).forEach(queueVisibleItem);
    }
  };

  if (motionPreference.addEventListener) motionPreference.addEventListener("change", (event) => {
    if (event.matches) clearViewEntrance();
  });

  const slotFor = (index, centerIndex) => {
    const centerSlot = Math.floor(stops.length / 2);
    return ((index - centerIndex + stops.length + centerSlot) % stops.length) - centerSlot;
  };

  const placeStops = (centerIndex = wheelIndex) => {
    const radius = Math.min(wheel.clientWidth * 0.5, wheel.clientHeight * 0.47);
    const radiusX = radius;
    const radiusY = radius;
    wheel.style.setProperty("--wheel-radius-x", `${radiusX}px`);
    wheel.style.setProperty("--wheel-radius-y", `${radiusY}px`);
    const step = stops.length > 1 ? 82 / (stops.length - 1) : 0;

    stops.forEach((stop, index) => {
      const slot = slotFor(index, centerIndex);
      const angle = slot * step;
      const radians = (angle * Math.PI) / 180;
      stop.style.left = `${radiusX * Math.cos(radians)}px`;
      stop.style.top = `calc(50% + ${radiusY * Math.sin(radians)}px)`;
    });
  };

  const rotateWheelOneStep = async (direction) => {
    const centerSlot = Math.floor(stops.length / 2);
    const nextWheelIndex = (wheelIndex + direction + stops.length) % stops.length;
    let wrappingStop = null;

    for (let index = 0; index < stops.length; index += 1) {
      const oldSlot = slotFor(index, wheelIndex);
      const newSlot = slotFor(index, nextWheelIndex);
      const wrapsForward = direction > 0 && oldSlot === -centerSlot && newSlot === centerSlot;
      const wrapsBackward = direction < 0 && oldSlot === centerSlot && newSlot === -centerSlot;
      if (wrapsForward || wrapsBackward) {
        wrappingStop = stops[index];
        break;
      }
    }

    if (wrappingStop && spinDuration) {
      wrappingStop.classList.add("is-wrapping");
      await delay(180);
    }

    wheelIndex = nextWheelIndex;
    orbitAngle = (orbitAngle + direction * (360 / stops.length) + 360) % 360;
    wheel.style.setProperty("--orbit-angle", `${orbitAngle}deg`);
    placeStops(wheelIndex);

    if (spinDuration) await delay(spinDuration - (wrappingStop ? 180 : 0));
    if (wrappingStop) wrappingStop.classList.remove("is-wrapping");
  };

  const rotateWheelTo = async (targetIndex) => {
    while (wheelIndex !== targetIndex) {
      const forwardSteps = (targetIndex - wheelIndex + stops.length) % stops.length;
      const direction = forwardSteps <= stops.length / 2 ? 1 : -1;
      await rotateWheelOneStep(direction);
    }
  };

  const requestWheelRotation = (targetIndex) => {
    queuedWheelIndex = targetIndex;
    if (isRotating) return;
    isRotating = true;

    const runQueue = async () => {
      while (queuedWheelIndex !== null) {
        const nextIndex = queuedWheelIndex;
        queuedWheelIndex = null;
        await rotateWheelTo(nextIndex);
      }
      isRotating = false;
    };

    void runQueue();
  };

  const selectStop = (index, moveFocus = false, updateLocation = false) => {
    activeIndex = (index + stops.length) % stops.length;
    const selected = stops[activeIndex];
    const activeView = selected.dataset.view;
    const entranceRun = clearViewEntrance();

    if (updateLocation && window.location.hash !== selected.getAttribute("href")) {
      window.history.pushState({ wheelIndex: activeIndex }, "", selected.getAttribute("href"));
    }

    stops.forEach((stop, stopIndex) => {
      const isSelected = stopIndex === activeIndex;
      if (isSelected) stop.setAttribute("aria-current", "location");
      else stop.removeAttribute("aria-current");
      stop.tabIndex = isSelected ? 0 : -1;
    });

    views.forEach((view) => {
      const isSelected = view.dataset.wheelView === activeView;
      view.hidden = !isSelected;
      view.classList.toggle("is-active", isSelected);
    });

    destinationCount.textContent = selected.dataset.number;
    viewStatus.textContent = `${selected.getAttribute("aria-label")} section selected.`;
    contentPane.scrollTop = 0;
    startViewEntrance(views.find((view) => view.dataset.wheelView === activeView), entranceRun);

    if (updateLocation) requestWheelRotation(activeIndex);
    if (moveFocus) selected.focus();
  };

  stops.forEach((stop, index) => {
    stop.addEventListener("click", (event) => {
      event.preventDefault();
      selectStop(index, false, true);
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.classList.contains("wheel-stop")) return;

    const targetIndex = stops.findIndex((stop) => stop.getAttribute("href") === link.getAttribute("href"));
    if (targetIndex < 0) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      selectStop(targetIndex, false, true);
    });
  });

  wheel.addEventListener("keydown", (event) => {
    let nextIndex = activeIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex += 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex -= 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = stops.length - 1;
    else return;

    event.preventDefault();
    selectStop(nextIndex, true, true);
  });

  const syncFromLocation = () => {
    const index = stops.findIndex((stop) => stop.getAttribute("href") === window.location.hash);
    const selectedIndex = index >= 0 ? index : 0;
    selectStop(selectedIndex);
    requestWheelRotation(selectedIndex);
  };

  window.addEventListener("popstate", syncFromLocation);
  window.addEventListener("hashchange", syncFromLocation);

  orbitAngle %= 360;
  wheel.style.setProperty("--orbit-angle", `${orbitAngle}deg`);
  placeStops(wheelIndex);
  selectStop(activeIndex);
  wheel.classList.add("is-ready");
  document.body.classList.add("wheel-enabled");

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => placeStops(wheelIndex)).observe(wheel);
  } else {
    window.addEventListener("resize", () => placeStops(wheelIndex), { passive: true });
  }
})();
