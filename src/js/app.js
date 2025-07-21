console.log('JS is running ✅');

import axios from 'axios';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/* ---------- Слайдер ---------- */
const slider = new Swiper('.swiper__container', {
  modules: [Navigation, Pagination],
  wrapperClass: 'swiper__wrapper',
  slideClass: 'swiper__slide',
  loop: true,
  navigation: {
    nextEl: '.swiper__button-next',
    prevEl: '.swiper__button-prev',
  },
  pagination: {
    el: '.swiper__pagination',
    clickable: true,
  },
});

/* ---------- Глобальные переменные ---------- */
let allProducts = [];
const productsContainer = document.querySelector('.products');
const counterEl = document.querySelector('.controls__counter');
const sortSelect = document.getElementById('sort-select');
const filterCheckboxes = document.querySelectorAll('input[name="filters"]');

/* ---------- Корзина ---------- */
let cart = [];
let removedItems = [];

function updateHeaderCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.querySelector('.header__cart-count');
  if (badge) badge.textContent = count;
}

function updateCartItemCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const countElement = document.querySelector('.cart-item-count');
  if (countElement) {
    countElement.textContent = `${count} ${getNoun(
      count,
      'товар',
      'товара',
      'товаров'
    )}`;
  }
  updateHeaderCartCount();
}

function getNoun(number, one, two, five) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

/* ---------- Работа с товарами ---------- */
function getPriceNumber(priceStr) {
  return Number(priceStr.replace(/[^0-9]/g, '')) || 0;
}

function renderProducts(list) {
  if (!productsContainer) return;
  productsContainer.innerHTML = '';

  list.forEach(p => {
    const priceNumber = getPriceNumber(p.price);
    const imgFile = p.img || 'default.jpg'; // если не указано — подставим дефолт

    const item = document.createElement('div');
    item.className = 'products__item products__item--default';
    item.innerHTML = `
      <div class="products__item--image-container">
        <div class="products__item--image-border">
          <img
            class="products__item--image"
            src="/img/${imgFile}"
            alt="${p.name}"
            onerror="this.src='/img/default.jpg'; this.onerror=null;"
          >
        </div>
      </div>
      <div class="products__item--info">
        <span class="products__item--name">${p.name}</span>
        <div class="products__item--price">${priceNumber.toLocaleString(
          'ru-RU'
        )} ₽</div>
        <button class="add-to-cart" data-id="${p.id}">
         +
        </button>
      </div>
    `;

    productsContainer.appendChild(item);
  });

  if (counterEl) counterEl.textContent = `${list.length} товаров`;
}


function sortProducts(list, mode) {
  const sorted = [...list];
  switch (mode) {
    case 'expensive':
      sorted.sort((a, b) => getPriceNumber(b.price) - getPriceNumber(a.price));
      break;
    case 'cheap':
      sorted.sort((a, b) => getPriceNumber(a.price) - getPriceNumber(b.price));
      break;
    case 'new':
      sorted.sort((a, b) => b.id - a.id);
      break;
    case 'popular':
      break;
  }
  return sorted;
}

function getActiveFilters() {
  return Array.from(filterCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}

function filterProducts(list, active) {
  if (!active.length) return list;
  return list.filter(p => {
    if (Array.isArray(p.tags)) {
      return active.every(tag => p.tags.includes(tag));
    }
    if (p.category) {
      return active.includes(p.category);
    }
    return false;
  });
}

function applyFiltersAndSort() {
  const active = getActiveFilters();
  const filtered = filterProducts(allProducts, active);
  const sorted = sortProducts(filtered, sortOption);
  renderProducts(sorted);
}

filterCheckboxes.forEach(cb =>
  cb.addEventListener('change', applyFiltersAndSort)
);

/* ---------- Модальные окна ---------- */
const body = document.body;

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  body.classList.add('modal-open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  body.classList.remove('modal-open');
}

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (
      e.target.classList.contains('modal__overlay') ||
      e.target.classList.contains('modal__close')
    ) {
      closeModal(modal);
    }
  });
});

const filtersOpenBtn = document.querySelector('.filters-open-btn');
const burgerBtn = document.querySelector('.header__burger');

if (filtersOpenBtn) {
  filtersOpenBtn.addEventListener('click', () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const modalId = isMobile ? 'filters-modal--bottom' : 'filters-modal';
    openModal(document.getElementById(modalId));
  });
}

if (burgerBtn) {
  burgerBtn.addEventListener('click', () =>
    openModal(document.getElementById('mobile-menu'))
  );
}

/* ---------- Корзина: логика ---------- */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₽';
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;

  const existing = cart.find(i => i.id == productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: productId,
      qty: 1,
      price: product.price,
      name: product.name,
      img: product.img,
    });
  }

  saveCart();
  updateCartItemCount();
  renderCart();
}

if (productsContainer) {
  productsContainer.addEventListener('click', e => {
    const button = e.target.closest('.add-to-cart');
    if (button) {
      const id = button.dataset.id;
      addToCart(id);
    }
  });
}

function updateCartTotal() {
  const total = cart.reduce(
    (sum, item) => sum + getPriceNumber(item.price) * item.qty,
    0
  );
  const totalEl = document.querySelector('.cart-total');
  if (totalEl) totalEl.textContent = `Итого ${formatPrice(total)}`;
}

function renderCart() {
  const wrapper = document.querySelector('.cart-items');
  if (!wrapper) return;

  wrapper.innerHTML = '';

  if (!cart.length) {
    const emptyCart = document.createElement('div');
    emptyCart.className = 'empty-cart';
    emptyCart.innerHTML = `
      <p>Корзина пуста</p>
    `;
    wrapper.appendChild(emptyCart);
    updateCartTotal();
    updateCartItemCount();
    return;
  }

  cart.forEach(item => {
    const product = allProducts.find(p => p.id == item.id) || item;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = item.id;

    row.innerHTML = `
      <img src="/img/${product.img}" alt="${
      product.name
    }" class="cart-item__img" />
      <div class="cart-item__info">
        <span class="products__item--name cart-item__name">${
          product.name
        }</span>
        <span class="products__item--price cart-item__price">${formatPrice(
          getPriceNumber(item.price) * item.qty
        )}</span>
      </div>
      <div class="cart-item__qty">
        <button class="qty-btn qty-minus" ${
          item.qty <= 1 ? 'disabled' : ''
        }>−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn qty-plus">+</button>
      </div>
      <button class="cart-item__remove" title="Удалить товар">×</button>
    `;

    wrapper.appendChild(row);
  });

  wrapper.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.closest('.cart-item').dataset.id;
      const item = cart.find(i => i.id == id);
      if (item.qty > 1) {
        item.qty--;
      } else {
        removedItems.unshift(cart.splice(cart.indexOf(item), 1)[0]);
      }
      saveCart();
      renderCart();
    });
  });

  wrapper.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.closest('.cart-item').dataset.id;
      const item = cart.find(i => i.id == id);
      if (item) {
        item.qty++;
        saveCart();
        renderCart();
      }
    });
  });

  wrapper.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.closest('.cart-item').dataset.id;
      const idx = cart.findIndex(i => i.id == id);
      if (idx > -1) {
        removedItems.unshift(cart.splice(idx, 1)[0]);
        saveCart();
        renderCart();
      }
    });
  });

  updateCartTotal();
  updateCartItemCount();
}

function clearCart() {
  removedItems = [...cart];
  cart = [];
  saveCart();
  renderCart();
  updateCartItemCount();
}

function restoreRemovedItems() {
  cart = [...cart, ...removedItems];
  removedItems = [];
  saveCart();
  renderCart();
  updateCartItemCount();
}

/* ---------- Инициализация ---------- */
function initCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
  }

  const clearCartBtn = document.querySelector('.clear-cart');
  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

  const cartBtn = document.querySelector('.header__action--cart');
  const cartModal = document.querySelector('#cart-modal');
  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', e => {
      e.preventDefault();
      openModal(cartModal);
    });
  }

  renderCart();
}

/* ---------- Сортировка ---------- */
let sortOption = 'expensive';

const sortButton = document.getElementById('sort-button');
const sortPopup = document.getElementById('sort-popup');
const sortOverlay = document.getElementById('sort-overlay');

function toggleSortPopup(show) {
  const isVisible = show ?? sortButton.getAttribute('aria-expanded') !== 'true';
  sortButton.setAttribute('aria-expanded', isVisible);
  sortPopup.setAttribute('data-visible', isVisible);
  sortOverlay.setAttribute('data-visible', isVisible);
  document.body.classList.toggle('sort-popup-open', isVisible);
}

if (sortButton && sortPopup && sortOverlay) {
  sortButton.setAttribute('aria-expanded', 'false');
  sortButton.addEventListener('click', e => {
    e.stopPropagation();
    toggleSortPopup();
  });
  sortOverlay.addEventListener('click', () => toggleSortPopup(false));
  sortPopup.addEventListener('click', e => {
    const option = e.target.closest('.sorting__option');
    if (!option) return;
    sortOption = option.dataset.value;
    sortButton.textContent = option.textContent;
    sortPopup
      .querySelectorAll('.sorting__option')
      .forEach(opt =>
        opt.setAttribute('data-selected', opt === option ? 'true' : 'false')
      );
    toggleSortPopup(false);
    applyFiltersAndSort();
  });
  document.addEventListener('keydown', e => {
    if (
      e.key === 'Escape' &&
      sortPopup.getAttribute('data-visible') === 'true'
    ) {
      toggleSortPopup(false);
    }
  });
  const defaultOption = sortPopup.querySelector(`[data-value="${sortOption}"]`);
  if (defaultOption) {
    defaultOption.setAttribute('data-selected', 'true');
    sortButton.textContent = defaultOption.textContent;
  }
}

/* ---------- Загрузка товаров ---------- */
axios
  .get('https://687b93a5b4bc7cfbda8659d5.mockapi.io/catalog-paint/products')
  .then(response => {
    allProducts = response.data;
    applyFiltersAndSort();
    initCart();
    updateHeaderCartCount();
  });

document.addEventListener('DOMContentLoaded', initCart);
