// Используем addEventListener вместо onload для надежности
document.addEventListener("DOMContentLoaded", function () {
  // 1. Элементы интерфейса
  const phoneBtn = document.querySelector(".PhoneDiv");
  const modal = document.getElementById("phone-modal");
  const closeBtn = document.getElementById("close-phone");
  const click = document.getElementById("click");
  const hourElem = document.querySelector(".HourDiv");
  const minElem = document.querySelector(".MinuteDiv");

  // Экраны (меню) телефона
  const mainMenu = document.getElementById("main-phone-menu");
  const invMenu = document.getElementById("inventory-menu"); // Старый экран телефона (если остался в HTML)
  const shopMenu = document.getElementById("shop-menu");
  const jobMenu = document.getElementById("job-menu");

  // Кнопки открытия внутри телефона
  const openInvBtn = document.getElementById("open-inventory");
  const openShopBtn = document.getElementById("open-shop");
  const openJobBtn = document.getElementById("open-job");
  
  // Кнопки возврата внутри телефона
  const backInvBtn = document.getElementById("back-to-menu");
  const backShopBtn = document.getElementById("back-from-shop");
  const backJobBtn = document.getElementById("back-from-job");

  // Элементы НОВОГО РЮКЗАКА ИЗ ХЕДЕРА
  const headerInvBtn = document.getElementById('inventory-trigger');
  const headerInvWindow = document.getElementById('inventory-window');
  const headerInvClose = document.getElementById('inventory-close');

  // 2. Инициализация (запуск функций ПРИ ЗАГРУЗКЕ СТРАНИЦЫ)
  const startHP = parseInt(document.querySelector(".hp span").innerText);
  const startEn = parseInt(document.querySelector(".energy span").innerText);
  const startWt = parseInt(document.querySelector(".hydration span").innerText);
  const startFd = parseInt(document.querySelector(".satiety span").innerText);
  
  updateStat("hp-fill", startHP, 100);
  updateStat("energy-fill", startEn, 100);
  updateStat("water-fill", startWt, 100);
  updateStat("food-fill", startFd, 100);
  updateXP();
  checkUnlocks();

  // ==========================================================================
  // ЛОГИКА НОВОГО РЮКЗАКА (ХЕДЕР)
  // ==========================================================================
  if (headerInvBtn && headerInvWindow && headerInvClose) {
    // Открытие рюкзака по клику на блок слева
    headerInvBtn.addEventListener('click', () => {
      headerInvWindow.classList.remove('hidden');
      loadHeaderInventory(); // Загружаем предметы в сетку хедера
    });

    // Закрытие на крестик
    headerInvClose.addEventListener('click', () => {
      headerInvWindow.classList.add('hidden');
    });

    // Закрытие по нажатию на клавишу Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        headerInvWindow.classList.add('hidden');
      }
    });
  }

  // Функция для динамической отрисовки предметов в новой сетке рюкзака
  async function loadHeaderInventory() {
    const grid = document.querySelector(".inventory-grid");
    if (!grid) return;

    grid.innerHTML = "<div style='grid-column: span 4; text-align: center; font-size: 14px;'>Загрузка...</div>";

    try {
      const response = await fetch('/get_inventory');
      const items = await response.json();
      grid.innerHTML = ""; // Очищаем текст загрузки

      // Отрисовываем ровно 8 слотов (как в твоем HTML)
      for (let i = 0; i < 8; i++) {
        const slot = document.createElement("div");
        slot.className = "inventory-slot";

        // Если под текущим индексом на бэкенде есть предмет — заполняем ячейку
        if (items[i]) {
          const item = items[i];
          const isEquipped = item.is_equipped;

          // Наполняем слот: картинка + счетчик предметов
          slot.innerHTML = `
            <img src="../static/img/items/${item.image || 'default.png'}" alt="${item.name}">
            <span class="slot-count">x${item.quantity}</span>
          `;
          
          slot.style.cursor = "pointer";
          // Всплывающая подсказка при наведении мышки на ячейку
          slot.title = `${item.name}: ${item.description} ${isEquipped ? '[Надето]' : ''}`;
          
          // При клике по ячейке используем вещь (вызывается глобальная функция window.useItem)
          slot.onclick = async () => {
            await window.useItem(item.id);
            loadHeaderInventory(); // Мгновенно обновляем сетку рюкзака после использования
          };
        }
        grid.appendChild(slot);
      }
    } catch (error) {
      console.error("Ошибка обновления рюкзака:", error);
      grid.innerHTML = "<div style='grid-column: span 4; text-align: center; color: red;'>Ошибка</div>";
    }
  }

  // ==========================================================================
  // КНОПКИ ПЕРЕКЛЮЧЕНИЯ И ДЕЙСТВИЯ СТРАНИЦЫ
  // ==========================================================================
  
  // Старая кнопка телефона теперь просто может открывать рюкзак в шапке для подстраховки
  if (openInvBtn) {
    openInvBtn.onclick = () => {
      console.log("Инвентарь открывается в шапке...");
      if (headerInvWindow) headerInvWindow.classList.remove('hidden');
      loadHeaderInventory();
      modal.style.display = "none"; // Закрываем телефон, чтобы не мешал
    };
  }

  if (openShopBtn) {
    openShopBtn.onclick = () => {
      console.log("Открываем магазин...");
      switchScreen(shopMenu);
    };
  }

  if (openJobBtn) {
    openJobBtn.onclick = () => {
      console.log("Открываем работу...");
      switchScreen(jobMenu);
    };
  }

  if (click) {
    click.onclick = async (e) => {
      e.preventDefault();
      const response = await fetch('/click', { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();

        if (data.status === "active") {
          showEventModal(data);
        } else if (data.status === "death") {
          window.location.href = "/death";
        } else {
          updateUI(data);
        }
      }
    };
  }

  // Функция обновления всего UI данными с сервера
  window.updateUI = function(data) {
    console.log("Обновление интерфейса данными:", data);
  
    updateStat("hp-fill", data.hp, 100);
    updateStat("energy-fill", data.energy, 100);
    updateStat("water-fill", data.water, 100);
    updateStat("food-fill", data.food, 100);

    if (hourElem && minElem) {
      let hours = Math.floor(data.time / 60);
      let minutes = data.time % 60;
      hourElem.innerText = String(hours).padStart(2, '0');
      minElem.innerText = String(minutes).padStart(2, '0');
    }

    document.querySelector(".hp span").innerText = `${data.hp}HP/100HP`;
    document.querySelector(".energy span").innerText = `${data.energy}/100 ENERGY`;
    document.querySelector(".hydration span").innerText = `${data.water}/100 WATER`;
    document.querySelector(".satiety span").innerText = `${data.food}/100 FOOD`;
    
    // Обновляем деньги и в телефоне, и в HUD-шапке
    const phoneWallet = document.querySelector(".wallet-img");
    if (phoneWallet) phoneWallet.innerText = `💰 $${data.money}`;
    
    const hudMoney = document.querySelector(".money-label");
    if (hudMoney) hudMoney.innerText = data.money;
    
    const xpElem = document.getElementById("current-xp");
    if (xpElem) xpElem.innerText = data.xp;
    
    updateXP();
    checkUnlocks();
  };

  // Показ окна игровой ситуации
  function showEventModal(data) {
    const eventModal = document.getElementById("event-modal");
    document.getElementById("event-name").innerText = data.name;
    document.getElementById("event-desc").innerText = data.description;
    
    const container = document.getElementById("event-choices");
    container.innerHTML = ""; 

    data.choice.forEach((text, index) => {
      if (text && text.trim() !== "") {
        const btn = document.createElement("button");
        btn.className = "choice-btn"; 
        btn.innerText = text;
        btn.onclick = () => makeChoice(data.situation_id, index + 1);
        container.appendChild(btn);
      }
    });
    eventModal.style.display = "flex";
  }

  // Отправка выбора игрока на сервер
  async function makeChoice(sitId, choiceNum) {
    const response = await fetch('/choice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situation_id: sitId, choice_num: choiceNum })
    });

    if (response.ok) {
      const data = await response.json();
      updateUI(data); 

      document.getElementById("event-desc").innerText = data.result;
      
      const container = document.getElementById("event-choices");
      container.innerHTML = "";

      const closeBtn = document.createElement("button");
      closeBtn.className = "choice-btn"; 
      closeBtn.innerText = "Понятно";
      closeBtn.onclick = () => {
        document.getElementById("event-modal").style.display = "none";
      };
      container.appendChild(closeBtn);
    }
  }

  // Функция переключения экранов внутри телефона
  function switchScreen(toShow) {
    [mainMenu, invMenu, shopMenu, jobMenu].forEach((m) => {
      if (m) m.style.display = "none";
    });
    if (toShow) toShow.style.display = "block";
  }

  // Клик по кнопке телефона для вызова модалки
  if (phoneBtn && modal) {
    phoneBtn.onclick = () => {
      modal.style.display = "flex";
      switchScreen(mainMenu);
    };
  }

  // Кнопки "Назад" внутри телефона
  if (backInvBtn) backInvBtn.onclick = () => switchScreen(mainMenu);
  if (backShopBtn) {
    backShopBtn.onclick = () => {
      const categoriesGrid = document.getElementById("shop-categories-grid");
      const itemsContainer = document.getElementById("shop-items-container");

      if (itemsContainer && itemsContainer.style.display === "block") {
        itemsContainer.style.display = "none";  
        itemsContainer.innerHTML = "";         
        categoriesGrid.style.display = "grid"; 
      } else {
        switchScreen(mainMenu);
}
};
}
if (backJobBtn) backJobBtn.onclick = () => switchScreen(mainMenu);
// Закрытие модального окна телефона
if (closeBtn) {
closeBtn.onclick = () => {
modal.style.display = "none";
};
}
window.onclick = (e) => {
if (e.target === modal) modal.style.display = "none";
};
// Асинхронное использование предмета
window.useItem = async function(invId) {
try {
const response = await fetch('/use_item', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ inv_id: invId })
});
if (response.ok) {
const data = await response.json();
if (data.status === "success" || data.status === "unequipped") {
window.updateUI(data);
} else {
alert(data.message || "Ошибка");
}
}
} catch (error) {
console.error("Критическая ошибка:", error);
}
};
// Асинхронная покупка предмета
window.buyItem = async function(itemId) {
console.log("Пытаемся купить предмет с ID:", itemId);
try {
const response = await fetch('/buy_item', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ item_id: itemId })
});
const data = await response.json();
if (data.status === "success") {
alert(data.message);
// Обновляем деньги в телефоне
const wallet = document.querySelector(".wallet-img");
if (wallet) wallet.innerText = `💰 $${data.money}`;
// Обновляем деньги в HUD-шапке
const hudMoney = document.querySelector(".money-label");
if (hudMoney) hudMoney.innerText = data.money;
// Если открыт рюкзак — сразу обновляем и его содержимое
if (headerInvWindow && !headerInvWindow.classList.contains('hidden')) {
loadHeaderInventory();
}
} else {
alert(data.message);
}
} catch (error) {
console.error("Критическая ошибка при покупке:", error);
alert("Ошибка связи с сервером. Попробуйте позже.");
}
};
// Загрузка товаров по категориям в магазине
window.loadShop = async function(categoryType) {
const categoriesGrid = document.getElementById("shop-categories-grid");
const itemsContainer = document.getElementById("shop-items-container");
if (!categoriesGrid || !itemsContainer) return;
categoriesGrid.style.display = "none";
itemsContainer.style.display = "block";
itemsContainer.innerHTML = "Загрузка товаров...";
try {
const response = await fetch('/shop', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ category_type: categoryType })
});
const items = await response.json();
itemsContainer.innerHTML = "";
if (items.length === 0) {
itemsContainer.innerHTML = "Товаров пока нет";
return;
}
items.forEach(item => {
const itemDiv = document.createElement("div");
itemDiv.className = "inventory-item";
itemDiv.innerHTML = `<div class="item-info" style="border-bottom: 1px solid #444; padding: 10px; margin-bottom: 5px;"> <strong>${item.name}</strong> — <span style="color: #2ecc71;">$${item.price}</span> <p style="font-size: 0.85em; color: #ccc; margin: 5px 0;">${item.description}</p> <button onclick="buyItem(${item.id})" class="btn-use"  style="background: #e67e22; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 3px; width: 100%;"> Купить </button> </div>`;
itemsContainer.appendChild(itemDiv);
});
} catch (error) {
console.error("Ошибка магазина:", error);
itemsContainer.innerHTML = "Ошибка загрузки";
}
};
});
// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function updateStat(id, current, max) {
const fill = document.getElementById(id);
if (fill) {
let percentage = (current / max) * 100;
fill.style.width = Math.max(0, Math.min(100, percentage)) + "%";
}
}
function updateXP() {
const currentElem = document.getElementById("current-xp");
const maxElem = document.getElementById("max-xp");
const xpFill = document.getElementById("xp-fill");
if (currentElem && maxElem && xpFill) {
const currentXP = parseInt(currentElem.innerText.replace(/\D/g, ""));
const maxXP = parseInt(maxElem.innerText.replace(/\D/g, ""));
let percentage = (currentXP / maxXP) * 100;
xpFill.style.width = Math.min(percentage, 100) + "%";
}
}
function checkUnlocks() {
const currentXPNode = document.getElementById("current-xp");
if (!currentXPNode) return;
const currentXP = parseInt(currentXPNode.innerText.replace(/\D/g, ""));
const tunnel = document.getElementById("loc-tunnel");
const park = document.getElementById("loc-park");
const job2 = document.getElementById("job2");
const job3 = document.getElementById("job3");
if (tunnel && currentXP >= 1500) tunnel.style.display = "flex";
if (park && currentXP >= 3000) park.style.display = "flex";
if (job2 && currentXP >= 1500) job2.style.display = "flex";
if (job3 && currentXP >= 3000) job3.style.display = "flex";
}
