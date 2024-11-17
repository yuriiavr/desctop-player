class RotatingKnob {
  constructor(element, options) {
    this.element = element;
    this.min = options.min || -30;
    this.max = options.max || 30;
    this.onValueChange = options.onValueChange;
    this.localStorageKey = options.localStorageKey;
    this.knobColor = options.knobColor || "#00ffcc";

    this.init();
    const savedValue = localStorage.getItem(this.localStorageKey);
    this.updateKnobValue(
      savedValue !== null ? parseFloat(savedValue) : options.initialValue || 0
    );
  }

  init() {
    this.element.addEventListener("click", (e) => this.setKnobValue(e));
  }

  setKnobValue(e) {
    e.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    angle += 90;
    if (angle < 0) {
      angle += 360;
    }

    const value = (angle / 360) * (this.max - this.min) + this.min;

    if (this.onValueChange) {
      this.onValueChange(value);
    }

    this.updateKnobValue(value);

    localStorage.setItem(this.localStorageKey, value);
  }

  updateKnobValue(value) {
    const angle = ((value - this.min) / (this.max - this.min)) * 360;
    this.element.style.background = `conic-gradient(
        ${this.knobColor} ${angle}deg,
        #333333 ${angle}deg 360deg
      )`;
  }

  setKnobColor(color) {
    this.knobColor = color;
    localStorage.setItem(`${this.localStorageKey}_color`, color);
    const currentValue = localStorage.getItem(this.localStorageKey);
    this.updateKnobValue(currentValue !== null ? parseFloat(currentValue) : 0);
  }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const track = audioContext.createMediaElementSource(audio); // Використовуємо об'єкт audio, який ви використовуєте у своєму плеєрі

const lowFilter = audioContext.createBiquadFilter();
lowFilter.type = "lowshelf";
lowFilter.frequency.setValueAtTime(200, audioContext.currentTime);

const midFilter = audioContext.createBiquadFilter();
midFilter.type = "peaking";
midFilter.frequency.setValueAtTime(1000, audioContext.currentTime);

const highFilter = audioContext.createBiquadFilter();
highFilter.type = "highshelf";
highFilter.frequency.setValueAtTime(3000, audioContext.currentTime);

track.connect(lowFilter);
lowFilter.connect(midFilter);
midFilter.connect(highFilter);
highFilter.connect(audioContext.destination);

document.addEventListener("DOMContentLoaded", () => {
  const savedColor1 = localStorage.getItem("lowKnobValue_color") || "#43e5f7";
  const savedColor2 = localStorage.getItem("midKnobValue_color") || "#43e5f7";
  const savedColor3 = localStorage.getItem("highKnobValue_color") || "#43e5f7";

  document.getElementById("equalizer1").value = savedColor1;
  document.getElementById("equalizer2").value = savedColor2;
  document.getElementById("equalizer3").value = savedColor3;
  const lowKnob = new RotatingKnob(document.getElementById("lowKnob"), {
    min: -10,
    max: 30,
    initialValue:
      localStorage.getItem("lowKnobValue") !== null
        ? parseFloat(localStorage.getItem("lowKnobValue"))
        : lowFilter.gain.value,
    localStorageKey: "lowKnobValue",
    knobColor: document.getElementById("equalizer1").value,
    onValueChange: (value) => {
      lowFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  const midKnob = new RotatingKnob(document.getElementById("midKnob"), {
    min: -30,
    max: 30,
    initialValue:
      localStorage.getItem("midKnobValue") !== null
        ? parseFloat(localStorage.getItem("midKnobValue"))
        : midFilter.gain.value,
    localStorageKey: "midKnobValue",
    knobColor: document.getElementById("equalizer2").value,
    onValueChange: (value) => {
      midFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  const highKnob = new RotatingKnob(document.getElementById("highKnob"), {
    min: -30,
    max: 30,
    initialValue:
      localStorage.getItem("highKnobValue") !== null
        ? parseFloat(localStorage.getItem("highKnobValue"))
        : highFilter.gain.value,
    localStorageKey: "highKnobValue",
    knobColor: document.getElementById("equalizer3").value,
    onValueChange: (value) => {
      highFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  document.getElementById("equalizer1").addEventListener("input", (e) => {
    lowKnob.setKnobColor(e.target.value);
  });

  document.getElementById("equalizer2").addEventListener("input", (e) => {
    midKnob.setKnobColor(e.target.value);
  });

  document.getElementById("equalizer3").addEventListener("input", (e) => {
    highKnob.setKnobColor(e.target.value);
  });
});
