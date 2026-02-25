'use strict';



/**
 * Add event listener on multiple elements
 */

const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}



/**
 * MOBILE NAVBAR TOGGLER
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");

const toggleNav = () => {
  navbar.classList.toggle("active");
  document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNav);



/**
 * HEADER ANIMATION
 * When scrolled donw to 100px header will be active
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});



/**
 * SLIDER
 */

const slider = document.querySelector("[data-slider]");
const sliderContainer = document.querySelector("[data-slider-container]");
const sliderPrevBtn = document.querySelector("[data-slider-prev]");
const sliderNextBtn = document.querySelector("[data-slider-next]");

let totalSliderVisibleItems = Number(getComputedStyle(slider).getPropertyValue("--slider-items"));
let totalSlidableItems = sliderContainer.childElementCount - totalSliderVisibleItems;

let currentSlidePos = 0;

const moveSliderItem = function () {
  sliderContainer.style.transform = `translateX(-${sliderContainer.children[currentSlidePos].offsetLeft}px)`;
}

/**
 * NEXT SLIDE
 */

const slideNext = function () {
  const slideEnd = currentSlidePos >= totalSlidableItems;

  if (slideEnd) {
    currentSlidePos = 0;
  } else {
    currentSlidePos++;
  }

  moveSliderItem();
}

sliderNextBtn.addEventListener("click", slideNext);

/**
 * PREVIOUS SLIDE
 */

const slidePrev = function () {
  if (currentSlidePos <= 0) {
    currentSlidePos = totalSlidableItems;
  } else {
    currentSlidePos--;
  }

  moveSliderItem();
}

sliderPrevBtn.addEventListener("click", slidePrev);

/**
 * RESPONSIVE
 */
window.addEventListener("resize", function () {
  totalSliderVisibleItems = Number(getComputedStyle(slider).getPropertyValue("--slider-items"));
  totalSlidableItems = sliderContainer.childElementCount - totalSliderVisibleItems;

  moveSliderItem();
});









"use strict";

// Function to fetch weather data for the past 7 days
const fetchWeatherData = async () => {
  const apiKey = "4c21304b59da33a8c0d0f41e25355d81"; // Replace with your actual API key
  const apiUrl = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=LOCATION&dt=DATE`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

// Function to update temperature monitor
const updateTemperatureMonitor = async () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDate = new Date();
  const temperatureMonitor = document.getElementById("temperature-monitor");
  if (!temperatureMonitor) return;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    
    // Fetch weather data for the date
    const weatherData = await fetchWeatherData(formattedDate);
    const temperature = weatherData?.forecast?.forecastday[0]?.day?.avgtemp_c;
    
    // Update HTML with temperature information
    const dayElement = temperatureMonitor.querySelector(`[data-day="${days[date.getDay()]}"]`);
    if (dayElement) {
      dayElement.textContent = `${days[date.getDay()]}: ${temperature}°C`;
    }
  }
};

// Call updateTemperatureMonitor function when the page loads
window.addEventListener("load", updateTemperatureMonitor);



/**
 * THEME TOGGLE
 */

const themeToggleBtn = document.getElementById("theme-toggle");
const themeToggleIcon = themeToggleBtn?.querySelector("ion-icon");

const toggleTheme = function () {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  updateThemeIcon(newTheme);
}

const updateThemeIcon = function (theme) {
  if (theme === "dark") {
    themeToggleIcon.setAttribute("name", "sunny-outline");
  } else {
    themeToggleIcon.setAttribute("name", "moon-outline");
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Initialize theme
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const initialTheme = savedTheme || systemTheme;

  document.documentElement.setAttribute("data-theme", initialTheme);
  updateThemeIcon(initialTheme);
}


/**
 * TOAST NOTIFICATION & SUBSCRIBE
 */

const showToast = function (message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Accessibility attributes
  if (type === 'success') {
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
  } else {
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
  }

  const icon = document.createElement('ion-icon');
  icon.name = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';
  icon.style.fontSize = '24px';
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
}

// Subscribe functionality
const subscribeButtons = document.querySelectorAll('.input-wrapper .btn-primary, .footer-list .btn-primary');

subscribeButtons.forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();

    // Find the wrapper container
    let wrapper = btn.closest('.input-wrapper');
    if (!wrapper) {
       // For footer where button is sibling to input wrappers
       wrapper = btn.parentElement;
    }

    const emailInput = wrapper ? wrapper.querySelector('input[type="email"]') : null;

    if (emailInput && emailInput.value.trim() !== '' && emailInput.value.includes('@')) {
      showToast('Thank you for subscribing! 🌱', 'success');
      emailInput.value = '';

      // Also clear name input if exists in the same container
      const nameInput = wrapper.querySelector('input[name="name"]');
      if (nameInput) nameInput.value = '';

    } else {
      showToast('Please enter a valid email address.', 'error');
      if (emailInput) emailInput.focus();
    }
  });
});

