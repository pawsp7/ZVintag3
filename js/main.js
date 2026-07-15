(function () {
  'use strict';

  const EBAY_STORE = 'https://www.ebay.ca/str/zvintag3';
  let products = [];
  let activeCategory = 'all';

  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const productsGrid = document.getElementById('productsGrid');
  const categoryCards = document.querySelectorAll('.category-card');

  function categorizeProduct(title) {
    const t = title.toLowerCase();
    if (/\b(tee|t-shirt|ringer)\b/.test(t)) return 'retro-tees';
    if (/\b(jeans|denim|levi)\b/.test(t)) return 'denim';
    if (/\b(bag|satchel|hat|cap|duffle|driver)\b/.test(t)) return 'accessories';
    if (/\b(vintage)\b/.test(t)) return 'vintage-clothing';
    return 'streetwear';
  }

  function renderProducts(items) {
    if (!items.length) {
      productsGrid.innerHTML = '<p class="products__empty">No items in this category. <a href="' + EBAY_STORE + '" target="_blank" rel="noopener noreferrer">Browse all on eBay</a></p>';
      return;
    }

    productsGrid.innerHTML = items.map(function (product) {
      const title = escapeHtml(product.title);
      const image = escapeHtml(product.image);
      const url = escapeHtml(product.url);
      return (
        '<article class="product-card">' +
          '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="product-card__link" aria-label="View ' + title + ' on eBay">' +
            '<div class="product-card__image-wrap">' +
              '<img src="' + image + '" alt="' + title + '" class="product-card__image" loading="lazy" width="500" height="500">' +
            '</div>' +
            '<div class="product-card__body">' +
              '<h3 class="product-card__title">' + title + '</h3>' +
              '<span class="product-card__cta">View on eBay</span>' +
            '</div>' +
          '</a>' +
        '</article>'
      );
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function filterProducts(category) {
    activeCategory = category;
    categoryCards.forEach(function (card) {
      card.classList.toggle('category-card--active', card.dataset.category === category);
    });

    const filtered = category === 'all'
      ? products
      : products.filter(function (p) {
          const cat = p.category || categorizeProduct(p.title);
          return cat === category;
        });

    renderProducts(filtered);
  }

  function loadProducts() {
    fetch('assets/products.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then(function (data) {
        products = data.map(function (p) {
          return Object.assign({}, p, {
            category: p.category || categorizeProduct(p.title)
          });
        });
        renderProducts(products);
      })
      .catch(function () {
        productsGrid.innerHTML = '<p class="products__empty">Could not load products. <a href="' + EBAY_STORE + '" target="_blank" rel="noopener noreferrer">Visit our eBay store</a></p>';
      });
  }

  function initHeader() {
    window.addEventListener('scroll', function () {
      header.classList.toggle('header--scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  function initMobileNav() {
    menuToggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  function initCategories() {
    categoryCards.forEach(function (card) {
      card.addEventListener('click', function () {
        filterProducts(card.dataset.category);
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-filter]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const filter = link.dataset.filter;
        filterProducts(filter);
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  initHeader();
  initMobileNav();
  initCategories();
  loadProducts();
})();
