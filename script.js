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

const phoneInput = document.getElementById('customer-phone');

phoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^\d+\s-]/g, '');
});

const dateInput = document.getElementById('order-date');

const today = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 14);

const formatDate = (date) => date.toLocaleDateString('en-CA');

dateInput.min = formatDate(today);
dateInput.value = formatDate(today);
dateInput.max = formatDate(maxDate);

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

    const digitsOnly = phoneInput.value.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
        alert('Lütfen geçerli bir telefon numarası girin (en az 10 hane).');
        return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const phone = phoneInput.value.trim();
    const date = formatDateTR(document.getElementById('order-date').value);
    const time = document.getElementById('order-time').value;

    let orderText = '';
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const lineTotal = item.price * item.quantity;
        orderText += `${index + 1}. ${item.name} × ${item.quantity} — ₺${lineTotal}\n`;
        totalPrice += lineTotal;
    });

    const message =
`Merhaba ${BRAND_NAME}! 👋
Web sitenizden gel-al sipariş vermek istiyorum.

🛒 *Siparişim:*
${orderText}
💰 *Toplam:* ₺${totalPrice}

👤 *Ad Soyad:* ${name}
📞 *Telefon:* ${phone}
📅 *Teslim alma tarihi:* ${date}
⏰ *Saat:* ${time}

Siparişimi onaylayabilir misiniz? Şimdiden teşekkürler! 🍯`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Yeni sekmede WhatsApp'ı aç; açılır pencere engellenirse aynı sekmede yönlendir
    const win = window.open(waUrl, '_blank');
    if (!win) {
        window.location.href = waUrl;
    }
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
const timeInput = document.getElementById('order-time');
const nextHour = today.getHours() + 1;

if (nextHour < 10 || nextHour >= 22) {
    timeInput.value = '10:00';
} else {
    timeInput.value = `${String(nextHour).padStart(2, '0')}:00`;
}
