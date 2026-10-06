// Функция отображения категорий магазина 
function showCategories() {
    const container = document.getElementById('menu-buttons-container');
    const title = document.getElementById('menu-title');
    const backBtn = document.getElementById('back-btn');

    if (!container || !title || !backBtn) return;

    title.innerText = "Выберите категорию";
    backBtn.classList.add('hidden'); 
    container.innerHTML = ''; 

    // Твои реальные категории из базы данных с красивыми эмодзи
    const categories = [
        { id: "food", label: "Еда" },
        { id: "drink", label: "Напитки" },
        { id: "meds", label: "Аптека" },
        { id: "cloth", label: "Одежда" },
        { id: "guitar", label: "Гитары" },
        { id: "eqp", label: "Усилители" }
    ];

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'action-location-btn';
        btn.innerText = cat.label;
        // Передаем точный id (например, 'food'), который ждет твой Flask
        btn.onclick = () => loadShopItems(cat.id, cat.label);
        container.appendChild(btn);
    });
}


// Асинхронная загрузка товаров из Flask по выбранной категории
async function loadShopItems(categoryId, categoryLabel) {
    const container = document.getElementById('menu-buttons-container');
    const title = document.getElementById('menu-title');
    const backBtn = document.getElementById('back-btn');

    if (!container || !title || !backBtn) return;

    title.innerText = categoryLabel;
    backBtn.classList.remove('hidden'); // Показываем кнопку "Назад"
    container.innerHTML = "<div class='loading' style='color: #ccc; text-align: center; padding: 15px;'>Загрузка товаров...</div>";

    try {
        // Делаем POST-запрос к Flask-серверу на роут /shop
        const response = await fetch('/shop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_type: categoryId })
        });

        const items = await response.json();
        container.innerHTML = ''; 

        // ИСПРАВЛЕНИЕ: Отфильтровываем товары, у которых цена больше 0
        const visibleItems = items.filter(item => item.price > 0);

        // Если товаров с ценой выше 0 в данной категории нет
        if (visibleItems.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:15px; color: #ccc;'>Товаров пока нет</p>";
            return;
        }

        // Отрисовываем только платные товары в виде кнопок нового дизайна
        visibleItems.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'action-location-btn';
            
            // Заполняем структуру: Название слева, Цена справа
            btn.innerHTML = `
                <span>${item.name}</span>
                <span class="btn-price">${item.price} $</span>
            `;
            
            // При клике на товар запускаем функцию покупки
            btn.onclick = () => buyItem(item.id);
            container.appendChild(btn);
        });

    } catch (error) {
        console.error("Ошибка магазина:", error);
        container.innerHTML = "<p style='text-align:center; color:red; padding:15px;'>Ошибка загрузки</p>";
    }
}

// Асинхронный запрос на покупку предмета
async function buyItem(itemId) {
    console.log("Отправка запроса на покупку ID:", itemId);

    try {
        const response = await fetch('/buy_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: itemId })
        });

        const data = await response.json();

        if (data.status === "success") {
            alert(data.message);

            // Ищем кошелек игрока на странице и обновляем баланс
            const wallet = document.querySelector(".wallet-img");
            if (wallet) {
                wallet.innerText = `💰 $${data.money}`;
            }
        } else {
            // Показываем ошибку от сервера (например, "Недостаточно средств")
            alert(data.message);
        }

    } catch (error) {
        console.error("Критическая ошибка при покупке:", error);
        alert("Ошибка связи с сервером. Попробуйте позже.");
    }
}

// Запускаем отображение категорий сразу после загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
    showCategories();
});
