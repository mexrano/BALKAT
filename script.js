// ===== Ayarlar =====
// Siparişlerin gönderileceği WhatsApp numarası (ülke kodu ile, sadece rakam)
const WHATSAPP_NUMBER = '905353142777';
const BRAND_NAME = 'BALKAT';

function renderProducts(items = products) {
    const grid = document.getElementById('products-grid');
    const htmlArray = items.map((product) => {
        return `
            <article class="card">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${product.name}</h3>
                    <div class="card-bottom">
                        <span class="card-price">₺${product.price}</span>
                        <button class="btn-add" data-id="${product.id}" aria-label="Sepete ekle">+</button>
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
    if (event.target.classList.contains('btn-add')) {
        const productId = Number(event.target.dataset.id);
        addToCart(productId);
    }
});

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart-message">Sepetiniz henüz boş.<br>Yukarıdaki menüden tatlı ekleyebilirsiniz.</div>';
        totalContainer.textContent = '₺0';
        updateCartBadge();
        return;
    }

    const htmlArray = cart.map(item => {
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">₺${item.price}</span>
                </div>
                <div class="quantity-controls">
                    <button class="btn-qty btn-minus" data-id="${item.id}">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="btn-qty btn-plus" data-id="${item.id}">+</button>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = htmlArray.join('');

    const totalPrice = cart.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    totalContainer.textContent = `₺${totalPrice}`;
    updateCartBadge();
}

const cartItemsContainer = document.getElementById('cart-items');

cartItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-qty')) {
        const productId = Number(event.target.dataset.id);
        const itemInCart = cart.find(item => item.id === productId);

        if (!itemInCart) return;

        if (event.target.classList.contains('btn-plus')) {
            itemInCart.quantity++;
        } else if (event.target.classList.contains('btn-minus')) {
            itemInCart.quantity--;
            if (itemInCart.quantity === 0) {
                cart = cart.filter(item => item.id !== productId);
            }
        }

        renderCart();
    }
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
        orderText += `${index + 1}. ${item.name} × ${item.quantity} — ₺${lineTotal}\n`;
        totalPrice += lineTotal;
    });

    // Not satırı sadece müşteri bir şey yazdıysa eklenir
    const noteLine = note ? `\n📝 *Not:* ${note}` : '';

    const message =
`Merhaba ${BRAND_NAME}! 👋
Web sitenizden gel-al sipariş vermek istiyorum.

🛒 *Siparişim:*
${orderText}
💰 *Toplam:* ₺${totalPrice}

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

