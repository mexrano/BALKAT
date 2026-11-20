// ===== Ayarlar =====
// Siparişlerin gönderileceği WhatsApp numarası (ülke kodu ile, sadece rakam)
const WHATSAPP_NUMBER = '905353142777';
const BRAND_NAME = 'BALKAT';

const priceFormatter = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0
});

function formatPrice(value) {
    return `₺${priceFormatter.format(Number(value) || 0)}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderProducts(items = products) {
    const grid = document.getElementById('products-grid');
    const htmlArray = items.map((product, index) => {
        const id = escapeHtml(product.id);
        const name = escapeHtml(product.name);
        const image = escapeHtml(product.image);
        const isAvailable = product.available !== false;
        const loading = index < 4 ? 'eager' : 'lazy';
        const priceText = escapeHtml(formatPrice(product.price));

        return `
            <article class="card" data-id="${id}" data-available="${isAvailable}" aria-labelledby="p-${id}-title">
                <div class="card-media">
                    <img class="card-image" src="${image}"
                         alt="${name}" width="800" height="800"
                         loading="${loading}" decoding="async">
                    <span class="card-badge"${isAvailable ? ' hidden' : ''}>Tükendi</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title" id="p-${id}-title">${name}</h3>
                    <div class="card-bottom">
                        <span class="card-price">${priceText}</span>
                        <button class="btn-add" type="button" data-id="${id}"
                                aria-label="«${name}» sepete ekle"${isAvailable ? '' : ' disabled'}>+</button>
                    </div>
                </div>
            </article>
        `;
    });
    grid.innerHTML = htmlArray.join('');
}

renderProducts();

let cart = [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.available === false) return;
    const itemInCart = cart.find(item => item.id === productId);

    if (itemInCart) {
        itemInCart.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
}

const gridElement = document.getElementById('products-grid');

gridElement.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-add');
    if (!btn || btn.disabled) return;
    const productId = Number(btn.dataset.id);
    addToCart(productId);
});

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart-message">Sepetiniz henüz boş.<br>Yukarıdaki menüden tatlı ekleyebilirsiniz.</div>';
        totalContainer.textContent = formatPrice(0);
        updateCartBadge();
        return;
    }

    const htmlArray = cart.map(item => {
        const id = escapeHtml(item.id);
        const name = escapeHtml(item.name);
        const image = escapeHtml(item.image);
        const unitPrice = escapeHtml(formatPrice(item.price));
        const lineTotal = escapeHtml(formatPrice(item.price * item.quantity));
        const qty = escapeHtml(item.quantity);

        return `
            <div class="cart-item" data-id="${id}">
                <img src="${image}" alt="${name}" width="60" height="60" class="cart-item-img" loading="lazy" decoding="async">
                <div class="cart-item-info">
                    <span class="cart-item-name">${name}</span>
                    <div class="cart-item-prices">
                        <span class="cart-item-price">${unitPrice} / adet</span>
                        <span class="cart-item-subtotal">${lineTotal}</span>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="btn-qty btn-minus" type="button" data-id="${id}" aria-label="«${name}» miktarını azalt">−</button>
                        <span class="qty-value">${qty}</span>
                        <button class="btn-qty btn-plus" type="button" data-id="${id}" aria-label="«${name}» miktarını artır">+</button>
                    </div>
                    <button class="btn-remove" type="button" data-id="${id}" aria-label="«${name}» ürününü sepetten kaldır">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = htmlArray.join('');

    const totalPrice = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    totalContainer.textContent = formatPrice(totalPrice);
    updateCartBadge();
}

const cartItemsContainer = document.getElementById('cart-items');

cartItemsContainer.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn) return;
    const productId = Number(btn.dataset.id);
    const itemInCart = cart.find(item => item.id === productId);
    if (!itemInCart) return;

    if (btn.classList.contains('btn-plus')) {
        itemInCart.quantity++;
    } else if (btn.classList.contains('btn-minus')) {
        itemInCart.quantity--;
        if (itemInCart.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
    } else if (btn.classList.contains('btn-remove')) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        return;
    }

    renderCart();
});

// ===== Tarih & saat varsayılanları (iOS Safari uyumlu) =====
const dateInput = document.getElementById('order-date');
const timeInput = document.getElementById('order-time');

const OPEN_HOUR = 10;  // açılış
const CLOSE_HOUR = 22; // kapanış
const MAX_DAYS_AHEAD = 14;

const pad2 = (n) => String(n).padStart(2, '0');

// Cihazın yerel saatine göre YYYY-MM-DD (toISOString/UTC kullanılmaz)
const toLocalDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// HH:MM, başında sıfırla
const toLocalTime = (h, m = 0) => `${pad2(h)}:${pad2(m)}`;

// Şu anki yerel saate göre önerilen teslim alma tarihi ve saati
function getDefaultPickup() {
    const now = new Date();
    const pickupDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextHour = now.getHours() + 1;
    let hour;

    if (nextHour <= OPEN_HOUR) {
        // Gece / sabah erken: bugün 10:00
        hour = OPEN_HOUR;
    } else if (nextHour < CLOSE_HOUR) {
        // Çalışma saatleri içinde: bir sonraki tam saat
        hour = nextHour;
    } else {
        // Kapanışa yakın veya kapanıştan sonra: yarın 10:00
        pickupDay.setDate(pickupDay.getDate() + 1);
        hour = OPEN_HOUR;
    }

    const minDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const maxDay = new Date(minDay);
    maxDay.setDate(maxDay.getDate() + MAX_DAYS_AHEAD);

    return {
        date: toLocalDate(pickupDay),
        time: toLocalTime(hour),
        minDate: toLocalDate(minDay),
        maxDate: toLocalDate(maxDay)
    };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// force=true: değerleri her durumda yazar.
// force=false: sadece alan boşsa veya geçersizse doldurur (kullanıcının seçimini ezmez).
function applyPickupDefaults(force = false) {
    if (!dateInput || !timeInput) return;

    const d = getDefaultPickup();

    // Önce min/max, sonra value: değer hiçbir zaman sınırların dışında kalmaz
    dateInput.min = d.minDate;
    dateInput.max = d.maxDate;
    timeInput.min = toLocalTime(OPEN_HOUR);
    timeInput.max = toLocalTime(CLOSE_HOUR);

    const dateInvalid = !DATE_RE.test(dateInput.value)
        || dateInput.value < d.minDate
        || dateInput.value > d.maxDate;
    const timeInvalid = !TIME_RE.test(timeInput.value)
        || timeInput.value < timeInput.min
        || timeInput.value > timeInput.max;

    if (force || dateInvalid) {
        dateInput.setAttribute('value', d.date);
        dateInput.value = d.date;
    }
    if (force || timeInvalid) {
        timeInput.setAttribute('value', d.time);
        timeInput.value = d.time;
    }
}

// 1) Hemen
applyPickupDefaults(true);
// 2) DOM hazır olduğunda ve sayfa tamamen yüklendiğinde (iOS bazen ilk değeri göstermiyor)
document.addEventListener('DOMContentLoaded', () => applyPickupDefaults(false));
window.addEventListener('load', () => {
    applyPickupDefaults(false);
    setTimeout(() => applyPickupDefaults(false), 300);
});
// 3) WhatsApp'tan geri dönüldüğünde (bfcache) alanlar boş kaldıysa tekrar doldur
window.addEventListener('pageshow', () => applyPickupDefaults(false));

// "2026-11-21" -> "21 Kasım 2026 Cumartesi"
function formatDateTR(isoDate) {
    const d = new Date(`${isoDate}T00:00:00`);
    if (isNaN(d)) return isoDate;
    return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });
}

const orderForm = document.getElementById('wa-form');

orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (cart.length === 0) {
        alert('Lütfen sepetinize en az bir tatlı ekleyin.');
        return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const note = document.getElementById('order-note').value.trim();
    const date = formatDateTR(document.getElementById('order-date').value);
    const time = document.getElementById('order-time').value;

    let orderText = '';
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const lineTotal = item.price * item.quantity;
        orderText += `${index + 1}. ${item.name} × ${item.quantity} — ${formatPrice(lineTotal)}\n`;
        totalPrice += lineTotal;
    });

    // Not satırı sadece müşteri bir şey yazdıysa eklenir
    const noteLine = note ? `\n📝 *Not:* ${note}` : '';

    const message =
`Merhaba ${BRAND_NAME}! 👋
Web sitenizden gel-al sipariş vermek istiyorum.

🛒 *Siparişim:*
${orderText}
💰 *Toplam:* ${formatPrice(totalPrice)}

👤 *İsim:* ${name}
📅 *Teslim alma tarihi:* ${date}
⏰ *Saat:* ${time}${noteLine}

Siparişimi onaylayabilir misiniz? Şimdiden teşekkürler! 🍯`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Aynı sekmede yönlendirme: iOS Safari'de açılır pencere engellemesine takılmaz.
    // Form sıfırlanmadığı için tarih/saat alanları ve sepet olduğu gibi kalır.
    window.location.href = waUrl;
});

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;

    if (totalItems === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'flex';
    }
}

const filtersContainer = document.getElementById('filters');
const filterBtns = document.querySelectorAll('.filter-btn');

filtersContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('filter-btn')) {
        filterBtns.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const category = event.target.dataset.category;

        if (category === 'all') {
            renderProducts(products);
        } else {
            const filteredProducts = products.filter(p => p.category === category);
            renderProducts(filteredProducts);
        }
    }
});

renderCart();

