// Animation sequence timing
const TIMING = {
  START_DELAY: 300,
  UNDERLINE_DRAW: 300,
  UNDERLINE_PAUSE: 400,
  UNDERLINE_HIDE: 300,
  BACKGROUND_FADE: 600
};

// Phrases for glitch animation
const phrases = [
  { text: "ENSO STUDIOS DANIEL VAMOSI", font: "Bodoni Moda", style: "italic" },
  { text: "ENSO STUDIOS DANIEL VAMOSI", font: "Nunito" },
  { text: "enso studios daniel vamosi", font: "Calistoga", style: "italic" },
  { text: "ENSO STUDIOS DANIEL VAMOSI", font: "Barlow ExtraBold" },
  { text: "ENSO STUDIOS DANIEL VAMOSI", font: "Pixels", size: "6.5vw", raise: true },
  { text: "enso studios daniel vamosi", font: "IBM Plex Serif Thin", style: "italic" },
  { text: "ENSO STUDIOS DANIEL VAMOSI", font: "Sofia Pro" },
  { text: "[ en-so ] [ dan-yell ] [ vam-oh-see ]", font: "DM Mono", size: "2.975vw" },
  { text: "endv", font: "Montserrat ExtraBold", style: "italic" },
  { text: "e", font: "Rig Shaded", size: "4vw" },
  { text: "E", font: "Bodoni Moda", style: "italic", size: "4vw" },
  { text: "E", font: "Barlow ExtraBold", size: "4vw" }
];

// DOM elements
const underline = document.getElementById("underline");
const underlineMask = document.getElementById("underline-mask");
const background = document.getElementById("background");
const cursor = document.getElementById("cursor");
const white = document.getElementById("glitch-white");
const r = document.getElementById("glitch-r");
const g = document.getElementById("glitch-g");
const b = document.getElementById("glitch-b");
const waveMask = document.getElementById("wave-mask");
const turbulence = document.getElementById("turbulence");
const video = document.getElementById("background-video");

// Container elements
const underlineContainer = document.querySelector(".underline-container");
const underlineInner = document.querySelector(".underline-inner");
const textWrapper = document.querySelector(".text-wrapper");

// Panel elements
const splitScreen = document.getElementById('split-screen');
const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');
const leftProjects = document.getElementById('left-projects');
const rightProjects = document.getElementById('right-projects');
const glitchContainer = document.querySelector('.glitch-container');

// Animation state
let current = 0;
let lastMove = Date.now();
let lastPhaseChange = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mobile = /Mobi|Android/i.test(navigator.userAgent);
let mouseStopped = true;
let introAnimationComplete = false;
let mouseX = 0;
let mouseY = 0;
let waveTime = 0;
let waveInterval;

let currentZone = 'center'; // 'center' | 'left' | 'right'
let fullscreenPanel = null;

// Utility: measure glitch text width and update underline
function updateUnderlineToText(phrase) {
  const measure = document.getElementById("glitch-measure");
  if (!measure) return;
  measure.textContent = phrase.text;
  measure.style.fontFamily = `'${phrase.font}'`;
  measure.style.fontStyle = phrase.style || "normal";
  measure.style.fontSize = phrase.size || "3.5vw";
  let textWidth = measure.getBoundingClientRect().width;
  // Add 0.3cm (0.15 left + 0.15 right) for buffer
  const buffer = 0.3 * 37.7952755906; // 1cm = 37.795 px
  textWidth += buffer;
  const underlineContainer = document.querySelector(".underline-container");
  const underlineInner = document.querySelector(".underline-inner");
  underlineContainer.style.width = textWidth + "px";
  underlineInner.style.width = textWidth + "px";
}

// --- Prevent text jump: lock glitch-container position and height strictly ---
function fixGlitchContainerPosition() {
  const glitchContainer = document.querySelector('.glitch-container');
  const textEl = document.getElementById('glitch-white');
  if (glitchContainer && textEl) {
    const rect = textEl.getBoundingClientRect();
    glitchContainer.style.position = 'fixed';
    glitchContainer.style.top = '50%';
    glitchContainer.style.left = '0';
    glitchContainer.style.width = '100%';
    glitchContainer.style.transform = 'translateY(-50%)';
    glitchContainer.style.zIndex = '20';
    glitchContainer.style.textAlign = 'center';
    glitchContainer.style.height = rect.height + 'px'; // lock height
  }
}

// Lock glitch-container height after text render to prevent jump
function lockGlitchContainerHeight() {
  const glitchContainer = document.querySelector('.glitch-container');
  const textEl = document.getElementById('glitch-white');
  if (glitchContainer && textEl) {
    const rect = textEl.getBoundingClientRect();
    glitchContainer.style.minHeight = rect.height + 'px';
    glitchContainer.style.height = rect.height + 'px';
  }
}

// Apply glitch phrase with font
function applyGlitch(phrase, glitchActive = false) {
  const fontSize = phrase.size || "3.5vw";
  const fontStyle = phrase.style || "normal";
  const font = phrase.font;
  const topOffset = phrase.raise ? "-3px" : "0px";

  [white, r, g, b].forEach(el => {
    el.textContent = phrase.text;
    el.style.fontFamily = `'${font}'`;
    el.style.fontStyle = fontStyle;
    el.style.fontSize = fontSize;
    el.style.top = `calc(50% + ${topOffset})`;
    el.style.transform = el.style.transform || 'translateY(-50%)';
  });

  // Animate underline to match text width
  setTimeout(() => updateUnderlineToText(phrase), 10);
  // Strictly fix glitch-container position to prevent jump
  setTimeout(fixGlitchContainerPosition, 12);
  // Lock glitch-container height after text render to prevent jump
  setTimeout(lockGlitchContainerHeight, 12);

  if (!glitchActive) {
    [r, g, b].forEach(layer => layer.style.transform = 'translateY(-50%) translateX(0)');
  }
}

// Update glitch offset based on mouse movement
function updateGlitchOffset(dx, dy) {
  const velocity = Math.sqrt(dx * dx + dy * dy);
  const maxOffset = Math.min(velocity * 0.06, 6.4);
  const angleRad = Math.atan2(dy, dx);

  const x = Math.cos(angleRad) * maxOffset;
  const y = Math.sin(angleRad) * maxOffset;

  r.style.transform = `translate(${-x}px, ${-y}px) translateY(-50%)`;
  g.style.transform = `translate(${x}px, ${-y}px) translateY(-50%)`;
  b.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;

  mouseStopped = false;
  lastMove = Date.now();
}

function resetGlitch() {
  [r, g, b].forEach(layer => {
    layer.style.transform = 'translateY(-50%) translateX(0)';
  });
  mouseStopped = true;
}

function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = `${mouseX}px`;
  cursor.style.top = `${mouseY}px`;
  if (!introAnimationComplete) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  updateGlitchOffset(dx, dy);
  updateWaveDistortion(e.clientX / window.innerWidth);
  const movement = Math.sqrt(dx * dx + dy * dy);
  const now = Date.now();
  if (now - lastPhaseChange > 100 && movement > 4) {
    current = (current + 1) % phrases.length;
    applyGlitch(phrases[current], true);
    lastPhaseChange = now;
  }
}

function updateWaveDistortion(xPosition = 0.5) {
  const distanceFromCenter = Math.abs(xPosition - 0.75);
  const intensity = Math.max(0, 1 - distanceFromCenter * 2) * 0.7;
  waveMask.style.opacity = 0.4 + (intensity * 0.5);
  const baseFreqX = 0.02 + (intensity * 0.02);
  const baseFreqY = 0.02 + (intensity * 0.02);
  turbulence.setAttribute('baseFrequency', `${baseFreqX} ${baseFreqY}`);
}

function animateWaves() {
  waveTime += 0.01;
  const timeX = Math.sin(waveTime) * 0.005 + 0.02;
  const timeY = Math.cos(waveTime * 0.8) * 0.005 + 0.02;
  turbulence.setAttribute('baseFrequency', `${timeX} ${timeY}`);
  const opacityPulse = (Math.sin(waveTime * 2) * 0.15) + 0.45;
  waveMask.style.opacity = opacityPulse;
  turbulence.setAttribute('seed', Math.floor(waveTime * 10) % 100);
}

function hideUnderline() {
  underlineContainer.style.display = 'none';
}

function showCornerTitles() {
  document.getElementById('corner-photo').style.opacity = '1';
  document.getElementById('corner-film').style.opacity = '1';
  document.getElementById('corner-info').style.opacity = '1';
  document.getElementById('corner-email').style.opacity = '1';
}

function startIntroAnimation() {
  applyGlitch(phrases[0]);
  underlineContainer.getBoundingClientRect();
  underline.style.transition = 'none';
  underline.style.transformOrigin = 'left';
  underline.style.transform = 'scaleX(0)';
  underline.style.opacity = '1';
  underlineContainer.style.display = 'block';
  underlineContainer.style.opacity = '1';
  window.getComputedStyle(underline).transform;
  setTimeout(() => {
    underline.style.transition = `transform ${TIMING.UNDERLINE_DRAW}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
    underline.style.transform = 'scaleX(1)';
    underline.style.opacity = '1';
    setTimeout(() => {
      underline.style.transition = `transform ${TIMING.UNDERLINE_HIDE}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      underline.style.transformOrigin = 'right';
      underline.style.transform = 'scaleX(0)';
      setTimeout(() => {
        underlineContainer.style.display = 'none';
        setTimeout(() => {
          background.style.opacity = '0';
          setTimeout(() => {
            introAnimationComplete = true;
            waveInterval = setInterval(animateWaves, 16);
            waveMask.style.opacity = 0.4;
            showCornerTitles();
          }, TIMING.BACKGROUND_FADE);
        }, 100);
      }, TIMING.UNDERLINE_HIDE);
    }, TIMING.UNDERLINE_PAUSE);
  }, TIMING.START_DELAY);
}

function setPanelState(zone) {
  // Reset all
  leftPanel.classList.remove('expanded', 'compressed', 'fullscreen');
  rightPanel.classList.remove('expanded', 'compressed', 'fullscreen');
  leftProjects.classList.remove('visible');
  rightProjects.classList.remove('visible');
  glitchContainer.classList.remove('fade');
  document.querySelectorAll('.project-title').forEach(el => el.classList.remove('visible'));
  if (fullscreenPanel) fullscreenPanel.classList.remove('fullscreen');
  fullscreenPanel = null;

  if (zone === 'left') {
    leftPanel.classList.add('expanded');
    rightPanel.classList.add('compressed');
    leftProjects.classList.add('visible');
    fadeInProjectTitles(leftProjects);
    glitchContainer.classList.add('fade');
  } else if (zone === 'right') {
    rightPanel.classList.add('expanded');
    leftPanel.classList.add('compressed');
    rightProjects.classList.add('visible');
    fadeInProjectTitles(rightProjects);
    glitchContainer.classList.add('fade');
  } else {
    // center
    leftPanel.classList.remove('expanded', 'compressed');
    rightPanel.classList.remove('expanded', 'compressed');
    glitchContainer.classList.remove('fade');
  }
}

function fadeInProjectTitles(listContainer) {
  const titles = listContainer.querySelectorAll('.project-title');
  titles.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 80 * i);
  });
}

function handleMouseMovePanel(e) {
  if (fullscreenPanel) return;
  const x = e.clientX / window.innerWidth;
  if (x <= 0.15) {
    if (currentZone !== 'left') {
      setPanelState('left');
      currentZone = 'left';
    }
  } else if (x >= 0.85) {
    if (currentZone !== 'right') {
      setPanelState('right');
      currentZone = 'right';
    }
  } else {
    if (currentZone !== 'center') {
      setPanelState('center');
      currentZone = 'center';
    }
  }
}

// Fullscreen on project hover
function handleProjectHover(e) {
  if (fullscreenPanel) return;
  const parentPanel = e.currentTarget.closest('.panel');
  parentPanel.classList.add('fullscreen');
  fullscreenPanel = parentPanel;
}
function handleProjectLeave(e) {
  if (!fullscreenPanel) return;
  fullscreenPanel.classList.remove('fullscreen');
  fullscreenPanel = null;
  setPanelState(currentZone); // restore zone state
}

// --- Vimeo Responsive Embeds for Right Panel ---
const vimeoEmbeds = [
  `<div style="padding:177.78% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1077804813?h=7437a21e45&badge=0&autopause=0&player_id=0&app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="G6 Film Studios"></iframe></div>`,
  `<div style="padding:177.78% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1077810709?h=c0de2f83cd&badge=0&autopause=0&player_id=0&app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="Superba instagram reel"></iframe></div>`,
  `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/1077804882?h=e06c9f3145&badge=0&autopause=0&player_id=0&app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="mini mes bts v1"></iframe></div>`
];

document.querySelectorAll('.right-panel .project-title').forEach((el, idx) => {
  const preview = el.querySelector('.project-preview');
  el.addEventListener('mouseenter', () => {
    preview.innerHTML = vimeoEmbeds[idx];
    handleProjectHover({ currentTarget: el });
  });
  el.addEventListener('mouseleave', () => {
    preview.innerHTML = '';
    handleProjectLeave({ currentTarget: el });
  });
});

// For left panel, keep previous logic

document.querySelectorAll('.left-panel .project-title').forEach(el => {
  el.addEventListener('mouseenter', handleProjectHover);
  el.addEventListener('mouseleave', handleProjectLeave);
});

document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });

document.querySelectorAll('.project-title').forEach(el => {
  el.addEventListener('mouseenter', handleProjectHover);
  el.addEventListener('mouseleave', handleProjectLeave);
});

// --- Project Title Hover Underline Logic ---
document.querySelectorAll('.project-title').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.classList.add('hovered');
  });
  el.addEventListener('mouseleave', () => {
    el.classList.remove('hovered');
  });
});

window.addEventListener('mousemove', handleMouseMovePanel);
window.addEventListener('mouseleave', () => {
  setPanelState('center');
  currentZone = 'center';
});

// --- Ensure glitch text always visible initially ---
setPanelState('center');

// --- Left Panel: Swap Background on Hover ---
const leftBg = document.getElementById('left-bg');
document.querySelectorAll('.left-panel .project-title').forEach(el => {
  el.addEventListener('mouseenter', () => {
    const img = el.getAttribute('data-img');
    if (img) leftBg.src = img;
    el.classList.add('hovered');
    handleProjectHover({ currentTarget: el });
  });
  el.addEventListener('mouseleave', () => {
    leftBg.src = 'https://raw.githubusercontent.com/CreateWithEnso/enso-assets/main/2DF901D2-716B-401C-A64A-A128E67A1512_1_105_c.jpeg';
    el.classList.remove('hovered');
    handleProjectLeave({ currentTarget: el });
  });
});

// --- Right Panel: Swap Vimeo on Hover ---
const rightBg = document.getElementById('right-bg');
const defaultVideo = `<video id="background-video" autoplay loop muted playsinline><source src="https://raw.githubusercontent.com/CreateWithEnso/enso-assets/main/temp%20showreel%201.mp4" type="video/mp4"></video>`;

document.querySelectorAll('.right-panel .project-title').forEach(el => {
  el.addEventListener('mouseenter', () => {
    const vimeo = el.getAttribute('data-vimeo');
    if (vimeo) {
      rightBg.innerHTML = `<iframe src='${vimeo}' width='100%' height='100%' frameborder='0' allow='autoplay; fullscreen; picture-in-picture' allowfullscreen style='width:100%;height:100%;'></iframe>`;
    }
    el.classList.add('hovered');
    handleProjectHover({ currentTarget: el });
  });
  el.addEventListener('mouseleave', () => {
    rightBg.innerHTML = defaultVideo;
    el.classList.remove('hovered');
    handleProjectLeave({ currentTarget: el });
  });
});

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    startIntroAnimation();
  }, 200);
});

// =============================
// GLITCH INTRO LOGIC (DESKTOP & MOBILE, RUNS AFTER INTRO)
// =============================

// This function is called after the intro animation (background fade & corner titles)
function startGlitchIntro() {
  if (mobile) {
    mobileSequence();
  } else {
    desktopIntroSequence();
  }
}

// Desktop: Run short intro loop, then enable mouse interaction only
function desktopIntroSequence() {
  const introSequence = [0, 1, 3, 5];
  let idx = 0;
  function cycleIntro() {
    if (idx >= introSequence.length) {
      // After intro, enable mouse-driven glitch only
      document.addEventListener('mousemove', handleMouseMove);
      if (typeof checkMouseInactivity === 'function') checkMouseInactivity();
      return;
    }
    applyGlitch(phrases[introSequence[idx]], true);
    if (idx < introSequence.length - 1) {
      let angle = 0;
      const interval = setInterval(() => {
        const x = Math.cos(angle) * 4;
        const y = Math.sin(angle) * 2;
        r.style.transform = `translate(${-x}px, ${-y}px) translateY(-50%)`;
        g.style.transform = `translate(${x}px, ${-y}px) translateY(-50%)`;
        b.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
        angle += 0.5;
      }, 16);
      setTimeout(() => {
        clearInterval(interval);
        resetGlitch();
        idx++;
        cycleIntro();
      }, 50);
    } else {
      setTimeout(() => {
        resetGlitch();
        idx++;
        cycleIntro();
      }, 1000); // Pause on last phrase for a moment
    }
  }
  cycleIntro();
}

// Mobile: Run intro loop, then infinite auto-loop sequence
function mobileSequence() {
  const introSequence = [0, 1, 3, 5];
  let idx = 0;
  function initialCycle() {
    if (idx >= introSequence.length) {
      startRegularMobileCycle();
      return;
    }
    applyGlitch(phrases[introSequence[idx]], true);
    if (idx < introSequence.length - 1) {
      let angle = 0;
      const interval = setInterval(() => {
        const x = Math.cos(angle) * 4;
        const y = Math.sin(angle) * 2;
        r.style.transform = `translate(${-x}px, ${-y}px) translateY(-50%)`;
        g.style.transform = `translate(${x}px, ${-y}px) translateY(-50%)`;
        b.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
        angle += 0.5;
      }, 16);
      setTimeout(() => {
        clearInterval(interval);
        resetGlitch();
        idx++;
        initialCycle();
      }, 50);
    } else {
      setTimeout(() => {
        resetGlitch();
        startRegularMobileCycle();
      }, 1000);
    }
  }
  function startRegularMobileCycle() {
    const sequence = [
      0, 1, 2, 3, 4, 5, [5, 2000],
      6, 7, 8, 9, 10, 11, [11, 2000],
      8, 9, 10, 11, 0, 1, 2, [2, 2000],
      3, 4, 5, 6, 7, 8, 9, 10, 11, [4, 2000]
    ];
    let seqIdx = 0;
    async function loop() {
      while (true) {
        let entry = sequence[seqIdx % sequence.length];
        let phraseIndex = Array.isArray(entry) ? entry[0] : entry;
        let delay = Array.isArray(entry) ? entry[1] : 100;
        applyGlitch(phrases[phraseIndex], delay < 1000);
        if (delay < 1000) {
          let angle = 0;
          const interval = setInterval(() => {
            const x = Math.cos(angle) * 3;
            const y = Math.sin(angle) * 1.5;
            r.style.transform = `translate(${-x}px, ${-y}px) translateY(-50%)`;
            g.style.transform = `translate(${x}px, ${-y}px) translateY(-50%)`;
            b.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
            angle += 0.25;
          }, 16);
          await new Promise(res => setTimeout(res, delay));
          clearInterval(interval);
        } else {
          resetGlitch();
          await new Promise(res => setTimeout(res, delay));
        }
        seqIdx++;
      }
    }
    loop();
  }
  initialCycle();
}

// Patch: ensure glitch intro starts after background fade
(function patchGlitchIntroAfterIntro() {
  const origStartIntroAnimation = startIntroAnimation;
  window.startIntroAnimation = function() {
    origStartIntroAnimation();
    setTimeout(() => {
      if (introAnimationComplete) {
        startGlitchIntro();
      }
    }, TIMING.BACKGROUND_FADE + 150);
  };
})();
