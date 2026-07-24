(function () {
  'use strict';

  const EBAY_STORE = 'https://www.ebay.ca/str/zvintag3';
  const ITEMS_PER_PAGE = 24;

  let products = [];
  let filteredProducts = [];
  let activeCategory = 'all';
  let currentPage = 1;

  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const productsGrid = document.getElementById('productsGrid');
  const productsMeta = document.getElementById('productsMeta');
  const pagination = document.getElementById('pagination');
  const categoryCards = document.querySelectorAll('.category-card');

  function categorizeProduct(title) {
    const t = title.toLowerCase();
    if (/\b(tee|t-shirt|ringer)\b/.test(t)) return 'retro-tees';
    if (/\b(jeans|denim|levi)\b/.test(t)) return 'denim';
    if (/\b(bag|satchel|hat|cap|duffle|driver)\b/.test(t)) return 'accessories';
    if (/\b(vintage)\b/.test(t)) return 'vintage-clothing';
    return 'streetwear';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getTotalPages(itemCount) {
    return Math.max(1, Math.ceil(itemCount / ITEMS_PER_PAGE));
  }

  function getPageItems(items, page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }

  function renderProductCard(product) {
    const title = escapeHtml(product.title);
    const image = escapeHtml(product.image);
    const url = escapeHtml(product.url);
    const priceLabel = product.price ? escapeHtml(product.price) : '';
    const priceHtml = priceLabel
      ? '<span class="product-card__price">' + priceLabel + '</span>'
      : '';

    return (
      '<article class="product-card">' +
        '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="product-card__link" aria-label="View ' + title + ' on eBay for ' + (priceLabel || 'listed price') + '">' +
          '<div class="product-card__image-wrap">' +
            '<img src="' + image + '" alt="' + title + '" class="product-card__image" loading="lazy" width="500" height="500">' +
            priceHtml +
          '</div>' +
          '<div class="product-card__body">' +
            '<h3 class="product-card__title">' + title + '</h3>' +
            '<span class="product-card__cta">View on eBay</span>' +
          '</div>' +
        '</a>' +
      '</article>'
    );
  }

  function renderProductsMeta(items, page) {
    if (!items.length) {
      productsMeta.innerHTML = '';
      productsMeta.hidden = true;
      return;
    }

    const start = (page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(page * ITEMS_PER_PAGE, items.length);
    productsMeta.hidden = false;
    productsMeta.textContent = 'Showing ' + start + '–' + end + ' of ' + items.length + ' items';
  }

  function getPaginationRange(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, function (_, i) { return i + 1; });
    }

    const pages = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      pages.push('ellipsis-start');
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < total - 1) {
      pages.push('ellipsis-end');
    }

    pages.push(total);
    return pages;
  }

  function renderPagination(items, page) {
    const totalPages = getTotalPages(items.length);

    if (items.length <= ITEMS_PER_PAGE) {
      pagination.innerHTML = '';
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;
    const pages = getPaginationRange(page, totalPages);

    let html = '<div class="pagination__inner">';
    html += '<button class="pagination__btn pagination__btn--nav" data-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '>Previous</button>';
    html += '<div class="pagination__pages">';

    pages.forEach(function (entry) {
      if (typeof entry === 'string') {
        html += '<span class="pagination__ellipsis">…</span>';
        return;
      }

      const isActive = entry === page;
      html += '<button class="pagination__btn pagination__btn--page' + (isActive ? ' is-active' : '') + '" data-page="' + entry + '" ' + (isActive ? 'aria-current="page"' : '') + '>' + entry + '</button>';
    });

    html += '</div>';
    html += '<button class="pagination__btn pagination__btn--nav" data-page="' + (page + 1) + '" ' + (page === totalPages ? 'disabled' : '') + '>Next</button>';
    html += '</div>';

    pagination.innerHTML = html;
  }

  function renderCatalog() {
    const pageItems = getPageItems(filteredProducts, currentPage);

    if (!filteredProducts.length) {
      productsGrid.innerHTML = '<p class="products__empty">No items in this category. <a href="' + EBAY_STORE + '" target="_blank" rel="noopener noreferrer">Browse all on eBay</a></p>';
      renderProductsMeta([], currentPage);
      renderPagination([], currentPage);
      return;
    }

    productsGrid.innerHTML = pageItems.map(renderProductCard).join('');
    renderProductsMeta(filteredProducts, currentPage);
    renderPagination(filteredProducts, currentPage);
  }

  function goToPage(page, scrollToShop) {
    const totalPages = getTotalPages(filteredProducts.length);
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (nextPage === currentPage) {
      return;
    }

    currentPage = nextPage;
    renderCatalog();

    if (scrollToShop) {
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function applyFilters() {
    filteredProducts = activeCategory === 'all'
      ? products.slice()
      : products.filter(function (p) {
          const cat = p.category || categorizeProduct(p.title);
          return cat === activeCategory;
        });

    currentPage = 1;
    renderCatalog();
  }

  function filterProducts(category) {
    activeCategory = category;
    categoryCards.forEach(function (card) {
      card.classList.toggle('category-card--active', card.dataset.category === category);
    });
    applyFilters();
  }

  function loadProducts() {
    const productsUrl = new URL('assets/products.json', window.location.href).href;
    fetch(productsUrl, { cache: 'no-store' })
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
        applyFilters();
      })
      .catch(function () {
        productsGrid.innerHTML = '<p class="products__empty">Could not load products. <a href="' + EBAY_STORE + '" target="_blank" rel="noopener noreferrer">Visit our eBay store</a></p>';
        productsMeta.hidden = true;
        pagination.hidden = true;
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
        filterProducts(link.dataset.filter);
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initPagination() {
    pagination.addEventListener('click', function (event) {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) {
        return;
      }

      goToPage(Number(button.dataset.page), true);
    });
  }

  initHeader();
  initMobileNav();
  initCategories();
  initPagination();
  loadProducts();
})();
